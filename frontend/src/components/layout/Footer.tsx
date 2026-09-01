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

export function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-200 bg-white">
      <div aria-hidden="true" className="brand-gradient h-1 w-full" />
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" aria-label="CeonHub home" className="inline-block rounded-md">
              <Image src={longLogo} alt="" className="h-10 w-auto" sizes="177px" />
            </Link>
            <p className="mt-4 max-w-xs text-sm text-ink-600">
              Find work, hire talent, and connect privately — a center of network for people and the
              companies looking for them.
            </p>
          </div>

          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-sm font-semibold text-ink-900">{section.title}</h2>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-600 transition-colors hover:text-primary-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-ink-100 pt-6">
          <p className="text-sm text-ink-500">
            © {new Date().getFullYear()} CeonHub — find work, hire talent, connect privately.
          </p>
        </div>
      </Container>
    </footer>
  );
}
