import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const baseUrl = import.meta.env.VITE_API_URL;

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("patient");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
   
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 🚨 Wapas JSON format par aa gaye hain
            const response = await fetch(`${baseUrl}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password, role }), // JSON data
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("access_token", data.access_token);
                if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);

                localStorage.setItem("role", data.role);
                localStorage.setItem("isAuthenticated", "true");

                const urlParams = new URLSearchParams(window.location.search);
                const inviteToken = urlParams.get("invite_token");

                if (inviteToken && data.role === "patient") {
                    try {
                        await fetch(`${baseUrl}/accept-invite`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${data.access_token}`
                            },
                            body: JSON.stringify({ token: inviteToken }),
                        });
                        console.log("Successfully linked to doctor!");
                    } catch (linkError) {
                        console.error("Link fail ho gaya:", linkError);
                    }
                }

                if (data.role === "caretaker") {
                    navigate("/caretaker-dashboard");
                } else {
                    navigate("/patient-dashboard");
                }
            } else {
                // 🚨 FIX: Safe Error Handling taaki React crash na ho
                let errorMessage = "Login failed!";
                if (typeof data.detail === "string") {
                    errorMessage = data.detail;
                } else if (Array.isArray(data.detail)) {
                    errorMessage = data.detail[0].msg; // Agar object aaye toh uski string nikal lo
                }
                
                setError(errorMessage);
            }
        } catch (err) {
            console.error("Login Error", err);
            setError("Server se connect nahi ho paya. Backend chalu hai?");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <Card className="w-full max-w-md shadow-xl border-slate-200 bg-white">
                <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl font-bold text-slate-800">Welcome Back</CardTitle>
                    <CardDescription className="text-slate-500">Sign in to your wellness account</CardDescription>
                </CardHeader>

                <CardContent>
                    {/* 🚨 FIX: autoComplete="off" laga diya taaki pehle se data bhara hua na aaye */}
                    <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
                        
                        {/* Email field */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="off"
                                required
                            />
                        </div>

                        {/* Password field with Eye Icon & Forgot Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password" // Ye strict browsers ko autofill karne se rokta hai
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            
                            {/* Forgot Password Link */}
                            <div className="flex justify-end">
                                <Link 
                                    to="/forgot-password" 
                                    className="text-sm text-blue-600 hover:underline font-medium"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                        </div>

                        {/* Radio buttons for role */}
                        <div className="space-y-3 pt-1">
                            <Label className="text-slate-700 font-semibold">I am logging in as:</Label>
                            <RadioGroup value={role} onValueChange={setRole} className="flex space-x-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="patient" id="patient" />
                                    <Label htmlFor="patient" className="cursor-pointer">Patient</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="care_taker" id="care_taker" />
                                    <Label htmlFor="care_taker" className="cursor-pointer">Care Taker</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Error Message */}
                        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                        {/* Submit Button */}
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
                        >
                            {loading ? "Signing In..." : "Sign In"}
                        </Button>

                        {/* Sign Up Link */}
                        <div className="text-center text-sm text-slate-600 pt-2">
                            Don't have an account?{" "}
                            <Link to="/signup" className="text-blue-600 font-medium hover:underline">
                                Sign Up
                            </Link>
                        </div>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;