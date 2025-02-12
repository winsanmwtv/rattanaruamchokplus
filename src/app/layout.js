import { Geist, Geist_Mono } from "next/font/google";
import { Mitr } from "next/font/google"; // Import Mitr font
import "./globals.css";
import Navbar from "./components/navbar";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "RattanaRuamchok+",
    description: "Made by winsanmwtv",
};

// Import Mitr font with specified weight
const mitr = Mitr({
    variable: "--font-mitr",
    subsets: ["latin", "thai"],
    weight: "400", // You can change this to another weight like "300", "500", etc. if needed
});

export default function RootLayout({ children }) {
    return (
        <html lang="th">
        <body
            className={`${geistSans.variable} ${geistMono.variable} ${mitr.variable} antialiased`}
        >
        <div className="flex flex-col min-h-screen">
            <Navbar /> {/* Navbar applied globally */}
            <div className="flex-grow pt-0">
                <main>{children}</main> {/* Page content */}
            </div>
        </div>
        </body>
        </html>
    );
}
