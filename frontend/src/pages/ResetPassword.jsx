import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: ""});
    const [resetSuccess, setResetSuccess] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();

        if(!token) {
            setMessage({ type: "error", text: "Invalid or missing token."});
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: "error", text: "Password must be at least 6 characters long." });
            return;
        }

        if(newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match." });
            return;
        }

        setLoading(true);
        setMessage({ type: "", text: ""});

        try{
            const response = await fetch("http://localhost:8000/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({ token, new_password: newPassword}),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: "success", text: "Success: Password reset successful!"});
                setResetSuccess(true);
                setNewPassword("");
                setConfirmPassword("");

                // redirect to login after 3 seconds
                setTimeout(() => navigate("/login"), 3000);
            } else {
                setMessage({ type: "error", text: `Failed: ${data.detail || "Reset failed." }`});
            }
        } catch (err) {
            setMessage({ type: "error", text: "Failed: Server error. Please try again."});
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <Card className="w-full max-w-sm shadow-xl border-slate-200 bg-white">
                <CardHeader className="text-center">
                    <CardTitle className="text-xl font-bold">
                        {resetSuccess ? "Password Reset!" : "Set New Password"}
                    </CardTitle>
                        {!resetSuccess && <CardDescription>Enter your new strong password</CardDescription>}
                </CardHeader>
                <CardContent>
                    {/* Dynamic Alert Styling */}
                    {message.text && (
                        <div className={`p-3 rounded-md mb-4 text-center font-medium text-sm border ${
                            message.type === 'success'
                            ? 'bg-grren-100 text-green-700 border-green-300'
                            : 'bg-red-100 text-red-700 border-red-300'
                        }`}>
                            {message.text.replace("Failed: ", "").replace("Success: ", "")}
                        </div>
                    )}

                    {!resetSuccess ? (
                        <form onSubmit={handleReset} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative">
                                    <Input 
                                    id="password" 
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={loading}
                                    required
                                    className="pr-10"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -transalte-y-1/2 text-slate-400">
                                        {showPassword? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>

                                </div>
                            </div>

                            <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                    required />
                            </div>

                            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2">
                                    {loading ? "Updating..." : "Update Password"}
                            </Button>

                        </form>
                    ) : (
                        <div className="text-center mt-2 space-y-4">
                            <p className="text-slate-500 text-sm">Redirecting to login...</p>
                            <Link to="/login">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Go to Login Now</Button>
                            </Link>

                        </div>
                    )}
                </CardContent>

            </Card>

        </div>
    );

};

export default ResetPassword;