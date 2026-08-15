"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface AuthFormProps {
    mode: "login" | "signup";
    userType?: "patient" | "doctor";
}

export const AuthForm = ({ mode, userType = "patient" }: AuthFormProps) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // For login, first check if user exists and verify role
            if (mode === "login") {
                const checkResponse = await fetch(`/api/doctors/check?email=${encodeURIComponent(email)}`);
                const checkResult = await checkResponse.json();

                if (checkResult.exists) {
                    // User exists, check role compatibility - strict check based on role
                    if (userType === "doctor" && checkResult.role === "patient") {
                        setError("This email is registered as a patient. Please login as patient or use a different email.");
                        setLoading(false);
                        return;
                    }
                    if (userType === "patient" && checkResult.role === "doctor") {
                        setError("This email is registered as a doctor. Please login as doctor or use a different email.");
                        setLoading(false);
                        return;
                    }
                }

                // Proceed with login
                const { data, error: loginError } = await authClient.signIn.email({
                    email,
                    password,
                });
                if (loginError) throw loginError;

                // Determine redirect based on role and profile completion
                if (userType === "doctor") {
                    // Update role to doctor
                    await fetch("/api/user/role", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ role: "doctor" }),
                    });
                    
                    const redirectPath = checkResult.profileComplete ? "/doctor/dashboard" : "/doctor/onboarding";
                    router.push(redirectPath);
                } else {
                    const redirectPath = checkResult.profileComplete ? "/patient/dashboard" : "/patient/medical_session";
                    router.push(redirectPath);
                }
            } else {
                // Signup flow
                // First check if email already exists with different role
                const checkResponse = await fetch(`/api/doctors/check?email=${encodeURIComponent(email)}`);
                const checkResult = await checkResponse.json();

                if (checkResult.exists) {
                    // Account already exists - stricter check
                    if (userType === "doctor" && checkResult.role === "patient") {
                        setError("This email is already registered as a patient. Please use a different email.");
                        setLoading(false);
                        return;
                    }
                    if (userType === "patient" && checkResult.role === "doctor") {
                        setError("This email is already registered as a doctor. Please use a different email.");
                        setLoading(false);
                        return;
                    }
                    // If same role, redirect to login
                    setError("This email is already registered. Please login instead.");
                    setLoading(false);
                    return;
                }

                const { data, error: signupError } = await authClient.signUp.email({
                    email,
                    password,
                    name,
                });
                if (signupError) throw signupError;

                // Set the role after signup
                await fetch("/api/user/role", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ role: userType }),
                });

                // Redirect to appropriate onboarding
                const redirectPath = userType === "doctor" ? "/doctor/onboarding" : "/patient/medical_session";
                router.push(redirectPath);
            }
            
            router.refresh();

        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError("");

        // Store the intended role in localStorage before redirect
        if (typeof window !== "undefined") {
            localStorage.setItem("pendingUserType", userType);
        }

        const callbackURL = userType === "doctor" ? "/doctor/onboarding" : "/patient/medical_session";

        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL,
            });
        } catch (err: any) {
            setError(err.message || "Google sign-in failed");
            setGoogleLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Google Sign-in Button */}
            <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                variant="outline"
                className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
                {googleLoading ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                    <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Continue with Google
                    </>
                )}
            </Button>

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                </div>
            </div>

            {/* Email Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
                {mode === "signup" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Full Name
                        </label>
                        <div className="mt-1">
                            <input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all"
                            />
                        </div>
                    </motion.div>
                )}

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email address
                    </label>
                    <div className="mt-1">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <div className="mt-1">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete={mode === "signup" ? "new-password" : "current-password"}
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-all"
                        />
                    </div>
                    {mode === "signup" && (
                        <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters</p>
                    )}
                </div>

                {error && (
                    <div className="text-red-500 text-sm font-medium bg-red-50 p-2 rounded">
                        {error}
                    </div>
                )}

                <div>
                    <Button
                        type="submit"
                        disabled={loading || googleLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : mode === "login" ? "Sign in" : "Sign up"}
                    </Button>
                </div>

                <div className="text-center text-sm">
                    {mode === "login" ? (
                        <p className="text-gray-600">
                            Don&apos;t have an account?{" "}
                            <Link href="/signup" className="font-medium text-primary hover:text-primary/90">
                                Sign up
                            </Link>
                        </p>
                    ) : (
                        <p className="text-gray-600">
                            Already have an account?{" "}
                            <Link href="/login" className="font-medium text-primary hover:text-primary/90">
                                Sign in
                            </Link>
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
};

