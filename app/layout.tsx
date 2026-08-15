import type { Metadata } from "next";
import { Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoUrdu = Noto_Nastaliq_Urdu({
  variable: "--font-noto-urdu",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Sehat Guftagu | AI Healthcare",
  description: "Bridging healthcare gaps through AI-powered voice consultations in Urdu & English. 15-minute clinical interviews, SOAP reports, and doctor verification.",
  icons: {
    icon: "/logo/sehat-guftagu-favicon.svg",
    apple: "/logo/sehat-guftagu-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${notoUrdu.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

