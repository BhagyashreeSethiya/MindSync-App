// src/components/SpeechInput.jsx
import React, { useState, useEffect, useRef } from "react";

const SpeechInput = ({ onTextComplete, isThinking }) => {
  const [isListening, setIsListening] = useState(false);
  const [currentSpeech, setCurrentSpeech] = useState("");

  //mic ko control krne aur text ko yaad rakhne k liye refs
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");

  const toggleListening = () => {
    if (isThinking) return;

    // agr pehle s sun rah h aur button dbaya toh turant mic band kro
    if(isListening && recognitionRef.current) {
      //1. text nikal lo
      const finalTranscript = transcriptRef.current;

      //2. UI turant clear aur update kr
      setIsListening(false);
      setCurrentSpeech("");
      transcriptRef.current = "";

      //3.Browser ko Force-Kill karo
      recognitionRef.current.abort();

      //4. Text ko turant Parent ko bhej do (Bina kisi delay ke)
      if(finalTranscript.trim()) {
        onTextComplete(finalTranscript);
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Aapka browser Speech Recognition support nahi karta.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = true; // Taaki bolte waqt real-time text dikhe

    // isse mic apne aap band nhi hoga
    recognition.continuous = true;

    recognition.onstart = () => {
      setIsListening(true);
      setCurrentSpeech("");
      transcriptRef.current = "";
    };
    
    recognition.onresult = (event) => {
      let transcript = "";
      for(let i=0; i<event.results.length; i++){
        transcript += event.results[i][0].transcript;
      }
      setCurrentSpeech(transcript);
      transcriptRef.current = transcript;
    };

    recognition.onerror = (event) => {
      // 'no-speech' aur 'aborted' normal warnings hain, inhein console par panic mat hone do
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("Speech Error:", event.error);
      }
      setIsListening(false);
      
    };

    recognition.onend = () => {
      if(isListening) {
        setIsListening(false);
        

      //Ref s final text nikal kr pareng ko bhejo  (Delay khtm)
      const finalTranscript = transcriptRef.current;

      if (finalTranscript.trim()) {
        onTextComplete(finalTranscript); // Final text parent ko bhejo
      }

      setCurrentSpeech("");
      transcriptRef.current = "";
    }
    };

    recognition.start();
  };

  //Agar user page chhod dw, toh mic background m chalu na rahe
  useEffect(() => {
    return () => {
      if(recognitionRef.current){
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="shrink-0 flex flex-col items-center justify-center pt-4 border-t border-slate-100 w-full">
      
      {/* 🎙️ Real-time Listening Bubble */}
      {isListening && currentSpeech && (
        <div className='flex flex-col items-end opacity-70 mb-4 w-full text-right animate-fade-in'>
          <span className='text-[10px] font-bold uppercase text-slate-400 mb-1'>Listening...</span>
          <div className='p-4 rounded-2xl bg-slate-100 text-slate-700 rounded-tr-sm italic max-w-[85%] text-sm'>
            {currentSpeech}
          </div>
        </div>
      )}

      {/* Aapka Original Styled Mic Button */}
      <button
        onClick={toggleListening}
        disabled={isThinking}
        className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl transition-all duration-300 transform active:scale-95 shadow-md ${
          isListening 
            ? 'bg-red-500 text-white animate-pulse shadow-red-200' 
            : isThinking
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-blue-100 text-blue-500 hover:bg-blue-200 shadow-blue-100'
        }`}
      >
        {isListening ? '🛑' : '🎙️'}
      </button>
    </div>
  );
};

export default SpeechInput;