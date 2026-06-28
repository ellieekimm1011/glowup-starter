# ✨ GlowUp — AI Makeup Coach

A personalized AI makeup coaching app that analyzes your facial features and teaches you techniques tailored to your unique face shape.

---

## 🗂 Folder Structure

```
glowup/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx                # Root layout (wraps all pages)
│   │   ├── page.tsx                  # Landing / home page
│   │   ├── auth/
│   │   │   ├── login/page.tsx        # Login page
│   │   │   └── signup/page.tsx       # Sign up page
│   │   ├── dashboard/page.tsx        # User dashboard after login
│   │   ├── upload/page.tsx           # Selfie upload page
│   │   ├── analysis/page.tsx         # Facial analysis results + makeup guide
│   │   └── profile/page.tsx          # User profile page
│   ├── components/
│   │   ├── ui/                       # Reusable buttons, inputs, cards
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Input.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx            # Top navigation bar
│   │   │   └── Footer.tsx
│   │   └── makeup/
│   │       ├── FaceShapeCard.tsx     # Shows detected face shape
│   │       ├── MakeupGuideSection.tsx # Blush/contour/highlight tips
│   │       └── TutorialCard.tsx      # Recommended YouTube tutorials
│   ├── lib/
│   │   ├── supabase.ts               # Supabase client setup
│   │   ├── ai.ts                     # OpenRouter API calls for analysis
│   │   └── utils.ts                  # Helper functions
│   ├── types/
│   │   └── index.ts                  # TypeScript type definitions
│   └── hooks/
│       └── useAuth.ts                # Authentication hook
├── .env.local                        # Your secret keys (never commit this!)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## 🗄 Database Schema (Supabase)

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Face analyses table
CREATE TABLE face_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  face_shape TEXT NOT NULL,  -- oval, round, square, heart, diamond, oblong
  analysis_data JSONB NOT NULL,  -- full AI response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) — users only see their own data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_analyses ENABLE ROW LEVEL SECURITY;

-- Policies: users can only read/write their own rows
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own analyses" ON face_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON face_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage bucket for selfies
INSERT INTO storage.buckets (id, name, public) VALUES ('selfies', 'selfies', false);

CREATE POLICY "Users can upload own selfies" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own selfies" ON storage.objects
  FOR SELECT USING (bucket_id = 'selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 🚀 Step-by-Step Setup Instructions

### Step 1: Prerequisites
Install these on your computer first:
- **Node.js** (v18+): https://nodejs.org
- **Git**: https://git-scm.com
- A code editor like **VS Code**: https://code.visualstudio.com

### Step 2: Create GitHub Repository
1. Go to https://github.com and sign in
2. Click the **+** button → **New repository**
3. Name it `glowup`, set to Public, click **Create repository**
4. Follow the instructions shown to push your code there

### Step 3: Create Supabase Project
1. Go to https://supabase.com and sign up (free)
2. Click **New Project**, give it a name like "glowup"
3. Set a strong database password and save it somewhere safe
4. Wait ~2 minutes for the project to spin up
5. Go to **Settings → API** and copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Go to **SQL Editor** and paste + run all the SQL from the Database Schema section above

### Step 4: Get OpenRouter API Key
1. Go to https://openrouter.ai and sign up / log in
2. Go to **Keys** and create a new key
3. Copy it → this is your `OPENROUTER_API_KEY`

### Step 5: Install & Run Locally
```bash
# Clone the repo (replace YOUR_USERNAME with your GitHub username)
git clone https://github.com/YOUR_USERNAME/glowup.git
cd glowup

# Install all dependencies
npm install

# Copy the example env file
cp .env.example .env.local

# Open .env.local and fill in your keys
# Then start the development server
npm run dev
```
Open http://localhost:3000 in your browser — you should see the app!

### Step 6: Deploy to Vercel
1. Go to https://vercel.com and sign up with your GitHub account
2. Click **Add New → Project**
3. Select your `glowup` repository
4. Under **Environment Variables**, add all four variables from your `.env.local`
5. Click **Deploy** — Vercel will give you a live URL in ~2 minutes!

---

## 🔑 Environment Variables

Create a `.env.local` file in the root of the project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

⚠️ **Never share these keys or commit them to GitHub.**
The `.gitignore` file already excludes `.env.local` so you're safe.
