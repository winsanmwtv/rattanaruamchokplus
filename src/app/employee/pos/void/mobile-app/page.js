"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const MobileVoidBillPage = () => {
    const [receiptIdInput, setReceiptIdInput] = useState("");
    const [voidBill, setVoidBill] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const router = useRouter();

    // Fetch receipt details based on receipt ID
    const fetchVoidBill = async () => {
        if (!receiptIdInput.trim()) {
            setErrorMessage("กรุณากรอกหมายเลขใบเสร็จ");
            return;
        }
        setErrorMessage("กำลังดึงข้อมูลใบเสร็จ...");
        try {
            const res = await fetch(`/api/void/get?receipt_id=${receiptIdInput}`);
            if (!res.ok) {
                setErrorMessage("ไม่พบใบเสร็จ");
                setVoidBill(null);
                return;
            }
            const data = await res.json();
            setVoidBill(data);
            setErrorMessage("");
        } catch (error) {
            console.error("Error fetching void bill:", error);
            setErrorMessage("เกิดข้อผิดพลาดในการดึงข้อมูลใบเสร็จ");
            setVoidBill(null);
        }
    };

    // Cancel the fetched receipt
    const handleCancelReceipt = async () => {
        if (!voidBill) return;
        try {
            const res = await fetch("/api/void/cancel", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ receipt_id: voidBill.receipt_id }),
            });
            if (!res.ok) {
                setErrorMessage("การยกเลิกใบเสร็จล้มเหลว");
                return;
            }
            alert("ยกเลิกบิลแล้ว");
            handleReset();
        } catch (error) {
            console.error("Error canceling receipt:", error);
            setErrorMessage("เกิดข้อผิดพลาดในการยกเลิกใบเสร็จ");
        }
    };

    // Reset the input and state
    const handleReset = () => {
        setReceiptIdInput("");
        setVoidBill(null);
        setErrorMessage("");
    };

    // Calculate the total amount of the receipt
    const calculateTotal = () => {
        if (!voidBill || !voidBill.items) return 0;
        return voidBill.items.reduce(
            (sum, item) => sum + item.price_each * item.quantity,
            0
        );
    };

    return (
        <div style={{ padding: "20px", height: "100vh", overflowY: "auto", textAlign: "center" }}>
            {errorMessage && <div style={{ color: "red", marginBottom: "10px" }}>{errorMessage}</div>}
            {voidBill ? (
                <div style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "20px" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "5px" }}>
                        ใบเสร็จ: {voidBill.receipt_id}
                    </div>
                    <div style={{ marginBottom: "5px" }}>
                        วันที่: {voidBill.issue_date} | สาขา: {voidBill.branch_id}
                    </div>
                    <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
                        รวม: {calculateTotal().toFixed(2)} บาท
                    </div>
                    <div>
                        {voidBill.items && voidBill.items.length > 0 ? (
                            voidBill.items.map((item, index) => (
                                <div key={index} style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                    <div>
                                        {item.name_th ? item.name_th : item.prod_id} x {item.quantity}
                                    </div>
                                    <div>{(item.price_each * item.quantity).toFixed(2)} บาท</div>
                                </div>
                            ))
                        ) : (
                            <div>ไม่มีรายการสินค้า</div>
                        )}
                    </div>
                    <div style={{ marginTop: "20px" }}>
                        <button
                            onClick={handleCancelReceipt}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#4CAF50",
                                color: "white",
                                borderRadius: "5px",
                                border: "none",
                                cursor: "pointer",
                                marginBottom: "10px",
                            }}
                        >
                            ยกเลิกบิลนี้
                        </button>
                    </div>
                    <div>
                        <button
                            onClick={handleReset}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#333",
                                color: "white",
                                borderRadius: "5px",
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            สแกนใบเสร็จอื่น
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: "20px" }}>
                        <input
                            type="text"
                            placeholder="กรอกหมายเลขใบเสร็จ"
                            value={receiptIdInput}
                            onChange={(e) => setReceiptIdInput(e.target.value)}
                            style={{ padding: "10px", width: "80%", borderRadius: "5px", border: "1px solid #ccc" }}
                        />
                    </div>
                    <div style={{ marginBottom: "20px" }}>
                        <button
                            onClick={fetchVoidBill}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "green",
                                color: "white",
                                borderRadius: "5px",
                                border: "none",
                                cursor: "pointer",
                                marginRight: "10px",
                            }}
                        >
                            ค้นหา
                        </button>
                        <button
                            onClick={handleReset}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "red",
                                color: "white",
                                borderRadius: "5px",
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            รีเซ็ต
                        </button>
                    </div>
                </>
            )}
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                <button
                    onClick={() => router.push("/employee/pos")}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#333",
                        color: "white",
                        borderRadius: "5px",
                        border: "none",
                        cursor: "pointer",
                    }}
                >
                    กลับหน้าการขาย
                </button>
                <button
                    onClick={() => {
                        document.cookie = "emp_id=; path=/; max-age=0";
                        router.push("/login");
                    }}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#f00",
                        color: "white",
                        borderRadius: "5px",
                        border: "none",
                        cursor: "pointer",
                    }}
                >
                    ออกจากระบบ
                </button>
            </div>
        </div>
    );
};

export default MobileVoidBillPage;
