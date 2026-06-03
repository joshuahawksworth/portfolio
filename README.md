# Joshua Hawksworth - Portfolio

A personal portfolio website showcasing my work experience and technical skills. Built with React and TypeScript.

🔗 **[Live Site](https://hawksworth.dev/)**

![Portfolio Demo](./demo.gif)

## Overview

Single-page portfolio featuring my professional experience across my previous companies, the tech stack I worked with, and a contact form to get in touvh! Includes some animations and interactive elements for visual interest.

## Features

- Hero section with animated background elements
- Tech stack icons grid
- Contact form with serverless email (using Resend's Free API)
- Responsive layout for mobile/tablet/desktop

## Snake leaderboard (production)

Scores are stored in Supabase so every visitor sees the same top 10. In `api/leaderboard.ts` (and `.env.example`) you’ll find the one-time SQL to create `snake_leaderboard` with public read/insert policies.

1. Create a Supabase project and run that SQL in the SQL editor.
2. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to Vercel → Project → Settings → Environment Variables (and to `.env.local` for local dev).
3. Redeploy. Without those variables, the API falls back to per-instance memory, so scores will not persist or sync across users.

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: CSS Modules
- **Deployment**: Vercel
- **API**: Vercel serverless functions
- **Email**: Resend
- **Code Quality**: ESLint, Prettier

## Running Locally

```bash
# Install dependencies
npm install

# Add environment variables (see .env.example)
# Create .env.local with RESEND_API_KEY and, for a shared Snake leaderboard:
#   SUPABASE_URL, SUPABASE_ANON_KEY

# Start dev server
npm run dev

# Build for production
npm run build
```

## Contact

Joshua Hawksworth - joshuahawksworth@me.com

[LinkedIn](https://www.linkedin.com/in/joshua-hawksworth-9741aa209/) • [GitHub](https://github.com/joshuahawksworth)
