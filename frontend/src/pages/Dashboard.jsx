import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Music, LogOut, Sparkles, Activity, Heart } from "lucide-react";
import SpeechInput from "../components/SpeechInput"; 

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat"); 
  const [selectedMood, setSelectedMood] = useState(null);
  const [activeVibe, setActiveVibe] = useState(null); // Dynamic track aur dynamic animation ke liye
  
  // AI Chat State 
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  
  const messageEndRef = useRef(null);
  const audioRef = useRef(null); 

  // Auto-scroll chat
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // SMART AUDIO CONTROLLER: Chat tab aate hi background music aur speech band
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

  // DYNAMIC AUDIO + DYNAMIC ANIMATION SLOTS
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

  // RANDOM PICKER FUNCTION (Selects both unique Audio and unique Animation layout dynamically)
  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    const availableVibes = moodSettings[mood].vibes;
    const randomVibe = availableVibes[Math.floor(Math.random() * availableVibes.length)];
    setActiveVibe(randomVibe);
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
      <div className="flex-1 flex flex-col overflow-hidden relative justify-center items-center p-6">
        
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
                  
                  {/* FAANG HIGHLIGHT: DYNAMIC COMPONENT ANIMATION */}
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