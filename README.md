# Smoothflow

Day planning web app built with React + Vite.

## Run locally (web)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start dev server:
   ```bash
   npm run dev
   ```

No Base44 configuration is required anymore. The app runs in standalone mode and stores data in the browser `localStorage`.

## Run as a desktop app with Electron

This repo includes an Electron wrapper so you can use Smoothflow like a local desktop app on your PC.

### Development mode (live reload)

```bash
npm install
npm run electron:dev
```

What this does:
- Starts the Vite dev server.
- Waits for `http://localhost:5173`.
- Launches Electron pointed to that local app.

### Build a desktop package

```bash
npm install
npm run electron:dist
```

Output installers/packages are written to the `release/` folder.

### Build unpacked desktop app (for testing)

```bash
npm run electron:pack
```

This creates an unpacked build in `release/` without creating a final installer.

## Available scripts

- `npm run dev` – start development server
- `npm run build` – create production web build
- `npm run preview` – preview production web build
- `npm run lint` – run ESLint
- `npm run typecheck` – run TypeScript checks (if applicable)
- `npm run electron:dev` – run desktop app in development mode
- `npm run electron:pack` – create unpacked desktop build
- `npm run electron:dist` – create installable desktop build

## Standalone migration notes

See [`docs/base44-exit-plan.md`](docs/base44-exit-plan.md) for the architecture/migration rationale.
