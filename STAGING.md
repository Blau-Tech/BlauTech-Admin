# BlauTech Admin staging environment

The Admin has two long-lived deployment tracks from this repository:

| Environment | Git branch | Domain |
| --- | --- | --- |
| Production | `main` | `admin.blau-tech.de` |
| Staging | `staging` | `admin-preview.blau-tech.de` |

## Isolation contract

The staging deployment must not be connected to production services.

Before assigning the preview domain, configure branch-scoped Vercel Preview
variables for `staging`:

```env
NEXT_PUBLIC_APP_ENV=preview
NEXT_PUBLIC_SUPABASE_URL=<staging Supabase URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging Supabase anon key>
NEXT_PUBLIC_N8N_EVENT_INTAKE_URL=<staging n8n intake URL>
NEXT_PUBLIC_N8N_BERLIN_EVENT_INTAKE_URL=<staging Berlin n8n intake URL>
N8N_ADMIN_WEBHOOK_URL=<staging n8n webhook base URL>
N8N_ADMIN_WEBHOOK_SECRET=<staging-only secret>
```

Any additional workflow URL must also point to a staging workflow. Never copy a
production service-role key or production n8n secret into Preview variables.

The staging Supabase environment needs its own Auth users and App Metadata
roles. Seed only synthetic or approved test data.

## Release flow

1. Develop on a feature branch and use its generated Vercel URL for an initial
   build check.
2. Merge approved work into `staging`.
3. Test it at `admin-preview.blau-tech.de`.
4. Merge the same reviewed change into `main` only when it is ready for
   production.

Production variables and `admin.blau-tech.de` remain attached to `main`.
