"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// test commit on new windows 11

export default function Home() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const getCookie = (name) => {
            return document.cookie
                .split("; ")
                .find(row => row.startsWith(name + "="))
                ?.split("=")[1];
        };

        const emp_id = getCookie("emp_id");
        if (emp_id) {
            setIsAuthenticated(true);
            router.push("/employee");
        } else {
            router.push("/login"); // Redirect if session is invalid
        }
    }, []);

    if (!isAuthenticated) return <div>Redirecting...</div>;

    return (
        <div></div>
    );
}
