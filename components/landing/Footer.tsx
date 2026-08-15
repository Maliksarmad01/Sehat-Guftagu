'use client';

import React from 'react';
import Link from 'next/link';
import { Github, Linkedin, Twitter } from 'lucide-react';
import Image from 'next/image';

export const Footer = () => {
  const footerLinks = {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'How it Works', href: '#how-it-works' },
      { name: 'For Patients', href: '/signup?type=patient' },
      { name: 'For Doctors', href: '/signup?type=doctor' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'HIPAA Compliance', href: '/hipaa' },
    ],
  };

  return (
    <footer className="relative bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Large Brand Text Background - Using Beastars Font */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none select-none">
        <div className="font-beastars text-[12vw] md:text-[9vw] leading-none text-[#779ada]/40 tracking-tight whitespace-nowrap text-center">
          SEHAT GUFTAGU
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Main Footer Content */}
        <div className="py-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <Image
                src="/logo/sehat-guftagu-favicon.svg"
                alt="Sehat Guftagu"
                width={48}
                height={48}
              />
              <div>
                <span className="font-display text-2xl tracking-wider block">
                  SEHAT GUFTAGU
                </span>
                <span className="font-urdu text-sm text-gray-400">
                  صحت گفتگو
                </span>
              </div>
            </Link>
            <p className="text-gray-400 mb-6 max-w-sm leading-relaxed">
              Bridging the healthcare gap through AI-powered voice
              consultations. Quality healthcare accessible to everyone, in your
              own language.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-heading font-bold text-white mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map(link => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-heading font-bold text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map(link => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 mb-4 border-t border-white/10 flex items-center justify-center">
          <p className="text-gray-500 text-sm text-center">
            © 2026 Sehat Guftagu - interview version. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
