import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SITE_URL } from "@/lib/env";
import { AuthProvider } from "@/providers/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CeonHub: Find work. Hire talent. Connect privately.",
    template: "%s | CeonHub",
  },
  description:
    "CeonHub is a US hiring and work marketplace for immediate hiring, freelance and side income work, internships, and private employer and candidate connections across the United States.",
  applicationName: "CeonHub",
  openGraph: {
    type: "website",
    siteName: "CeonHub",
    title: "CeonHub: Find work. Hire talent. Connect privately.",
    description:
      "Immediate hiring, freelance and side-income work, internships, and private opportunities across the US, with direct employer and candidate connections.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "CeonHub: Find work. Hire talent. Connect privately.",
    description:
      "Immediate hiring, freelance and side-income work, internships, and private opportunities across the US.",
  },
};

/**
 * One family for the whole product, loaded as a variable font so the display
 * weights the headings need cost nothing extra over the body weight. Next
 * self-hosts it at build time, so there is no runtime request to Google and no
 * flash of a fallback face on a cold visit.
 */
const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

/** Matches the green in the mark, so mobile browser chrome picks up the brand. */
export const viewport: Viewport = {
  themeColor: "#23e837",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={figtree.variable}>
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
