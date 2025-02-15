"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EmployeeLayout({ children }) {
    const [employee, setEmployee] = useState(null);
    const router = useRouter();

    useEffect(() => {
        // Utility function to parse cookies into an object
        const getCookies = () =>
            document.cookie.split("; ").reduce((acc, cookie) => {
                const [name, value] = cookie.split("=");
                acc[name] = decodeURIComponent(value);
                return acc;
            }, {});

        const cookies = getCookies();

        // Check if the required employee cookie exists
        if (cookies.emp_id) {
            // Set employee state with available cookie data
            setEmployee({
                emp_id: cookies.emp_id,
                firstname: cookies.firstname || "",
                lastname: cookies.lastname || "",
                img_path: cookies.img_path || "", // Employee profile image path
                // Add any additional employee data here as needed
            });
        } else {
            // Redirect to login if not authenticated
            router.push("/login");
        }
    }, [router]);

    if (!employee) {
        return (
            <div className="h-screen flex items-center justify-center">
                Redirecting...
            </div>
        );
    }

    return (
        <div>

            <main>{children}</main>
        </div>
    );
}
