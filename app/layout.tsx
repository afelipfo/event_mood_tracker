import React from "react"
import type { Metadata } from "next"
import { Instrument_Serif, DM_Sans } from "next/font/google"

import "./globals.css"

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Event Mood Tracker",
  description:
    "Detect audience mood in real-time using facial expression analysis. Client-side only, no data stored.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${dmSans.variable}`}
    >
      <body className="min-h-screen antialiased">
        {/* Ambient background gradient */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(38,92%,55%)] opacity-[0.03] blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[600px] translate-x-1/4 translate-y-1/4 rounded-full bg-[hsl(215,60%,50%)] opacity-[0.02] blur-[100px]" />
        </div>
        {children}
      </body>
    </html>
  )
}
