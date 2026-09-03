import type { Child } from 'hono/jsx';
import { SiteHeader } from './site-header';

export function SiteLayout({
  title,
  clientScriptUrl,
  navigation,
  children,
  page,
}: {
  title: string;
  clientScriptUrl: string;
  navigation?: Child;
  children: Child;
  page?: string;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#fffaf4" />
        <title>{title === 'Big Question Club' ? title : `${title} — Big Question Club`}</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <SiteHeader showAuthenticationControls>{navigation}</SiteHeader>
        <main class="page-shell" data-page={page}>
          {children}
        </main>
        <script type="module" src={clientScriptUrl} />
      </body>
    </html>
  );
}
