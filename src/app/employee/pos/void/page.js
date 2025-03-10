"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

const VoidReceiptListPage = () => {
    const [receipts, setReceipts] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [error, setError] = useState("");
    const router = useRouter();
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

    const empId = getCookie("emp_id");

    // Fetch all receipts on component mount
    useEffect(() => {
        const fetchReceipts = async () => {
            try {
                const res = await fetch("/api/void/list");
                if (!res.ok) {
                    setError("Failed to fetch receipts");
                    return;
                }
                const data = await res.json();
                setReceipts(data);
            } catch (err) {
                console.error(err);
                setError("Error fetching receipts");
            }
        };
        fetchReceipts();
    }, []);

    // When a receipt is clicked, fetch its details
    const viewReceipt = async (receiptId) => {
        try {
            const res = await fetch(`/api/void/get?receipt_id=${receiptId}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) {
                setError("Failed to fetch receipt details");
                return;
            }

            const data = await res.json();
            setSelectedReceipt(data);
        } catch (err) {
            console.error(err);
            setError("Error fetching receipt details");
        }
    };

    // Cancel (void) the currently selected receipt
    const cancelReceipt = async () => {
        if (!selectedReceipt) return;
        const confirmCancel = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการยกเลิกใบเสร็จนี้?");
        if (!confirmCancel) return;

        // Calculate the total price of the receipt, summing up the price of all items
        const totalPrice = selectedReceipt.items.reduce((sum, item) => {
            return sum + (item.quantity * item.price_each);
        }, 0);

        // Make the total price negative (because it's a void action)
        const negativeTotalPrice = -totalPrice;

        try {
            const res = await fetch("/api/void/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ receipt_id: selectedReceipt.receipt_id }),
            });
            if (!res.ok) {
                setError("Failed to cancel receipt");
                return;
            }

            const shiftRes = await fetch('/api/shift/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: new Date().toISOString().slice(0, 10),
                    emp_id: empId,
                    increment: negativeTotalPrice  // Using the negative total price
                })
            });

            if (!shiftRes.ok) {
                const errorData = await shiftRes.json();
                setError(errorData.error || "Shift update failed");
                return; // Stop further processing
            }

            alert("Receipt has been canceled");
            router.push("/employee/pos"); // Redirect to sales page
        } catch (err) {
            console.error(err);
            setError("Error canceling receipt");
        }
    };

    // Render the list view (all receipt IDs)
    const renderListView = () => (
        <div>
            <h1>รายการใบเสร็จ (ใหม่สุดไปเก่า)</h1>
            {error && <div style={{ color: "red" }}>{error}</div>}
            <ul style={{ listStyle: "none", padding: 0 }}>
                {receipts.map((receipt) => (
                    <li key={receipt.receipt_id} style={{ borderBottom: "1px solid #ccc", padding: "10px 0" }}>
                        <div
                            style={{ display: isMobile ? "block" : "flex", justifyContent: "space-between", alignItems: "center" }}
                        >
                            <div>
                                <strong>{receipt.receipt_id}</strong>
                                <br />
                                <small>Date: {receipt.issue_date}</small>
                                <br />
                                <small>Branch: {receipt.branch_id}</small>
                            </div>
                            <div style={{ marginTop: isMobile ? "10px" : 0 }}>
                                <button onClick={() => viewReceipt(receipt.receipt_id)} style={{ padding: "8px 12px" }}>
                                    View
                                </button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );

    // Render the detail view (for a single receipt)
    const renderDetailView = () => (
        <div>
            <button onClick={() => setSelectedReceipt(null)} style={{ marginBottom: "20px", padding: "10px" }}>
                Back to List
            </button>
            <h2>Receipt: {selectedReceipt.receipt_id}</h2>
            <p>
                Date: {selectedReceipt.issue_date} | Branch: {selectedReceipt.branch_id}
            </p>
            <h3>Items:</h3>
            <ul>
                {selectedReceipt.items.map((item) => (
                    <li key={item.prod_id}>
                        {item.name_th} - {item.quantity} x {item.price_each} THB
                    </li>
                ))}
            </ul>
            <button onClick={cancelReceipt} style={{ padding: "10px", backgroundColor: "red", color: "white" }}>
                Void Receipt
            </button>
            <button onClick={() => router.push("/employee/pos")} style={{ padding: "10px", marginLeft: "10px" }}>
                Back to Sale
            </button>
        </div>
    );

    return (
        <div style={{ padding: "20px", height: "100vh", overflowY: "auto" }}>
            {!selectedReceipt ? renderListView() : renderDetailView()}
        </div>
    );
};

export default VoidReceiptListPage;
