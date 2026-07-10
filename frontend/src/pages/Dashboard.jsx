import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Music, LogOut, Sparkles, Activity, Heart, Check, Pill } from "lucide-react";
import SpeechInput from "../components/SpeechInput"; 

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat"); 
  const [selectedMood, setSelectedMood] = useState(null);
  const [activeVibe, setActiveVibe] = useState(null); 
  
  const [currentLogId, setCurrentLogId] = useState(null); 
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  
  // LOCAL STATES 
  const [evalHelpful, setEvalHelpful] = useState(null);
  
  // Medicine Toggle State
  const [medicineTaken, setMedicineTaken] = useState(false);
  const [isUpdatingMedicine, setIsUpdatingMedicine] = useState(false);

  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  
  const messageEndRef = useRef(null);
  const audioRef = useRef(null); 

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  useEffect(() => {
    if (activeTab === "chat") {
      window.speechSynthesis.cancel(); 
      if (audioRef.current) {
        audioRef.current.pause(); 
      }
    }
  }, [activeTab]);

  const handleVoiceInput = async (spokenText) => {
    const userMsg = { role: "user", text: spokenText };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ user_message: spokenText }),
      });

      if (response.status === 401) throw new Error("Unauthorized!");
      if (!response.ok) throw new Error("API call failed");
      
      const data = await response.json();
      const aiMsg = { role: "ai", text: data.ai_reply };
      setMessages((prev) => [...prev, aiMsg]);

      if (activeTab === "chat") {
        const utterance = new SpeechSynthesisUtterance(data.ai_reply);
        utterance.rate = 0.95; 
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { role: "ai", text: `Error: ${error.message}` }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleLogout = () => {
    window.speechSynthesis.cancel(); 
    if (audioRef.current) audioRef.current.pause(); 
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  const moodSettings = {
    sad: {
      bg: "bg-gradient-to-br from-amber-50 to-orange-100",
      color: "border-amber-400 bg-amber-500",
      emoji: "😢",
      vibes: [
        { text: "Warm & Cozy Comfort", musicTitle: "Cozy Fireplace 🔥", animation: "animate-[bounce_4s_infinite]", audioSrc: "/audio/sad1.mp3" },
        { text: "Gentle Healing Rhythm", musicTitle: "Soft Rain Piano 🎹", animation: "animate-[pulse_5s_infinite]", audioSrc: "/audio/sad2.mp3" }
      ]
    },

    anxious: {

      bg: "bg-gradient-to-br from-teal-50 to-emerald-100",

      color: "border-teal-400 bg-teal-500",

      emoji: "😰",

      vibes: [

        { text: "Calm Deep Breathing", musicTitle: "Gentle River Flow 🌊", animation: "animate-[pulse_4s_infinite]", audioSrc: "/audio/anxious1.mp3" },

        { text: "Grounding Frequencies", musicTitle: "Deep Brown Noise 🎧", animation: "animate-[ping_3s_infinite_linear] opacity-30", audioSrc: "/audio/anxious2.mp3" },

        { text: "Slowing Down Time", musicTitle: "Peaceful Flute 🍃", animation: "animate-[bounce_5s_infinite]", audioSrc: "/audio/anxious3.mp3" }

      ]

    },

    angry: {

      bg: "bg-gradient-to-br from-red-50 to-rose-100",

      color: "border-red-400 bg-red-500",

      emoji: "😡",

      vibes: [

        { text: "Cool Down Frequencies", musicTitle: "Deep Ocean Waves 🌊", animation: "animate-[pulse_2s_infinite]", audioSrc: "/audio/angry1.mp3" },

        { text: "Releasing Hot Energy", musicTitle: "Zen Singing Bowls 🥣", animation: "animate-[ping_2s_infinite_linear] opacity-25", audioSrc: "/audio/angry2.mp3" },

        { text: "Patience and Peace", musicTitle: "Distant Thunder Rain ⛈️", animation: "animate-[bounce_4s_infinite]", audioSrc: "/audio/angry3.mp3" }

      ]

    },

    overwhelmed: {

      bg: "bg-gradient-to-br from-indigo-50 to-purple-100",

      color: "border-indigo-400 bg-indigo-500",

      emoji: "🤯",

      vibes: [

        { text: "Mind Declutter Space", musicTitle: "Wind Chimes Breeze 🎐", animation: "animate-[ping_4s_infinite_linear] opacity-20", audioSrc: "/audio/overwhelmed1.mp3" },

        { text: "Find Your Center", musicTitle: "Ambient Cosmic Pad 🌌", animation: "animate-[pulse_6s_infinite]", audioSrc: "/audio/overwhelmed2.mp3" },

        { text: "Thoughts Dissolving", musicTitle: "White Noise Waterfall 🏔️", animation: "animate-[bounce_6s_infinite]", audioSrc: "/audio/overwhelmed3.mp3" }

      ]

    },


    happy: {
      bg: "bg-gradient-to-br from-yellow-50 to-lime-100",
      color: "border-yellow-400 bg-yellow-500",
      emoji: "😊",
      vibes: [
        { text: "Joy & Gratitude Room", musicTitle: "Morning Forest Birds 🐦", animation: "animate-[spin_12s_linear_infinite]", audioSrc: "/audio/happy1.mp3" }
      ]
    }
    
  };

  const handleMoodSelect = async (mood) => {
    setSelectedMood(mood);
    setFeedbackSubmitted(false); 
    setEvalHelpful(null);        
    
    const availableVibes = moodSettings[mood].vibes;
    const randomVibe = availableVibes[Math.floor(Math.random() * availableVibes.length)];
    setActiveVibe(randomVibe);

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://localhost:8000/chat/quick-relief", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          emotion: mood,
          therapy_used: randomVibe.musicTitle
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentLogId(data.log_id || data.id);
      }
    } catch (error) {
      console.error("Failed to create quick relief log:", error);
    }
  };

  const handleFeedbackSubmit = async (isHelpful) => {
    if (!currentLogId) return;

    setFeedbackLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      await fetch("http://localhost:8000/chat/feedback", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          log_id: currentLogId,
          is_helpful: isHelpful,
          skipped_medicine: null // Medicine form se hata diya hai
        })
      });
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error("Feedback submission failed:", error);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Medicine Toggle Handler
  const handleMedicineToggle = async () => {
    const newStatus = !medicineTaken;
    setMedicineTaken(newStatus);
    setIsUpdatingMedicine(true);

    try {
      const token = localStorage.getItem("access_token");
      // Hum isi /chat endpoint ko use kar rahe hain ek special message ke sath jise Caretaker timeline detect karegi
      await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          user_message: `[MEDICINE LOG] Patient marked medicine as: ${newStatus ? 'TAKEN' : 'SKIPPED'}`
        }),
      });
    } catch (error) {
      console.error("Failed to update medicine status", error);
    } finally {
      setIsUpdatingMedicine(false);
    }
  };

  useEffect(() => {
    if (activeTab === "mood" && activeVibe && audioRef.current) {
      audioRef.current.load(); 
      audioRef.current.play().catch(e => console.log("Autoplay prevented:", e));
    }
  }, [activeVibe, activeTab]);

  return (
    <div className={`flex h-screen transition-all duration-1000 ${selectedMood && activeTab === 'mood' ? moodSettings[selectedMood]?.bg : 'bg-slate-50'}`}>
      
      {activeVibe && activeTab === "mood" && (
        <audio ref={audioRef} src={activeVibe.audioSrc} loop />
      )}

      {/* SIDEBAR NAVIGATION PANEL */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shadow-sm z-10 shrink-0">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 px-2 py-3 border-b border-slate-100">
            <Heart className="text-red-500 fill-red-500" size={24} />
            <span className="font-bold text-xl text-slate-800 tracking-tight">WellnessAI</span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("chat")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                activeTab === "chat" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <MessageSquare size={18} />
              <span>AI Companion Chat</span>
            </button>

            <button
              onClick={() => setActiveTab("mood")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                activeTab === "mood" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Music size={18} />
              <span>Mood & Music Studio</span>
            </button>
          </div>

          {/*PERSISTENT DAILY HEALTH WIDGET */}
          <div className="mt-8 bg-amber-50/50 rounded-2xl p-4 border border-amber-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
                <Pill size={16} />
              </div>
              <h3 className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Daily Health Check</h3>
            </div>
            
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-amber-100/60 shadow-sm">
              <span className="text-xs font-semibold text-slate-700">Morning Meds</span>
              
              {/* Animated Toggle Switch */}
              <button 
                onClick={handleMedicineToggle}
                disabled={isUpdatingMedicine}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${medicineTaken ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${medicineTaken ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <p className="text-[10px] text-amber-600/70 mt-2 text-center font-medium">
              {medicineTaken ? "Great! You're on track today." : "Don't forget your medication!"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>

      {/* MAIN CONTENT CONTAINER*/}
      <div className="flex-1 flex flex-col overflow-y-auto relative justify-start items-center p-6 scrollbar-thin">
        
        {/* TAB 1: CHAT */}
        {activeTab === "chat" && (
            <div className="bg-white p-6 rounded-3xl shadow-sm max-w-lg w-full text-center space-y-6 flex flex-col h-[85vh] border border-slate-100">
                {/* Chat UI - Same as your code */}
                 <div className="text-center shrink-0">
                  <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center justify-center gap-2">
                    Hello Friend 😊 <Sparkles size={20} className="text-blue-500" />
                  </h1>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-left scrollbar-thin">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-slate-100' : 'bg-blue-50'}`}>{msg.text}</div>
                    </div>
                  ))}
                  <div ref={messageEndRef} />
                </div>
                <SpeechInput onTextComplete={handleVoiceInput} isThinking={isThinking} />
            </div>
        )}

        {/* TAB 2: MOOD STUDIO */}
        {activeTab === "mood" && (
          <div className="max-w-3xl w-full text-center space-y-8 p-4 z-10">
            {/* Grid for Emotion*/}
            
            {selectedMood && activeVibe && (
              <div className="bg-white p-8 rounded-3xl shadow-md border border-slate-100 space-y-6 text-center max-w-md mx-auto mt-8 transition-all duration-500">
                <p className="text-lg font-bold text-slate-700">{activeVibe.musicTitle}</p>
                
                {/* UX INTERACTION: ONE-STEP FEEDBACK PANEL */}
                <div className="border-t border-slate-100 pt-4 mt-2 text-left space-y-3">
                  {feedbackSubmitted ? (
                    <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
                      <Check size={16} />
                      <span>Feedback recorded safely!</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider text-center">Quick Evaluation</p>
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium text-slate-600">Did this sound track help calm you down?</label>
                        <div className="flex gap-2">
                          <button onClick={() => setEvalHelpful(true)} className={`flex-1 rounded-xl py-2 px-3 text-xs font-medium border ${evalHelpful === true ? 'bg-emerald-500 text-white' : 'bg-slate-50'}`}>Yes, it helped</button>
                          <button onClick={() => setEvalHelpful(false)} className={`flex-1 rounded-xl py-2 px-3 text-xs font-medium border ${evalHelpful === false ? 'bg-rose-500 text-white' : 'bg-slate-50'}`}>Not really</button>
                        </div>
                      </div>

                      <button
                        disabled={evalHelpful === null || feedbackLoading}
                        onClick={() => handleFeedbackSubmit(evalHelpful)}
                        className={`w-full py-2.5 mt-3 rounded-xl text-xs font-bold transition-all ${evalHelpful !== null ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                      >
                        {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default Dashboard;