"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Mic, Activity, FileText, Heart, Shield, Clock } from "lucide-react";
import Link from "next/link";
import gsap from "gsap";

export const Hero = () => {
    const heroRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const floatingRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Floating elements animation
            gsap.to(".float-element", {
                y: -15,
                duration: 2,
                ease: "power1.inOut",
                yoyo: true,
                repeat: -1,
                stagger: 0.3,
            });

            // Pulse animation for the mic icon
            gsap.to(".pulse-icon", {
                scale: 1.1,
                duration: 1,
                ease: "power1.inOut",
                yoyo: true,
                repeat: -1,
            });
        }, heroRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={heroRef}
            className="relative pt-32 pb-20 px-4 md:px-6 overflow-hidden min-h-screen flex flex-col justify-center bg-pattern"
        >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Gradient Orbs */}
                <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-gradient-to-br from-secondary/20 to-primary/10 rounded-full blur-[80px] float-element" />
                <div className="absolute bottom-[20%] left-[5%] w-[300px] h-[300px] bg-gradient-to-tr from-primary/15 to-secondary/10 rounded-full blur-[60px] float-element" />
                
                {/* Grid Lines */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(62,111,203,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(62,111,203,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <div className="container mx-auto relative z-10">
                {/* Hero Content */}
                <div className="flex flex-col items-center text-center mb-20">
                    {/* Main Title */}
                    <motion.h1
                        ref={titleRef}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-lemonmilk tracking-wide text-gray-900 mb-6 max-w-5xl leading-[1.1]"
                    >
                        <span className="text-primary">BRIDGING</span>{" "}
                        <span className="gradient-text">HEALTHCARE</span>
                        <br />
                        <span className="gradient-text">GAPS WITH</span>{" "}
                        <span className="text-secondary">AI</span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="text-lg md:text-xl text-gray-600 max-w-2xl mb-4 leading-relaxed"
                    >
                        <b>Intelligent voice interviews that connect patients with doctors.</b>
                        <b>Speak in Urdu or English - our AI understands.</b>
                    </motion.p>

                    {/* Urdu Tagline */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="font-urdu text-xl text-secondary mb-10"
                    >
                        <b>"آپ کی صحت، ہماری ترجیح"</b>
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        <Link
                            href="/signup"
                            className="group px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white text-lg font-semibold rounded-full hover:shadow-2xl hover:shadow-primary/30 transition-all flex items-center gap-3 hover:scale-105"
                        >
                            <Mic className="w-5 h-5 pulse-icon" />
                            Start Health Checkup
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="#how-it-works"
                            className="px-8 py-4 bg-white text-primary text-lg font-semibold rounded-full border-2 border-gray-200 hover:border-primary/30 hover:bg-gray-50 transition-all flex items-center gap-2"
                        >
                            See How It Works
                        </Link>
                    </motion.div>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 max-w-6xl mx-auto">
                    {/* Card 1: AI Clinical Interview - Large */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="md:col-span-7 bg-gradient-to-br from-primary via-[#2a5298] to-secondary rounded-3xl p-8 text-white relative overflow-hidden group hover-lift"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700">
                            <Activity size={180} strokeWidth={1} />
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="font-display text-3xl tracking-wide mb-3">SMART CLINICAL INTERVIEWS</h3>
                            <p className="text-blue-100 max-w-md text-base leading-relaxed">
                                Our AI agent conducts thorough 5-15-minute interviews, detecting medical "Red Flags" with 95% accuracy in both Urdu & English.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-2">
                                <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">SOAP Notes</span>
                                <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">Risk Analysis</span>
                                <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">Real-time</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Card 2: Voice Support */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="md:col-span-5 bg-white border border-gray-100 shadow-xl shadow-gray-200/50 rounded-3xl p-8 flex flex-col justify-between hover-lift group"
                    >
                        <div>
                            <div className="w-12 h-12 bg-gradient-to-br from-secondary/20 to-primary/10 rounded-2xl flex items-center justify-center text-secondary mb-4 group-hover:scale-110 transition-transform">
                                <Mic size={24} />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">Native Urdu Voice</h3>
                            <p className="font-urdu text-lg text-secondary text-right mb-3">
                                "طبی مشورے اب آپ کی اپنی زبان میں"
                            </p>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Breaking language barriers with fluent Urdu/English voice interactions powered by ElevenLabs.
                            </p>
                        </div>
                        <div className="mt-6 flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-white" />
                                ))}
                            </div>
                            <span className="text-sm text-gray-500">10K+ users served</span>
                        </div>
                    </motion.div>

                    {/* Card 3: SOAP Reports */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="md:col-span-4 bg-white border border-gray-100 shadow-xl shadow-gray-200/50 rounded-3xl p-8 hover-lift group"
                    >
                        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform">
                            <FileText size={24} />
                        </div>
                        <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">Instant SOAP Reports</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Automated generation of Subjective, Objective, Assessment, and Plan notes for doctors.
                        </p>
                    </motion.div>

                    {/* Card 4: Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="md:col-span-8 bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-around gap-8"
                    >
                        <div className="text-center group">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-primary" />
                                <div className="font-display text-5xl text-primary">15M</div>
                            </div>
                            <div className="text-gray-500 text-sm font-medium">Average Session</div>
                        </div>
                        <div className="h-16 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent hidden sm:block" />
                        <div className="text-center group">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Shield className="w-5 h-5 text-secondary" />
                                <div className="font-display text-5xl text-secondary">95%</div>
                            </div>
                            <div className="text-gray-500 text-sm font-medium">Diagnostic Accuracy</div>
                        </div>
                        <div className="h-16 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent hidden sm:block" />
                        <div className="text-center group">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Heart className="w-5 h-5 text-red-500" />
                                <div className="font-display text-5xl text-primary">24/7</div>
                            </div>
                            <div className="text-gray-500 text-sm font-medium">Always Available</div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
