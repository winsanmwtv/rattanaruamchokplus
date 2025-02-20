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

const MobileEnquiryPage = () => {
    const router = useRouter();
    const [product, setProduct] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [manualBarcode, setManualBarcode] = useState("");
    const [showCamera, setShowCamera] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [videoDevices, setVideoDevices] = useState([]);
    const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
    const [zoom, setZoom] = useState(2);
    const [lastScanned, setLastScanned] = useState("");
    const [mode, setMode] = useState("scan"); // "scan" or "more"

    const scannerRef = useRef(null);

    // Enumerate video devices
    useEffect(() => {
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
                let rearCameras = allVideoDevices.filter((device) => {
                    const label = device.label.toLowerCase();
                    return !label.includes("front") && !label.includes("selfie");
                });
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

    const videoConstraints =
        videoDevices.length > 0
            ? {
                deviceId: { exact: videoDevices[selectedDeviceIndex].deviceId },
                width: { ideal: 640 },
                height: { ideal: 480 },
            }
            : { facingMode: { ideal: "environment" }, width: { ideal: 640 }, height: { ideal: 480 } };

    const handleSwitchCamera = () => {
        if (videoDevices.length > 1) {
            setSelectedDeviceIndex((prev) => (prev + 1) % videoDevices.length);
            setZoom(2);
        }
    };

    const handleZoomChange = (e) => {
        const newZoom = parseFloat(e.target.value);
        setZoom(newZoom);
    };

    useEffect(() => {
        if (showCamera && scannerRef.current) {
            const videoEl = scannerRef.current.querySelector("video");
            if (videoEl && videoEl.srcObject) {
                const [track] = videoEl.srcObject.getVideoTracks();
                if (track) {
                    const capabilities = track.getCapabilities();
                    const advanced = [];
                    if (capabilities.zoom) {
                        const min = capabilities.zoom.min || 1;
                        const max = capabilities.zoom.max || 2;
                        const newZoom = Math.min(max, Math.max(min, zoom));
                        advanced.push({ zoom: newZoom });
                    }
                    if (capabilities.focusMode && Array.isArray(capabilities.focusMode)) {
                        if (capabilities.focusMode.includes("continuous")) {
                            advanced.push({ focusMode: "continuous" });
                        } else if (capabilities.focusMode.includes("auto")) {
                            advanced.push({ focusMode: "auto" });
                        }
                    }
                    if (advanced.length > 0) {
                        track.applyConstraints({ advanced }).catch((err) =>
                            console.error("Failed to apply advanced constraints:", err)
                        );
                    }
                }
            }
        }
    }, [zoom, showCamera]);

    // For enquiry, scan the barcode and fetch product info via /api/enquiry
    const handleBarcodeSubmit = async (barcodeValue) => {
        if (!barcodeValue.trim()) return;
        if (isWaiting) return;
        setIsWaiting(true);
        try {
            const res = await fetch(`/api/enquiry?barcode=${barcodeValue}`, {
                method: "GET",
            });
            if (!res.ok) {
                setErrorMessage("ไม่พบสินค้า");
                setTimeout(() => setErrorMessage(""), 3000);
                setIsWaiting(false);
                return;
            }
            const data = await res.json();
            setProduct(data);
        } catch (error) {
            console.error("Error fetching product:", error);
            setErrorMessage("เกิดข้อผิดพลาด");
        }
        setIsWaiting(false);
    };

    const handleScan = useCallback(
        (err, result) => {
            if (result && !isWaiting) {
                if (result.text === lastScanned) return;
                setLastScanned(result.text);
                handleBarcodeSubmit(result.text);
            }
        },
        [isWaiting, lastScanned]
    );

    const handleManualBarcodeKeyDown = (e) => {
        if (e.key === "Enter") {
            handleBarcodeSubmit(manualBarcode);
        }
    };

    // Logout handler
    const handleLogout = () => {
        document.cookie = "emp_id=; path=/; max-age=0";
        document.cookie = "firstName=; path=/; max-age=0";
        document.cookie = "lastName=; path=/; max-age=0";
        document.cookie = "employeeType=; path=/; max-age=0";
        document.cookie = "avatarUrl=; path=/; max-age=0";
        router.push("/login");
    };

    const moreMenuOptions = [
        { label: "กลับหน้าการขาย", path: "/employee/pos" },
        { label: "คืนสินค้า/คืนเงิน", path: "/employee/pos/void" },
        { label: "ออกจากระบบ", action: handleLogout },
        { label: "สินค้าอื่นๆ", action: () => alert("ฟีเจอร์สินค้าอื่นๆ ยังไม่เสร็จ") },
    ];

    // Render scan mode: show either the product information (if scanned) or the camera/manual input UI.
    const renderScanMode = () => (
        <div style={{ padding: "20px", textAlign: "center" }} ref={scannerRef}>
            {product ? (
                // Information dialog showing product details
                <div style={{ border: "1px solid #ccc", padding: "10px" }}>
                    {product.img_path && (
                        <div style={{ textAlign: "center", marginBottom: "10px" }}>
                            <img
                                src={product.img_path}
                                alt={product.name_th}
                                style={{ maxWidth: "100%", height: "auto" }}
                                onError={(e) => { e.target.style.display = "none"; }}
                            />
                        </div>
                    )}
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "5px" }}>
                        {product.name_th}
                    </div>
                    <div style={{ fontSize: "1rem", marginBottom: "5px" }}>
                        {product.barcode}
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "10px" }}>
                        {parseFloat(product.price).toFixed(2)} บาท
                    </div>
                    <div style={{ marginBottom: "10px" }}>
                        หน้าร้าน: {product.front_quantity} | หลังร้าน: {product.back_quantity}
                    </div>
                    <div style={{ marginBottom: "20px" }}>
                        โปรโมชั่น:{" "}
                        {product.is_bulk && product.single_price
                            ? `${parseFloat(product.single_price).toFixed(2)} บาท`
                            : "-"}
                    </div>
                    <button
                        onClick={() => { setProduct(null); setManualBarcode(""); setLastScanned(""); }}
                        style={{
                            padding: "10px 20px",
                            borderRadius: "5px",
                            backgroundColor: "#4CAF50",
                            color: "white",
                        }}
                    >
                        สแกนสินค้าอื่น
                    </button>
                </div>
            ) : (
                // Camera view and manual input (no numeric keypad)
                <>
                    {isWaiting ? (
                        <div style={{ width: "300px", height: "200px", backgroundColor: "black", margin: "0 auto" }}></div>
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
                                    filter: "contrast(150%) brightness(120%)",
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
                    <div style={{ margin: "20px 0" }}>
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
                </>
            )}
            {errorMessage && <div style={{ color: "red", marginTop: "10px" }}>{errorMessage}</div>}
            {/* Option to switch to "More" menu */}
            <div style={{ marginTop: "20px" }}>
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
        </div>
    );

    const renderMoreMenu = () => (
        <div style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ marginBottom: "20px", fontSize: "1.2rem", fontWeight: "bold" }}>
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
                {moreMenuOptions.map((btn, idx) => (
                    <button
                        key={idx}
                        onClick={btn.action ? btn.action : () => router.push(btn.path || "")}
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
    );

    const renderContent = () => {
        switch (mode) {
            case "scan":
                return renderScanMode();
            case "more":
                return renderMoreMenu();
            default:
                return renderScanMode();
        }
    };

    return <div style={{ height: "100vh", overflowY: "auto" }}>{renderContent()}</div>;
};

export default MobileEnquiryPage;
