<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1pHB48Oku3J4hNAr_9m5EwGICAgw-yGki
Live URL: [LINK_WILL_GO_HERE] (Please paste your Vercel URL here)

## Database Migrations (IMPORTANT)
If features like "Properties" or "Team" are missing, it's likely because Database Policies (RLS) aren't updated.
Run the SQL scripts in `supabase/migrations/` using the Supabase SQL Editor.
Latest fix: `supabase/migrations/10_final_stabilization.sql`

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
