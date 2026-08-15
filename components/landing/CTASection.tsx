"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import gsap from "gsap";

export const CTASection = () => {
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Animate the gradient orbs
            gsap.to(".cta-orb", {
                y: -20,
                duration: 3,
                ease: "power1.inOut",
                yoyo: true,
                repeat: -1,
                stagger: 0.5,
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="relative py-32 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#2a5298] to-secondary" />
            
            {/* Animated Orbs */}
            <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl cta-orb" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl cta-orb" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px] cta-orb" />

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center">

                    {/* Main Heading */}
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="font-display text-5xl md:text-7xl lg:text-8xl text-white tracking-wide mb-6 leading-[0.95]"
                    >
                        READY WHEN
                        <br />
                        <span className="text-white/60">YOU ARE</span>
                    </motion.h2>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed"
                    >
                        Experience the future of healthcare. Our AI assistant is available 24/7 to help you understand your symptoms and connect you with the right care.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Link
                            href="/signup"
                            className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-primary text-lg font-semibold rounded-full hover:shadow-2xl hover:shadow-white/20 transition-all hover:scale-105"
                        >
                            Start Free Trial
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="#demo"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white text-lg font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-all"
                        >
                            Watch Demo
                        </Link>
                    </motion.div>

                    {/* Trust Badge */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="mt-8 text-white/50 text-sm"
                    >
                        No credit card required • Free for first consultation • HIPAA compliant
                    </motion.p>
                </div>
            </div>
        </section>
    );
};
