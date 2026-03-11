# Smoothflow

Day planning web app built with React + Vite.

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start dev server:
   ```bash
   npm run dev
   ```

No Base44 configuration is required anymore. The app runs in standalone mode and stores data in the browser `localStorage`.

## Available scripts

- `npm run dev` – start development server
- `npm run build` – create production build
- `npm run preview` – preview production build
- `npm run lint` – run ESLint
- `npm run typecheck` – run TypeScript checks (if applicable)

## Standalone migration notes

See [`docs/base44-exit-plan.md`](docs/base44-exit-plan.md) for the architecture/migration rationale.
