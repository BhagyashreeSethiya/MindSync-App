import React, { useEffect, useState, useRef, useMemo } from "react";
import { Search, Bell, AlertCircle, User as UserIcon, LogOut, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, Rectangle } from "recharts";


const API_BASE_URL = "http://localhost:8000";

const CaretakerDashboard = () => {
const navigate = useNavigate();

const [searchQuery, setSearchQuery] = useState("");
const [suggestions, setSuggestions] = useState([]); 
const [showDropdown, setShowDropdown] = useState(false);

const [selectedPatientName, setSelectedPatientName] = useState(null);
const [logs, setLogs] = useState([]);
const [notifications, setNotifications] = useState([]);
const [loading, setLoading] = useState(false);

const beepSound = useRef(null);

// Initialize audio only once on mount to prevent memory leaks during re-renders
useEffect(() => {
    beepSound.current = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
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

// 6. Chart Data Processor with Dynamic Colors
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
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
        
        {/* LEFT PANEL: Main Dashboard Area */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            
            {/* Header Container */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        📊 Caretaker Dashboard
                    </h2>
                    <p className="text-slate-500 mt-1 text-sm">Monitor your patients' emotional well-being.</p>
                </div>

                {/* Actions (Search + Logout) */}
                <div className="flex items-center gap-4">
                    <div className="relative w-80">
                        <input 
                            type="text" 
                            placeholder="Search patient by name..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Delay to allow click
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        
                        {showDropdown && suggestions.length > 0 && (
                            <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                {suggestions.map((patient) => (
                                    <div 
                                        key={patient.id}
                                        onMouseDown={() => loadPatientData(patient.id, patient.name)}
                                        className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-slate-100 last:border-none"
                                    >
                                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                            <UserIcon size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{patient.name}</p>
                                            <p className="text-xs text-slate-500">{patient.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
                        title="Log Out"
                    >
                        <LogOut size={18} />
                        <span className="font-semibold text-sm">Logout</span>
                    </button>
                </div>
            </div>

            {/* Patient Data Display Area */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-slate-500 animate-pulse text-lg">Loading patient data...</p>
                </div>
            ) : !selectedPatientName ? (
                <div className="flex-1 flex items-center justify-center flex-col text-slate-400">
                    <Search size={48} className="mb-4 opacity-50" />
                    <p>Search for a patient or click a notification to view logs.</p>
                </div>
            ) : (
                <div className="space-y-6 pb-10">
                    
                    {/* Beautiful Chart Box */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                        <h3 className="text-lg font-semibold text-slate-700 mb-4">
                            Mood Analytics: {selectedPatientName}
                        </h3>
                        {chartData.length > 0 ? (
                        <ChartContainer config={chartConfig} className="h-64 w-full">
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
                        <div className="h-48 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                            No emotion data available for graph.
                        </div>
                        )}
                    </div>

                    {/* NEW Timeline Data View */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="border-b border-slate-100 pb-4 mb-6">
                            <h3 className="text-lg font-semibold text-slate-700">Interaction Timeline</h3>
                        </div>
                        
                        {logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                                <Inbox size={32} className="opacity-40 mb-3" />
                                No interaction logs found for this patient.
                            </div>
                        ) : (
                            <div className="pl-6 border-l-2 border-slate-200 space-y-6 ml-2">
                                {logs.map((log) => {
                                    // 1. Identify Log Type
                                    const isMusicLog = log.user_message && log.user_message.includes("[USED QUICK RELIEF FEATURE]");
                                    const isMedicineLog = log.user_message && log.user_message.includes("[MEDICINE LOG]");

                                    return (
                                        <div key={log.id} className="relative">
                                            
                                            {/* Timeline Bullet Dot */}
                                            <span className={`absolute -left-8.25 top-1.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${isMedicineLog ? 'bg-amber-400' : (isMusicLog ? 'bg-indigo-500' : 'bg-blue-500')}`} />

                                            {/* Main Card Content */}
                                            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                                
                                                {/* Top Row: Time + Type Badge */}
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-xs font-bold text-slate-400">
                                                        🕒 {formatToLocalTime(log.timestamp)}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isMedicineLog ? 'bg-amber-50 text-amber-700' : (isMusicLog ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700')}`}>
                                                        {isMedicineLog ? "💊 Health Check" : (isMusicLog ? "🎵 Therapy Studio" : "💬 Chat Companion")}
                                                    </span>
                                                </div>

                                                {/* Conditional Rendering based on Log Type */}
                                                {isMedicineLog ? (
                                                    /*  MEDICINE LOG VIEW */
                                                    <div className="flex items-center gap-3 bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                                                        <div className="p-2 bg-white rounded-full shadow-sm">
                                                            <span className="text-xl">💊</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-amber-900">Patient Medication Update</p>
                                                            <p className="text-xs text-amber-700 mt-0.5">
                                                                {log.user_message.includes("TAKEN") 
                                                                    ? "✅ Status marked as TAKEN." 
                                                                    : "⚠️ Status marked as SKIPPED."}
                                                            </p>
                                                        </div>
                                                    </div>

                                                ) : isMusicLog ? (
                                                    /* MUSIC LOG VIEW */
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium text-slate-800">
                                                            Patient triggered a Sensory Therapy session.
                                                        </p>
                                                        <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-md border border-slate-100">
                                                            {log.ai_reply}
                                                        </div>
                                                        
                                                        {/* Feedback Section inside Card */}
                                                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                                                        <span className="text-xs font-semibold text-slate-500">Feedback:</span>
    
                                                            {log.is_helpful === true && (
                                                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                                                                    🎵 Sound Helped
                                                                </span>
                                                            )}
                                                            {log.is_helpful === false && (
                                                                <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 text-xs font-medium">
                                                                    🎵 Didn't Calm
                                                                </span>
                                                            )}
                                                            {log.is_helpful === null && (
                                                                <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200 text-xs font-medium">
                                                                     No Feedback
                                                                </span>
                                                            )}
                                                    </div>
                                                        
                                                </div>
                                                ) : (
                                                    /* CHAT LOG VIEW */
                                                    <div className="space-y-3">
                                                        <div className="flex gap-2 items-start">
                                                            <span className="text-xs font-bold text-slate-500 mt-0.5 shrink-0">Patient:</span>
                                                            <p className="text-sm text-slate-700 bg-slate-50/60 p-2 rounded-lg w-full">
                                                                "{log.user_message}"
                                                            </p>
                                                        </div>

                                                        <div className="flex gap-2 items-start">
                                                            <span className="text-xs font-bold text-blue-600 mt-0.5 shrink-0">AI Reply:</span>
                                                            <p className="text-sm text-blue-700 bg-blue-50/40 p-2 rounded-lg w-full border border-blue-100/30">
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
        <div className="w-80 bg-white border-l border-slate-200 shadow-xl flex flex-col z-10">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-red-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Bell size={18} className="text-red-500 animate-bounce" /> 
                    Live Alerts
                </h3>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                    {notifications.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center mt-10">No new alerts.</p>
                ) : (
                    notifications.map((alert) => (
                        <div 
                            key={alert.id} 
                            onClick={() => handleNotificationClick(alert)}
                            className="p-3 bg-red-50 border border-red-100 rounded-lg cursor-pointer hover:bg-red-100 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-start gap-3">
                                <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={16} />
                                <div>
                                    <p className="text-sm font-semibold text-slate-800 group-hover:text-red-700">
                                        Patient: {alert.patient_name}
                                    </p>
                                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{alert.message}</p>
                                    <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                        {formatToLocalTime(alert.timestamp)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

    </div>
  );
};

export default CaretakerDashboard;