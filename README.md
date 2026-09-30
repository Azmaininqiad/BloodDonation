This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

Import the repository into [Vercel](https://vercel.com/new). Vercel detects Next.js and uses the `build` script from `package.json`. The repository's `vercel.json` pins installs to `npm ci`, matching the committed `package-lock.json`.

Add environment variables in **Project Settings → Environment Variables**. Set them for the environments where they are needed, then redeploy after changing them.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL, e.g. `https://<project-ref>.supabase.co`; do not append `/rest/v1` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key; safe for the browser |
| `SUPABASE_SECRET_KEY` | Supabase secret key; server-side only, never use a `NEXT_PUBLIC_` prefix |
| `NEXT_PUBLIC_APP_URL` | Canonical production URL including `https://`; omit on Preview if you want links to use that preview's Vercel URL |
| `CRON_SECRET` | Long random secret used to protect `/api/cron/dispatch` |
| `IP_HASH_SALT` | Long random value used to hash requester IP addresses |
| `NEXT_PUBLIC_DEFAULT_LAT`, `NEXT_PUBLIC_DEFAULT_LNG` | Optional map defaults; default to Dhaka |

Add provider variables from `.env.example` only when enabling that email or SMS provider. Never commit `.env.local` or put the Supabase secret key in a public variable.

In Supabase **Authentication → URL Configuration**, set the Site URL to the production app URL and allow `<app-url>/auth/callback`. Add any Vercel Preview callback URLs you intend to test. For Google sign-in, Google's authorized redirect URI remains the Supabase callback URL shown in the Supabase Google provider settings, not the app callback.

The SQL schema's `pg_cron` dispatch calls the deployed app. After deployment, update these Supabase settings to match the Vercel URL and `CRON_SECRET`:

```sql
update public.app_settings
set value = to_jsonb('https://<your-domain>/api/cron/dispatch'::text)
where key = 'dispatch_url';

update public.app_settings
set value = to_jsonb('<same-value-as-CRON_SECRET>'::text)
where key = 'cron_secret';
```

Run `pnpm build` locally before deploying. Vercel supplies `VERCEL_URL` automatically; the app uses it for preview request and donor-response links when `NEXT_PUBLIC_APP_URL` is not set.
