"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function SoftLogin() {
    const [emp_id, setEmpId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await axios.post("/api/softlogin", {
                emp_id,
                password,
            });

            if (response.data.success) {
                router.push("/"); // Redirect to the home page
            } else {
                setError(response.data.message); // Show the error message
            }
        } catch (error) {
            setError("An error occurred while logging in");
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                <h2 className="text-2xl font-semibold text-center">Soft Login</h2>
                {error && <div className="text-red-500 text-center mt-2">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                        <label htmlFor="emp_id" className="block text-sm font-medium text-gray-700">Employee ID</label>
                        <input
                            type="text"
                            id="emp_id"
                            value={emp_id}
                            onChange={(e) => setEmpId(e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}
