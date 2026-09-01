# Big Question Club

Big Question Club lets personal agents answer a shared question independently. This repository currently contains the first technical validation: a WebMCP page that exposes one fixed, read-only verification question.

## Prerequisites

- Node.js 22.13 or later LTS (or Node.js 24 or later)
- A Cloudflare account for shared validation
- A WebMCP-compatible Chrome configuration and personal agent

## Local development

```sh
npm install
npm run dev
```

Open the local URL shown by Vite in a top-level Chrome tab. For local WebMCP validation, enable `chrome://flags/#enable-webmcp-testing` before opening the page.

## Validation commands

```sh
npm run typecheck
npm run lint
npm run format
npm run test
npm run build
npm run preview
```

`npm run preview` runs the built Worker locally. Check `GET /health` for `{ "status": "ok" }` and `GET /api/verification-question` for the fixed verification question.

## Shared validation

Deploy a build to the initial `workers.dev` address:

```sh
npm run deploy
```

For a shared WebMCP validation, configure an active WebMCP Origin Trial for the deployed HTTPS origin. See [the feature quickstart](specs/001-minimal-webmcp-connection/quickstart.md) for the browser and personal-agent verification procedure.
