# Determined AI Growth Pilot

Determined AI is a high-performance growth engineering platform for ad management and analytics, now powered by **Supabase**.

## 🚀 Getting Started

### Prerequisites

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/dmytro-sudo/ai.git
    cd determined-ai-growth-pilot
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```ini
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run Locally**:
    ```bash
    npm run dev
    ```

---

## 🗄️ Database Setup (Supabase)

To get the application working, you must run the following SQL script in your **Supabase SQL Editor**. This sets up the multi-tenant architecture and all required tables.

```sql
-- 1. WORKSPACES
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  platform TEXT,
  status TEXT DEFAULT 'active'
);

-- 2. CAMPAIGNS
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL,
  budget DECIMAL,
  spent DECIMAL DEFAULT 0,
  revenue DECIMAL DEFAULT 0,
  leads INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cpl DECIMAL,
  ctr DECIMAL,
  roas DECIMAL,
  audience TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
);

-- 3. AD CREATIVES
CREATE TABLE creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT DEFAULT 'pending_review',
  file_url TEXT,
  thumbnail_url TEXT,
  headline TEXT,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr DECIMAL DEFAULT 0
);

-- 4. SCHEDULED ACTIONS
CREATE TABLE scheduled_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  campaign_name TEXT,
  action_type TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  value TEXT,
  status TEXT DEFAULT 'pending'
);

-- 5. NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_label TEXT
);

-- 6. REPORTS
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  type TEXT,
  summary TEXT,
  total_spent DECIMAL,
  total_revenue DECIMAL,
  total_leads INTEGER,
  roas DECIMAL,
  status TEXT DEFAULT 'generated'
);
```

---

## 🏗️ Architecture

- **Frontend**: React + Vite
- **Styling**: Vanilla CSS + Tailwind
- **Backend/Database**: Supabase
- **Deployment**: GitHub → Vercel

## 🛠️ Tech Stack

- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: Moment.js
- **UI Components**: Radix UI
