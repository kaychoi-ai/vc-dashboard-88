# 🚀 Production Deployment Guide (Vercel)

VentureDash is now a **Next.js** application, which means it can be deployed to Vercel in seconds with full support for both the Frontend and the AI/Database API.

## 1. Prepare for Deployment
Ensure your latest changes are pushed to GitHub:
```bash
git add .
git commit -m "Migrate to Next.js for Vercel deployment"
git push origin main
```

## 2. Deploy to Vercel
1.  Go to the [Vercel Dashboard](https://vercel.com/new).
2.  **Import** your `vc-dashboard-88` repository.
3.  **Environment Variables**: This is the most important step! Add the following keys in the "Environment Variables" section during setup:
    *   `GEMINI_API_KEY`: Your Google AI key.
    *   `DATA_SOURCE`: Set this to `supabase`.
    *   `SUPABASE_URL`: Your project URL.
    *   `SUPABASE_ANON_KEY`: Your project anon key.
4.  **Build Settings**: The defaults for Next.js are perfect. No changes needed.
5.  Click **Deploy**.

## 3. Post-Deployment Verification
*   **API Check**: Visit `https://your-project.vercel.app/api/sales-data`. You should see your JSON data from Supabase.
*   **AI Check**: Click the "Generate Insights" button on your production site. It should process securely via Vercel's serverless functions.

## 💡 Pro Tips
- **Supabase**: Ensure your Supabase Database has the `sales_data` table populated before checking production.
- **Analytics**: Use the Vercel Dashboard to monitor API response times and AI token usage.
