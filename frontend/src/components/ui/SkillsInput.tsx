"use client";

import { useState, type KeyboardEvent } from "react";
import { CONTROL_BORDER, CONTROL_CLASSES } from "./Input";
import { cn } from "@/lib/cn";

interface SkillsInputProps {
  id: string;
  value: string[];
  onChange: (skills: string[]) => void;
  max?: number;
  placeholder?: string;
}

/** Tag entry: type a skill, press Enter or comma to add it. */
export function SkillsInput({
  id,
  value,
  onChange,
  max = 20,
  placeholder = "Add a skill and press Enter",
}: SkillsInputProps) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const skill = raw.trim();
    if (!skill || value.length >= max) return;
    if (value.some((existing) => existing.toLowerCase() === skill.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, skill]);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
      return;
    }
    if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-sm text-brand-800 ring-1 ring-inset ring-brand-200"
          >
            {skill}
            <button
              type="button"
              onClick={() => onChange(value.filter((entry) => entry !== skill))}
              className="text-brand-700 hover:text-brand-900"
              aria-label={`Remove ${skill}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <input
        id={id}
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => add(draft)}
        disabled={value.length >= max}
        placeholder={value.length >= max ? `Maximum ${max} skills` : placeholder}
        className={cn(CONTROL_CLASSES, CONTROL_BORDER, value.length > 0 && "mt-2")}
      />
    </div>
  );
}
