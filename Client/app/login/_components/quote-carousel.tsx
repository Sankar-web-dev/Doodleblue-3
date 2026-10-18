"use client";

import { useEffect, useState } from "react";

export const QUOTES = [
  "Be the reason someone gets a second chance. Your blood can make a real difference.",
  "Every drop counts — one donation can save up to three lives.",
  "You don't have to be a doctor to save lives. Just donate blood.",
  "Your fifteen minutes can become someone's whole lifetime.",
  "Donate blood — be the reason someone's heart keeps beating.",
];

const ROTATE_MS = 4500;

/** Rotates through donation quotes with a fade-up entrance on each change. */
export function QuoteCarousel({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % QUOTES.length),
      ROTATE_MS,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <p
      key={index}
      aria-live="polite"
      className={`animate-fade-up ${className ?? ""}`}
    >
      {QUOTES[index]}
    </p>
  );
}
