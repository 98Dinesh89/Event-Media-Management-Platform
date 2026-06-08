# Club-Specific Roles Handoff

## Storage Impact

### Supabase / Postgres

This change needs database schema updates. The app previously had one global role on `users.role`, but the requested behavior needs roles per club. The schema now needs:

- `clubs`: stores each club.
- `club_members`: stores one user role per club.
- `events.club_id`: links every event to one club.
- Backfill logic for existing events/users into a default club so old data still works.

Run this SQL before using the updated backend:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS club_members (
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'photographer', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (club_id, user_id)
);

ALTER TABLE events ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES clubs(id) ON DELETE CASCADE;

INSERT INTO clubs (name, description, created_by)
SELECT 'MediaVault Club', 'Default club for existing events and users', u.id
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'MediaVault Club')
ORDER BY u.created_at ASC
LIMIT 1;

UPDATE events
SET club_id = (SELECT id FROM clubs ORDER BY created_at ASC LIMIT 1)
WHERE club_id IS NULL;

INSERT INTO club_members (club_id, user_id, role)
SELECT
  (SELECT id FROM clubs ORDER BY created_at ASC LIMIT 1),
  u.id,
  CASE
    WHEN u.role IN ('admin', 'photographer', 'member', 'viewer') THEN u.role
    ELSE 'viewer'
  END
