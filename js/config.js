/* ============================================================
   config.js — THE ONLY FILE YOU NEED TO EDIT
   Fill in all 5 values below, save, and push to GitHub.
   ============================================================

   HOW TO GET EMAILJS VALUES (free, ~10 min):
   1. Create account at https://emailjs.com
   2. Email Services → Add New Service → connect Gmail
      → copy the Service ID
   3. Email Templates → Create New Template
      → paste the template from README.md
      → copy the Template ID
   4. Account → API Keys → copy Public Key
   ============================================================ */

const CONFIG = {
  // ── EmailJS ──────────────────────────────────────────────
  emailjs_public_key:  'YOUR_PUBLIC_KEY',    // emailjs.com → Account → API Keys
  emailjs_service_id:  'YOUR_SERVICE_ID',    // emailjs.com → Email Services
  emailjs_template_id: 'YOUR_TEMPLATE_ID',   // emailjs.com → Email Templates

  // ── Where review emails go ────────────────────────────────
  admin_email: 'you@youremail.com',

  // ── Admin panel password ──────────────────────────────────
  // Change this! Use something only you know.
  admin_password: 'changeme123',
};
