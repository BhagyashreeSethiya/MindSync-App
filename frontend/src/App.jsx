import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login"; 

import Signup  from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";



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

            {/* Public Authentication flow routes */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />}/>
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Proctected Route (Sirf Admin dekh sakta hai)*/}
            <Route 
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
                />
                {/* Fallback route: agar user koi gaalt URL daalta hai toh wapas login p bhej do */}
                <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </BrowserRouter>
    );
}

export default App;