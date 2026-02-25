import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ThemeProvider, { themeScript } from "./providers/theme-provider";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Support Copilot | AI-Driven Support",
  description: "AI-Driven Support for Modern Teams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} app-layout`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
