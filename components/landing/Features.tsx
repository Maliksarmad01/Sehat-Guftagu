"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, BookOpen, Stethoscope, FileText, Mic, Globe, Brain, Users, AlertTriangle, CheckCircle2 } from "lucide-react";

// Animation variants for staggered children
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    },
};

export const Features = () => {
    return (
        <section id="features" className="py-24 bg-white relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#fbf9ff] to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(62,111,203,0.03),transparent_50%)]" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-secondary font-semibold uppercase tracking-widest text-sm mb-4 block"
                    >
                        Why Choose Us
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="font-display text-4xl md:text-6xl tracking-wide text-gray-900 mb-4"
                    >
                        HEALTHCARE FOR <span className="gradient-text">EVERYONE</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-500 max-w-2xl mx-auto"
                    >
                        <b>Thorough 5-15-minute AI interviews that detect critical symptoms with 95% accuracy</b>
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="font-urdu text-xl text-secondary/70 mt-2"
                    >
                       <b>صحت کی دیکھ بھال سب کے لیے</b>
                    </motion.p>
                </div>

                {/* Main Feature Grid - Case Study 1 Specific */}
                <div className="features-grid max-w-6xl mx-auto mb-20">
                    {/* Large Feature Card - Clinical Interview */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="feature-card bg-gradient-to-br from-primary via-[#2a5298] to-secondary rounded-3xl p-8 text-white relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 opacity-10">
                                <Brain size={200} strokeWidth={0.5} />
                            </div>
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                                    <Mic className="w-7 h-7" />
                                </div>
                                <h3 className="font-display text-3xl tracking-wide mb-3">15-MINUTE CLINICAL INTERVIEWS</h3>
                                <p className="text-blue-100 text-lg leading-relaxed mb-4">
                                    Our AI agent conducts thorough adaptive interviews, asking follow-up questions based on your symptoms. Just like talking to a doctor.
                                </p>
                                <p className="font-urdu text-lg text-blue-200 text-right">
                                    آپ کی علامات کی بنیاد پر ذہین سوالات
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="feature-card bg-white border border-gray-100 shadow-xl rounded-3xl p-8"
                        >
                            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                                <AlertTriangle className="w-7 h-7 text-red-600" />
                            </div>
                            <h3 className="font-display text-2xl tracking-wide text-gray-900 mb-3">RED FLAG DETECTION</h3>
                            <p className="text-gray-600 text-lg leading-relaxed mb-4">
                                Zero tolerance for missed emergencies. Our system identifies critical symptoms like chest pain, stroke signs, and other medical emergencies instantly.
                            </p>
                            <div className="flex items-center gap-2 text-red-600 font-medium">
                                <ShieldCheck className="w-5 h-5" />
                                <span>95% Accuracy on Critical Cases</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Three Column Features */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="feature-card bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-3xl p-6"
                        >
                            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center mb-4">
                                <Globe className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-heading text-lg font-bold text-gray-900 mb-2">Urdu & English</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Speak naturally in your preferred language. Our AI understands both fluently.
                            </p>
                            <p className="font-urdu text-sm text-green-600 mt-2 text-right">اردو یا انگریزی</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="feature-card bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-3xl p-6"
                        >
                            <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center mb-4">
                                <Brain className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-heading text-lg font-bold text-gray-900 mb-2">Simple Language</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                No medical jargon. We explain everything at a 5th-grade reading level.
                            </p>
                            <p className="font-urdu text-sm text-purple-600 mt-2 text-right">آسان زبان میں</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                            className="feature-card bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-3xl p-6"
                        >
                            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center mb-4">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-heading text-lg font-bold text-gray-900 mb-2">Doctor Verified</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Every diagnosis is reviewed by qualified doctors before prescription.
                            </p>
                            <p className="font-urdu text-sm text-blue-600 mt-2 text-right">ڈاکٹر کی تصدیق</p>
                        </motion.div>
                    </div>

                    {/* SOAP Report Feature */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 }}
                            className="feature-card lg:col-span-2 bg-gradient-to-br from-[#1a2744] to-[#0f172a] rounded-3xl p-8 text-white relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 opacity-10">
                                <FileText size={250} strokeWidth={0.5} />
                            </div>
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                                    <FileText className="w-7 h-7" />
                                </div>
                                <h3 className="font-display text-3xl tracking-wide mb-4">SOAP CLINICAL REPORTS</h3>
                                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                                    Structured clinical documentation generated automatically for doctors. Includes Subjective symptoms, Objective findings, Assessment, and recommended Plan.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4">
                                        <div className="text-blue-300 font-bold mb-1">S - Subjective</div>
                                        <div className="text-gray-400 text-sm">Patient's complaints in their own words</div>
                                    </div>
                                    <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4">
                                        <div className="text-green-300 font-bold mb-1">O - Objective</div>
                                        <div className="text-gray-400 text-sm">Recorded symptoms and vital signs</div>
                                    </div>
                                    <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-4">
                                        <div className="text-yellow-300 font-bold mb-1">A - Assessment</div>
                                        <div className="text-gray-400 text-sm">AI diagnosis with confidence level</div>
                                    </div>
                                    <div className="bg-purple-500/20 border border-purple-400/30 rounded-xl p-4">
                                        <div className="text-purple-300 font-bold mb-1">P - Plan</div>
                                        <div className="text-gray-400 text-sm">Recommended tests and next steps</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6 }}
                            className="feature-card bg-gradient-to-br from-secondary to-primary rounded-3xl p-6 text-white flex flex-col justify-between"
                        >
                            <div>
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <h3 className="font-display text-2xl tracking-wide mb-3">MEDICAL KNOWLEDGE</h3>
                                <p className="text-blue-100 leading-relaxed">
                                    Grounded in verified medical datasets: MedQA, PubMedQA, and MedMCQA.
                                </p>
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/20">
                                <div className="flex items-center gap-2 text-blue-200">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="text-sm">RAG-powered accuracy</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Trust Indicators */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto text-center"
                >
                    <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-3xl p-8">
                        <h3 className="font-display text-2xl text-gray-900 mb-6">BUILT WITH TRUST & SAFETY</h3>
                        <div className="flex flex-wrap justify-center gap-8">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6 text-green-600" />
                                <span className="text-gray-700">HIPAA Compliant</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Stethoscope className="w-6 h-6 text-primary" />
                                <span className="text-gray-700">Doctor Verified</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                                <span className="text-gray-700">Zero False Negatives on Red Flags</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
