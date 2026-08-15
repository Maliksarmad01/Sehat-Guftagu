"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen selection:bg-secondary/30">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <CTASection />
      <Footer />
    </main>
  );
}
