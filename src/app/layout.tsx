import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CekDulu — Periksa Pesan Sebelum Bertindak",
  description: "Periksa tanda risiko dalam pesan sebelum mengklik atau mentransfer uang.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
