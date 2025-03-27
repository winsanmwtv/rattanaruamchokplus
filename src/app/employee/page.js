"use client";

import React, { useState, useEffect } from 'react';

const EmployeePage = () => {
    const [userRole, setUserRole] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const getCookie = (name) => {
            return document.cookie
                .split("; ")
                .find(row => row.startsWith(name + "="))
                ?.split("=")[1];
        };

        const role = getCookie("employeeType");
        setUserRole(role);

        const handleResize = () => {
            setIsMobile(window.innerWidth < 768); // Exclude tablets (common breakpoints: 768px+)
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const newsDialogs = (
        <div style={{
            border: '2px solid purple',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '200px',
            overflow: 'auto',
            textAlign: 'center'
        }}>
            <h2>ข่าวสารประจำร้าน สาขา พระจอมเกล้าพระนครเหนือ</h2>
            <p>
                <b>📢 ด่วน! พนักงานประจำร้าน ชื่อ สิรวิชญ์ ผาสุข ขโมยของในร้านไป ใครพบเห็นโปรดแจ้งผู้จัดการโดยทันที ขอบคุณครับ</b>
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
        // { label: "แจ้งลาป่วย/ลาพักร้อน", path: "/employee/report" },
        // { label: "ส่งข้อความหาผู้จัดการร้าน", path: "/employee/report" },
    ];

    const adminMenus = [
        { label: "จัดการสินค้า", path: "/employee/product" },
        { label: "แก้ไขข้อมูลพนักงาน", path: "/employee/employees" },
    ];

    const renderMenus = (menus) => (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            overflowY: 'auto',
            flex: 1
        }}>
            {menus.map((menu, index) => (
                <a key={index} href={menu.path} className="btn btn-primary text-white"
                   style={{
                       padding: '15px',
                       textAlign: 'center',
                       display: 'flex',
                       justifyContent: 'center',
                       alignItems: 'center',
                       height: 'auto',
                       borderRadius: '8px',
                   }}>
                    {menu.label}
                </a>
            ))}
        </div>
    );

    let allMenus = [...alwaysMenus, ...conditionalMenus];
    if (userRole === "%E0%B8%A3%E0%B8%B0%E0%B8%9A%E0%B8%9A%E0%B8%8A%E0%B8%B3%E0%B8%A3%E0%B8%B0%E0%B9%80%E0%B8%87%E0%B8%B4%E0%B8%99%E0%B8%94%E0%B9%89%E0%B8%A7%E0%B8%A2%E0%B8%95%E0%B8%99%E0%B9%80%E0%B8%AD%E0%B8%87")
        allMenus = [...alwaysMenus];
    if (userRole === "%E0%B8%9E%E0%B8%99%E0%B8%B1%E0%B8%81%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%9D%E0%B9%88%E0%B8%B2%E0%B8%A2%20IT" ||
        userRole === "%E0%B8%9C%E0%B8%B9%E0%B9%89%E0%B8%88%E0%B8%B1%E0%B8%94%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%99" ||
        userRole === "%E0%B9%80%E0%B8%88%E0%B9%89%E0%B8%B2%E0%B8%82%E0%B8%AD%E0%B8%87%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%99") {
        allMenus = [...allMenus, ...adminMenus];
    }

    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            minHeight: '100vh',
            height: '100%',
            overflow: 'hidden'
        }}>
            {!isMobile && (
                <div style={{
                    width: '100%',
                    maxWidth: '30%',
                    minWidth: '280px',
                    padding: '20px',
                    height: '100%',
                    overflow: 'auto'
                }}>
                    {newsDialogs}
                </div>
            )}

            <div style={{
                flex: 1,
                padding: '20px',
                borderLeft: '2px solid gray',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100%',
                overflow: 'hidden'
            }}>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {renderMenus(allMenus)}
                </div>
            </div>
        </div>
    );
};

export default EmployeePage;
