import React, {useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const Signup = () => {
    const[formData, setFormData] = useState({ name: "", email: "", password: "", role: "patient"});
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: ""}); // success ya error dikhane k liye
    

    const handleChange = (e) => setFormData({...formData, [e.target.id]: e.target.value});

    const handleSignup = async (e) => {
        e.preventDefault();

        // Pre-validation guard
        if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
            setMessage({ type: "error", text: "Please fill out all mandatory fields." });
            return;
        }

        if (formData.password.trim().length < 6){
                setMessage({ type: "error", text: "Password must be at least 6 characters long."});
                return;
        }

        setLoading(true);
        setMessage({ type: "", text: ""});

        try{
            const response = await fetch("http://localhost:8000/auth/signup", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(formData),
            });
            const data = await response.json();

            if(response.ok){
                setMessage({ type: "success", text: `Success: ${data.message || "Please check your email to verify."}` });

                setFormData({name: "", email: "", password: "", role: "patient"});
            } else {
                setMessage({ type: "error", text: `Failed: ${data.detail || "Signup failed!"}`});
            }
        } catch (err) {
            setMessage({ type: "error", text: "Failed: Server error. Is backend running?"});
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-scrren flex items-center justify-center bg-slate-50 px-4">
            <Card className="w-full max-w-md shadow-xl border-slate-200 bg-white">
                <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl font-bold text-slate-800">Create Account</CardTitle>
                    <CardDescription className="text-slate-500">Join our wellness platform</CardDescription>
                </CardHeader>

                <CardContent>
                    {message.text && (
                        <div className={`p-3 rounded-md mb-4 text-center font-medium text-sm border ${message.type === 'success'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            :
                            'bg-red-100 text-red-700 border-red-300'
                        }`}>
                            {message.text.replace("Failed: ", "").replace("Success: ","")}
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input 
                            id="name"
                            placeholder="Enter your name"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={loading}
                            required
                            />

                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input 
                            id="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                            required
                            />

                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input id="password" 
                                type={showPassword? "text" : "password"}
                                placeholder="Create a strong password"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                                required
                                className="pr-10"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={loading} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    {showPassword? <EyeOff size={18} /> : <Eye size={18} />}

                                </button>

                            </div>

                        </div>

                        <div className="space-y-3 pt-1">
                            <Label className="text-slate-700 font-semibold">
                                I am joining as:
                            </Label>
                            <RadioGroup value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})} disabled={loading} className="flex space-x-4">
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

                        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2">
                                {loading ? "Creating account..." : "Sign Up"}
                        </Button>

                        <div className="text-center text-sm text-slate-600 pt-2">
                                Already have an account? <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign In</Link>
                        </div>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Signup;