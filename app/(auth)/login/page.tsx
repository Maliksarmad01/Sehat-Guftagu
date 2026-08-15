"use client";

import { AuthForm } from "@/components/auth/AuthForm";
import { useState } from "react";
import { User, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
    const [userType, setUserType] = useState<"patient" | "doctor">("patient");

    return (
        <div>
            {/* Role Selection Tabs */}
            <div className="mb-6">
                <div className="flex bg-gray-100 rounded-xl p-1">
                    <button
                        onClick={() => setUserType("patient")}
                        className={`relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                            userType === "patient"
                                ? "text-white"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        {userType === "patient" && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-lg"
                                transition={{ type: "spring", duration: 0.5 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Patient
                        </span>
                    </button>
                    <button
                        onClick={() => setUserType("doctor")}
                        className={`relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                            userType === "doctor"
                                ? "text-white"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        {userType === "doctor" && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-lg"
                                transition={{ type: "spring", duration: 0.5 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <Stethoscope className="w-4 h-4" />
                            Doctor
                        </span>
                    </button>
                </div>
            </div>

            <h3 className="text-xl font-medium text-gray-900 mb-6 text-center">
                Sign in as {userType === "patient" ? "Patient" : "Doctor"}
            </h3>
            
            <AuthForm mode="login" userType={userType} />
        </div>
    );
}
