# BlauTech Admin Panel

A separate admin website for managing BlauTech events, hackathons, scholarships, signups, and partner events. This application uses Supabase for authentication and database operations.

## Features

- 🔐 **Protected Authentication**: Full admins and city-scoped city leads can access the panel
- 📅 **Events Management**: Full CRUD operations for events
- 💻 **Hackathons Management**: Full CRUD operations for hackathons
- 🎓 **Scholarships Management**: Full CRUD operations for scholarships
- 📝 **Signups Management**: View and delete user signups
- 🤝 **Partner Events Management**: Full CRUD operations for partner events
- 🎨 **Modern UI**: Built with Next.js, TypeScript, and Tailwind CSS

## Prerequisites

- Node.js 18+ and npm/yarn
- A Supabase project with the following tables:
  - `events`
  - `hackathons`
  - `scholarships`
  - `signups`
  - `partner_events`

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

### Signups
- `id` (uuid, primary key)
- `full_name` (text, required)
- `email` (text, required)
- `phone` (text, optional)
- `referral` (text, optional)
- `consent` (bool, required)
- `created_at` (timestamptz, required)

### Partner Events
- `id` (int8, primary key)
- `name` (text, required)
- `date` (text, required)
- `description` (text, optional)
- `link` (text, optional)
- `organiser` (text, optional)
- `created_at` (timestamptz, required)

## Project Structure

```
├── app/
│   ├── dashboard/          # Admin dashboard pages
│   │   ├── events/         # Events management
│   │   ├── hackathons/      # Hackathons management
│   │   ├── scholarships/    # Scholarships management
│   │   ├── signups/         # Signups view
│   │   └── partner-events/  # Partner events management
│   ├── login/               # Login page
│   └── unauthorized/        # Unauthorized access page
├── components/              # Reusable components
│   ├── Layout.tsx           # Main layout with auth check
│   ├── Navbar.tsx           # Navigation bar
│   ├── DataTable.tsx        # Data table component
│   ├── Modal.tsx            # Modal component
│   ├── EventForm.tsx        # Form for events/hackathons/scholarships
│   └── PartnerEventForm.tsx # Form for partner events
└── lib/
    ├── supabase.ts          # Supabase client
    ├── auth.ts              # Authentication utilities
    └── api.ts               # API functions for CRUD operations
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
