import React, { useEffect } from "react";

const AiResponse = ({ aiText, userText}) => {
    //Jab bhi naya aiText aaye, use aawaz m bolo
    useEffect(() => {
        if(aiText) {
        const utterance = new SpeechSynthesisUtterance(aiText);
        utterance.rate = 0.9; // thoda aarm s bole
        window.speechSynthesis.speak(utterance);
        }
    }, [aiText]);

    //Agar abhi tak koi conversation nhi hui h
    if(!userText && !aiText) return null;

    return (
        <div style={{
            maxWidth: "600px", 
      margin: "0 auto", 
      padding: "20px", 
      backgroundColor: "#f9f9f9", 
      borderRadius: "10px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}>
            {userText && (
                <div style = {{marginBottom: "15px"}}>
                    <p style={{ margin: "0", fontSize: "14px", color: "#666" }}>Aapne Kaha:</p>
                    <p style={{ margin: "5px 0 0 0", fontSize: "16px", fontWeight: "bold" }}>"{userText}"</p>
        </div>
            )}

            {aiText && (
                <div style={{ padding: "15px", backgroundColor: "#e3f2fd", borderRadius: "8px", borderLeft: "4px solid #4A90E2" }}>
          <p style={{ margin: "0", fontSize: "14px", color: "#4A90E2", fontWeight: "bold" }}>AI Companion:</p>
          <p style={{ margin: "5px 0 0 0", fontSize: "16px", lineHeight: "1.5" }}>{aiText}</p>
        </div>
            )}
        </div>
    );
};

export default AiResponse;