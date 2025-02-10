"use client";  // Enable client-side rendering

import { useEffect, useState } from "react";

export default function Navbar() {
    const user = {
        name: "พงศ์ศิริ เลิศพงษ์ไทย",
        role: "พนักงานฝ่าย IT",
        profilePic: "/profile.png",
    };

    // State for date and time
    const [currentTime, setCurrentTime] = useState("");
    const [currentDate, setCurrentDate] = useState("");

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();

            // Format time
            setCurrentTime(now.toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }));

            // Get date in Thai format (including Buddhist year)
            const thaiDate = now.toLocaleDateString("th-TH", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            });

            // Manually insert "พ.ศ." before the year
            const dateParts = thaiDate.split(" ");
            const formattedDate = `${dateParts[0]} ${dateParts[1]} ${dateParts[2]} พ.ศ. ${dateParts[3]}`;

            setCurrentDate(formattedDate); // Set the formatted date
        };

        updateTime(); // Set initial time and date
        const interval = setInterval(updateTime, 1000); // Update every second
        return () => clearInterval(interval);
    }, []);

    return (
        <nav className="bg-primary text-white sticky top-0 w-full z-50 flex justify-between items-center p-4">
            {/* Left Side - Store Name & Date-Time */}
            <div className="flex items-center space-x-4">
                <span className="text-2xl font-bold">รัตนารวมโชคพลัส</span> {/* Increased font size */}
                <div className="flex flex-col text-sm text-gray-300">
                    <span>{currentDate}</span>
                    <span>{`เวลา ${currentTime}`}</span> {/* 'เวลา' outside HTML element */}
                </div>
            </div>

            {/* Right Side - User Info with a Box */}
            <div className="flex items-center space-x-3">
                <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 min-w-[250px] flex items-center">
                    {/* Adjust text alignment to left */}
                    <div className="flex flex-col text-left text-sm w-full ml-2">
                        <span className="font-semibold">{user.name}</span>
                        <span className="text-gray-300">{user.role}</span>
                    </div>
                    <img
                        src={user.profilePic}
                        alt="User Profile"
                        className="w-10 h-10 rounded-full border border-white"
                    />
                </div>
            </div>
        </nav>
    );
}
