"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { Mitr } from "next/font/google";
import { useEffect } from "react";
import "./globals.css";
import NavBar from "./components/NavBar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const mitr = Mitr({ variable: "--font-mitr", subsets: ["latin", "thai"], weight: "400" });

export default function RootLayout({ children }) {
    useEffect(() => {
        // Utility function to parse cookies into an object
        const getCookies = () =>
            document.cookie.split("; ").reduce((acc, cookie) => {
                const [name, value] = cookie.split("=");
                acc[name] = decodeURIComponent(value);
                return acc;
            }, {});

        // Function to update the session cookie with a new 30-minute expiry
        const setSessionCookie = () => {
            const cookies = getCookies();
            if (!cookies.emp_id) return; // Skip if no active employee session

            const sessionData = {
                emp_id: cookies.emp_id,
                firstname: cookies.firstname || "",
                lastname: cookies.lastname || "",
                img_path: cookies.img_path || "",
                // Add more session data as needed
            };

            const now = new Date();
            now.setTime(now.getTime() + Number.MAX_SAFE_INTEGER); // Extend for 30 minutes

            document.cookie = `session=${encodeURIComponent(
                JSON.stringify(sessionData)
            )}; expires=${now.toUTCString()}; path=/; Secure; SameSite=Strict`;
        };

        const resetSession = () => {
            setSessionCookie();
        };

        // Attach event listeners to detect user activity and reset session timeout
        const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
        events.forEach((event) => {
            window.addEventListener(event, resetSession);
        });

        // Cleanup event listeners on unmount
        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, resetSession);
            });
        };
    }, []);

    return (
        <html lang="th">
        <body
            className={`${geistSans.variable} ${geistMono.variable} ${mitr.variable} antialiased`}
        >
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-grow flex flex-col">{children}</main>
        </div>
        </body>
        </html>
    );
}
