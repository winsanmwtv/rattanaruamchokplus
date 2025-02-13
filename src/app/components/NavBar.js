"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const NavBar = () => {
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const router = useRouter();

    const dropdownRef = useRef(null); // Ref for the dropdown menu
    const profileRef = useRef(null); // Ref for the user profile (to prevent closing dropdown)

    const getCookie = (name) => {
        return document.cookie
            .split("; ")
            .find(row => row.startsWith(name + "="))
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
        updateUserState(); // Update on initial render

        const interval = setInterval(() => {
            updateUserState(); // Check cookies every 2 seconds
        }, 2000);

        return () => clearInterval(interval); // Clean up the interval on unmount
    }, []);

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const days = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
            const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
                "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
            const day = days[now.getDay()];
            const date = now.getDate();
            const month = months[now.getMonth()];
            const year = now.getFullYear() + 543;
            const time = now.toLocaleTimeString("th-TH", { hour12: false });

            setCurrentDateTime(`${day} ที่ ${date} ${month} พ.ศ. ${year} | เวลา ${time}`);
        };

        updateDateTime();
        const interval = setInterval(updateDateTime, 1000);

        return () => clearInterval(interval); // Clean up the interval on unmount
    }, []);

    const handleLogout = () => {
        document.cookie = "emp_id=; path=/; max-age=0";
        document.cookie = "firstName=; path=/; max-age=0";
        document.cookie = "lastName=; path=/; max-age=0";
        document.cookie = "employeeType=; path=/; max-age=0";
        document.cookie = "avatarUrl=; path=/; max-age=0";

        setUser(null);
        setIsLoggedIn(false);
        router.push('/login');
    };

    const toggleMenu = () => {
        setShowMenu(!showMenu);
    };

    // Close the dropdown if clicked outside, but allow clicks on the profile to toggle the menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            // If the click is outside the dropdown and the profile area, close the dropdown
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !profileRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    return (
        <nav style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 20px',
            backgroundColor: '#333',
            color: 'white',
            fontSize: '16px',
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <div>ร้านรัตนารวมโชค</div>
                <div>{currentDateTime}</div>
            </div>

            {isLoggedIn && user ? (
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <div ref={profileRef} onClick={toggleMenu} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'right', marginRight: '10px' }}>
                            <div>{user.firstName} {user.lastName}</div>
                            <div style={{ fontSize: '14px', color: '#ddd' }}>{user.role}</div>
                        </div>
                        <img
                            src={user.avatarUrl || "/empty.png"}
                            alt="Profile Picture"
                            style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid white' }}
                        />
                    </div>

                    {showMenu && (
                        <div ref={dropdownRef} style={{
                            position: 'absolute',
                            top: '60px',
                            right: 0,
                            backgroundColor: '#333',
                            color: 'white',
                            borderRadius: '5px',
                            padding: '10px',
                            zIndex: 1,
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                        }}>
                            <button onClick={handleLogout} style={{
                                padding: '5px 10px',
                                backgroundColor: '#555',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '5px',
                            }}>
                                Logout
                            </button>
                            {/* You can add more menu items here */}
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ flexShrink: 0 }}>
                    <button
                        onClick={() => router.push('/login')}
                        style={{
                            padding: '5px 10px',
                            backgroundColor: '#555',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: '5px',
                            minWidth: '100px',
                        }}
                    >
                        Login
                    </button>
                </div>
            )}
        </nav>
    );
};

export default NavBar;
