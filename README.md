# 📊 VentureDash: VC & Sales Dashboard

A modern, clean, and professional SaaS-style dashboard built with **React**, **Tailwind CSS**, and **Lucide Icons**. This dashboard provides a real-time overview of sales performance by ingesting data directly from a CSV file.

![Dashboard Preview](https://raw.githubusercontent.com/lucide-react/lucide/main/icons/layout-dashboard.svg) *Note: Replace with an actual screenshot if hosted.*

## ✨ Features

- **🚀 Multi-Source Data Layer**: Effortlessly switch between local CSV storage and a production-ready **Supabase** database via environment variables.
- **🧠 AI Strategy Engine**: Integrated Gemini AI (Free & Pro tiers) to generate automated business alerts, opportunities, and suggestions from your data.
- **🔒 Secure Proxy Architecture**: API keys are stored server-side in a private `.env`, keeping your credentials protected from frontend exposure.
- **📈 Advanced Analytics**: Real-time KPI calculations and interactive Recharts visualizations (Line, Bar, Pie charts).
- **🔍 Smart Filtering**: Instantly drill down into data by Date Range, Product, or Acquisition Channel.

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Tailwind CSS 3](https://tailwindcss.com/), [Recharts](https://recharts.org/)
- **Backend**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/)
- **AI**: [Google Gemini AI SDK](https://ai.google.dev/)
- **Database**: [Supabase](https://supabase.com/) (Optional/PostgreSQL)
- **Utilities**: [csv-parser](https://www.npmjs.com/package/csv-parser), [Concurrently](https://www.npmjs.com/package/concurrently)

## 📥 Detailed Installation Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: Version 18.x or higher (LTS recommended)
- **NPM**: Normally bundled with Node.js
- **Git**: (Optional) For cloning the repository

### 2. Setup Steps
Follow these steps to get the dashboard running locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/vc-dashboard.git
   cd vc-dashboard
   ```
   *(Or just open the project folder in your IDE)*

2. **Clean Install**:
   If you have existing `node_modules`, it is recommended to delete them first:
   ```powershell
   # Windows PowerShell
   Remove-Item -Recurse -Force node_modules
   ```
   Then install dependencies:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a [`.env`](file:///d:/Kay's%20Project/VC%20Dashboard/.env) file in the root directory and add your keys:
   ```env
   # AI Configuration
   GEMINI_API_KEY=your_key_here

   # Data Provider Selection
   DATA_SOURCE=csv   # Set to 'supabase' when ready

   # Supabase (Only if using Database)
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   ```

4. **Launch Application**:
   This runs both the React frontend (5173) and the AI/Data Proxy (8888) simultaneously:
   ```bash
   npm run dev
   ```

5. **View Dashboard**:
   Open [http://localhost:5173](http://localhost:5173).

### ⚠️ Troubleshooting (Windows Users)

If you encounter the error: `File ...\npm.ps1 cannot be loaded because running scripts is disabled on this system`, try the following:

- **Method A (Fixed suffix)**: Use `.cmd` appended to your commands (e.g., `npm.cmd install` or `npm.cmd run dev`).
- **Method B (Execution Policy)**: Open PowerShell as **Administrator** and run:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
- **Method C (Bypass)**: Bypass the policy for the current session:
  ```powershell
  powershell -ExecutionPolicy ByPass -File .\node_modules\.bin\vite.ps1
  ```

## 🗄️ Database Integration (Supabase)

The backend API is configured to read data from a local CSV by default, but is fully ready to connect to **Supabase** for real-time data persistence. Follow these simple steps to switch:

1. **Create a Supabase Project**: Go to [Supabase](https://supabase.com/) and create a new project.
2. **Setup the Table**: In the **SQL Editor**, create the `sales_data` table by pasting and running this SQL snippet:
   ```sql
   create table sales_data (
     id uuid default gen_random_uuid() primary key,
     date date not null,
     product text not null,
     channel text not null,
     orders integer default 0,
     revenue numeric default 0,
     cost numeric default 0,
     visitors integer default 0,
     customers integer default 0,
     created_at timestamp with time zone default now()
   );
   ```
3. **Import Data**: 
   - Go to the **Table Editor** (look for the grid icon in the left sidebar).
   - Select your new `sales_data` table from the list.
   - Click the **Insert** button at the top and choose **Import data from CSV**.
   - Drag and drop your `sales_data.csv` (found in your project's `data/` folder).
   - Ensure the preview looks correct and click **Import**.
4. **Get Credentials**: 
   - Click the **Project Settings** icon (gear icon ⚙️ at the very bottom of the left sidebar).
   - In the settings menu, click on the **API** tab.
   - You will see a section called **Project API Keys**:
     - **Project URL**: Copy the long URL starting with `https://...`
     - **anon (public)**: Copy the long string of characters labeled as your "anon" key.
5. **Update Local Settings**: In your project's [`.env`](file:///d:/Kay's%20Project/VC%20Dashboard/.env) file, add your credentials and switch the source:
   ```env
   DATA_SOURCE=supabase
   SUPABASE_URL=your_project_url_here
   SUPABASE_ANON_KEY=your_anon_key_here
   ```
6. **Restart & Launch**: Restart your development server (`npm run dev`). The API will now serve data directly from Supabase!

---

## 📁 Project Structure

```text
/
├── data/               # Local data source (CSV)
├── lib/
│   └── providers/      # Data Layer logic (Supabase vs CSV)
├── src/
│   ├── App.jsx         # Dashboard UI & Logic
│   └── index.css       # Tailwind & Global Styles
├── server.js           # Secure Express API & AI Proxy
├── .env                # Private Credentials (DO NOT COMMIT)
├── tailwind.config.js  # SaaS Theme Configuration
└── package.json        # Unified scripts and dependencies
```

The system is configured to read from `data/sales_data.csv` by default.

| Column | Description |
| :--- | :--- |
| `date` | YYYY-MM-DD |
| `product` | Name of the service or item sold |
| `channel` | Marketing channel (e.g., Facebook Ads, Google Ads) |
| `orders` | Number of transactions |
| `revenue` | Total gross revenue |
| `cost` | Total marketing and operational cost |

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
