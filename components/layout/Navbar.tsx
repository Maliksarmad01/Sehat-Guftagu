"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Navbar Component
 * Floating navigation bar with glassmorphism effect.
 * Uses Framer Motion for animations.
 */
export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "How it Works", href: "#how-it-works" },
        { name: "Features", href: "#features" },
        { name: "About", href: "#about" },
    ];

    return (
        <>
            {/* Floating Navbar */}
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
                    scrolled ? "top-2" : "top-4"
                }`}
            >
                <div
                    className={`flex items-center gap-2 px-2 py-2 rounded-2xl transition-all duration-300 ${
                        scrolled
                            ? "bg-white/95 shadow-xl shadow-primary/10 border border-gray-100"
                            : "bg-white/80 shadow-lg shadow-black/5 border border-white/50"
                    } backdrop-blur-xl`}
                >
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 pl-3 pr-4">
                        <Image 
                            src="/logo/sehat-guftagu-logo.svg" 
                            alt="Sehat Guftagu" 
                            width={32} 
                            height={32}
                        />
                        <span className="font-display text-xl text-primary hidden sm:block tracking-wider">
                            SEHAT GUFTAGU
                        </span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors rounded-xl hover:bg-gray-50"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center gap-2">
                        <Link
                            href="/login"
                            className="px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 rounded-xl transition-all"
                        >
                            Login
                        </Link>
                        <Link
                            href="/signup"
                            className="px-5 py-2 bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all hover:scale-105"
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-xl transition-colors"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </motion.nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="fixed top-20 left-4 right-4 bg-white rounded-2xl shadow-2xl shadow-primary/20 z-50 md:hidden overflow-hidden border border-gray-100"
                        >
                            <div className="flex flex-col p-4 gap-1">
                                {navLinks.map((link, index) => (
                                    <motion.div
                                        key={link.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Link
                                            href={link.href}
                                            onClick={() => setIsOpen(false)}
                                            className="block px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                                        >
                                            {link.name}
                                        </Link>
                                    </motion.div>
                                ))}
                                <div className="border-t border-gray-100 mt-2 pt-3 flex flex-col gap-2">
                                    <Link
                                        href="/login"
                                        onClick={() => setIsOpen(false)}
                                        className="px-4 py-3 text-center font-semibold text-primary hover:bg-primary/5 rounded-xl transition-all"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/signup"
                                        onClick={() => setIsOpen(false)}
                                        className="px-4 py-3 text-center bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl"
                                    >
                                        Get Started
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
