# Bandwidth Monitor

React dashboard with Supabase (Postgres + Auth) and a small Node.js monitor agent. The dashboard is a static site and does not need a deployed Express/API server. The monitor agent must keep running on the computer/network interface being observed; Supabase cannot measure that machine's network traffic.

## 1. Create the Supabase project

1. Create a project in Supabase.
2. Open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql).
3. In **Authentication → Providers / Sign ups**, disable public sign-ups.
4. In **Authentication → Users**, create the admin user(s) who may access the dashboard.
5. Copy the project URL and publishable/anon key for the frontend. Copy the **service_role/secret key** for the local monitor only. Never expose that secret in frontend settings or commit it.

The SQL policies allow signed-in users to read and change dashboard data. With public sign-ups disabled, only users created by an administrator can sign in.

## 2. Configure and run the dashboard

Copy `frontend/.env.example` to `frontend/.env.local` and fill in:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Then run locally:

```sh
cd frontend
npm install
npm run start
```

For deployment, deploy the `frontend` folder as a Vite static site (for example, to Vercel or Netlify) and set the same two `VITE_` environment variables in the hosting dashboard. Build command: `npm run build`; output folder: `dist`.

## 3. Run the local monitor agent

Copy `backend/.env.example` to `backend/.env` and fill in the project URL and **service role/secret key**. Keep this file on the monitored computer and out of source control.

```sh
cd backend
npm install
npm start
```

The monitor samples the network interface selected by `systeminformation` every five seconds and writes usage/downtime rows directly to Supabase. Leave this process running for continuous monitoring. This agent is not an HTTP server and does not need public hosting.

## Data tables

`departments` maps department names to IP addresses; `usage_logs` stores samples; `downtime_logs` stores outage periods; `config` stores the threshold and leased bandwidth; and `audit_logs` stores dashboard changes.

> Current sampling reads the network interface statistics of the computer running the monitor. It records those same machine-wide readings for each configured department IP; it does not collect per-device traffic from the IP addresses themselves.
