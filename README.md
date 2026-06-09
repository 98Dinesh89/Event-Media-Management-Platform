# MediaVault — Event & Media Management Platform

A scalable web platform for clubs and organizations to upload, organize, access, and interact with event media seamlessly.

**Live Demo:** https://event-media-management-platform-tawny.vercel.app  
**Backend API:** https://event-media-management-platform-production-4d0f.up.railway.app  
**GitHub:** https://github.com/98Dinesh89/event-media-management-platform

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, Tailwind CSS, Lucide React |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (Supabase) |
| Cloud Storage | Cloudinary (auto compression + AI tagging) |
| Real-time | Socket.io |
| Auth | JWT + bcrypt |
| Face Recognition | Luxand API |
| AI Image Tagging | Google Vision via Cloudinary |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## Features

### Core Features

- **Club System** — Create or join clubs. Each user has a role per club (Admin, Photographer, Member, Viewer). Switch between clubs from the navbar.
- **Event Management** — Create events per club with title, description, category, date, public/private visibility. Sort by name, date, or category.
- **Media Upload** — Bulk upload, drag and drop support, media preview before upload, auto compression via Cloudinary (40-70% size reduction), AI auto-tagging.
- **Access Control** — Private events visible only to club members and admins. Role-based upload and delete permissions.
- **Social Features** — Like, comment, favourite, download, share via QR code, tag friends in photos.
- **Real-time Notifications** — Socket.io powered live notifications for likes, comments, and tags.
- **AI Smart Tagging** — Google Vision automatically tags uploaded images with labels like people, landscape, sports, crowd etc.
- **Facial Recognition** — Upload a selfie, find all photos you appear in across all events (Luxand API).
- **Advanced Search** — Search by event name, tag, upload date, or uploader name.
- **Watermarked Downloads** — Auto watermark on download includes club name, event name, and user role.
- **Analytics Dashboard** — Total events, media, likes, comments, top events by media count, most liked photos, recent uploads.
- **QR Album Sharing** — Generate a QR code for any event album. Scan to open instantly.
- **Infinite Scroll** — Smooth infinite scrolling gallery with automatic load on scroll.

### Bonus Features

- Infinite scrolling gallery
- QR-based album sharing
- Analytics dashboard
- Club-based multi-role permission system
- Real-time notifications

---

## Role Permissions

| Role | Create Event | Upload Media | View Private Events | Like / Comment / Favourite |
|------|:-----------:|:------------:|:-------------------:|:--------------------------:|
| Admin | ✅ | ✅ Any event | ✅ | ✅ |
| Photographer | ✅ | ✅ Own events only | ❌ | ✅ |
| Member | ❌ | ❌ | ✅ | ✅ |
| Viewer | ❌ | ❌ | ❌ | ✅ |

---

## Database Schema

### Tables

- **users** — id, name, email, password, role, avatar_url, selfie_url, selfie_public_id, created_at
- **clubs** — id, name, description, created_by, created_at
- **club_members** — club_id, user_id, role, joined_at
- **events** — id, title, description, category, event_date, is_public, created_by, club_id, cover_image, created_at
- **media** — id, event_id, uploaded_by, url, thumbnail_url, public_id, media_type, tags, caption, is_public, created_at
- **likes** — id, user_id, media_id, created_at
- **comments** — id, user_id, media_id, text, created_at
- **favourites** — id, user_id, media_id, created_at
- **notifications** — id, user_id, from_user_id, type, media_id, message, is_read, created_at
- **face_matches** — id, user_id, media_id, confidence, created_at
- **media_tags** — id, media_id, tagged_by, tagged_user_id, created_at

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user profile |

### Clubs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/clubs | List all clubs |
| GET | /api/clubs/mine | Get my clubs with roles |
| POST | /api/clubs/join | Join an existing club |
| POST | /api/clubs/create | Create a new club |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/events | List events (filter by club, category, sort) |
| POST | /api/events | Create event |
| GET | /api/events/:id | Get single event |
| PUT | /api/events/:id | Update event |
| DELETE | /api/events/:id | Delete event |

