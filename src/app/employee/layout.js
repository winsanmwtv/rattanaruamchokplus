"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EmployeeLayout({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const getCookie = (name) => {
            return document.cookie
                .split("; ")
                .find((row) => row.startsWith(name + "="))
                ?.split("=")[1];
        };

        const emp_id = getCookie("emp_id");
        if (emp_id) {
            setIsAuthenticated(true);
        } else {
            router.push("/login"); // Redirect if session is invalid
        }
    }, []);

    if (!isAuthenticated) return <div className="h-screen flex items-center justify-center">Redirecting...</div>;

    return <>{children}</>; // Only render content without duplicating NavBar/Footer
}
