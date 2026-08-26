import type { Metadata, Viewport } from "next";
import "./globals.css";
import SwRegister from "./sw-register";

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#000000",
};

export const metadata: Metadata = {
    title: "Games — Bunlong Heng",
    description: "Educational games: Math Heroes, Spelling Bee, Coloring Island, US States, and more.",
    manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                {children}
                <SwRegister />
            </body>
        </html>
    );
}
