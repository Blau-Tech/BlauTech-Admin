# BlauTech Admin Panel

A separate admin website for managing BlauTech events, hackathons, scholarships, signups, and partner events. This application uses Supabase for authentication and database operations.

## Features

- 🔐 **Admin-only Authentication**: Only users with admin role can access the panel
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

3. **Set up admin users in Supabase:**
   
   You need to set the `role` in the user metadata to `admin` or `super_admin` for users who should have admin access.
   
   You can do this in the Supabase dashboard:
   - Go to Authentication > Users
   - Edit a user
   - In the "Raw User Meta Data" section, add:
     ```json
     {
       "role": "admin"
     }
     ```
   
   Or you can use the Supabase SQL editor to update user metadata:
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = jsonb_set(
     COALESCE(raw_user_meta_data, '{}'::jsonb),
     '{role}',
     '"admin"'
   )
   WHERE email = 'your-admin-email@example.com';
   ```

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

- Only users with `admin` or `super_admin` role in their user metadata can access the admin panel
- Make sure to set up Row Level Security (RLS) policies in Supabase to protect your data
- Never commit your `.env.local` file to version control

## License

Private - BlauTech

