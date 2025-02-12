"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export default function Navbar() {
    const [user, setUser] = useState(null);
    const [currentDate, setCurrentDate] = useState(""); // State for current date

    useEffect(() => {
        // Get user data from cookies
        const userData = {
            emp_id: Cookies.get("emp_id"),
            firstname: Cookies.get("firstname"),
            lastname: Cookies.get("lastname"),
            role: Cookies.get("role"),
            img_path: Cookies.get("img_path"),
        };
        if (userData.emp_id) {
            setUser(userData);
        }

        // Update the current date every second (or desired interval)
        const interval = setInterval(() => {
            setCurrentDate(new Date().toLocaleString()); // Update date string on the client
        }, 1000);

        return () => clearInterval(interval); // Clean up interval on unmount
    }, []);

    const handleLogout = () => {
        // Remove cookies and refresh the page
        Cookies.remove("emp_id");
        Cookies.remove("firstname");
        Cookies.remove("lastname");
        Cookies.remove("role");
        Cookies.remove("img_path");
        window.location.reload();
    };

    return (
        <nav>
            <div className="left">
                <p>ร้าน รัตนารวมโชค</p>
                <p>{currentDate}</p> {/* Display dynamic date */}
            </div>
            <div className="right">
                {user ? (
                    <>
                        <img src={user.img_path || "/empty.png"} alt="User" />
                        <span>{user.firstname} {user.lastname}</span>
                        <span>{user.role}</span>
                        <button onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <button onClick={() => window.location.href = "/login"}>Login</button>
                )}
            </div>
        </nav>
    );
}
