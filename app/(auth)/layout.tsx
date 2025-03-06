import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "next-themes";
import clsx from "clsx";
import type { Metadata } from "next";
import "../../app/globals.css";

export const metadata: Metadata = {
	title: "Parrot - Auth",
	description:
		"An enterprise-grade voice assistant powered by Deepseek, Groq, Cartesia, and Vercel.",
	authors: [{ name: "Godwin" }],
	keywords: ["AI", "voice assistant", "Deepseek", "enterprise", "parrot"],
	viewport: "width=device-width, initial-scale=1",
	manifest: "/manifest.json",
	icons: {
		icon: "/favicon.ico",
		apple: "/apple-touch-icon.png",
	},
	openGraph: {
		type: "website",
		title: "Parrot",
		description: "An enterprise-grade voice assistant with thinking capabilities",
		url: "/",
		images: [{ url: "/og-image.png" }],
	},
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={clsx(
            GeistSans.variable,
            GeistMono.variable,
            "antialiased font-sans",
          )}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
