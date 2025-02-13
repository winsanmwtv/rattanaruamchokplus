"use client";

import React, { useState, useEffect } from 'react';
import jsCookie from 'js-cookie';

const EmployeePage = () => {
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const getCookie = (name) => {
            return document.cookie
                .split("; ")
                .find(row => row.startsWith(name + "="))
                ?.split("=")[1];
        };

        const role = getCookie("employeeType");
        setUserRole(role);
    }, []);

    const newsDialogs = (
        <div style={{
            border: '2px solid purple',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            height: '100%'
        }}>
            <h2 style={{ textAlign: 'center' }}>ข่าวสารประจำวัน</h2>
            <p style={{ textAlign: 'center' }}>
                <b>(ระบบกำลังพัฒนา ฟังก์ชั่นบางส่วนอาจไม่พร้อมใช้งาน)</b><br />

            </p>
        </div>
    );

    const alwaysMenus = [
        { label: "บันทึกเวลาเข้าออกงาน", path: "/employee/clock" },
        { label: "เช็คราคาสินค้า/ยอดคงเหลือ", path: "/employee/enquiry" },
        { label: "ระบบขายหน้าร้าน (POS)", path: "/employee/pos" },
    ];

    const conditionalMenus = [
        { label: "ตรวจสอบหมดอายุประจำวัน", path: "/employee/daily-expiry" },
        { label: "รับสินค้าใหม่เข้าคลัง", path: "/employee/receive-stock" },
        { label: "เติมสินค้าหน้าร้าน", path: "/employee/stock-storefront" },
        { label: "แจ้งลาป่วย/ลาพักร้อน", path: "/employee/report" },
        { label: "ส่งข้อความหาผู้จัดการร้าน", path: "/employee/report" },
    ];

    const adminMenus = [
        { label: "จัดการสินค้า/ทำโปรโมชั่น", path: "/employee/product" },
        { label: "แก้ไขข้อมูลพนักงาน", path: "/employee/employees" },
    ];

    const renderMenus = (menus) => (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)', // 2 buttons per row
            gap: '10px',
            overflowY: 'auto',
            height: '100%', // Allow scrolling inside the menu
            flex: 1 // Ensure that it takes available space
        }}>
            {menus.map((menu, index) => (
                <a key={index} href={menu.path} className="btn btn-primary text-white">
                    {menu.label}
                </a>
            ))}
        </div>
    );

    // Combine all menus into a single array to render
    let allMenus = [...alwaysMenus, ...conditionalMenus];
    if (userRole === "%E0%B8%A3%E0%B8%B0%E0%B8%9A%E0%B8%9A%E0%B8%8A%E0%B8%B3%E0%B8%A3%E0%B8%B0%E0%B9%80%E0%B8%87%E0%B8%B4%E0%B8%99%E0%B8%94%E0%B9%89%E0%B8%A7%E0%B8%A2%E0%B8%95%E0%B8%99%E0%B9%80%E0%B8%AD%E0%B8%87")
        allMenus = [...alwaysMenus];
    if (userRole === "%E0%B8%9E%E0%B8%99%E0%B8%B1%E0%B8%81%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%9D%E0%B9%88%E0%B8%B2%E0%B8%A2%20IT" ||
        userRole === "%E0%B8%9C%E0%B8%B9%E0%B8%9E%E0%B8%B9%E0%B8%94%E0%B8%B1%E0%B8%81%E0%B8%A3%E0%B8%B1%E0%B8%99" ||
        userRole === "%E0%B9%80%E0%B8%88%E0%B8%B2%E0%B8%82%E0%B8%AD%E0%B8%87%E0%B8%A3%E0%B8%B1%E0%B8%99") {
        allMenus = [...allMenus, ...adminMenus];  // Add admin menus if user is admin
    }

    console.log(userRole);

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
            {/* News section */}
            <div style={{
                width: '30%',
                padding: '20px',
                height: '100%',
                overflow: 'hidden'
            }}>
                {newsDialogs}
            </div>

            {/* Main menu section */}
            <div style={{
                width: '70%',
                padding: '20px',
                borderLeft: '2px solid gray',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden'
            }}>
                <h2 style={{ textAlign: 'center' }}>เมนูหลักหน้าพนักงาน</h2>

                {/* Render all menus */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {renderMenus(allMenus)}
                </div>
            </div>
        </div>
    );
};

export default EmployeePage;
