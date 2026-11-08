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
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-4"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
