# BlauTech Admin Panel

A separate admin website for managing BlauTech listings and Berlin-focused
publishing workflows. It uses Supabase for authentication and database
operations.

## System boundary

This repository contains UI shared by the established multi-city admin and the
new Berlin-focused publishing system.

- Berlin-focused work lives in the workflow proxy, LinkedIn draft previews,
  publication controls, and the event/hackathon workflow actions.
- Existing Munich and Madrid CRUD, authorization, and routing behavior is a
  compatibility boundary. Do not remove or reshape it as part of Berlin
  cleanup.
- Stable/legacy n8n workflows live in `BlauTechN8N`. Privileged actions use the
  authenticated proxy; event intake calls public stable and Berlin endpoints directly.

## Publishing controls

- Events and hackathons are eligible for publishing when they are approved with
  `is_published`; `posted_newsletter`, `posted_linkedin`, and `drafted_linkedin`
  track channel state and prevent duplicate selection.
- `partner_event` remains an event presentation and Berlin LinkedIn priority
  flag; partner rows are ordered nearest-first within that priority group.
- Events and hackathons have no Admin highlight control. Newsletter and LinkedIn
  selection do not read their legacy `is_highlight` values.
- Highlight controls remain for scholarships, opportunities, and organisations,
  where they select featured public-site content.

## Features

- 🔐 **Protected Authentication**: Full admins and city-scoped city leads can access the panel
- 📅 **Events Management**: Full CRUD operations for events
- 💻 **Hackathons Management**: Full CRUD operations for hackathons
- 🎓 **Scholarships Management**: Full CRUD operations for scholarships
- 🏢 **Organisations Management**: Full CRUD operations for organisations
- 🔗 **Link Tracking**: View tracked publishing links and click counts
- ✍️ **Berlin Publishing**: Preview and create reviewed LinkedIn drafts
- 🎨 **Modern UI**: Built with Next.js, TypeScript, and Tailwind CSS

## Prerequisites

- Node.js 18+ and npm/yarn
- A Supabase project with the following tables:
  - `events`
  - `hackathons`
  - `scholarships`
  - `opportunities`
  - `organisations`
  - `tracked_links`
  - `link_clicks`

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Set up authorized users in Supabase:**

   Roles and cities must be stored in protected **App Metadata**, which users cannot edit themselves. Use one of these exact shapes:

   ```json
   { "role": "admin" }
   { "role": "super_admin" }
   { "role": "city_lead", "city": "BERLIN" }
   ```

   Valid city-lead cities are `MUNICH`, `BERLIN`, and `MADRID`. A city lead with a missing or invalid city is denied access.

   Assign these claims only to accounts you have reviewed. Do not copy values from user-editable metadata. You can edit App Metadata in Authentication > Users, use the Supabase Auth Admin API from a trusted server, or update one reviewed account in the SQL editor:

   ```sql
   UPDATE auth.users
   SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
     || '{"role":"city_lead","city":"BERLIN"}'::jsonb
   WHERE email = 'verified-berlin-lead@example.com';
   ```

   After changing claims, the user must sign out and sign back in so their access token contains the new App Metadata.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

The application expects the following table structures:

### Events, Hackathons, Scholarships
- `id` (uuid, primary key)
- `title` (text, required)
- `description` (text, optional)
- `start_date` (timestamptz, required)
- `end_date` (timestamptz, required)
- `location` (text, optional)
- `created_at` (timestamptz, required)
- `updated_at` (timestamptz, required)

## Project Structure

```
├── app/
│   ├── dashboard/          # Admin dashboard pages
│   │   ├── events/         # Events management
│   │   ├── hackathons/     # Hackathons management
│   │   ├── scholarships/    # Scholarships management
│   │   ├── opportunities/  # Programs and fellowships
│   │   ├── organisations/  # Organisations management
│   │   └── link-tracking/  # Publishing link analytics
│   ├── api/workflows/      # Authenticated n8n proxy
│   ├── login/               # Login page
│   └── unauthorized/        # Unauthorized access page
├── components/              # Reusable components
│   ├── Layout.tsx           # Main layout with auth check
│   ├── Navbar.tsx           # Navigation bar
│   ├── Modal.tsx            # Modal component
│   └── ui/                  # Shared UI primitives
└── lib/
    ├── supabase.ts          # Supabase client
    ├── auth.ts              # Authentication utilities
    ├── authorization.ts     # Roles and workflow allowlist
    ├── linkedinPreview.ts   # Berlin draft candidate selection
    └── api.ts               # CRUD and workflow clients
```

## Building for Production

```bash
npm run build
npm start
```

## Security Notes

- The Admin UI reads authorization only from protected Supabase Auth App Metadata
- Database Row Level Security is the actual enforcement layer; UI city filters are only for usability
- `admin` and `super_admin` can manage every city and global record
- A `city_lead` can manage only records assigned exactly to their city; global and multi-city records are full-admin only
- Apply trusted App Metadata to reviewed accounts and refresh their sessions before deploying the city-permission RLS migration
- Never commit your `.env.local` file to version control

## License

Private - BlauTech
