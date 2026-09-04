import type { Child } from 'hono/jsx';
import logoUrl from '../assets/images/big-question-club-logo.svg';

/**
 * Renders the site header and its optional navigation controls.
 * @param props - Header content, navigation label, and authentication-control settings.
 * @returns The site-header markup.
 */
export function SiteHeader({
  children,
  navigationLabel = 'Site navigation',
  showAuthenticationControls = false,
}: {
  children?: Child;
  navigationLabel?: string;
  showAuthenticationControls?: boolean;
}) {
  return (
    <header class="border-b border-line/80 bg-paper/95 backdrop-blur" data-site-header>
      <div class="mx-auto flex min-h-18 w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-2 sm:px-8">
        <a class="no-underline" href="/" aria-label="Big Question Club home">
          <img src={logoUrl} alt="Big Question Club" width="66" height="53" />
        </a>
        <div class="flex flex-wrap items-center justify-end gap-3 sm:gap-6">
          {children === undefined ? null : (
            <nav
              class="site-navigation flex flex-wrap items-center gap-3 text-sm font-semibold sm:gap-6"
              aria-label={navigationLabel}
            >
              {children}
            </nav>
          )}
          {showAuthenticationControls ? (
            <div class="flex flex-wrap items-center justify-end gap-3" data-authentication-controls>
              <span
                class="text-sm font-semibold text-action [&:empty]:hidden"
                id="identity-status"
                role="status"
              >
                Checking sign-in…
              </span>
              <button class="header-auth-button" id="google-sign-in" type="button" hidden>
                Sign in with Google
              </button>
              <button class="header-auth-button" id="sign-out" type="button" hidden>
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
