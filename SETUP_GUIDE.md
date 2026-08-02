# Local Livestock — Beginner Setup & Deployment Guide

This guide walks you through every step, from zero to a live website.
No prior experience needed. Follow each section in order.

---

## Part 1: Package Installation

You only need one package beyond what's already in the project:
the official Supabase client library.

Open your terminal and run:

```bash
npm install @supabase/supabase-js
```

That's it. The rest of the dependencies (React, Tailwind CSS, Vite,
TypeScript, Lucide icons) are already listed in `package.json` and
will be installed when you run `npm install` (covered in Part 4).

---

## Part 2: Supabase Project Setup

### Step 2.1 — Create a free Supabase account

1. Open your web browser and go to **https://supabase.com**
2. Click the green **"Start your project"** button in the top-right
3. Sign up using your **GitHub account** (recommended) or your email
4. Once logged in, you'll see the Supabase dashboard

### Step 2.2 — Create a new project

1. Click the green **"New Project"** button
2. Fill in the form:
   - **Name**: type `local-livestock` (or any name you like)
   - **Database Password**: click "Generate a password" and copy it
     somewhere safe — you won't need it for this guide, but save it
   - **Region**: select **Southeast Asia (Singapore)** — closest to
     the Philippines for the fastest response times
   - **Pricing Plan**: leave it on **Free** (perfectly fine for this app)
3. Click the green **"Create new project"** button
4. **Wait 1-2 minutes** — Supabase is setting up your database.
   You'll see a progress indicator. Don't close the page.

### Step 2.3 — Run the SQL schema script

This step creates all 6 database tables, security rules, triggers,
and stored procedures your app needs.

1. In the **left sidebar** of your Supabase dashboard, find and click
   **"SQL Editor"** (it has a `>_` icon)
