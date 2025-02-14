"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { Mitr } from "next/font/google"; // Import Mitr font
import { useEffect } from "react";
import "./globals.css";
import NavBar from "./components/NavBar";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// Import Mitr font with specified weight
const mitr = Mitr({
    variable: "--font-mitr",
    subsets: ["latin", "thai"],
    weight: "400",
});

export default function RootLayout({ children }) {
    useEffect(() => {
        const getCookie = (name) => {
            return document.cookie
                .split("; ")
                .find(row => row.startsWith(name + "="))
                ?.split("=")[1];
        };

        const setSessionCookie = () => {
            const emp_id = getCookie("emp_id");
            if (!emp_id) return; // Skip if no session exists

            const now = new Date();
            now.setTime(now.getTime() + 30 * 60 * 1000); // Extend for 30 minutes
            document.cookie = `emp_id=${emp_id}; expires=${now.toUTCString()}; path=/`;
        };

        const resetSession = () => {
            setSessionCookie();
        };

        // Add event listeners to detect user activity
        window.addEventListener("mousemove", resetSession);
        window.addEventListener("keydown", resetSession);
        window.addEventListener("click", resetSession);

        return () => {
            // Cleanup event listeners when unmounting
            window.removeEventListener("mousemove", resetSession);
            window.removeEventListener("keydown", resetSession);
            window.removeEventListener("click", resetSession);
        };
    }, []);

    return (
        <html lang="th">
        <body className={`${geistSans.variable} ${geistMono.variable} ${mitr.variable} antialiased`}>
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-grow flex flex-col">{children}</main>
        </div>
        </body>
        </html>
    );
}
