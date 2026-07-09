import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole }) => {
    // LocalStorage se check karo ki user logged in hai aur uska role kya hai
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    const userRole = localStorage.getItem("role");

    // 1. Agar login nahi kiya, toh seedha Login page par fek do
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 2. Agar dashboard ka role aur user ka role match nahi karta
    if (allowedRole && userRole !== allowedRole) {
        // Patient ko patient ke page par, aur caretaker ko uske page par bhej do
        if (userRole === 'patient') {
            return <Navigate to="/dashboard" replace />;
        } else if (userRole === 'care_taker') {
            return <Navigate to="/caretaker-dashboard" replace />;
        }
    }

    // 3. Agar sab theek hai (Logged in + Sahi Role), toh page dikha do
    return children;
};

export default ProtectedRoute;