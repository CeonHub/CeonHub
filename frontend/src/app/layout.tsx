import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SITE_URL } from "@/lib/env";
import { AuthProvider } from "@/providers/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CeonHub — Find work. Hire talent. Connect privately.",
    template: "%s | CeonHub",
  },
  description:
    "CeonHub is a hiring and work marketplace for immediate hiring, freelance and side income work, internships, and private employer–candidate connections.",
  openGraph: {
    type: "website",
    siteName: "CeonHub",
    title: "CeonHub — Find work. Hire talent. Connect privately.",
    description:
      "Immediate hiring, freelance and side-income work, internships, and private opportunities — with direct employer and candidate connections.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "CeonHub — Find work. Hire talent. Connect privately.",
    description:
      "Immediate hiring, freelance and side-income work, internships, and private opportunities.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <AuthProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
