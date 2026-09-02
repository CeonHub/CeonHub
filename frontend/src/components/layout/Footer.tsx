import Image from "next/image";
import Link from "next/link";
import longLogo from "../../../public/long-logo.png";
import { Container } from "./Container";

const SECTIONS = [
  {
    title: "For candidates",
    links: [
      { href: "/jobs", label: "Browse jobs" },
      { href: "/jobs?immediateHire=true", label: "Immediate start" },
      { href: "/jobs?freelance=true", label: "Freelance work" },
      { href: "/jobs?sideIncome=true", label: "Side income" },
      { href: "/jobs?internship=true", label: "Internships" },
    ],
  },
  {
    title: "For employers",
    links: [
      { href: "/register?role=EMPLOYER", label: "Post a job" },
      { href: "/employer/candidates", label: "Search candidates" },
      { href: "/how-it-works", label: "Private hiring" },
      { href: "/companies", label: "Companies" },
    ],
  },
  {
    title: "CeonHub",
    links: [
      { href: "/about", label: "About" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/login", label: "Sign in" },
    ],
  },
];

/**
 * Filled with the same near-black the private-hiring section uses, so the page
 * closes on the brand's dark surface rather than trailing off into another white
 * band. The logo is the only saturated thing down here on purpose.
 */
export function Footer() {
  return (
    <footer className="bg-night text-ink-400">
      <Container className="py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-8">
          <div>
            <Link href="/" aria-label="CeonHub home" className="inline-block rounded-control">
              <Image src={longLogo} alt="" className="h-9 w-auto" sizes="160px" />
            </Link>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-ink-500">
              Find work, hire talent, and connect privately across the US — a center of network for
              people and the companies looking for them.
            </p>
          </div>

          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-eyebrow text-white">{section.title}</h2>
              <ul className="mt-5 space-y-3">
                {section.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-night-line pt-8">
          <p className="text-sm text-ink-500">
            © {new Date().getFullYear()} CeonHub — find work, hire talent, connect privately.
          </p>
        </div>
      </Container>
    </footer>
  );
}
