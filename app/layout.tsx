import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#000000",
};

export const metadata: Metadata = {
    title: "Games — Bunlong Heng",
    description: "Educational games: Math Heroes, Spelling Bee, Coloring Island, US States, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
