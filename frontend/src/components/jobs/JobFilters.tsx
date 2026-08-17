"use client";

import { useRouter } from "next/navigation";
import { useRef, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { CONTROL_BORDER, CONTROL_CLASSES } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/format";
import type { EmploymentType } from "@/lib/types";

export interface JobFilterValues {
  q?: string;
  location?: string;
  remote?: string;
  employmentType?: string;
  category?: string;
  immediateHire?: string;
  freelance?: string;
  internship?: string;
  sideIncome?: string;
}

const FLAGS: Array<{ name: keyof JobFilterValues; label: string }> = [
  { name: "immediateHire", label: "Immediate start" },
  { name: "remote", label: "Remote" },
  { name: "freelance", label: "Freelance" },
  { name: "internship", label: "Internship" },
  { name: "sideIncome", label: "Side income" },
];

/**
 * Filters live in the URL, so a search can be shared, bookmarked and rendered on
 * the server. Selects and checkboxes apply immediately; the text inputs apply on
 * Enter or when the form is submitted.
 */
export function JobFilters({
  categories,
  values,
}: {
  categories: string[];
  values: JobFilterValues;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const [key, value] of data.entries()) {
      if (typeof value === "string" && value.trim()) params.set(key, value.trim());
    }

    const query = params.toString();
    router.push(query ? `/jobs?${query}` : "/jobs");
  }

  function handleChange(event: ChangeEvent<HTMLFormElement>) {
    // Text inputs would fire on every keystroke; they submit on Enter instead.
    if (event.target instanceof HTMLInputElement && event.target.type === "text") return;
    formRef.current?.requestSubmit();
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onChange={handleChange}
      className="space-y-4 rounded-card border border-ink-200 bg-white p-5"
      role="search"
      aria-label="Job filters"
    >
      <div>
        <label htmlFor="q" className="block text-sm font-medium text-ink-800">
          Keyword
        </label>
        <input
          id="q"
          name="q"
          type="text"
          defaultValue={values.q ?? ""}
          placeholder="Job title, skill or company"
          className={cn(CONTROL_CLASSES, CONTROL_BORDER, "mt-1.5")}
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-ink-800">
          Location
        </label>
        <input
          id="location"
          name="location"
          type="text"
          defaultValue={values.location ?? ""}
          placeholder="City or country"
          className={cn(CONTROL_CLASSES, CONTROL_BORDER, "mt-1.5")}
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-ink-800">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={values.category ?? ""}
          className={cn(CONTROL_CLASSES, CONTROL_BORDER, "mt-1.5")}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="employmentType" className="block text-sm font-medium text-ink-800">
          Employment type
        </label>
        <select
          id="employmentType"
          name="employmentType"
          defaultValue={values.employmentType ?? ""}
          className={cn(CONTROL_CLASSES, CONTROL_BORDER, "mt-1.5")}
        >
          <option value="">Any type</option>
          {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value as EmploymentType}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-2 border-t border-ink-100 pt-4">
        <legend className="text-sm font-medium text-ink-800">Opportunity type</legend>
        {FLAGS.map((flag) => (
          <label key={flag.name} className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              name={flag.name}
              value="true"
              defaultChecked={values[flag.name] === "true"}
              className="h-4 w-4 rounded border-ink-300"
            />
            {flag.label}
          </label>
        ))}
      </fieldset>

      <div className="flex gap-2 border-t border-ink-100 pt-4">
        <Button type="submit" size="sm" className="flex-1">
          Apply filters
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => router.push("/jobs")}>
          Clear
        </Button>
      </div>
    </form>
  );
}
