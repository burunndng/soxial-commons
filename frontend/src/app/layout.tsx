import type { Metadata } from "next";
import { DM_Sans, DM_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navigation } from "@/components/Navigation";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["300", "400", "500"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Soxial Commons",
  description:
    "An anti-vanity community platform. Ideas surface by merit, not momentum.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${dmSans.variable} ${dmMono.variable} ${instrumentSerif.variable} font-sans antialiased`}
      >
        <Providers>
          <div className="flex flex-col min-h-screen bg-surface-base text-text-primary">
            <Navigation />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
