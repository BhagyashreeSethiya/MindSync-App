import React, { useEffect, useState, useRef, useMemo } from "react";
import { Search, Bell, AlertCircle, User as UserIcon, LogOut, Inbox, UserPlus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, Rectangle } from "recharts";
const API_BASE_URL = import.meta.env.VITE_API_URL;



const CaretakerDashboard = () => {
const navigate = useNavigate();

const [searchQuery, setSearchQuery] = useState("");
const [suggestions, setSuggestions] = useState([]); 
const [showDropdown, setShowDropdown] = useState(false);

const [selectedPatientName, setSelectedPatientName] = useState(null);
const [logs, setLogs] = useState([]);
const [notifications, setNotifications] = useState([]);
const [loading, setLoading] = useState(false);

const [showInviteModal, setShowInviteModal] = useState(false);
const [inviteEmail, setInviteEmail] = useState("");
const [inviteStatus, setInviteStatus] = useState({ loading: false, message: "", type: "" });

const beepSound = useRef(null);

// Initialize audio only once on mount to prevent memory leaks during re-renders
useEffect(() => {
    beepSound.current = new Audio('/sounds/beep_short.ogg');
}, []);

// Helper: Auth Headers
const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };
};

// Helper: UTC time to IST (Local Time)
const formatToLocalTime = (timestampString) => {
    if (!timestampString) return "";
    const safeTimestamp = (typeof timestampString === 'string' && !timestampString.includes('Z') && !timestampString.includes('+'))
        ? `${timestampString}Z`
        : timestampString;

    return new Date(safeTimestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
};

// 1. Auto-Suggest API call (Debounced)
useEffect(() => {
    const fetchSuggestions = async () => {
        if (searchQuery.length < 2) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/logs/search-patients?q=${searchQuery}`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                setSuggestions(data);
                setShowDropdown(true);
            }
        } catch (error) {
            console.error("Error fetching suggestions:", error);
        }
    };

        const delay = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(delay);
}, [searchQuery]);

// 2. HTTP Polling for Notifications
useEffect(() => {
    const pollNotifications = async () => {
        if (!localStorage.getItem("access_token")) return;

            try {
                const response = await fetch(`${API_BASE_URL}/logs/active-alerts`, {
                headers: getAuthHeaders()
             });

        if (response.ok) {
            const newAlerts = await response.json();
            if (newAlerts.length > 0) {
                setNotifications((prev) => {
                    if (newAlerts.length > prev.length && beepSound.current) {
                    beepSound.current.play().catch(e => console.log("Sound play blocked by browser:", e));
            }
              return newAlerts;
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
      }
};

    const interval = setInterval(pollNotifications, 1000);
    return () => clearInterval(interval);
}, []);

// 3. Load Patient Data (Using ID)
const loadPatientData = async (patientId, patientName) => {
    if (!patientId) return;

    setLoading(true);
    setSelectedPatientName(patientName);
    setShowDropdown(false); 
    setSearchQuery(""); // Clear search bar for cleaner UI after selection

    try {
      const response = await fetch(`${API_BASE_URL}/logs/patient/${patientId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

// 4. Handle Notification Click
const handleNotificationClick = (alert) => {
    loadPatientData(alert.user_id, alert.patient_name);
};

// 5. Handle Logout Function
const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    try {
      const refreshToken = localStorage.getItem("refresh_token");

      await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ refresh_token: refreshToken })
      });
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      navigate("/login");
    }
};

// --- 6. NEW: Handle Send Invite ---
    const handleSendInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        setInviteStatus({ loading: true, message: "", type: "" });

        try {
            const response = await fetch(`${API_BASE_URL}/auth/send-invite`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ patient_email: inviteEmail }),
            });

            const data = await response.json();

            if (response.ok) {
                setInviteStatus({ loading: false, message: data.message || "Invite sent successfully!", type: "success" });
                // 2 seconds baad modal close kar do
                setTimeout(() => {
                    setShowInviteModal(false);
                    setInviteEmail("");
                    setInviteStatus({ loading: false, message: "", type: "" });
                }, 2000);
            } else {
                setInviteStatus({ loading: false, message: data.detail || "Failed to send invite.", type: "error" });
            }
        } catch (error) {
            setInviteStatus({ loading: false, message: "Server error. Try again later.", type: "error" });
        }
    };

