import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SyncStage AI — K-pop Choreography Director",
  description: "Upload a K-pop demo track → Gemini 3 Flash Preview deep-listens to beats → auto-generates 3D choreography timeline + stage wardrobe via Gemini Image Generation. Refine with natural language Function Calling.",
  openGraph: {
    title: "SyncStage AI",
    description: "AI A&R Director powered by Gemini — audio to choreography in seconds.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
