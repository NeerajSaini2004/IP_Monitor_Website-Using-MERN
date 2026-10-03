# Bandwidth Monitor frontend

This is a Vite + React static dashboard that connects directly to Supabase. It does not need the Express API server.

Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` for local development or as environment variables in your static-site host. See the repository [README](../README.md) for Supabase schema setup, admin sign-in, deployment, and the separate local monitor agent.

Run `npm install` and `npm run start` for local development. Run `npm run build` to create the deployable `dist` directory.
