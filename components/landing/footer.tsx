import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.04] px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
          <span className="font-serif text-sm text-foreground/60">
            EventMood
          </span>
        </div>

        <p className="text-xs text-muted-foreground/40">
          Built with AI. All processing runs in your browser.
        </p>

        <div className="flex items-center gap-6">
          <Link
            href="/track"
            className="text-xs text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            Launch App
          </Link>
          <a
            href="#features"
            className="text-xs text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            Features
          </a>
        </div>
      </div>
    </footer>
  );
}