FROM users u
WHERE EXISTS (SELECT 1 FROM clubs)
ON CONFLICT (club_id, user_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_events_club_id ON events(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON club_members(user_id);
```

This SQL is also saved in:

```txt
backend/db/club_roles.sql
```

### Cloudinary

No Cloudinary storage changes are required.

The upload pipeline still uses the existing Cloudinary middleware and still stores:

- `media.url`
- `media.thumbnail_url`
- `media.public_id`
- `media.media_type`

The only media-related behavior change is permission checking before upload/view/delete/download. Cloudinary folders, presets, keys, and upload middleware do not need to change.

## Core Thinking

The app used `users.role`, which is global. That cannot represent:

- admin in Club A
- photographer in Club B
- member in Club C
- viewer/no membership elsewhere

So the implementation keeps `users.role` for backward compatibility/login token compatibility, but moves real event/media permissions to:

```txt
clubs
club_members
events.club_id
```

The key backend rule is: permissions are calculated from the event's club, not from the user's global role.

## Permission Model Implemented

Roles are club-specific:

- `admin`: can create/delete/update events in that club, upload media, delete media, view private event/media.
- `photographer`: can create events in clubs where they are photographer; can view/upload/manage only events they created.
- `member`: can view private event/media, like, comment, favourite, tag, share.
- `viewer`: default role; can view public event/media and interact with visible media, but cannot view private media and cannot create/upload/delete.

## New Files

### `backend/db/club_roles.sql`

Purpose:

- Creates `clubs`.
- Creates `club_members`.
- Adds `events.club_id`.
- Backfills existing data into a default club.
- Adds indexes.

### `backend/utils/clubPermissions.js`

Purpose:

- Centralizes role normalization and event/media permission checks.

Important functions:

```js
const normalizeRole = role => {
  if (role === 'club_member') return 'member'
  if (['admin', 'photographer', 'member', 'viewer'].includes(role)) return role
  return 'viewer'
}
```

```js
const getClubRole = async (userId, clubId) => {
  if (!userId || !clubId) return 'viewer'
  const result = await pool.query(
    'SELECT role FROM club_members WHERE user_id = $1 AND club_id = $2',
    [userId, clubId]
  )
  return normalizeRole(result.rows[0]?.role)
}
```

```js
const getEventAccess = async (userId, eventId) => {
  const result = await pool.query(
    `SELECT e.*, c.name as club_name, cm.role as user_role
     FROM events e
     LEFT JOIN clubs c ON e.club_id = c.id
     LEFT JOIN club_members cm ON cm.club_id = e.club_id AND cm.user_id = $2
     WHERE e.id = $1`,
    [eventId, userId]
  )

  const event = result.rows[0]
  if (!event) return null

  const role = normalizeRole(event.user_role)
  return {
    event,
    role,
    canView: event.is_public || event.created_by === userId || role === 'admin' || role === 'member',
    canUpload: role === 'admin' || (role === 'photographer' && event.created_by === userId),
    canManageEvent: role === 'admin' || (role === 'photographer' && event.created_by === userId),
    canViewMedia: media => media.is_public || media.uploaded_by === userId || role === 'admin' || role === 'member' || (role === 'photographer' && event.created_by === userId),
    canDeleteMedia: media => role === 'admin' || media.uploaded_by === userId
  }
}
```

### `backend/controllers/clubController.js`

Purpose:

- List all clubs for registration.
- List current user's clubs for event creation.

Endpoints:

```txt
GET /api/clubs
GET /api/clubs/mine
```

### `backend/routes/clubs.js`

Purpose:

- Adds club routes.

```js
router.get('/', getClubs)
router.get('/mine', auth, getMyClubs)
```

## Modified Backend Files

### `backend/server.js`

Added the clubs route:

```js
app.use('/api/clubs', require('./routes/clubs'))
```

### `backend/controllers/authController.js`

Changed registration from global-role registration to club-aware registration.

Before:

```js
const { name, email, password, role } = req.body
```

After:

```js
const { name, email, password, role, mode, club_name, club_description, clubs = [] } = req.body
const requestedClubs = Array.isArray(clubs) ? clubs.slice(0, 3) : []
```

Registration now:

- creates user with fallback global role `viewer`
- if `mode === 'create'`, creates a club and inserts the user as `admin`
- otherwise joins up to 3 selected clubs with roles `viewer`, `member`, or `photographer`
- returns `user.clubs`

Login and `/auth/me` now also return clubs:

```js
const clubs = await pool.query(
  `SELECT c.id, c.name, cm.role
   FROM club_members cm
   JOIN clubs c ON cm.club_id = c.id
   WHERE cm.user_id = $1
   ORDER BY c.name ASC`,
  [user.id]
)
```

### `backend/controllers/eventController.js`

Events now require `club_id`.

Create event now checks role in that club:

```js
const userRole = await getClubRole(req.user.id, club_id)
if (!['admin', 'photographer'].includes(userRole)) {
  return res.status(403).json({ message: 'Only club admins and photographers can create events' })
}
```

Event insert now includes `club_id`:

```js
'INSERT INTO events (title, description, category, event_date, is_public, created_by, club_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *'
```

Event list now joins:

```txt
clubs
club_members
```

and returns:

```txt
club_name
user_role
```

Private event visibility now checks club role:

```js
e.is_public = true
OR e.created_by = $1
OR cm.role = 'admin'
OR cm.role = 'member'
```

Update/delete now allow:

- club admin
- photographer only if they created that event

### `backend/routes/events.js`

Removed global role middleware:

```js
router.post('/', auth, createEvent)
router.put('/:id', auth, updateEvent)
router.delete('/:id', auth, deleteEvent)
```

Reason:

Global `req.user.role` is no longer enough. The controller must check the event's club.

### `backend/controllers/mediaController.js`

Added:

```js
const { getEventAccess } = require('../utils/clubPermissions')
```

Upload now checks the event's club:

```js
const access = await getEventAccess(req.user.id, event_id)
if (!access) return res.status(404).json({ message: 'Event not found' })
if (!access.canView || !access.canUpload) {
  return res.status(403).json({ message: 'Only club admins and event photographers can upload media here' })
}
```

Media listing now:

- checks event access first
- filters private media by club role
- returns `user_role` on media rows

Delete now allows:

- uploader
- club admin

Download now:

- checks access
- uses actual club name in watermark instead of hardcoded `MediaVault`

```js
const clubName = media.club_name || 'MediaVault'
```

### `backend/routes/media.js`

Removed global role middleware from upload:

```js
router.post('/upload', auth, upload.array('files', 50), uploadMedia)
```

Reason:

Upload permission depends on the target event's club, so it must happen inside `uploadMedia`.

### `backend/controllers/socialController.js`

Added media/event access checks before:

- like
- comment
- get comments
- favourite
- tag
- favourites list

New helper:

```js
const getMediaAccess = async (userId, mediaId) => {
  const media = await pool.query('SELECT * FROM media WHERE id=$1', [mediaId])
  if (media.rows.length === 0) return { media: null, access: null }
  const access = await getEventAccess(userId, media.rows[0].event_id)
  return { media: media.rows[0], access }
}
```

The goal is to prevent private club media leaking through social endpoints.

### `backend/controllers/aiController.js`

Search and face-match results now respect event/media visibility.

Changed public search from:

```js
WHERE m.is_public = true
```

to:

```js
WHERE m.is_public = true AND e.is_public = true
```

Face search now only scans media visible to the current user:

```sql
(m.is_public = true AND e.is_public = true)
OR m.uploaded_by = current_user
OR cm.role = 'admin'
OR cm.role = 'member'
OR (cm.role = 'photographer' AND e.created_by = current_user)
```

The same visibility filter was added to previous face matches and `GET /ai/my-photos`.

## Modified Frontend Files

### `frontend/src/app/register/page.js`

Registration UI changed from a single global role dropdown to:

- Join clubs
- Create club

Join mode:

- lets the user join up to 3 clubs
- each selected club can have role `viewer`, `member`, or `photographer`

Create mode:

- asks for club name and description
- backend creates user as admin of that club

New frontend call:

```js
api.get('/clubs')
```

New registration payload shape:

```js
{
  name,
  email,
  password,
  mode: 'join' | 'create',
  club_name,
  club_description,
  clubs: [{ club_id, role }]
}
```

### `frontend/src/app/events/create/page.js`

Event creation now loads current user's manageable clubs:

```js
api.get('/clubs/mine')
```

Only clubs where user is:

```js
admin
photographer
```

are shown.

Event form now includes:

```js
club_id
```

### `frontend/src/app/events/page.js`

Changed New Event button visibility from global role:

```js
['admin', 'photographer'].includes(user?.role)
```

to club memberships:

```js
user?.clubs?.some(club => ['admin', 'photographer'].includes(club.role))
```

Event cards now show:

```txt
club_name - user_role
```

### `frontend/src/app/events/[id]/page.js`

Upload button now checks event-specific role:

```js
const canUpload = event?.user_role === 'admin' || (event?.user_role === 'photographer' && event?.created_by === user?.id)
```

Event header now shows:

```txt
club_name - user_role
```

Passes event role to `MediaGrid`:

```js
<MediaGrid media={media} onMediaDeleted={() => fetchMedia(1)} eventRole={event?.user_role} />
```

### `frontend/src/components/MediaGrid.jsx`

Accepts:

```js
eventRole
```

Delete button now checks:

```js
user?.id === selected.uploaded_by || eventRole === 'admin' || selected.user_role === 'admin'
```

### `frontend/src/app/dashboard/page.js`

New Event button now uses club memberships instead of global role:

```js
const canCreateEvent = user?.clubs?.some(club => ['admin', 'photographer'].includes(club.role))
```

Role card changed to a club count summary:

```js
const roleSummary = user?.clubs?.length
  ? `${user.clubs.length} club${user.clubs.length === 1 ? '' : 's'}`
  : 'Viewer'
```

## Important Routes After Change

```txt
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
GET  /api/clubs
GET  /api/clubs/mine
GET  /api/events
GET  /api/events/:id
POST /api/events
PUT  /api/events/:id
DELETE /api/events/:id
GET  /api/media/event/:eventId
POST /api/media/upload
DELETE /api/media/:id
GET  /api/media/download/:id
```

## Files Changed

```txt
backend/controllers/aiController.js
backend/controllers/authController.js
backend/controllers/clubController.js
backend/controllers/eventController.js
backend/controllers/mediaController.js
backend/controllers/socialController.js
backend/db/club_roles.sql
backend/routes/clubs.js
backend/routes/events.js
backend/routes/media.js
backend/server.js
backend/utils/clubPermissions.js
frontend/src/app/dashboard/page.js
frontend/src/app/events/[id]/page.js
frontend/src/app/events/create/page.js
frontend/src/app/events/page.js
frontend/src/app/register/page.js
frontend/src/components/MediaGrid.jsx
```

## Verification Done

Backend syntax checks passed:

```txt
node --check backend/controllers/authController.js
node --check backend/controllers/eventController.js
node --check backend/controllers/mediaController.js
node --check backend/controllers/socialController.js
node --check backend/controllers/aiController.js
node --check backend/controllers/clubController.js
node --check backend/utils/clubPermissions.js
node --check backend/server.js
node --check backend/routes/clubs.js
```

Frontend production build passed:

```txt
npm run build
```

Frontend lint still fails because of existing React lint/compiler warnings/errors in multiple files. The production build succeeds.

## Notes For The Other AI

The important architectural decision is that route middleware using `roles('admin', ...)` cannot decide club-specific permissions. It only sees `req.user.role`, which is global. Permissions that depend on an event or media item must be checked after loading that event/media and its `club_id`.

Keep `users.role` unless doing a larger migration. It is currently retained for backward compatibility with the JWT and older UI assumptions, but new logic should prefer `club_members.role`.

