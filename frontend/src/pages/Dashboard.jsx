import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Music, LogOut, Sparkles, Activity, Heart, Check, X } from "lucide-react";
import SpeechInput from "../components/SpeechInput"; 

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat"); 
  const [selectedMood, setSelectedMood] = useState(null);
  const [activeVibe, setActiveVibe] = useState(null); 
  
  // --- NEW STATES FOR API FLOW ---
  const [currentLogId, setCurrentLogId] = useState(null); // Backend se aane wali log_id
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  
  // --- LOCAL STATES FOR 2-STEP FEEDBACK ---
  const [evalHelpful, setEvalHelpful] = useState(null);
  const [evalMedicine, setEvalMedicine] = useState(null);

  // --- AI Chat State ---
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  
  const messageEndRef = useRef(null);
  const audioRef = useRef(null); 

  // Auto-scroll chat
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // SMART AUDIO CONTROLLER
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
        { text: "Gentle Healing Rhythm", musicTitle: "Soft Rain Piano 🎹", animation: "animate-[pulse_5s_infinite]", audioSrc: "/audio/sad2.mp3" },
        { text: "Deep Emotional Soothing", musicTitle: "Melancholy Cello 🎻", animation: "animate-[pulse_3s_infinite]", audioSrc: "/audio/sad3.mp3" }
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
        { text: "Joy & Gratitude Room", musicTitle: "Morning Forest Birds 🐦", animation: "animate-[spin_12s_linear_infinite]", audioSrc: "/audio/happy1.mp3" },
        { text: "Positive Sunshine Energy", musicTitle: "Upbeat Lo-Fi Chill 🎶", animation: "animate-[bounce_3s_infinite]", audioSrc: "/audio/happy2.mp3" },
        { text: "Celebrating the Moment", musicTitle: "Acoustic Ukulele 🎸", animation: "animate-[pulse_3s_infinite]", audioSrc: "/audio/happy3.mp3" }
      ]
    }
  };

  // 🚀 INTEGRATION 1: ASYNC MOOD SELECT & QUICK RELIEF LOGGER
  const handleMoodSelect = async (mood) => {
    setSelectedMood(mood);
    setFeedbackSubmitted(false); // Reset feedback status
    setEvalHelpful(null);        // Reset Q1
    setEvalMedicine(null);       // Reset Q2
    
    const availableVibes = moodSettings[mood].vibes;
    const randomVibe = availableVibes[Math.floor(Math.random() * availableVibes.length)];
    setActiveVibe(randomVibe);

    // Backend hit karke sensory therapy session log karenge
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
        console.log("Backend response data:", data);

        // 🛠️ FIX APPLIED HERE: Checking for both log_id and id
        if (data.log_id) {
          setCurrentLogId(data.log_id);
          console.log("Log ID set to (from log_id):", data.log_id);
        } else if (data.id) {
          setCurrentLogId(data.id);
          console.log("Log ID set to (from id):", data.id);
        } else {
          console.warn("⚠️ Backend ne koi ID return nahi ki! Data:", data);
        }
      }
    } catch (error) {
      console.error("Failed to create quick relief log:", error);
    }
  };

  // 🚀 INTEGRATION 2: PATCH FEEDBACK HANDLER
  const handleFeedbackSubmit = async (isHelpful, skippedMedicine) => {
    if (!currentLogId) {
      alert("No active therapy log session found to give feedback on.");
      return;
    }

    setFeedbackLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://localhost:8000/chat/feedback", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          log_id: currentLogId,
          is_helpful: isHelpful,
          skipped_medicine: skippedMedicine
        })
      });

      if (response.ok) {
        setFeedbackSubmitted(true);
      }
    } catch (error) {
      console.error("Feedback submission failed:", error);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Automatically load and play new stream when state updates
  useEffect(() => {
    if (activeTab === "mood" && activeVibe && audioRef.current) {
      audioRef.current.load(); 
      audioRef.current.play().catch(e => console.log("Autoplay prevented:", e));
    }
  }, [activeVibe, activeTab]);

  return (
    <div className={`flex h-screen transition-all duration-1000 ${selectedMood && activeTab === 'mood' ? moodSettings[selectedMood].bg : 'bg-slate-50'}`}>
      
      {/*Dynamic Background Audio Stream */}
      {activeVibe && activeTab === "mood" && (
        <audio ref={audioRef} src={activeVibe.audioSrc} loop />
      )}

      {/*SIDEBAR NAVIGATION PANEL */}
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
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col overflow-y-auto relative justify-start items-center p-6 scrollbar-thin">
        
        {/* TAB 1: AI COMPANION COACH */}
        {activeTab === "chat" && (
          <div className="bg-white p-6 rounded-3xl shadow-sm max-w-lg w-full text-center space-y-6 flex flex-col h-[85vh] border border-slate-100">
            <div className="text-center shrink-0">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center justify-center gap-2">
                Hello Friend 😊 <Sparkles size={20} className="text-blue-500" />
              </h1>
              <p className="text-slate-500 text-sm mt-1">Tap the mic and let's talk about your day.</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-left scrollbar-thin">
              {messages.length === 0 && (
                <div className="text-center text-slate-400 py-12 text-sm italic">
                  No conversation yet. Click the mic to start!
                </div>
              )}
              {messages.map((msg, index) => (
                <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">{msg.role === 'user' ? 'You' : 'AI Coach'}</span>
                  <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${
                    msg.role === 'user' ? 'bg-slate-100 text-slate-700 rounded-tr-sm' : 'bg-blue-50 border border-blue-100 text-slate-800 rounded-tl-sm leading-relaxed'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex flex-col items-start">
                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-blue-500 text-sm rounded-tl-sm animate-pulse">
                    Thinking... 🤔
                  </div>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            <SpeechInput onTextComplete={handleVoiceInput} isThinking={isThinking} />
          </div>
        )}

        {/* TAB 2: IMMERSIVE MOOD & VIBE STUDIO */}
        {activeTab === "mood" && (
          <div className="max-w-3xl w-full text-center space-y-8 p-4 z-10">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">How are you feeling right now?</h1>
              <p className="text-slate-500 mt-2">Select an emotion to synchronize the environment with your mind.</p>
            </div>

            {/* Grid for 5 Core Emotions */}
            <div className="flex flex-wrap justify-center gap-4">
              {Object.keys(moodSettings).map((mood) => (
                <button
                  key={mood}
                  onClick={() => handleMoodSelect(mood)}
                  className={`p-4 rounded-2xl border text-center transition-all transform active:scale-95 capitalize font-semibold shadow-sm flex flex-col items-center justify-center gap-2 bg-white w-28 h-28 ${
                    selectedMood === mood ? "border-blue-500 ring-4 ring-blue-100 text-blue-600 scale-105" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow"
                  }`}
                >
                  <span className="text-3xl">{moodSettings[mood].emoji}</span>
                  <span className="text-sm">{mood}</span>
                </button>
              ))}
            </div>

            {/* Generative Visualizer Studio */}
            {selectedMood && activeVibe ? (
              <div className="bg-white p-8 rounded-3xl shadow-md border border-slate-100 space-y-6 text-center max-w-md mx-auto mt-8 transition-all duration-500">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
                    {activeVibe.text}
                  </span>
                  
                  <div className={`w-32 h-32 rounded-full ${moodSettings[selectedMood].color} opacity-40 flex items-center justify-center text-white font-bold transition-all duration-500 ${activeVibe.animation}`}>
                    <Activity size={36} />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <p className="text-xs text-slate-400 font-medium uppercase">Suggested Healing Track</p>
                  <p className="text-lg font-bold text-slate-700 flex items-center justify-center gap-2">
                    {activeVibe.musicTitle}
                  </p>
                  <div className="pt-2">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-2/3 animate-[pulse_1.5s_infinite]"></div>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-1">Playing ambient vibe...</span>
                  </div>
                </div>

                {/* 🌟 UX INTERACTION: TWO-STEP FEEDBACK PANEL */}
                <div className="border-t border-slate-100 pt-4 mt-2 text-left space-y-3">
                  {feedbackSubmitted ? (
                    <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold p-3 rounded-xl flex items-center gap-2 border border-emerald-100">
                      <Check size={16} />
                      <span>Feedback recorded safely. Great job maintaining your health!</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider text-center">Quick Evaluation</p>
                      
                      {/* Question 1: Is Helpful? */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium text-slate-600">Did this sound track help calm you down?</label>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEvalHelpful(true)}
                            className={`flex-1 rounded-xl py-2 px-3 text-xs font-medium transition-all flex items-center justify-center gap-1 border ${
                              evalHelpful === true ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50'
                            }`}
                          >
                            Yes, it helped
                          </button>
                          <button 
                            onClick={() => setEvalHelpful(false)}
                            className={`flex-1 rounded-xl py-2 px-3 text-xs font-medium transition-all flex items-center justify-center gap-1 border ${
                              evalHelpful === false ? 'bg-rose-500 text-white border-rose-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-rose-50'
                            }`}
                          >
                            Not really
                          </button>
                        </div>
                      </div>

                      {/* Question 2: Skipped Medicine? */}
                      <div className="pt-2 flex items-center justify-between bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/60">
                        <span className="text-xs font-medium text-slate-600">Did you skip any prescribed medicine today?</span>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => setEvalMedicine(true)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                              evalMedicine === true ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-100'
                            }`}
                          >
                            Yes
                          </button>
                          <button 
                            onClick={() => setEvalMedicine(false)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                              evalMedicine === false ? 'bg-slate-800 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {/* Final Submit Button */}
                      <button
                        disabled={evalHelpful === null || evalMedicine === null || feedbackLoading}
                        onClick={() => handleFeedbackSubmit(evalHelpful, evalMedicine)}
                        className={`w-full py-2.5 mt-3 rounded-xl text-xs font-bold transition-all ${
                          evalHelpful !== null && evalMedicine !== null
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                      </button>
                    </>
                  )}
                </div>

              </div>
            ) : (
              <div className="text-slate-400 italic text-sm pt-8">
                Click an emotion above to light up the Vibe Room ✨
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;