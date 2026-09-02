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
    <header data-site-header>
      <a href="/" aria-label="Big Question Club home">
        <img src={logoUrl} alt="Big Question Club" width="109" height="88" />
      </a>
      {children === undefined ? null : <nav aria-label={navigationLabel}>{children}</nav>}
    </header>
  );
}
