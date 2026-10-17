
# 🚀 Deployment Guide

## Vercel Setup
1. Push your code to GitHub and connect the repo to Vercel.
2. Set the following Environment Variables in Vercel:
   - `USE_MOCK`: `false`
   - `NEXT_PUBLIC_APP_URL`: Your production URL (e.g., `https://snapdesk.vercel.app`)
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key
   - `DATABASE_URL`: Your Supabase direct connection string
   - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret
   - `GMAIL_REDIRECT_URI`: `https://snapdesk.vercel.app/api/gmail/callback`
   - `TOKEN_ENCRYPTION_KEY`: A random 32-character string
   - `AI_PROVIDER`: `anthropic` or `gemma`
   - `ANTHROPIC_API_KEY` / `GEMINI_API_KEY`: Your respective API key

## Third-Party Config
### Google OAuth
1. Go to Google Cloud Console $ightarrow$ APIs & Services $ightarrow$ Credentials.
2. Add your production URL to **Authorized JavaScript origins**.
3. Add `https://snapdesk.vercel.app/api/gmail/callback` to **Authorized redirect URIs**.

### Supabase Auth
1. Go to Authentication $ightarrow$ URL Configuration.
2. Set **Site URL** to your production URL.
3. Add `https://snapdesk.vercel.app/**` to **Redirect URLs**.

## Cron Jobs
The `/api/reminders/run` endpoint is scheduled via `vercel.json` to run daily. It requires the `CRON_SECRET` to be set in both the environment and the Vercel Cron configuration.

## Smoke Test
1. Log in as Admin.
2. Create a test employee.
3. Upload a document $ightarrow$ Verify AI extraction.
4. Run payroll $ightarrow$ Verify employees can see payslips.
