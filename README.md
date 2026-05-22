# Our Palisades Stories — Backend API

A lightweight Node.js/Express REST API for the Palisades community quilt board. Supports public uploads of images, audio, video, and text patches with tag-based filtering.

The project now includes a built frontend at `public/index.html` that consumes the API and lets visitors browse and submit tiles.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
#    → edit .env and set ADMIN_TOKEN to something secret

# 3. Run (development, with hot reload)
npm run dev

# 4. Run (production)
npm start
```

Then visit `http://localhost:3001/` to open the frontend site.

A moderator dashboard is available at `http://localhost:3001/admin.html`. Use the `ADMIN_TOKEN` value from your `.env` file to review pending submissions, approve or unapprove tiles, and delete inappropriate content.

The server will create `palisades.db` and an `uploads/` folder automatically on first run.

---

## API Reference

### `GET /api/patches`
Returns all approved patches, newest first.

**Query params**

| Param    | Type    | Default | Notes                          |
|----------|---------|---------|--------------------------------|
| `tag`    | string  | —       | Filter by tag name             |
| `type`   | string  | —       | text · image · audio · video · artwork |
| `limit`  | integer | 20      | 1–100                          |
| `offset` | integer | 0       | Pagination cursor              |

**Response**
```json
{
  "patches": [ ...PatchObject ],
  "total":   42,
  "limit":   20,
  "offset":  0,
  "hasMore": true
}
```

---

### `GET /api/patches/:id`
Returns a single patch by ID.

---

### `POST /api/patches`
Creates a new patch. Submit as `multipart/form-data`.

**Fields**

| Field         | Required | Notes                                       |
|---------------|----------|---------------------------------------------|
| `title`       | ✅       | Max 120 chars                               |
| `type`        | ✅       | text · image · audio · video · artwork      |
| `description` | —        | Max 1000 chars                              |
| `author_name` | —        | Defaults to "Anonymous"                     |
| `tags`        | —        | JSON array, e.g. `["Community","Nature"]`   |
| `bg_color`    | —        | cream · sage · lavender · blush             |
| `media`       | ⚠️       | Required for non-text types. Max 100 MB     |

**Supported file types**
- Images: JPEG, PNG, GIF, WebP
- Audio:  MP3, WAV, OGG, AAC
- Video:  MP4, WebM, OGG, QuickTime

---

### `DELETE /api/patches/:id` *(admin)*
Deletes a patch and its uploaded file.
Requires header: `X-Admin-Token: <your token>`

### `PATCH /api/patches/:id/approve` *(admin)*
Approve or unapprove a patch.
Requires header: `X-Admin-Token: <your token>`
Body: `{ "approved": true }`

---

### `GET /api/health`
Returns server status and total patch count.

---

## Patch Object

```json
{
  "id":          1,
  "type":        "image",
  "title":       "The Morning After",
  "description": "The smoke finally cleared...",
  "author_name": "Sarah Jenkins",
  "media_url":   "http://localhost:3001/uploads/images/abc-123.jpg",
  "media_type":  "image/jpeg",
  "file_size":   204800,
  "tags":        ["Loss & Grief", "Hope & Renewal", "Nature"],
  "bg_color":    "sage",
  "approved":    true,
  "created_at":  "2025-10-12T14:30:00.000Z"
}
```

---

## Available Tags
`Loss & Grief` · `Hope & Renewal` · `Community` · `Nature` · `Family` · `Rebuilding` · `Art & Expression` · `Resilience`

---

## Rate Limiting
- **POST** `/api/patches`: 30 requests per IP per 15 minutes

---

## Production Checklist
- [ ] Set `ADMIN_TOKEN` to a strong random value
- [ ] Set `ALLOWED_ORIGINS` to your frontend URL(s) only
- [ ] Set `NODE_ENV=production`
- [ ] Serve uploads via CDN or object storage (S3/Cloudflare R2) instead of local disk
- [ ] Add a reverse proxy (nginx/Caddy) in front of Express
- [ ] Enable HTTPS
- [ ] Add moderation queue: set `approved = 0` by default, review before publishing
