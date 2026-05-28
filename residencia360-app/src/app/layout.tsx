import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

import "./globals.css";

import { Providers } from "@/components/providers";
import { APP_NAME, RESIDENTIAL_NAME } from "@/lib/constants";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: `${APP_NAME} | ${RESIDENTIAL_NAME}`,
  description: "Plataforma integral para la operacion administrativa y de seguridad de Altos de Santa Clara.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
              const storedTheme = window.localStorage.getItem("residencia360-theme");
              const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
              const theme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : (systemDark ? "dark" : "light");
              document.documentElement.classList.toggle("dark", theme === "dark");
            } catch (error) {}`,
          }}
        />
      </head>
      <body className={`${sans.variable} ${mono.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
