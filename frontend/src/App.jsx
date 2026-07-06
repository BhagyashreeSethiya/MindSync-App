import React from "react";
//Navigate import kiya h redirection k liye
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";

import Login from "./pages/Login"; 


const ProtectedRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");

    // Agar logged in hai toh page dikhao (children), warna Login par bhej do
    if(!isAuthenticated){
        return <Navigate to="/login" replace />
    }
    return children;
};

function App() {
    return (
        <BrowserRouter>
        
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            {/* Proctected Route (Sirf Admin dekh sakta hai)*/}
            <Route 
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
                />
        </Routes>
        </BrowserRouter>
    );
}

export default App;