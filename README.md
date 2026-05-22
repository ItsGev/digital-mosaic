# The Digital Mosaic Collective
**A Santa Monica College community storytelling platform**

A public-facing digital bulletin board where community members can share stories, images, audio, video, and artwork. Built as a static site — no server needed. Runs entirely on GitHub Pages.

---

## File structure

```
digital-mosaic/
├── index.html          ← Page markup (add new seed tiles here)
├── css/
│   └── styles.css      ← All visual styles
├── js/
│   ├── config.js       ← ★ THE ONLY FILE YOU NEED TO EDIT
│   ├── app.js          ← Submit modal, filtering, form logic
│   └── admin.js        ← Admin panel, approve/reject/delete
├── assets/
│   └── smc-logo.png    ← SMC logo
└── README.md           ← This file
```

---

## Deploying to GitHub Pages

1. Upload all these files to your GitHub repo (maintain the folder structure)
2. Go to **Settings → Pages** → Source: `Deploy from branch` → Branch: `main` → Folder: `/ (root)`
3. Your site will be live at `https://yourusername.github.io/your-repo-name/`

---

## Setup: EmailJS (receive email when someone submits)

Submissions from the public work immediately without EmailJS — they save to the browser's local storage and show in your admin panel. EmailJS adds email notifications so you know when something comes in.

**Takes ~10 minutes, 200 emails/month free.**

### Step 1 — Create an account
Go to [https://emailjs.com](https://emailjs.com) and create a free account.

### Step 2 — Connect your email
- Go to **Email Services → Add New Service**
- Choose Gmail (or another provider)
- Follow the connection steps
- **Copy the Service ID** (e.g. `service_abc123`)

### Step 3 — Create an email template
- Go to **Email Templates → Create New Template**
- Paste this as the template body:

```
New tile submitted to The Digital Mosaic Collective

Title:       {{tile_title}}
Type:        {{tile_type}}
Story:       {{tile_story}}
Author:      {{tile_author}}
Themes:      {{tile_tags}}
Submitted:   {{submitted_at}}

Review it here → {{admin_url}}
```

- Set **To Email** to `{{to_email}}`
- **Copy the Template ID** (e.g. `template_xyz789`)

### Step 4 — Get your Public Key
- Go to **Account → API Keys**
- **Copy your Public Key**

### Step 5 — Fill in config.js
Open `js/config.js` and fill in all 5 values:

```js
const CONFIG = {
  emailjs_public_key:  'your_public_key_here',
  emailjs_service_id:  'service_abc123',
  emailjs_template_id: 'template_xyz789',
  admin_email:         'you@youremail.com',
  admin_password:      'choose-a-strong-password',
};
```

Push to GitHub — done.

---

## Using the Admin Panel

1. Click **Admin** in the top-right of the nav bar
2. Enter your admin password (set in `config.js`)
3. **Pending Review** — submissions waiting for your approval
   - **Approve & Post** — adds the tile live to the board instantly
   - **Reject** — permanently removes the submission
4. **Live Tiles** — every tile currently on the board
   - **Delete** — removes a tile from the board

You can also delete tiles directly on the board — while in admin mode, each tile shows a red **✕** button.

---

## How to add seed tiles (permanent tiles that always show)

Edit `index.html` and add a new `<article class="tile">` block inside `<div class="grid-cols" id="grid">`. Copy any existing tile and change the content.

**Key attributes to set on the article:**
- `data-id="unique-id"` — any unique string
- `data-tags="Community,Nature"` — comma-separated, must match the filter pills

**Tile accent colors:** `class="tile-accent navy"` / `sky` / `gold` / `gray`

---

## Customization

| What to change | Where |
|----------------|-------|
| Brand colors   | `css/styles.css` → `:root` block at the top |
| Fonts          | `index.html` → Google Fonts `<link>` tag |
| Hero text      | `index.html` → `<section class="hero">` |
| Filter tags    | `index.html` → `.filter-wrap` + `css/styles.css` `.ttag` colors |
| Admin password | `js/config.js` → `admin_password` |
| Logo           | Replace `assets/smc-logo.png` |

---

## Notes

- Submissions and approvals are stored in **localStorage** — they persist in the browser but reset if the user clears their browser data or if you open the site in a different browser.
- For a production version with a real database that persists across all browsers and devices, connect the Node.js backend (`palisades-backend/`) to a cloud host like Railway or Render.
- The site is fully static and works offline once loaded.
