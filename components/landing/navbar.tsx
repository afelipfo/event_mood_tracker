"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/[0.06] bg-background/80 backdrop-blur-xl py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_2px_hsl(38,92%,55%,0.3)]" />
          </div>
          <span className="font-serif text-lg tracking-tight text-foreground">
            EventMood
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            How It Works
          </a>
          <a
            href="#privacy"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Privacy
          </a>
        </div>

        <Link
          href="/track"
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-all duration-300 hover:shadow-[0_0_24px_-4px_hsl(38,92%,55%,0.4)]"
        >
          Launch App
        </Link>
      </div>
    </nav>
  );
}
