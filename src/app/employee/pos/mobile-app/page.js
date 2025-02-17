"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

// Helper function to get cookie by name
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
};

const MobilePosPage = () => {
    const router = useRouter();
    const empId = getCookie("emp_id");

    // Common states
    const [receiptId, setReceiptId] = useState("");
    const [itemList, setItemList] = useState([]); // Each item: { id, barcode, name_th, quantity, price }
    const [totalPrice, setTotalPrice] = useState(0);
    const [manualBarcode, setManualBarcode] = useState("");
    const [quantityInput, setQuantityInput] = useState(1);
    const [errorMessage, setErrorMessage] = useState("");

    // Camera and scanning states
    const [showCamera, setShowCamera] = useState(false); // Disabled by default
    const [isWaiting, setIsWaiting] = useState(false);

    // Device selection state
    const [selectedDeviceId, setSelectedDeviceId] = useState(null);

    // Modes: "scan", "more", "payment", "cash", "thaiQR", "result"
    const [mode, setMode] = useState("scan");
    const [cashReceived, setCashReceived] = useState("");
    const [changeDue, setChangeDue] = useState(null);

    // Reference for the scanner container (if needed)
    const scannerRef = useRef(null);

    // ------------------ Enumerate and Select Video Device ------------------
    useEffect(() => {
        // Request permission first so device labels become available
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                // Stop the stream immediately – we just need permission.
                stream.getTracks().forEach((track) => track.stop());
                return navigator.mediaDevices.enumerateDevices();
            })
            .then((devices) => {
                const videoDevices = devices.filter(
                    (device) => device.kind === "videoinput"
                );
                // Look for a device that does not include "ultra" in the label
                const standardDevice = videoDevices.find((device) => {
                    const label = device.label.toLowerCase();
                    return label.includes("wide") && !label.includes("ultra");
                });
                if (standardDevice) {
                    setSelectedDeviceId(standardDevice.deviceId);
                } else if (videoDevices.length > 0) {
                    // Fallback: use the first available device
                    setSelectedDeviceId(videoDevices[0].deviceId);
                }
            })
            .catch((err) => {
                console.error("Error enumerating devices:", err);
            });
    }, []);

    // ------------------ Define Video Constraints ------------------
    const videoConstraints = selectedDeviceId
        ? { deviceId: selectedDeviceId }
        : { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } };

    // ------------------ Fetch Receipt ID ------------------
    useEffect(() => {
        const fetchReceiptId = async () => {
            try {
                const res = await fetch("/api/receipt/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ staffId: 90002453 }),
                });
                if (!res.ok) throw new Error("ไม่สามารถดึงรหัสใบเสร็จได้");
                const data = await res.json();
                setReceiptId(data.receipt_id);
            } catch (error) {
                console.error("Error fetching receipt ID:", error);
            }
        };
        fetchReceiptId();
    }, []);

    // ------------------ Update Total Price ------------------
    useEffect(() => {
        const newTotal = itemList.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
        setTotalPrice(newTotal);
    }, [itemList]);

    // ------------------ Barcode Processing ------------------
    const handleBarcodeSubmit = async (barcodeValue) => {
        if (!barcodeValue.trim()) return;
        if (isWaiting) return; // Prevent duplicate scans

        // Disable scanning & blank the screen for 1.5 sec
        setIsWaiting(true);
        setShowCamera(false);

        try {
            const res = await fetch(`/api/product/get?barcode=${barcodeValue}`, {
                method: "GET",
            });
            if (!res.ok) {
                setErrorMessage("ไม่พบสินค้า");
                setTimeout(() => setErrorMessage(""), 3000);
                setTimeout(() => {
                    setIsWaiting(false);
                    setShowCamera(false);
                }, 1500);
                return;
            }
            const product = await res.json();
            const newItem = {
                id: itemList.length + 1,
                barcode: barcodeValue,
                name_th: product.name_th,
                quantity: parseInt(quantityInput, 10) || 1,
                price: parseFloat(product.price),
            };
            setItemList((prev) => [...prev, newItem]);
            setManualBarcode("");
            setQuantityInput(1);
        } catch (error) {
            console.error("Error fetching product:", error);
        }
        // Re-enable scanning after waiting period (camera remains off by default)
        setTimeout(() => {
            setIsWaiting(false);
            setShowCamera(false);
        }, 1500);
    };

    // ------------------ Camera Scan Handler ------------------
    const handleScan = useCallback(
        (err, result) => {
            if (result && !isWaiting) {
                console.log("Scanned barcode:", result.text);
                handleBarcodeSubmit(result.text);
            }
        },
        [isWaiting]
    );

    // ------------------ Quantity Handlers (desktop style) ------------------
    const increaseQuantity = () => {
        setQuantityInput((prev) => parseInt(prev, 10) + 1);
    };
    const decreaseQuantity = () => {
        setQuantityInput((prev) => Math.max(1, parseInt(prev, 10) - 1));
    };

    // ------------------ Manual Barcode Input ------------------
    const handleManualBarcodeKeyDown = (e) => {
        if (e.key === "Enter") {
            handleBarcodeSubmit(manualBarcode);
        }
    };

    // ------------------ Checkout and Payment Handlers ------------------
    const handleCheckout = () => {
        if (totalPrice <= 0) {
            setErrorMessage("ยังไม่มีรายการสินค้า");
            setTimeout(() => setErrorMessage(""), 3000);
            return;
        }
        setMode("payment");
    };

    // Cash Payment Handler (contact database immediately)
    const handleCashPayment = async () => {
        setErrorMessage("กำลังติดต่อกับระบบฐานข้อมูล CityRetails... | อาจใช้เวลาสักครู่");
        const cash = parseFloat(cashReceived) || 0;
        if (cash < totalPrice) {
            setErrorMessage("จำนวนเงินที่รับมาน้อยกว่าราคารวม");
            return;
        }
        try {
            let trans_id;
            const transRes = await fetch("/api/transaction/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emp_id: empId,
                    branch_id: 9000,
                    total_price: totalPrice,
                    status: "completed",
                    payment_type: "Cash",
                }),
            });
            if (!transRes.ok) {
                const errorData = await transRes.json();
                setErrorMessage(errorData.error || "สร้างรายการธุรกรรมล้มเหลว");
                return;
            }
            const transData = await transRes.json();
            trans_id = transData.trans_id;

            const receiptRes = await fetch("/api/receipt/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    receipt_id: receiptId,
                    trans_id: trans_id,
                    branch_id: 9000,
                    issue_date: new Date().toISOString().slice(0, 10),
                }),
            });
            if (!receiptRes.ok) {
                const errorData = await receiptRes.json();
                setErrorMessage(errorData.error || "สร้างใบเสร็จล้มเหลว");
                return;
            }

            for (const item of itemList) {
                const receiptItemRes = await fetch("/api/receipt_item/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        receipt_id: receiptId,
                        prod_id: item.barcode,
                        quantity: item.quantity,
                        price_each: item.price,
                    }),
                });
                if (!receiptItemRes.ok) {
                    const errorData = await receiptItemRes.json();
                    setErrorMessage(errorData.error || `สร้างรายการสินค้าในใบเสร็จล้มเหลวสำหรับ ${item.barcode}`);
                    return;
                }
                const transItemRes = await fetch("/api/transaction_item/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        trans_id: trans_id,
                        prod_id: item.barcode,
                        quantity: item.quantity,
                        price_each: item.price,
                    }),
                });
                if (!transItemRes.ok) {
                    const errorData = await transItemRes.json();
                    setErrorMessage(errorData.error || `สร้างรายการสินค้าในธุรกรรมล้มเหลวสำหรับ ${item.barcode}`);
                    return;
                }
                const stockRes = await fetch("/api/product/updateStock", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prod_id: item.barcode,
                        quantity: item.quantity,
                        branch_id: 9000,
                    }),
                });
                if (!stockRes.ok) {
                    const errorData = await stockRes.json();
                    setErrorMessage(errorData.error || `อัปเดตสต็อกล้มเหลวสำหรับ ${item.barcode}`);
                    return;
                }
            }

            const shiftRes = await fetch("/api/shift/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: new Date().toISOString().slice(0, 10),
                    emp_id: empId,
                    increment: totalPrice,
                }),
            });
            if (!shiftRes.ok) {
                const errorData = await shiftRes.json();
                setErrorMessage(errorData.error || "อัปเดตกะการทำงานล้มเหลว");
                return;
            }

            setChangeDue((cash - totalPrice).toFixed(2));
            setMode("cash");
        } catch (error) {
            console.error("Error processing Cash payment:", error);
            setErrorMessage(error.message || "เกิดข้อผิดพลาดในการชำระเงิน");
        }
    };

    // When user clicks Thai QR in Payment mode, simply switch to QR page.
    const handleThaiQRPayment = () => {
        setMode("thaiQR");
    };

    // On the Thai QR page, when user clicks success, then contact the database.
    const submitThaiQRPayment = async () => {
        setErrorMessage("กำลังติดต่อกับระบบฐานข้อมูล CityRetails... | อาจใช้เวลาสักครู่");
        try {
            let trans_id;
            const transRes = await fetch("/api/transaction/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emp_id: empId,
                    branch_id: 9000,
                    total_price: totalPrice,
                    status: "completed",
                    payment_type: "Thai QR",
                }),
            });
            if (!transRes.ok) {
                const errorData = await transRes.json();
                setErrorMessage(errorData.error || "สร้างรายการธุรกรรมล้มเหลว");
                return;
            }
            const transData = await transRes.json();
            trans_id = transData.trans_id;

            const receiptRes = await fetch("/api/receipt/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    receipt_id: receiptId,
                    trans_id: trans_id,
                    branch_id: 9000,
                    issue_date: new Date().toISOString().slice(0, 10),
                }),
            });
            if (!receiptRes.ok) {
                const errorData = await receiptRes.json();
                setErrorMessage(errorData.error || "สร้างใบเสร็จล้มเหลว");
                return;
            }

            for (const item of itemList) {
                const receiptItemRes = await fetch("/api/receipt_item/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        receipt_id: receiptId,
                        prod_id: item.barcode,
                        quantity: item.quantity,
                        price_each: item.price,
                    }),
                });
                if (!receiptItemRes.ok) {
                    const errorData = await receiptItemRes.json();
                    setErrorMessage(errorData.error || `สร้างรายการสินค้าในใบเสร็จล้มเหลวสำหรับ ${item.barcode}`);
                    return;
                }
                const transItemRes = await fetch("/api/transaction_item/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        trans_id: trans_id,
                        prod_id: item.barcode,
                        quantity: item.quantity,
                        price_each: item.price,
                    }),
                });
                if (!transItemRes.ok) {
                    const errorData = await transItemRes.json();
                    setErrorMessage(errorData.error || `สร้างรายการสินค้าในธุรกรรมล้มเหลวสำหรับ ${item.barcode}`);
                    return;
                }
                const stockRes = await fetch("/api/product/updateStock", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prod_id: item.barcode,
                        quantity: item.quantity,
                        branch_id: 9000,
                    }),
                });
                if (!stockRes.ok) {
                    const errorData = await stockRes.json();
                    setErrorMessage(errorData.error || `อัปเดตสต็อกล้มเหลวสำหรับ ${item.barcode}`);
                    return;
                }
            }
            setErrorMessage("การทำรายการเสร็จสิ้น");
            setChangeDue("0.00");
            setMode("result");
        } catch (error) {
            console.error("Error processing ThaiQR payment:", error);
            setErrorMessage(error.message || "เกิดข้อผิดพลาดในการชำระเงินด้วย Thai QR");
        }
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    // ------------------ RENDER FUNCTIONS ------------------

    // Scan Mode UI
    const renderScanMode = () => (
        <div style={{ padding: "20px", textAlign: "center" }} ref={scannerRef}>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "10px" }}>
                รหัสใบเสร็จ: {receiptId}
            </div>
            <div style={{ marginBottom: "10px" }}>
                รวม: {totalPrice.toFixed(2)} ({itemList.reduce((sum, item) => sum + item.quantity, 0)} รายการ)
            </div>
            {/* Camera section */}
            <div style={{ marginBottom: "20px" }}>
                {isWaiting ? (
                    <div style={{ width: "100%", height: "200px", backgroundColor: "black" }}></div>
                ) : showCamera ? (
                    <BarcodeScannerComponent
                        width={300}
                        height={200}
                        videoConstraints={videoConstraints}
                        onUpdate={handleScan}
                        onError={(err) => console.error("Scanner error:", err)}
                    />
                ) : (
                    <button
                        onClick={() => setShowCamera(true)}
                        style={{
                            padding: "10px 20px",
                            borderRadius: "5px",
                            backgroundColor: "#4CAF50",
                            color: "white",
                        }}
                    >
                        เปิดกล้องสแกนบาร์โค้ด
                    </button>
                )}
            </div>
            {/* Manual barcode input */}
            <div style={{ marginBottom: "10px" }}>
                <input
                    type="text"
                    placeholder="กรอกบาร์โค้ดด้วยตนเอง"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    onKeyDown={handleManualBarcodeKeyDown}
                    style={{
                        padding: "10px",
                        width: "60%",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                    }}
                />
                <button
                    onClick={() => handleBarcodeSubmit(manualBarcode)}
                    style={{
                        marginLeft: "10px",
                        padding: "10px 20px",
                        borderRadius: "5px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                    }}
                >
                    ตกลง
                </button>
            </div>
            {/* More menu button */}
            <div style={{ marginBottom: "20px" }}>
                <button
                    onClick={() => setMode("more")}
                    style={{
                        padding: "10px 20px",
                        borderRadius: "5px",
                        backgroundColor: "#333",
                        color: "white",
                    }}
                >
                    เมนูเพิ่มเติม
                </button>
            </div>
            {/* Checkout button */}
            <div>
                <button
                    onClick={handleCheckout}
                    style={{
                        padding: "10px 20px",
                        borderRadius: "5px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                    }}
                >
                    รวมยอด
                </button>
            </div>
            {errorMessage && <div style={{ color: "red", marginTop: "10px" }}>{errorMessage}</div>}
        </div>
    );

    // More Menu UI (2-column layout for 7 options)
    const renderMoreMenu = () => (
        <div style={{ padding: "20px" }}>
            <div style={{ textAlign: "center", marginBottom: "20px", fontSize: "1.2rem", fontWeight: "bold" }}>
                เมนูเพิ่มเติม
            </div>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "10px",
                    marginBottom: "20px",
                }}
            >
                {[
                    { label: "เช็คราคาสินค้า", action: () => alert("เช็คราคาสินค้า") },
                    { label: "คืนสินค้า (Void)", action: () => alert("คืนสินค้า (Void)") },
                    { label: "พักบิล", action: () => alert("พักบิล") },
                    { label: "ออกจากระบบ", action: () => alert("ออกจากระบบ") },
                    { label: "เรียกรายการพักบิล", action: () => alert("เรียกรายการพักบิล") },
                    { label: "ยกเลิกบิลนี้", action: () => setItemList([]) },
                    { label: "สินค้าอื่นๆ", action: () => alert("สินค้าอื่นๆ") },
                ].map((btn, idx) => (
                    <button
                        key={idx}
                        onClick={btn.action}
                        style={{
                            padding: "10px",
                            borderRadius: "5px",
                            backgroundColor: "#555",
                            color: "white",
                        }}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>
            <div style={{ textAlign: "center" }}>
                <button
                    onClick={() => setMode("scan")}
                    style={{
                        padding: "10px 20px",
                        borderRadius: "5px",
                        backgroundColor: "#FF6347",
                        color: "white",
                    }}
                >
                    กลับสู่การสแกน
                </button>
            </div>
        </div>
    );

    // Payment Mode UI
    const renderPaymentMode = () => (
        <div style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "10px" }}>
                รหัสใบเสร็จ: {receiptId}
            </div>
            <div style={{ marginBottom: "20px" }}>ยอดรวม: {totalPrice.toFixed(2)}</div>
            <div style={{ marginBottom: "20px" }}>
                <input
                    type="text"
                    placeholder="จำนวนเงินที่รับมา"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    style={{
                        padding: "10px",
                        width: "60%",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                    }}
                />
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
                <button
                    onClick={handleCashPayment}
                    style={{
                        padding: "10px 20px",
                        borderRadius: "5px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                    }}
                >
                    เงินสด
                </button>
                <button
                    onClick={handleThaiQRPayment}
                    style={{
                        padding: "10px 20px",
                        borderRadius: "5px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                    }}
                >
                    Thai QR
                </button>
                <button
                    onClick={() => alert("คูปอง ยังไม่สามารถใช้งานได้")}
                    style={{
                        padding: "10px 20px",
                        borderRadius: "5px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                    }}
                >
                    คูปอง
                </button>
            </div>
            <div>
                <button
                    onClick={() => setMode("scan")}
                    style={{
                        padding: "10px 20px",
                        borderRadius: "5px",
                        backgroundColor: "#FF6347",
                        color: "white",
                    }}
                >
                    กลับสู่การสแกน
                </button>
            </div>
            {errorMessage && <div style={{ color: "red", marginTop: "10px" }}>{errorMessage}</div>}
        </div>
    );

    // Cash Payment Result UI
    const renderCashResult = () => (
        <div style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "10px" }}>
                รหัสใบเสร็จ: {receiptId}
            </div>
            <div style={{ marginBottom: "20px" }}>เงินทอน: {changeDue}</div>
            <div>
                <button
                    onClick={handleRefresh}
                    style={{
                        padding: "10px 20px",
                        borderRadius: "5px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                    }}
                >
                    ทำรายการอื่นต่อ
                </button>
            </div>
        </div>
    );

    // Thai QR Payment UI (database is contacted only after clicking success)
    const renderThaiQRMode = () => (
        <div style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "10px" }}>
                รหัสใบเสร็จ: {receiptId}
            </div>
            <div style={{ marginBottom: "20px" }}>ยอดรวม: {totalPrice.toFixed(2)}</div>
            <div style={{ marginBottom: "20px" }}>
                <img
                    src={`https://promptpay.io/1103400083485/${totalPrice}.png`}
                    alt="PromptPay QR Code"
                    style={{ maxWidth: "80%", height: "auto" }}
                />
            </div>
            <div style={{ marginBottom: "20px" }}>
                <div>พงศ์ศิริ เลิศพงษ์ไทย</div>
                <div>1103400083485</div>
            </div>
            <div>
                <button
                    onClick={submitThaiQRPayment}
                    style={{
                        padding: "10px 20px",
                        borderRadius: "5px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                    }}
                >
                    ยืนยันการทำรายการ
                </button>
            </div>
            {errorMessage && <div style={{ color: "red", marginTop: "10px" }}>{errorMessage}</div>}
        </div>
    );

    // Transaction Result UI
    const renderResultMode = () => (
        <div style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "20px" }}>
                บันทึกการทำรายการแล้ว
            </div>
            <div style={{ marginBottom: "20px" }}>รหัสใบเสร็จ: {receiptId}</div>
            <div>
                <button
                    onClick={handleRefresh}
                    style={{
                        padding: "10px 20px",
                        borderRadius: "5px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                    }}
                >
                    ทำรายการใหม่
                </button>
            </div>
        </div>
    );

    // Main render based on mode
    const renderContent = () => {
        switch (mode) {
            case "scan":
                return renderScanMode();
            case "more":
                return renderMoreMenu();
            case "payment":
                return renderPaymentMode();
            case "cash":
                return renderCashResult();
            case "thaiQR":
                return renderThaiQRMode();
            case "result":
                return renderResultMode();
            default:
                return renderScanMode();
        }
    };

    return <div style={{ height: "100vh", overflowY: "auto" }}>{renderContent()}</div>;
};

export default MobilePosPage;
