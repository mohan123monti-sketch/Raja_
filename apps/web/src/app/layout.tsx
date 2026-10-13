import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raja Rani Online — Royal Multiplayer Paper-Chit Game",
  description:
    "Play the traditional South Indian Raja Rani paper chit game online with friends. Bluff, accuse, and claim the royal crown in live multiplayer matches.",
  icons: {
    icon: "/favicon.ico",
  },
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#090a1a] text-slate-100 antialiased selection:bg-amber-500 selection:text-black">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
