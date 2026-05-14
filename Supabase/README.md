# Supabase Setup

1. Open the Supabase project SQL editor.
2. Run `Supabase/schema.sql`.
3. Copy the project URL and anon public key from Supabase project settings.
4. Paste them into `Frontend/js/supabase-config.js`.

The frontend uses Supabase RPC functions directly. Direct anonymous access to
`school_progress` is revoked and RLS is enabled, so the browser can only use the
controlled functions in `schema.sql`.

No Edge Functions are required for the current app because the existing backend
logic is simple credential checks plus row updates, which fits cleanly in
Postgres `security definer` functions.

The schema now stores progress as JSON objects:

```json
[
  {
    "index": 0,
    "title": "Formed a team",
    "checked": true,
    "page-text": "",
    "img-url": "./images/team.jpeg"
  }
]
```
