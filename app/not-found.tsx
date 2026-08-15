"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Stethoscope } from "lucide-react";

export default function NotFound() {
    return (
        <main className="min-h-screen bg-pattern flex items-center justify-center px-4">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-gradient-to-br from-secondary/10 to-primary/5 rounded-full blur-[80px]" />
                <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] bg-gradient-to-tr from-primary/10 to-secondary/5 rounded-full blur-[60px]" />
            </div>

            <div className="relative z-10 text-center max-w-2xl mx-auto">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center mb-8"
                >
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
                        <Stethoscope className="w-8 h-8 text-white" />
                    </div>
                </motion.div>

                {/* 404 Text */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                >
                    <h1 className="font-display text-[12rem] md:text-[16rem] leading-none gradient-text tracking-wider">
                        404
                    </h1>
                </motion.div>

                {/* Message */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                        Page Not Found
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Oops! The page you're looking for seems to have wandered off. 
                        Let's get you back on track to better health.
                    </p>

                    {/* Urdu Message */}
                    <p className="font-urdu text-lg text-secondary mb-10">
                        "یہ صفحہ دستیاب نہیں ہے"
                    </p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full hover:shadow-lg hover:shadow-primary/25 transition-all hover:scale-105"
                    >
                        <Home className="w-4 h-4" />
                        Go Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary font-semibold rounded-full border border-gray-200 hover:border-primary/30 hover:bg-gray-50 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </motion.div>

                {/* Help Links */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12 pt-8 border-t border-gray-200"
                >
                    <p className="text-gray-500 text-sm mb-4">Need help? Try these:</p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm">
                        <Link href="/login" className="text-primary hover:underline">
                            Login
                        </Link>
                        <span className="text-gray-300">•</span>
                        <Link href="/signup" className="text-primary hover:underline">
                            Sign Up
                        </Link>
                        <span className="text-gray-300">•</span>
                        <Link href="/#how-it-works" className="text-primary hover:underline">
                            How It Works
                        </Link>
                        <span className="text-gray-300">•</span>
                        <Link href="/#contact" className="text-primary hover:underline">
                            Contact Us
                        </Link>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
