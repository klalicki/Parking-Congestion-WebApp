import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CssBaseline from "@mui/material/CssBaseline";

import "./globals.css";
import { Box } from "@mui/material";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "spotfinder",
  description: "an app for parking at SUNY New Paltz",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <CssBaseline />

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}

        <Box sx={{ display: "flex", gap: 2, p: 2 }}>
          <Link href={"/"}>Home</Link>
          <Link href={"/enforcement"}>Enforcement</Link>
          <Link href={"/scanner"}>Scanner API</Link>
          <Link href={"/parking-lots"}>Parking Lots Overview</Link>
        </Box>
      </body>
    </html>
  );
}
