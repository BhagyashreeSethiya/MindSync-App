import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

//Memory set (componenet k bahr)
const processedTokens = new Set();

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [status, setStatus] = useState("loading"); // loading, success, error
    const [message, setMessage] = useState("Verfying your email...");

    useEffect(() => {
        if(!token){
            setStatus("error");
            setMessage("Invalid or missing verification link.");
            return;
        }

        // Agar token already process ho chuka h , return kar jao
        if(processedTokens.has(token)) return;
        processedTokens.add(token);

        const verifyToken = async () => {
            try{
                const response = await fetch (`http://localhost:8000/auth/verify-email?token=${token}`);
                const data = await response.json();

                if(response.ok){
                    setStatus("success");
                    setMessage("✅ Email verified successfully!");

                    //2.5 sec baad automaticall login p behej dte h
                    setTimeout(() => {
                        navigate("/login");
                    }, 2500);
                }else {
                    setStatus("error");
                    setMessage(`❌ ${data.detail || "Verification failed."}`);
                }
            } catch (err) {
                setStatus("error");
                setMessage("❌ Server error while verifying.");
            }
        };
        verifyToken();
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <Card className="w-full max-w-sm shadow-xl border-slate-200 bg-white text-center">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">{message}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    {status === "loading" && <CardDescription>Please wait, we are checking your link...</CardDescription>}

                    {status === "success" && (
                        <p className="text-green-600 font-semibold text-lg">Proceeding to login...</p>
                    )}

                    {status === "error" && (
                        <div className="mt-4 space-y-3">
                            <p className="text-sm text-slate-500">You need to sign up again to get a new verification link.</p>
                            <Link to="/signup" className="block">
                            <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                                Go to Sign Up

                            </Button>
                        </Link>
                        </div>
                    )}
                </CardContent>

            </Card>

        </div>
    );
};

export default VerifyEmail;