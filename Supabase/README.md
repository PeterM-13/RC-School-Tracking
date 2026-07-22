# Supabase Database

This project uses Supabase Postgres directly from the static frontend. There is
no custom backend service. The simple school/password login
is implemented with Postgres RPC functions.

## Setup

1. Open the Supabase project SQL editor.
2. Run `Supabase/schema.sql`.
3. Copy the Supabase project URL and anon public key.
4. Paste them into `Frontend/js/supabase-config.js`.

## Tables

### `public."Luton_schools"`, `public."Edinburgh_schools"`, `public."Basildon_schools"`

Each site has its own school table for login details, roadmap progress, and
comments. If an older `public.school_progress` table exists, `schema.sql`
renames it to `public."Luton_schools"`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `bigint` | Identity primary key. |
| `school` | `text` | Unique school name. `Admin` is a special row. |
| `password` | `text` | Plain-text project password. This matches the existing simple login model and is not intended for a secure site. |
| `progress` | `jsonb` | Array of roadmap step objects. |
| `comments` | `jsonb` | Array of message/comment objects. |
| `created_at` | `timestamptz` | Created timestamp. |
| `updated_at` | `timestamptz` | Updated automatically by trigger. |

Constraints:

- `<site>_schools_school_unique`: one row per school name.
- `<site>_schools_progress_array`: `progress` must be a JSON array.
- `<site>_schools_comments_array`: `comments` must be a JSON array.

## Progress JSON

`progress` is always an array of step objects:

```json
[
  {
    "index": 0,
    "title": "Formed a team",
    "checked": false,
    "page-text": "",
    "img-url": "https://togmxgkpdfmfklcungfa.supabase.co/storage/v1/object/public/Roadmap-Images/team.jpeg"
  }
]
```

Fields:

| Field | Type | Notes |
| --- | --- | --- |
| `index` | number | Stable roadmap step index. |
| `title` | string | Step title displayed on the roadmap. |
| `checked` | boolean | Whether the school has completed the step. |
| `page-text` | string | Optional tooltip text. Empty string means no tooltip is shown. |
| `img-url` | string | Image path used by the progress pages. |

The `Admin` row acts as the roadmap template. Admin edits to `title`,
`page-text`, and `img-url` are applied when progress is fetched for every school.
Each school row keeps its own `checked` values.

`default_progress_steps()` defines the initial 31 roadmap steps used when seeding
schools and creating new schools.

## Comments JSON

`comments` is an array of comment objects:

```json
[
  {
    "index": 0,
    "sender": "leonardo",
    "text": "Hi there! How can we help?",
    "viewed": false
  }
]
```

Fields:

| Field | Type | Notes |
| --- | --- | --- |
| `index` | number | Position in the comment list. Re-indexed after delete. |
| `sender` | string | Either `school` or `leonardo`. |
| `text` | string | Message body. |
| `viewed` | boolean | Used for unread message badges. |

## Access Model

RLS is enabled on all site tables, and direct table access is revoked from
`anon`, `authenticated`, and `public`.

The browser only receives permission to execute controlled RPC functions. Those
functions are `security definer` functions and validate the school password or
admin password before reading or writing data.

No Edge Functions are currently required because the app logic is simple:
credential checks, progress updates, school administration, and comment updates.

## RPC Functions

### Auth helpers

| Function | Purpose |
| --- | --- |
| `site_schools_table(p_site)` | Internal helper that maps `Luton`, `Edinburgh`, or `Basildon` to the matching table. Unknown sites fall back to `Luton`. |
| `school_password_matches(p_school, p_password, p_site)` | Internal helper for school/password checks. |
| `admin_password_matches(p_password, p_site)` | Internal helper for Admin password checks. |
| `verify_school_password(p_name, p_password, p_site)` | Frontend login check. Returns `{ "success": true/false }`. |

### Roadmap/progress

| Function | Purpose |
| --- | --- |
| `default_progress_steps()` | Returns the default 31-step roadmap JSON. |
| `apply_progress_template(p_template, p_progress)` | Combines Admin roadmap metadata with a school row's checked values. |
| `get_school_progress(p_name, p_password, p_site)` | Returns one school's progress after password validation. |
| `list_school_progress(p_name, p_password, p_admin_key, p_site)` | Returns all schools' progress for a site. Requires either a valid school password or Admin key. |
| `update_school_progress(p_name, p_password, p_progress, p_site)` | Replaces a school's JSON progress array after password validation. |
| `reset_all_progress(p_admin_key, p_site)` | Sets `checked` to `false` for all non-Admin school rows in the selected site. |

### School management

| Function | Purpose |
| --- | --- |
| `get_school_names(p_site)` | Returns school names for the login dropdown. |
| `create_school(p_admin_key, p_name, p_password, p_site)` | Creates a new school using `default_progress_steps()`. Requires Admin key. |
| `delete_school(p_admin_key, p_name, p_password, p_site)` | Deletes a non-Admin school. Requires Admin key and that school's password. |

### Comments/messages

| Function | Purpose |
| --- | --- |
| `get_comments(p_school_name, p_school_key, p_site)` | Returns comments for a school after password validation. |
| `add_comment(p_school_name, p_school_key, p_text, p_admin_key, p_site)` | Adds a school or Leonardo comment. `p_admin_key` makes the sender `leonardo`. |
| `delete_comment(p_school_name, p_school_key, p_comment_index, p_admin_key, p_site)` | Deletes and re-indexes a comment. Requires Admin key. |
| `mark_comment_viewed(p_school_name, p_school_key, p_msg_index, p_site)` | Marks one comment as viewed. |
| `get_unviewed_comments(p_admin_key, p_sent_by, p_site)` | Returns unread comment counts by school. Requires Admin key. |

## Seed Data

`schema.sql` seeds these rows:

### Luton

| School | Password |
| --- | --- |
| `Admin` | `lu13pg` |
| `Cottesloe` | `cottesloe37355` |
| `Queensbury` | `queensbury67890` |
| `Parmiters` | `parmiters98765` |
| `Silverstone UTC` | `silverstoneutc44556` |
| `Roundwood` | `roundwood77889` |
| `Watford Boys` | `watfordboys99001` |
| `Watford Girls` | `watfordgirls22334` |
| `Chalk Hills` | `chalkhills55667` |
| `St Clement Danes` | `stclementdanes88990` |
| `Shenley Brook End` | `shenleybrookend91402` |

### Edinburgh

| School | Password |
| --- | --- |
| `Admin` | `eh52xs` |
| `Example School 1` | `exampleschool1` |
| `Example School 2` | `exampleschool2` |
| `Example School 3` | `exampleschool3` |

### Basildon

| School | Password |
| --- | --- |
| `Admin` | `ss143el` |
| `Example School 1` | `exampleschool1` |
| `Example School 2` | `exampleschool2` |
| `Example School 3` | `exampleschool3` |

Rows are inserted with `on conflict (school) do nothing`, so rerunning the schema
does not overwrite existing school rows.
