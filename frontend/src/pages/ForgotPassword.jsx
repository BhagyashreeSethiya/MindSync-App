import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const baseUrl = import.meta.env.VITE_API_URL;


const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const[message, setMessage] = useState({type: "", text: ""});

    const handleForgot = async (e) => {
        e.preventDefault();
        const targetEmail = email.trim();

        if(!targetEmail) {
            setMessage({ type: "error", text: "Please enter your email address first."});
            return;
        }

        setLoading(true);
        setMessage({ type: "", text: ""});

        try{
            const response = await fetch(`${baseUrl}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type" : "application/json"},
                body: JSON.stringify({ email: targetEmail}),
            });

            const data = await response.json();

            if(response.ok) {
                setMessage({ type: "success", text: `Success: ${data.message || "Reset link sent."}`});
                setEmail(""); // clear input on success
            } else {
                setMessage( { type: "error", text: `Failed: ${data.detail || "Email not registered."}`});
            }
        } catch (err) {
            setMessage({ type: "error", text: "Failed: Server error. Try again later."});
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <Card className="w-full max-w-sm shadow-xl border-slate-200 bg-white">
                <CardHeader className="text-center">
                    <CardTitle className="text-xl font-bold">Forgot Password</CardTitle>
                    <CardDescription>Enter your email to receive a reset link</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Dynamic alert styling */}
                    {message.text && (
                        <div className={`p-3 rounded-md mb-4 text-center font-medium text-sm border ${
                            message.type === 'success'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : 'bg-red-100 text-red-700 border-red-300'
                        }`}>
                            {message.text.replace("Failed: ", "").replace("Success: ", "")}
                        </div>
                    )}

                    <form onSubmit={handleForgot} className="space-y-4">
                        <div className="space-y-1">
                            <Input type="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} required />

                        </div>

                        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2">
                                {loading ? "Sending..." : "Send Reset Link"}
                        </Button>

                        <div className="text-center text-sm mt-4 text-slate-600">
                               Remember your password? <Link to="/login" className="text-blue-600 font-medium hover:underline">Back to Login</Link>
                        </div>

                    </form>
                </CardContent>

            </Card>

        </div>
    );

};

export default ForgotPassword;
