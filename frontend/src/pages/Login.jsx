import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
     const [role, setRole] = useState("patient");
    const [error, setError] = useState("");
   
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();//Form ko refresh hone s rokne k liye
        setError("");
        setLoading(true);

        try{
            const response = await fetch("http://localhost:8000/auth/login",{
                method: "POST",
                headers: {
                    "Content-Type":"application/json",
                },
                body: JSON.stringify({ email, password}),
            });

            const data = await response.json();

            if(response.ok) {
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("isAuthenticated", "true");

                navigate("/dashboard");
            } else {
                setError(data.detail || "Login failed!" );
            }
        } catch (err) {
            console.error("Login Error", err);
            setError("Server se connect nahi ho paya. Backend chalu hai?");
        }finally{
            setLoading(false);
        }

    };
        
    return (
        <div className="flex items-center justify-center mih-h-screen bg-slate-50">
            <Card className="w-400 shadow-lg border-slate-200">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-slate-800">Welcome Back</CardTitle>
                    <CardDescription className="text-slate-500">Sign in to your wellness account</CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6">

                        {/* Email field */}
                        <div classname="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                />

                        </div>

                        {/* Passwprd field */}
                        <div classname="space-y-2">
                            <Label htmlFor="password">Passwprd</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Create your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                />

                        </div>

                        {/* Radio buttons for role */}
                        <div classname="space-y-3 pt-2">
                            <Label className="text-slate-700 font-semibold">I am logging in as:</Label>
                            <RadioGroup value={role} onValueChange = {setRole} classname="flex space-x-4">
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
                        {error && <p classname="text-red-500 text-sm font-medium">{error}</p>}

                        {/* Submit Button */}
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                Sign In
                        </Button>


                    </form>
                </CardContent>

            </Card>
        </div>
    );
};

export default Login;