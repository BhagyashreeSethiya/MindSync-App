import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
    const navigate = useNavigate();

    //check kr user logged in h ya nhi
    const isAuthenticated = localStorage.getItem("isAuthenticated")

    const handleLogout = () => {
        //logout krte  waqt token aur status clear kr
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("access_token");
        navigate("/login");
    };

    return (
        <nav style={{ padding: "1rem", backgroundColor: "#f0f0f0", marginBottom: "20px", display:"flex", justifyContent: "space-between" , alignItems: "center"}}>

            {/*Left side m links */}
            <div>
            <Link to="/" style = {{ marginRight: "15px", textDecoration: "none", fontWeight: "bold", color: "#333"}}>
            🎙️ AI Chat
            </Link>

            <Link to="/dashboard" style={{textDecoration: "none", fontWeight: "bold", color: "#333"}}>
                📊 Dashboard
            </Link>
            </div>

            {/*Right Side: Login/Logout Button */}
            <div>
                {isAuthenticated ? (
                    <button
                    onClick={handleLogout}
                    style={{ backgroundColor: "#ff4d4d", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", transition: "0.3s"}}
                    >
                        Logout
                    </button>
                ) : (
                    <Link
                        to="/login"
                        style={{backgroundColor: "#4A90E2", color: "white", padding: "8px 15px", borderRadius: "5px", textDecoration: "none", fontWeight: "bold"}}
                        >
                            Login
                        </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;