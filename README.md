# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Vercel / Single Page App routing note

If you deploy this app to Vercel and use client-side routing (for example React Router), you must configure a fallback so requests for nested routes (like `/dashboard` or `/study/dashboard`) are served `index.html` rather than returning a 404. This repo includes a `vercel.json` with a rewrite that sends all non-API routes to `/index.html`.

If you still see 404s after adding `vercel.json`:

- Make sure the project is connected to Vercel and that `vercel.json` is present on the branch being deployed.
- Trigger a redeploy in the Vercel dashboard or push a new commit to your production branch.
- Confirm the build command is `npm run build` (Vercel usually detects `vite build`) and the output directory is `dist` (Vite's default).

This change fixes the issue where visiting client-side routes directly returned 404 on production while working locally with the dev server.
