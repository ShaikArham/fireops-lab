import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FireOps Lab | Fictional Payment Operations Sandbox",
  description:
    "An independent portfolio project exploring payment reconciliation and operational investigations with fictional data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
