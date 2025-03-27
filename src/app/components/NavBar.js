"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import pjson from "../../../package.json";

const NavBar = () => {

    console.log(pjson.version);

    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const router = useRouter();

    const dropdownRef = useRef(null);
    const profileRef = useRef(null);

    const getCookie = (name) => {
        return document.cookie
            .split("; ")
            .find((row) => row.startsWith(name + "="))
            ?.split("=")[1];
    };

    const updateUserState = () => {
        const emp_id = getCookie("emp_id");
        const firstName = getCookie("firstName");
        const lastName = getCookie("lastName");
        const role = getCookie("employeeType");
        const avatarUrl = getCookie("avatarUrl");

        if (emp_id) {
            setUser({
                emp_id,
                firstName: firstName ? decodeURIComponent(firstName) : "",
                lastName: lastName ? decodeURIComponent(lastName) : "",
                role: role ? decodeURIComponent(role) : "",
                avatarUrl: avatarUrl ? decodeURIComponent(avatarUrl) : "",
            });
            setIsLoggedIn(true);
        } else {
            setUser(null);
            setIsLoggedIn(false);
        }
    };

    useEffect(() => {
        updateUserState();
        const interval = setInterval(updateUserState, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const days = [
                "วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี",
                "วันศุกร์", "วันเสาร์"
            ];
            const months = [
                "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
                "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
            ];
            const day = days[now.getDay()];
            const date = now.getDate();
            const month = months[now.getMonth()];
            const year = now.getFullYear() + 543;
            const time = now.toLocaleTimeString("th-TH", { hour12: false });

            setCurrentDateTime(`${day} ที่ ${date} ${month} พ.ศ. ${year} | เวลา ${time}`);
        };

        updateDateTime();
        const interval = setInterval(updateDateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        document.cookie = "emp_id=; path=/; max-age=0";
        document.cookie = "firstName=; path=/; max-age=0";
        document.cookie = "lastName=; path=/; max-age=0";
        document.cookie = "employeeType=; path=/; max-age=0";
        document.cookie = "avatarUrl=; path=/; max-age=0";

        setUser(null);
        setIsLoggedIn(false);
        router.push("/login");
    };

    const handleLock = () => {
        handleLogout();
    };

    const handleOpenShift = () => {
        router.push("/employee/open-shift");
    };

    const handleCloseShift = () => {
        router.push("/employee/close-shift");
    };

    const handleChangePassword = () => {
        router.push("/employee/change-password");
        setShowMenu(false);
    };

    const handleGoHome = () => {
        router.push("/");
        setShowMenu(false);
    };


    const toggleMenu = () => {
        setShowMenu(!showMenu);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                !profileRef.current.contains(event.target)
            ) {
                setShowMenu(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    return (
        <nav
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 20px",
                backgroundColor: "#5a9dff",
                color: "white",
                fontSize: "16px",
            }}
        >
            <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                <div>ร้านรัตนารวมโชค | {pjson.version}</div>
                <div style={{ fontSize: "14px", color: "#ededed" }}>{currentDateTime}</div>
            </div>

            {isLoggedIn && user ? (
                <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
                    <div ref={profileRef} onClick={toggleMenu} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textAlign: "right",
                                marginRight: "10px",
                            }}
                        >
                            <div>{user.firstName} {user.lastName}</div>
                            <div style={{ fontSize: "14px", color: "#ededed" }}>{user.role}</div>
                        </div>
                        <img
                            src={user.avatarUrl || "/empty.png"}
                            alt="Profile Picture"
                            style={{ width: "50px", height: "50px", borderRadius: "50%", border: "2px solid white" }}
                        />
                    </div>

                    {showMenu && (
                        <div
                            ref={dropdownRef}
                            style={{
                                position: "absolute",
                                top: "60px",
                                right: 0,
                                backgroundColor: "#0056b3",
                                color: "white",
                                borderRadius: "5px",
                                padding: "10px",
                                zIndex: 1,
                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <button onClick={handleGoHome} style={dropdownButtonStyle}>
                                กลับสู่หน้าแรก
                            </button>
                            
                            <button onClick={handleLogout} style={dropdownButtonStyle}>
                                ออกจากระบบ
                            </button>
                            {/*<button onClick={handleOpenShift} style={dropdownButtonStyle}>*/}
                            {/*    เปิดกะเริ่มทำงาน*/}
                            {/*</button>*/}
                            {/*<button onClick={handleCloseShift} style={dropdownButtonStyle}>*/}
                            {/*    ปิดกะประจำวัน/จบงาน*/}
                            {/*</button>*/}
                            <button onClick={handleChangePassword} style={dropdownButtonStyle}>
                                เปลี่ยนรหัสผ่าน
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ flexShrink: 0 }}>
                    <button
                        onClick={() => router.push("/login")}
                        style={{
                            padding: "5px 10px",
                            backgroundColor: "#0056b3",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                            borderRadius: "5px",
                            minWidth: "100px",
                        }}
                    >
                        เข้าสู่ระบบ
                    </button>
                </div>
            )}
        </nav>
    );
};

// Common dropdown button style
const dropdownButtonStyle = {
    padding: "8px 12px",
    backgroundColor: "#5a9dff",
    color: "white",
    border: "none",
    cursor: "pointer",
    borderRadius: "5px",
    textAlign: "left",
    width: "100%",
    marginBottom: "5px",
};

export default NavBar;