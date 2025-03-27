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

const MobileReceiveStock = () => {
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
    const [showCamera, setShowCamera] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);

    // Device selection states
    const [videoDevices, setVideoDevices] = useState([]);
    const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);

    // Zoom state (default set to 2x)
    const [zoom, setZoom] = useState(2);

    // To prevent duplicate scans
    const [lastScanned, setLastScanned] = useState("");

    // Modes: "scan", "more", "payment", "cash", "thaiQR", "result"
    const [mode, setMode] = useState("scan");
    const [cashReceived, setCashReceived] = useState("");
    const [changeDue, setChangeDue] = useState(null);

    // Reference for the scanner container (to access the video element)
    const scannerRef = useRef(null);

    // ------------------ Enumerate and Select Video Devices ------------------
    useEffect(() => {
        // Request permission so that device labels are available.
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                stream.getTracks().forEach((track) => track.stop());
                return navigator.mediaDevices.enumerateDevices();
            })
            .then((devices) => {
                const allVideoDevices = devices.filter(
                    (device) => device.kind === "videoinput"
                );
                // Filter out front-facing devices based on label.
                let rearCameras = allVideoDevices.filter((device) => {
                    const label = device.label.toLowerCase();
                    return !label.includes("front") && !label.includes("selfie");
                });
                // Fallback if no rear-facing devices are found.
                if (rearCameras.length === 0) {
                    rearCameras = allVideoDevices;
                }
                setVideoDevices(rearCameras);
                setSelectedDeviceIndex(0);
            })
            .catch((err) => {
                console.error("Error enumerating devices:", err);
            });
    }, []);

    // ------------------ Video Constraints ------------------
    const videoConstraints =
        videoDevices.length > 0
            ? {
                deviceId: { exact: videoDevices[selectedDeviceIndex].deviceId },
                width: { ideal: 640 },
                height: { ideal: 480 },
            }
            : { facingMode: { ideal: "environment" }, width: { ideal: 640 }, height: { ideal: 480 } };

    // ------------------ Switch Camera Handler ------------------
    const handleSwitchCamera = () => {
        if (videoDevices.length > 1) {
            setSelectedDeviceIndex((prevIndex) => (prevIndex + 1) % videoDevices.length);
            // Optionally reset zoom when switching cameras.
            setZoom(2);
        }
    };

    // ------------------ Zoom Handler ------------------
    const handleZoomChange = (e) => {
        const newZoom = parseFloat(e.target.value);
        setZoom(newZoom);
    };

    // ------------------ Apply Zoom, Auto-Focus, and Contrast Enhancements ------------------
    useEffect(() => {
        if (showCamera && scannerRef.current) {
            const videoEl = scannerRef.current.querySelector("video");
            if (videoEl && videoEl.srcObject) {
                const [track] = videoEl.srcObject.getVideoTracks();
                if (track) {
                    const capabilities = track.getCapabilities();
                    const advanced = [];
                    // Apply zoom if supported.
                    if (capabilities.zoom) {
                        const min = capabilities.zoom.min || 1;
                        const max = capabilities.zoom.max || 2;
                        const newZoom = Math.min(max, Math.max(min, zoom));
                        advanced.push({ zoom: newZoom });
                    }
                    // Attempt to optimize auto-focus if supported.
                    if (capabilities.focusMode && Array.isArray(capabilities.focusMode)) {
                        if (capabilities.focusMode.includes("continuous")) {
                            advanced.push({ focusMode: "continuous" });
                        } else if (capabilities.focusMode.includes("auto")) {
                            advanced.push({ focusMode: "auto" });
                        }
                    }
                    if (advanced.length > 0) {
                        track
                            .applyConstraints({ advanced })
                            .catch((err) => console.error("Failed to apply advanced constraints:", err));
                    }
                }
            }
        }
    }, [zoom, showCamera]);

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
        if (isWaiting) return; // Prevent duplicate processing

        // Disable scanning for 1.5 sec.
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
                    setLastScanned(""); // reset last scanned
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
        // Clear waiting and last scanned after delay
        setTimeout(() => {
            setIsWaiting(false);
            setShowCamera(false);
            setLastScanned("");
        }, 1500);
    };

    // ------------------ Camera Scan Handler ------------------
    const handleScan = useCallback(
        (err, result) => {
            if (result && !isWaiting) {
                // Prevent duplicate scan of same barcode.
                if (result.text === lastScanned) return;
                setLastScanned(result.text);
                console.log("Scanned barcode:", result.text);
                handleBarcodeSubmit(result.text);
            }
        },
        [isWaiting, lastScanned]
    );

    // ------------------ Quantity Handlers ------------------
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

    const handleCashPayment = async () => {

        setErrorMessage("กำลังติดต่อกับระบบฐานข้อมูล CityRetails... | อาจใช้เวลาสักครู่");

        try {
            for (const item of itemList) {

                const stockRes = await fetch('/api/product/addBackStock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prod_id: item.barcode,
                        quantity: item.quantity,
                        branch_id: 9000
                    })
                });

                if (!stockRes.ok) {
                    const errorData = await stockRes.json();
                    setErrorMessage(errorData.error || `Stock update failed for product ${item.barcode}`);
                    return; // Stop further processing
                }
            }

            setErrorMessage("ทำรายการเสร็จสิ้น กำลังกลับหน้าแรกโดยอัตโนมัติ");

            router.push("/employee");

        } catch (error) {
            console.error("Error processing Cash payment:", error);
            setErrorMessage(error.message || "การทำธุรกรรมล้มเหลว");
        }
    };

    const handleThaiQRPayment = () => {
        setMode("thaiQR");
    };

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
                    setErrorMessage(
                        errorData.error || `สร้างรายการสินค้าในใบเสร็จล้มเหลวสำหรับ ${item.barcode}`
                    );
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
                    setErrorMessage(
                        errorData.error || `สร้างรายการสินค้าในธุรกรรมล้มเหลวสำหรับ ${item.barcode}`
                    );
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
                    setErrorMessage(
                        errorData.error || `อัปเดตสต็อกล้มเหลวสำหรับ ${item.barcode}`
                    );
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

    // Scan Mode UI – the container ensures a fixed horizontal (landscape) crop.
    const renderScanMode = () => (
        <div style={{ padding: "20px", textAlign: "center" }} ref={scannerRef}>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "10px" }}>
                ตรวจสอบการรับสินค้า
            </div>
            <div style={{ marginBottom: "10px" }}>
                รวม: {totalPrice.toFixed(2)} ({itemList.reduce((sum, item) => sum + item.quantity, 0)} รายการ)
            </div>
            {/* Camera section */}
            <div style={{ marginBottom: "20px" }}>
                {isWaiting ? (
                    <div style={{ width: "300px", height: "200px", backgroundColor: "black" }}></div>
                ) : showCamera ? (
                    <div
                        style={{
                            width: "300px",
                            height: "200px",
                            overflow: "hidden",
                            position: "relative",
                            margin: "0 auto",
                        }}
                    >
                        <BarcodeScannerComponent
                            width={300}
                            height={200}
                            videoConstraints={videoConstraints}
                            onUpdate={handleScan}
                            onError={(err) => console.error("Scanner error:", err)}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                filter: "contrast(150%) brightness(120%)", // Enhance contrast/brightness
                            }}
                        />
                        <button
                            onClick={handleSwitchCamera}
                            style={{
                                position: "absolute",
                                bottom: "5px",
                                right: "5px",
                                padding: "5px 10px",
                                backgroundColor: "rgba(0,0,0,0.5)",
                                color: "white",
                                border: "none",
                                borderRadius: "3px",
                                cursor: "pointer",
                            }}
                        >
                            Switch Camera
                        </button>
                    </div>
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
            {/* Zoom slider (visible when camera is active) */}
            {showCamera && (
                <div style={{ marginBottom: "10px" }}>
                    <label style={{ marginRight: "10px" }}>Zoom: {zoom}x</label>
                    <input
                        type="range"
                        min="1"
                        max="2"
                        step="0.1"
                        value={zoom}
                        onChange={handleZoomChange}
                    />
                </div>
            )}
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
                    ยืนยันการเช็คสินค้า
                </button>
            </div>
            {errorMessage && <div style={{ color: "red", marginTop: "10px" }}>{errorMessage}</div>}
        </div>
    );

    // More Menu, Payment, and Result UIs remain similar.
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
                    { label: "ออกจากระบบ", action: () => alert("ออกจากระบบ") },
                    { label: "ทำรายการใหม่", action: () => setItemList([]) },
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

    const renderPaymentMode = () => (
        <div style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "10px" }}>
                ตรวจสอบสินค้าหมดอายุ
            </div>
            <div style={{ marginBottom: "20px" }}>ยอดรวม: {totalPrice.toFixed(2)}</div>
            <div style={{ marginBottom: "20px" }}>

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
                    ยืนยันการทำรายการ
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

    const renderCashResult = () => (
        <div style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "10px" }}>
                ตรวจสอบสินค้าหมดอายุ
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

    const renderThaiQRMode = () => (
        <div style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "10px" }}>
                ตรวจสอบสินค้าหมดอายุ
            </div>
            <div style={{ marginBottom: "20px" }}>ยอดรวม: {totalPrice.toFixed(2)}</div>
            <div style={{ marginBottom: "20px" }}>
                <img
                    src={`https://promptpay.io/0935182935/${totalPrice}.png`}
                    alt="PromptPay QR Code"
                    style={{ maxWidth: "80%", height: "auto" }}
                />
            </div>
            <div style={{ marginBottom: "20px" }}>
                <div>สิรวิชญ์ ผาสุข</div>
                <div>0935182935</div>
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

    const renderResultMode = () => (
        <div style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "20px" }}>
                บันทึกการทำรายการแล้ว
            </div>
            <div style={{ marginBottom: "20px" }}>ตรวจสอบสินค้าหมดอายุ</div>
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

export default MobileReceiveStock;
