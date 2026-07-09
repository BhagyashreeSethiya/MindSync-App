
import { BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";

//pages imports
import CaretakerDashboard from "./pages/CaretakerDashboard";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login"; 
import Signup  from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <Router>
        
        <Routes>
            {/* Default redirect to Login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            {/* Public Authentication flow routes */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />}/>
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Route: Sirf Patient k liye */}
           <Route
                path="/patient-dashboard"
                element={
                    <ProtectedRoute allowedRole="patient">
                            <Dashboard />
                    </ProtectedRoute>
                }
            />

           {/* Protected Route: Sirf Caretaker k liye */}
           <Route
                path="/caretaker-dashboard"
                element={
                    <ProtectedRoute allowedRole="care_taker">
                            <CaretakerDashboard />
                    </ProtectedRoute>
                }
            />
                {/* Fallback route: agar user koi gaalt URL daalta hai toh wapas login p bhej do */}
                <Route path="*" element={<Navigate to="/login" replace />} />

                
        </Routes>
        </Router>
    );
}

export default App;