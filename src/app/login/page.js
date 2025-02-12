"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Using next/navigation

export default function LoginPage() {
    const [emp_id, setEmpId] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const router = useRouter();

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ emp_id, password }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Login successful");
                router.push("/");
            } else {
                console.error(data.message);
                setErrorMessage(data.message);
            }
        } catch (error) {
            console.error("Login error:", error);
            setErrorMessage("An error occurred. Please try again.");
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Employee ID</label>
                    <input
                        type="text"
                        value={emp_id}
                        onChange={(e) => setEmpId(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>

            {errorMessage && <p>{errorMessage}</p>}
        </div>
    );
}
