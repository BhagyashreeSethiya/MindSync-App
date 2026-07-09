import React, { useEffect, useState, useRef, useMemo } from "react";
import { Search, Bell, AlertCircle, User as UserIcon, LogOut} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

//raw recharts (dhancha bananae k liye)
import { Bar, BarChart, CartesianGrid, XAxis, Rectangle} from "recharts"


const CaretakerDashboard = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);//dropdown list k liye
  const [showDropdown, setShowDropdown] = useState(false);

  const [selectedPatientName, setSelectedPatientName] = useState(null);
  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const beepSound = useRef( new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'));

  // Helper Function: UTC time ko IST (Local Time) mein sahi se convert karne ke liye
  const formatToLocalTime = (timestampString) => {
    if (!timestampString) return "";
    // Agar string mein timezone indicator nahi hai toh 'Z' (UTC) append karo
    const safeTimestamp = (typeof timestampString === 'string' && !timestampString.includes('Z') && !timestampString.includes('+'))
      ? `${timestampString}Z`
      : timestampString;

    return new Date(safeTimestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  //1. Auto-Suggest API call (jab user type karta hai)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if(searchQuery.length < 2){
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`http://localhost:8000/logs/search-patients?q=${searchQuery}`, {
            headers: { "Authorization": `Bearer ${token}`}
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

    //Debounce effect ( user k type krne k 300ms baad API call hogi)
    const delay = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);



  //2. HTTP Polling for notification
  useEffect(() => {
    const pollNotifications = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if(!token) return;

        const response = await fetch("http://localhost:8000/logs/active-alerts", {
          headers: { "Authorization": `Bearer ${token}`}
        });

        if (response.ok) {
          const newAlerts = await response.json();
          if (newAlerts.length > 0) {
            setNotifications((prev) => {
              if (newAlerts.length > prev.length){
                beepSound.current.play().catch(e => console.log("Sound play blocked by browser:",e));
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

  //3. Load Patient Data ( Using ID)
  const loadPatientData = async (patientId, patientName) => {
    if (!patientId) return;

    setLoading(true);
    setSelectedPatientName(patientName);
    setShowDropdown(false); // dropdown band krdo

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://localhost:8000/logs/patient/${patientId}`, {
        headers: { "Authorization": `Bearer ${token}`}
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

  //4. Handle notification click
  const handleNotificationClick = (alert) => {
    setSearchQuery(alert.patient_name);
    //id bhej rhe h dataa load karne k liye
    loadPatientData(alert.user_id, alert.patient_name);

  };

  //5. Handle logout function
  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if(!confirmLogout) return;

    try {
      const token = localStorage.getItem("access_token");
      const refreshToken = localStorage.getItem("refresh_token");

      // backend blacklist API call
      await fetch("http://localhost:8000/logout",{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ refresh_token: refreshToken})
      });
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Local storage clear karna aur login page par redirect karna
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      navigate("/login");
    }
  };

  // 6. Chart Data Processor with Beautiful Dynamic Colors
  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    const counts = {};
    logs.forEach(log => {
        const emotion = log.emotion || 'Unknown';
        counts[emotion] = (counts[emotion] || 0) + 1;
    });

    // Premium Color Palette for Moods
    const emotionColors = {
        happy: "#4ade80",   // Soft Emerald Green
        anxious: "#fbbf24", // Vibrant Amber Yellow
        sad: "#60a5fa",     // Clean Sky Blue
        angry: "#f87171",   // Soft Red
        unknown: "#94a3b8"  // Slate Gray
    };

    return Object.keys(counts).map(key => ({
        emotion: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize first letter
        count: counts[key],
        fillColor: emotionColors[key.toLowerCase()] || "#6366f1" // Custom Color or Default Indigo
    }));

  }, [logs]);

  const chartConfig = {
    count: {
        label: "Interactions",
    },
  };

  return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            
            {/* 🖥️ LEFT PANEL: Main Dashboard Area */}
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
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            
                            {showDropdown && suggestions.length > 0 && (
                                <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                    {suggestions.map((patient) => (
                                        <div 
                                            key={patient.id}
                                            onClick={() => {
                                                setSearchQuery(patient.name);
                                                loadPatientData(patient.id, patient.name);
                                            }}
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
                    <div className="space-y-6">
                        
                        {/* 📈 Beautiful Chart Box */}
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

                                    {/* maxBarSize aur Cell injections se columns ekdum premium ho jayenge */}
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

                        {/* 📝 Data Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-100 border-b border-slate-200 py-3 px-5">
                                <h3 className="text-md font-semibold text-slate-700">Interaction Logs</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-sm text-slate-500 border-b border-slate-200">
                                            <th className="p-4 font-medium">Time</th>
                                            <th className="p-4 font-medium">Patient Said</th>
                                            <th className="p-4 font-medium">AI Replied</th>
                                            <th className="p-4 font-medium">Emotion</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {logs.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="p-6 text-center text-slate-500">
                                                    No logs found for this patient.
                                                </td>
                                            </tr>
                                        ) : (
                                            logs.map((log) => (
                                                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                    {/* Time Bug Solved */}
                                                    <td className="p-4 whitespace-nowrap text-slate-500 font-medium">
                                                        {formatToLocalTime(log.timestamp)}
                                                    </td>
                                                    <td className="p-4 text-slate-700">{log.user_message}</td>
                                                    <td className="p-4 text-blue-600 bg-blue-50/30">{log.ai_reply}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${log.alert ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                            {log.emotion}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 🔔 RIGHT PANEL: Notification Sidebar */}
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
                                        {/* Notification Time Bug Solved */}
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