2. Click the green **"New query"** button near the top
3. A large text editor will appear in the center of your screen
4. Open the file **`supabase-schema.sql`** from your project folder
   (I created this for you — it's in the root of your project)
5. Select **all** the text in that file (Ctrl+A / Cmd+A) and **copy**
   it (Ctrl+C / Cmd+C)
6. **Paste** it into the Supabase SQL editor (Ctrl+V / Cmd+V)
7. Click the green **"Run"** button at the bottom of the editor
8. You should see **"Success. No rows returned"** in the output panel
   below — this means everything worked

> **What did this script do?**
> - Created 6 tables: `profiles`, `listings`, `offers`,
>   `notifications`, `reviews`, `categories`
> - Added security rules so users can only see and edit their own data
> - Created a trigger that auto-creates a profile when someone signs up
> - Created a trigger that recalculates dealer ratings when a review is
>   submitted
> - Created two stored procedures: `approve_offer` (deducts stock
>   atomically) and `reject_offer`

### Step 2.4 — Find your Project URL and API Key

Your app needs two pieces of information to connect to Supabase:
the **Project URL** and the **Anon Key**.

1. In the **left sidebar**, click the **gear icon** (Project Settings)
   at the very bottom
2. Click **"API"** in the settings menu
3. You'll see two important values:

   **Project URL** — looks like:
   ```
   https://abcdefgh.supabase.co
   ```
   Copy this entire URL.

   **Project API Keys** — under the "Project API keys" heading, find
   the row labeled **"anon public"**. It's a very long string starting
   with `eyJ...`. Click the **"Copy"** button next to it.

4. **Save both of these** — you'll paste them into your `.env` file next.

> **Security note**: The "anon" key is safe to use in your frontend
> code. It only allows actions that your row-level security policies
> permit. Never use the "service_role" key in frontend code — that one
> bypasses all security rules.

### Step 2.5 — Create your `.env` file

1. In your project folder, I've created a file called **`.env.example`**
2. Make a copy of it and rename the copy to **`.env`** (just the name
   `.env`, no `.example`)
3. Open `.env` in your text editor
4. Replace the placeholder values with the real ones you copied:

   ```
   VITE_SUPABASE_URL=https://abcdefgh.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   ```

   (Paste your actual URL and key — don't use the example values above)

5. **Save** the file (Ctrl+S / Cmd+S)

> **Why `.env`?** This file stores your Supabase connection details.
> It's listed in `.gitignore`, so it will **never** be uploaded to
> GitHub — your keys stay private. The `.env.example` file (without
> real values) is safe to share and serves as a template.

### Step 2.6 — Test locally

1. Open your terminal in the project folder
2. Run `npm install` (if you haven't already)
3. Run `npm run dev`
4. Open **http://localhost:5173** in your browser
5. You should see the Local Livestock sign-in page
6. Try creating an account — it should work end-to-end

---

## Part 3: Push to GitHub

### Step 3.1 — Create a GitHub repository

1. Go to **https://github.com** and sign in
2. Click the green **"New"** button (or the `+` icon in the top-right,
   then "New repository")
3. Fill in the form:
   - **Repository name**: `local-livestock`
   - **Description**: `Provincial livestock trading platform`
   - **Visibility**: select **Private** (recommended) or Public
   - **Do NOT** check "Add a README file" — your project already has files
   - **Do NOT** add a `.gitignore` or license — both already exist
4. Click the green **"Create repository"** button
5. GitHub will show you a page with setup instructions.
   **Copy the URL** that looks like:
   ```
   https://github.com/YOUR_USERNAME/local-livestock.git
   ```

### Step 3.2 — Connect your local project to GitHub

Open your terminal in your project folder and run these commands
one at a time. Replace `YOUR_USERNAME` with your actual GitHub username.

```bash
# Initialize Git in your project folder (only if not already done)
git init

# Stage all your project files
git add .

# Create your first commit (a save point)
git commit -m "Migrate to Supabase backend with real auth and database"

# Rename the default branch to "main"
git branch -M main

# Link your local project to your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/local-livestock.git

# Push your code to GitHub
git push -u origin main
```

> **If `git push` asks for your username and password:**
> GitHub no longer accepts your account password for Git operations.
> You need a **Personal Access Token** instead:
> 1. Go to GitHub → Settings → Developer settings → Personal access
>    tokens → Tokens (classic)
> 2. Click "Generate new token (classic)"
> 3. Give it a name like "local-livestock-push"
> 4. Check the "repo" scope
> 5. Click "Generate token" at the bottom
> 6. Copy the token (it starts with `ghp_`)
> 7. When Git asks for your password, paste this token instead

### Step 3.3 — Verify your code is on GitHub

1. Go to **https://github.com/YOUR_USERNAME/local-livestock**
2. You should see all your project files listed there
3. **Verify that `.env` is NOT there** — click into the file list and
   confirm there's no `.env` file. If you see it, your `.gitignore`
   is wrong — but I've already set it up correctly for you

---

## Part 4: Deploy to Vercel

Vercel is a free hosting platform that connects directly to your
GitHub repository. Every time you push code to GitHub, Vercel will
automatically rebuild and deploy your site.

### Step 4.1 — Create a Vercel account

1. Go to **https://vercel.com**
2. Click **"Sign Up"** in the top-right
3. Click **"Continue with GitHub"** — this links your Vercel and
   GitHub accounts
4. Authorize Vercel to access your GitHub repositories when prompted

### Step 4.2 — Import your project

1. Once logged in, click the **"Add New"** button (top-right)
2. Select **"Project"** from the dropdown
3. You'll see a list of your GitHub repositories. Find
   **`local-livestock`** and click **"Import"** next to it
4. If you don't see it, click "Adjust GitHub App Permissions" and
   grant Vercel access to the repository, then refresh

### Step 4.3 — Configure the build settings

On the import page, you'll see a configuration screen:

- **Framework Preset**: Vercel should auto-detect **Vite**.
  If it doesn't, select "Vite" from the dropdown
- **Build Command**: leave as `npm run build` (auto-filled)
- **Output Directory**: leave as `dist` (auto-filled)
- **Install Command**: leave as `npm install` (auto-filled)

**Do NOT click "Deploy" yet** — you need to add your environment
variables first (next step).

### Step 4.4 — Add environment variables (CRITICAL STEP)

This is the most important part of deployment. Without these, your
live website won't be able to connect to your Supabase database.

1. On the same import/configure page, scroll down to the
   **"Environment Variables"** section
2. You'll see a form with three fields: **Key**, **Value**, and
   environment checkboxes
3. Add the **first variable**:
   - **Key**: type `VITE_SUPABASE_URL`
   - **Value**: paste your Supabase Project URL
     (e.g. `https://abcdefgh.supabase.co`)
   - Check all three boxes: **Production**, **Preview**, **Development**
4. Click **"Add"** to save this variable
5. Add the **second variable**:
   - **Key**: type `VITE_SUPABASE_ANON_KEY`
   - **Value**: paste your Supabase anon public key
     (the long string starting with `eyJ...`)
   - Check all three boxes: **Production**, **Preview**, **Development**
6. Click **"Add"** to save this variable

You should now see both variables listed in a table below the form.

### Step 4.5 — Deploy

1. Click the large **"Deploy"** button at the bottom of the page
2. Vercel will start building your project — you'll see a progress
   screen with animated icons
3. This takes about 1-2 minutes
4. When it's done, you'll see a **"Congratulations!"** screen with
   confetti
5. Click the **"Visit"** button (or the preview thumbnail) to see
   your live website

> **Your website is now live!** The URL will look like:
> `https://local-livestock-abc123.vercel.app`
> You can share this URL with anyone in the world.

### Step 4.6 — Verify it works

1. Open your live Vercel URL in a browser
2. Create a new account (use a real email — the app validates format)
3. Sign in
4. If you signed up as a dealer, try creating a listing
5. If you signed up as a customer, browse the marketplace
6. Everything should work exactly like it did on localhost — but now
   the data is stored in your Supabase database and visible to all
   visitors

---

## Part 5: Making Updates Going Forward

Once you're deployed, here's the workflow for making changes:

1. Edit files locally on your computer
2. Run `npm run dev` to preview changes at http://localhost:5173
3. When you're happy with the changes:
   ```bash
   git add .
   git commit -m "Description of what you changed"
   git push
   ```
4. Vercel will **automatically** rebuild and deploy your site within
   1-2 minutes — no need to do anything on Vercel

### Adding new environment variables later

If you ever need to add or change an environment variable on Vercel:

1. Go to https://vercel.com → your project → **Settings** tab
2. Click **"Environment Variables"** in the left menu
3. Add, edit, or delete variables as needed
4. Click **"Save"**
5. Go to the **"Deployments"** tab and click the three dots (`...`)
   next to your latest deployment → **"Redeploy"** — this is needed
   because environment variables are only read at build time

---

## Quick Troubleshooting

**"I see a blank page on my live site"**
You probably forgot to add the environment variables on Vercel.
Go to Settings → Environment Variables and add both
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then redeploy.

**"I can't sign up or sign in"**
Make sure your Supabase project is not paused. Free Supabase projects
pause after 7 days of inactivity. Go to your Supabase dashboard and
click "Restore" if you see a paused-project banner.

**"`git push` is rejected"**
Your local branch may be behind the remote. Run `git pull origin main`
first, then `git push` again.

**"Vercel build fails"**
Check the build logs on Vercel (click the failed deployment → "Build
Logs"). The most common cause is a typo in an environment variable
or a missing dependency (run `npm install` locally first).
