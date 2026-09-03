import type { Child } from 'hono/jsx';
import logoUrl from '../assets/images/big-question-club-logo.svg';

export function SiteHeader({
  children,
  navigationLabel = 'Site navigation',
}: {
  children?: Child;
  navigationLabel?: string;
}) {
  return (
    <header class="border-b border-line/80 bg-paper/95 backdrop-blur" data-site-header>
      <div class="mx-auto flex min-h-18 w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-2 sm:px-8">
        <a class="no-underline" href="/" aria-label="Big Question Club home">
          <img src={logoUrl} alt="Big Question Club" width="66" height="53" />
        </a>
        {children === undefined ? null : (
          <nav
            class="site-navigation flex flex-wrap items-center gap-3 text-sm font-semibold sm:gap-6"
            aria-label={navigationLabel}
          >
            {children}
          </nav>
        )}
      </div>
    </header>
  );
}