const chartData = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    const counts = {};
    logs.forEach(log => {
        const emotion = log.emotion || 'unknown';
        counts[emotion] = (counts[emotion] || 0) + 1;
    });

    const emotionColors = {
        happy: "#4ade80",   // Soft Emerald Green
        anxious: "#fbbf24", // Vibrant Amber Yellow
        sad: "#60a5fa",     // Clean Sky Blue
        angry: "#f87171",   // Soft Red
        unknown: "#94a3b8"  // Slate Gray
    };

    return Object.keys(counts).map(key => ({
        emotion: key.charAt(0).toUpperCase() + key.slice(1), 
        count: counts[key],
        fillColor: emotionColors[key.toLowerCase()] || "#6366f1" 
    }));
}, [logs]);

const chartConfig = {
    count: { label: "Interactions" },
};

return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen bg-slate-50 overflow-x-hidden lg:overflow-hidden font-sans relative">
        
        {/* LEFT PANEL: Main Dashboard Area */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
            
            {/* Header Container */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
                        📊 Caretaker Dashboard
                    </h2>
                    <p className="text-slate-500 mt-0.5 text-xs sm:text-sm">Monitor your patients' emotional well-being.</p>
                </div>

                {/* Actions (Search + Invite + Logout) */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="relative flex-1 sm:flex-initial w-full sm:w-64 md:w-72 lg:w-80">
                        <input 
                            type="text" 
                            placeholder="Search patient..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Delay to allow click
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        
                        {showDropdown && suggestions.length > 0 && (
                            <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                {suggestions.map((patient) => (
                                    <div 
                                        key={patient.id}
                                        onMouseDown={() => loadPatientData(patient.id, patient.name)}
                                        className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-slate-100 last:border-none"
                                    >
                                        <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0">
                                            <UserIcon size={16} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{patient.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{patient.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button 
                            onClick={() => setShowInviteModal(true)}
                            className="flex items-center gap-1.5 sm:gap-2 sm:px-4 py-2 bg-blue-600 border border-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-xs sm:text-sm font-semibold"
                            title="Invite Patient"
                        >
                            <UserPlus size={16} />
                            <span className="font-semibold text-sm">Invite Patient</span>
                        </button>

                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 sm:gap-2  px-3 sm:px-4 py-2 bg-white border border-slate-300  rounded-lg hover:bg-red-50 text-red-600 hover:border-red-100 transition-colors shadow-sm text-xs sm:text-sm font-semibold"
                        title="Log Out"
                    >
                        <LogOut size={16} />
                        <span className="font-semibold text-sm">Logout</span>
                    </button>
                </div>
            </div>

            {/* Patient Data Display Area */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center min-h-75">
                    <p className="text-slate-500 animate-pulse text-base sm:text-lg">Loading patient data...</p>
                </div>
            ) : !selectedPatientName ? (
                <div className="flex-1 flex items-center justify-center flex-col text-slate-400 min-h-75 text-center p-4">
                    <Search size={40} className="mb-3 opacity-50 sm:size-12" />
                    <p className="text-sm sm:text-base">Search for a patient or click a notification to view logs.</p>
                </div>
            ) : (
                <div className="space-y-6 pb-6">
                    
                    {/* Chart Box */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-700 mb-4 truncate">
                            Mood Analytics: {selectedPatientName}
                        </h3>
                        {chartData.length > 0 ? (
                        <ChartContainer config={chartConfig} className="h-48 sm:h-64 w-full">
                            <BarChart accessibilityLayer data={chartData}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-slate-200" />
                                <XAxis 
                                    dataKey="emotion"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => value.slice(0,10)}
                                    className="text-xs font-medium text-slate-600"
                                />
                                <ChartTooltip content={<ChartTooltipContent />} cursor={{fill: '#f8fafc'}} />
                                <Bar 
                                    dataKey="count" 
                                    maxBarSize={40} 
                                    radius={[6, 6, 0, 0]}
                                    shape={(props) => <Rectangle {...props} fill={props.payload.fillColor} />}
                                />
                            </BarChart>
                        </ChartContainer>
                        ) : (
                        <div className="h-36 sm:h-48 flex items-center justify-center text-xs sm:text-sm text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                            No emotion data available for graph.
                        </div>
                        )}
                    </div>

                    {/* NEW Timeline Data View */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
                        <div className="border-b border-slate-100 pb-3 sm:pb-4 mb-4  sm:mb-6">
                            <h3 className="text-base sm:text-lg font-semibold text-slate-700">Interaction Timeline</h3>
                        </div>
                        
                        {logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-slate-500 text-xs sm:text-sm">
                                <Inbox size={28} className="opacity-40 mb-2 sm:size-8" />
                                No interaction logs found for this patient.
                            </div>
                        ) : (
                            <div className="pl-4 sm:pl-6 border-l-2 border-slate-200 space-y-4 sm:space-y-6 ml-1 sm:ml-2">
                                {logs.map((log) => {
                                    // 1. Identify Log Type
                                    const isMusicLog = log.user_message && log.user_message.includes("[USED QUICK RELIEF FEATURE]");
                                    const isMedicineLog = log.user_message && log.user_message.includes("[MEDICINE LOG]");

                                    return (
                                        <div key={log.id} className="relative">
                                            
                                            {/* Timeline Bullet Dot */}
                                            <span className={`absolute -left-5.25 sm:-left-7.25 top-1.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full ring-4 ring-white ${isMedicineLog ? 'bg-amber-400' : (isMusicLog ? 'bg-indigo-500' : 'bg-blue-500')}`} />

                                            {/* Main Card Content */}
                                            <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                                
                                                {/* Top Row: Time + Type Badge */}
                                                <div className="flex flex-wrap justify-between items-center gap-2 mb-2  sm:mb-3">
                                                    <span className="text-[11px] sm:text-xs font-bold text-slate-400">
                                                        🕒 {formatToLocalTime(log.timestamp)}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${isMedicineLog ? 'bg-amber-50 text-amber-700' : (isMusicLog ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700')}`}>
                                                        {isMedicineLog ? "💊 Health Check" : (isMusicLog ? "🎵 Therapy Studio" : "💬 Chat Companion")}
                                                    </span>
                                                </div>

                                                {/* Conditional Rendering based on Log Type */}
                                                {isMedicineLog ? (
                                                    /*  MEDICINE LOG VIEW */
                                                    <div className="flex items-center gap-3 bg-amber-50/50 p-2.5 sm:p-3 rounded-lg border border-amber-100">
                                                        <div className="p-1.5 sm:p-2 bg-white rounded-full shadow-sm shrink-0">
                                                            <span className="text-base sm:text-xl">💊</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm sm:text-sm  font-semibold text-amber-900">Patient Medication Update</p>
                                                            <p className="text-[11px] sm:text-xs text-amber-700 mt-0.5">
                                                                {log.user_message.includes("TAKEN") 
                                                                    ? "✅ Status marked as TAKEN." 
                                                                    : "⚠️ Status marked as SKIPPED."}
                                                            </p>
                                                        </div>
                                                    </div>

                                                ) : isMusicLog ? (
                                                    /* MUSIC LOG VIEW */
                                                    <div className="space-y-2">
                                                        <p className="text-xs sm:text-sm font-medium text-slate-800">
                                                            Patient triggered a Sensory Therapy session.
                                                        </p>
                                                        <div className="text-[11px] sm:text-xs text-slate-500 bg-slate-50 p-2 rounded-md border border-slate-100">
                                                            {log.ai_reply}
                                                        </div>
                                                        
                                                        {/* Feedback Section inside Card */}
                                                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                                                        <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Feedback:</span>
    
                                                            {log.is_helpful === true && (
                                                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] text-xs font-medium">
                                                                    🎵 Sound Helped
                                                                </span>
                                                            )}
                                                            {log.is_helpful === false && (
                                                                <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 text-[10px] sm:text-xs font-medium">
                                                                    🎵 Didn't Calm
                                                                </span>
                                                            )}
                                                            {log.is_helpful === null && (
                                                                <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200 text-[10px] sm:text-xs font-medium">
                                                                     No Feedback
                                                                </span>
                                                            )}
                                                    </div>
                                                        
                                                </div>
                                                ) : (
                                                    /* CHAT LOG VIEW */
                                                    <div className="space-y-2 sm:space-y-3">
                                                        <div className="flex flex-col sm:flex-row sm:gap-2 sm:items-start">
                                                            <span className="text-[11px] sm:text-xs font-bold text-slate-500  shrink-0">Patient:</span>
                                                            <p className="text-xs sm:text-sm text-slate-700 bg-slate-50/60 p-2 rounded-lg w-full mt-0.5 sm:mt-0">
                                                                "{log.user_message}"
                                                            </p>
                                                        </div>

                                                        <div className="flex flex-col sm:flex-row sm:gap-2 sm:items-start">
                                                            <span className="text-[11px] sm:text-xs font-bold text-blue-600 shrink-0">AI Reply:</span>
                                                            <p className="text-xs sm:text-sm text-blue-700 bg-blue-50/40 p-2 rounded-lg w-full border border-blue-100/30 mt-0.5 sm:mt-0">
                                                                {log.ai_reply}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* RIGHT PANEL: Notification Sidebar */}
        <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 shadow-lg lg:shadow-xl flex flex-col shrink-0 max-h-80 lg:max-h-none">
            <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-red-50/50 sticky top-0 bg-white z-10">
                <h3 className="font-bold text-sm sm:text-base  text-slate-800 flex items-center gap-2">
                    <Bell size={18} className="text-red-500 animate-bounce" /> 
                    Live Alerts
                </h3>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {notifications.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                {notifications.length === 0 ? (
                    <p className="text-xs sm:text-sm text-slate-400 text-center py-6 lg:mt-10">No new alerts.</p>
                ) : (
                    notifications.map((alert) => (
                        <div 
                            key={alert.id} 
                            onClick={() => handleNotificationClick(alert)}
                            className="p-3 bg-red-50 border border-red-100 rounded-lg cursor-pointer hover:bg-red-100 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-start gap-2.5">
                                <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={16} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-red-700 truncate">
                                        Patient: {alert.patient_name}
                                    </p>
                                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{alert.message}</p>
                                    <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                        {formatToLocalTime(alert.timestamp)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
        
        {/* NEW: Invite Modal Overlay */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-5 sm:p-6 relative animate-in fade-in zoom-in duration-200">
                        {/* Close button */}
                        <button 
                            onClick={() => {
                                setShowInviteModal(false);
                                setInviteStatus({ loading: false, message: "", type: "" });
                            }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-5">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                                <UserPlus className="text-blue-600" size={22} />
                                Invite Patient
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                Send an invitation link to a patient to join your care network.
                            </p>
                        </div>

                        {/* Status Message */}
                        {inviteStatus.message && (
                            <div className={`p-3 rounded-md mb-4 text-xs sm:text-sm font-medium ${inviteStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {inviteStatus.message}
                            </div>
                        )}

                        <form onSubmit={handleSendInvite} className="space-y-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                                    Patient Email Address
                                </label>
                                <input 
                                    type="email" 
                                    required
                                    placeholder="patient@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={inviteStatus.loading}
                                />
                            </div>
                            
                            <div className="flex justify-end gap-2.5 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setShowInviteModal(false)}
                                    className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    disabled={inviteStatus.loading}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={inviteStatus.loading || !inviteEmail.trim()}
                                    className="px-4 py-2 text-xs sm:text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {inviteStatus.loading ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                            Sending...
                                        </>
                                    ) : (
                                        "Send Invite"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaretakerDashboard;
    