### Media
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/media/event/:eventId | Get media for an event |
| POST | /api/media/upload | Upload media files (bulk supported) |
| GET | /api/media/download/:id | Download with watermark |
| GET | /api/media/my-count | Count media uploaded by current user |
| DELETE | /api/media/:id | Delete media |

### Social
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/social/like | Toggle like on media |
| POST | /api/social/comment | Add comment |
| GET | /api/social/comments/:mediaId | Get comments for media |
| POST | /api/social/favourite | Toggle favourite |
| GET | /api/social/favourites | Get my favourites |
| POST | /api/social/tag | Tag a user in a photo |
| GET | /api/social/search-users | Search users to tag |
| GET | /api/social/notifications | Get notifications |
| PUT | /api/social/notifications/read | Mark notifications as read |

### AI / ML
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/ai/search | Advanced search by event, tag, date, uploader |
| POST | /api/ai/selfie | Upload reference selfie |
| POST | /api/ai/find-me | Find photos I appear in |
| GET | /api/ai/my-photos | Get my face match results |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics | Get analytics data (filter by club) |

---

## Architecture

```
┌─────────────────────────────────┐
│     Client (Next.js / Vercel)   │
│  Pages: Dashboard, Events,      │
│  Gallery, Search, Profile,      │
│  Analytics                      │
└────────────────┬────────────────┘
                 │ HTTP + WebSocket
┌────────────────▼────────────────┐
│   Backend API (Express/Railway) │
│   Controllers: auth, events,    │
│   media, social, ai, analytics  │
└──┬─────────────┬────────────────┘
   │             │
┌──▼──┐    ┌────▼────────┐
│     │    │  Cloudinary  │
│ DB  │    │  (Storage +  │
│ PG  │    │  AI Tagging) │
│     │    └─────────────┘
└──┬──┘
   │
┌──▼──────────┐
│ Luxand API  │
│ (Face Recog)│
└─────────────┘
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- Supabase account (free)
- Cloudinary account (free)
- Luxand account (free tier)

### 1. Clone the repository

```bash
git clone https://github.com/98Dinesh89/event-media-management-platform.git
cd event-media-management-platform
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
DATABASE_URL=your_supabase_connection_string
JWT_SECRET=any_long_random_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
LUXAND_API_KEY=your_luxand_key
CLIENT_URL=http://localhost:3000
```

```bash
node server.js
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

```bash
npm run dev
```

### 4. Database setup

Run the following SQL files in Supabase SQL Editor:
1. Main schema (create tables: users, events, media, likes, comments, favourites, notifications, face_matches, media_tags)
2. `backend/db/club_roles.sql` (create clubs, club_members, add club_id to events)

---

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | https://event-media-management-platform-tawny.vercel.app |
| Backend | Railway | https://event-media-management-platform-production-4d0f.up.railway.app |
| Database | Supabase | PostgreSQL hosted |
| Media | Cloudinary | CDN hosted |

Both frontend and backend auto-deploy on every push to the `main` branch.

---

## Project Structure

```
event-media-platform/
├── backend/
│   ├── config/          # DB and Cloudinary config
│   ├── controllers/     # Route handlers
│   ├── db/              # SQL migration files
│   ├── middlewares/     # Auth, roles, upload
│   ├── routes/          # Express routes
│   ├── sockets/         # Socket.io handlers
│   ├── utils/           # Club permissions helper
│   └── server.js        # Entry point
├── frontend/
│   └── src/
│       ├── app/         # Next.js pages
│       ├── components/  # Shared components
│       ├── context/     # Auth, Socket, Club context
│       └── lib/         # API client
└── README.md
```

---

## Built By

Dinesh Sunda — CIG Summer Project 2026