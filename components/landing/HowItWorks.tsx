"use client";

import React from "react";
import { motion } from "framer-motion";
import { Mic, Brain, CheckCircle } from "lucide-react";

const steps = [
    {
        id: 1,
        title: "Start Your Session",
        description: "Connect with our AI agent via voice or text. Speak naturally in Urdu or English — our system understands both.",
        icon: <Mic className="w-7 h-7" />,
        gradient: "from-blue-500 to-primary",
    },
    {
        id: 2,
        title: "AI Analysis",
        description: "Our intelligent system analyzes your symptoms against medical databases to identify red flags and potential conditions.",
        icon: <Brain className="w-7 h-7" />,
        gradient: "from-primary to-secondary",
    },
    {
        id: 3,
        title: "Doctor Review",
        description: "A comprehensive SOAP report is generated for qualified doctors to review, verify, and provide treatment guidance.",
        icon: <CheckCircle className="w-7 h-7" />,
        gradient: "from-secondary to-green-500",
    },
];

export const HowItWorks = () => {
    return (
        <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#fbf9ff] to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(62,111,203,0.03),transparent_50%)]" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="font-display text-4xl md:text-6xl tracking-wide text-gray-900 mb-4"
                    >
                        HOW IT <span className="gradient-text">WORKS</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-500 max-w-2xl mx-auto"
                    >
                        <b>Three simple steps to quality healthcare</b>
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="font-urdu text-lg text-secondary mt-2"
                    >
                       <b>صحت گفتگو کا طریقہ کار</b>
                    </motion.p>
                </div>

                {/* Steps */}
                <div className="steps-container relative max-w-5xl mx-auto">
                    {/* Connector Line (Desktop) */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="hidden md:block absolute top-24 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-primary via-secondary to-green-500 origin-left"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                className="step-card relative flex flex-col items-center text-center group"
                            >
                                {/* Step Number Badge */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-white border-2 border-gray-100 rounded-full text-sm font-bold text-primary shadow-sm">
                                        {step.id}
                                    </span>
                                </div>

                                {/* Icon Container */}
                                <div className={`w-20 h-20 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center mb-6 text-white shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300`}>
                                    {step.icon}
                                </div>

                                {/* Content */}
                                <h3 className="font-heading text-xl font-bold text-gray-900 mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-gray-500 leading-relaxed text-sm">
                                    {step.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
