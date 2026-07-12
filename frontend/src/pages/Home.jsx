// src/pages/Home.jsx
import React, { useState, useRef, useEffect } from "react";
import SpeechInput from "../components/SpeechInput";

const baseUrl = import.meta.env.VITE_API_URL;


const Home = () => {
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const messageEndRef = useRef(null);

  // Auto Scroll to Bottom Logic
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleVoiceInput = async (spokenText) => {
    // 1. User message ko conversation history mein jodo
    const userMsg = { role: "user", text: spokenText };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {

      const token = localStorage.getItem("access_token");

      const response = await fetch(`${baseUrl}/chat`, {

        method: "POST",

        headers: { "Content-Type": "application/json" ,
          "Authorization": `Bearer ${token}`
        },

        body: JSON.stringify({ user_message: spokenText }),
      });

      if (response. status === 401){
        throw new Error("Unauthorized! Pehle login karo.");
      }

      if (!response.ok) throw new Error("API call failed");
      const data = await response.json();

      // 2. AI response ko conversation history mein jodo
      const aiMsg = { role: "ai", text: data.ai_reply };
      setMessages((prev) => [...prev, aiMsg]);

      // 3. Audio Text-to-Speech Output
      const utterance = new SpeechSynthesisUtterance(data.ai_reply);
      utterance.rate = 0.95; 
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: `Maaf kijiye, ek error aayi: ${error.message}`}
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 font-sans">
      {/* Main Beautiful Chat Card Container */}
      <div className="bg-white p-8 rounded-3xl shadow-sm max-w-lg w-full text-center space-y-8 flex flex-col h-[85vh]">
        
        {/* Top Header */}
        <div className='text-center shrink-0'>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Hello Friend 😊
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Tap the mic and let's talk.
          </p>
        </div>

        {/* Chat Stream History Area */}
        <div className='flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin text-left'>
          {messages.map((msg, index) => (
            <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <span className='text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider'>
                {msg.role === 'user' ? 'You' : 'AI Coach'}
              </span>
              <div className={`p-4 rounded-2xl max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-slate-100 text-slate-700 rounded-tr-sm'
                  : 'bg-blue-50 border border-blue-100 text-slate-800 rounded-tl-sm leading-relaxed'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {/* Thinking Animation State */}
          {isThinking && (
            <div className='flex flex-col items-start'>
              <div className='p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-500 rounded-tl-sm animate-pulse'>
                Thinking... 🤔
              </div>
            </div>
          )}
          
          <div ref={messageEndRef} />
        </div>

        {/* Modular Input Box (Renders just the button perfectly inside footer) */}
        <SpeechInput onTextComplete={handleVoiceInput} isThinking={isThinking} />

      </div>
    </div>
  );
};

export default Home;