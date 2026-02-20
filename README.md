# ZapFlow — Setup Guide

## Exact Folder Structure

```
zapflow/
│
├── app/                          ← Next.js App Router (all pages live here)
│   ├── (auth)/                   ← Pages that show the split login layout
│   │   ├── layout.jsx            ← Left branding panel + right form panel
│   │   ├── login/page.jsx        ← Login form
│   │   └── signup/page.jsx       ← Signup form
│   │
│   ├── (dashboard)/              ← Pages that show the sidebar layout
│   │   ├── layout.jsx            ← Sidebar + topbar shell
│   │   ├── dashboard/page.jsx    ← Home overview
│   │   ├── inbox/page.jsx        ← Live WhatsApp chat (coming soon)
│   │   ├── contacts/page.jsx     ← Contact list (coming soon)
│   │   ├── broadcasts/           ← Broadcast campaigns (coming soon)
│   │   ├── chatbot/              ← Flow builder (coming soon)
│   │   ├── catalog/              ← Product catalog (coming soon)
│   │   ├── analytics/            ← Charts + stats (coming soon)
│   │   ├── integrations/         ← 80+ integrations (coming soon)
│   │   └── settings/             ← WhatsApp setup + billing (coming soon)
│   │
│   ├── api/                      ← Backend API routes (server-side only)
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.js  ← NextAuth handler
│   │   │   └── signup/route.js         ← Create account endpoint
│   │   ├── contacts/route.js
│   │   ├── broadcasts/route.js
│   │   └── whatsapp/
│   │       ├── webhook/route.js   ← Receives incoming WhatsApp messages
│   │       └── send/route.js      ← Sends outgoing messages
│   │
│   ├── layout.jsx                ← Root layout (fonts, toasts)
│   ├── globals.css               ← Tailwind + all reusable CSS classes
│   └── page.jsx                  ← Redirects to /login
│
├── components/
│   ├── dashboard/
│   │   ├── Sidebar.jsx           ← Left navigation panel
│   │   └── TopBar.jsx            ← Top search + action bar
│   ├── auth/                     ← (future) reusable auth components
│   └── ui/                       ← (future) buttons, modals, tables
│
├── lib/
│   ├── auth/index.js             ← NextAuth config (providers, callbacks)
│   ├── db/index.js               ← Prisma client singleton
│   └── utils.js                  ← cn() helper for classnames
│
├── prisma/
│   └── schema.prisma             ← Full database schema
│                                   (User, Workspace, Contact, Conversation,
│                                    Message, Broadcast, Chatbot, Product)
│
├── store/                        ← Zustand global state (coming soon)
├── hooks/                        ← Custom React hooks (coming soon)
├── public/images/                ← Static assets
│
├── middleware.js                 ← Route protection (redirect if not logged in)
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env.example                  ← Copy this to .env.local and fill in values
```

---

## Step 1 — Install PostgreSQL locally (Mac)

```bash
brew install postgresql@16
brew services start postgresql@16
createdb zapflow
```

**Windows:** Download from https://www.postgresql.org/download/windows/

**Already have Postgres?** Just run: `createdb zapflow`

---

## Step 2 — Clone and install

```bash
# Navigate to where you want the project
cd ~/Projects

# Copy the zapflow folder here, then:
cd zapflow
npm install
```

---

## Step 3 — Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/zapflow"
AUTH_SECRET="run this command to generate: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

Everything else (WhatsApp, OpenAI, Stripe) can be blank for now.

---

## Step 4 — Set up the database

```bash
npx prisma generate     # generates the Prisma client
npx prisma db push      # creates all tables in your local Postgres
npx prisma studio       # opens a visual DB browser at localhost:5555
```

---

## Step 5 — Run the app

```bash
npm run dev
```

Open http://localhost:3000 → redirects to login → create account → dashboard.

---

## What's Working Now
- ✅ Signup (creates user + workspace in DB)
- ✅ Login with email/password
- ✅ Google OAuth (needs Google Cloud credentials)
- ✅ Route protection (can't access /dashboard without login)
- ✅ Session-aware dashboard with user name + plan
- ✅ Beautiful sidebar navigation
- ✅ Dashboard home page

## What's Next (tell Claude to build these)
- Contacts page (import CSV, list, search, filter)
- Inbox (live chat UI)
- Broadcasts (create + send campaign)
- Chatbot flow builder
- WhatsApp API connection (settings page)
- Analytics with charts
