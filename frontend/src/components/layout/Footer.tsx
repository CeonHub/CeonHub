import Link from "next/link";
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
      <Container className="py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-sm font-semibold text-ink-900">{section.title}</h2>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className="text-sm text-ink-600 hover:text-brand-700">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 border-t border-ink-100 pt-6 text-sm text-ink-500">
          © {new Date().getFullYear()} CeonHub — find work, hire talent, connect privately.
        </p>
      </Container>
    </footer>
  );
}
