"use client";
import { useEffect, useState } from "react";
import ContentWidth from "./ContentWidth";

export default function Navbar() {
    const user = {
        name: "พงศ์ศิริ เลิศพงษ์ไทย", // Replace with dynamic user data
        role: "พนักงานแคชเชียร์",  // Replace with actual role
        profilePic: "/profile.png", // Replace with actual profile picture path
    };

    // State for current time
    const [currentTime, setCurrentTime] = useState("");

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }));
        };
        updateTime(); // Set initial time
        const interval = setInterval(updateTime, 1000); // Update time every second
        return () => clearInterval(interval);
    }, []);

    return (
        <nav className="bg-primary text-white sticky top-0 w-full z-50 flex justify-between items-center p-4">
            {/* Left Side - Store Name & Clock */}
            <div className="flex items-center space-x-4">
                <span className="text-lg font-bold">รัตนารวมโชคพลัส</span>
                <span className="text-sm text-gray-300">{currentTime}</span>
            </div>

            {/* Right Side - User Info */}
            <div className="flex items-center space-x-3">
                <div className="flex flex-col text-right text-sm">
                    <span className="font-semibold">{user.name}</span>
                    <span className="text-gray-300">{user.role}</span>
                </div>
                <img
                    src={user.profilePic}
                    alt="User Profile"
                    className="w-10 h-10 rounded-full border border-white"
                />
            </div>
        </nav>
    );
}
