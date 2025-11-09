import type { Metadata } from "next";
import CssBaseline from "@mui/material/CssBaseline";
import BottomNav from "./components/BottomNav";
import TopNav from "./components/TopNav";
import "./globals.css";
import { Container } from "@mui/material";

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

      <body className={"body-layout"}>
        <TopNav />
        <main className="main-grow">
          <Container maxWidth="lg">{children}</Container>
        </main>

        <BottomNav />
      </body>
    </html>
  );
}
