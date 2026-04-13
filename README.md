# Gifting CRM — Corporate Gifting Management System

A production-ready CRM for corporate gifting businesses. Built with Node.js 12,
Express, PostgreSQL, and React.

## CRM Flow

```
Cold Call → Call Log → Lead → Quotation → Won / Lost
WhatsApp Message → Auto-create Lead → Continue CRM flow
```

---

## Tech Stack

| Layer     | Technology                                |
|-----------|-------------------------------------------|
| Backend   | Node.js 12, Express 4, Sequelize 6        |
| Database  | PostgreSQL 12+                            |
| Frontend  | React 17, react-router-dom 5              |
| Auth      | JWT (jsonwebtoken 8)                      |
| Validation| Joi 17                                    |
| WhatsApp  | Meta Cloud API (webhook)                  |
| Hosting   | Plesk Node.js App                         |

---

## Project Structure

```
/
├── backend/
│   ├── server.js               ← Entry point
│   ├── package.json
│   ├── .env                    ← Create from .env.example
│   └── src/
│       ├── config/             ← DB + app config
│       ├── models/             ← Sequelize models
│       ├── controllers/        ← Route handlers
│       ├── routes/             ← Express routers
│       ├── middleware/         ← Auth, error handler
│       ├── services/           ← WhatsApp API service
│       ├── utils/              ← Activity logger
│       └── seed.js             ← Create admin + sample products
└── frontend/
    ├── package.json
    └── src/
        ├── pages/              ← Dashboard, Calls, Leads, Quotations, Products
        ├── components/         ← Layout, Modal, Badge
        ├── context/            ← Auth context
        └── services/           ← Axios API client
```

---

## Database Models

| Table              | Purpose                            |
|--------------------|------------------------------------|
| users              | CRM users (admin / sales)          |
| calls              | Cold call logs                     |
| leads              | Sales leads                        |
| products           | Product catalog                    |
| quotations         | Client quotations                  |
| quotation_items    | Line items in quotations           |
| whatsapp_messages  | Incoming WhatsApp messages         |
| activity_logs      | Audit trail                        |

---

## API Endpoints

```
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/register         (admin only)
PUT    /api/auth/change-password

GET    /api/calls
POST   /api/calls
PUT    /api/calls/:id
DELETE /api/calls/:id
POST   /api/calls/:id/convert-to-lead

GET    /api/leads
POST   /api/leads
PUT    /api/leads/:id
DELETE /api/leads/:id
POST   /api/leads/:id/create-quotation

GET    /api/quotations
POST   /api/quotations
PUT    /api/quotations/:id
PUT    /api/quotations/:id/status  { status: "won"|"lost" }
DELETE /api/quotations/:id

GET    /api/products
POST   /api/products               (admin only)
PUT    /api/products/:id           (admin only)
DELETE /api/products/:id           (admin only)

GET    /api/dashboard/stats
GET    /api/dashboard/users

GET    /webhook/whatsapp           (Meta verification)
POST   /webhook/whatsapp           (Incoming messages)
```

---

## Local Development Setup

### Prerequisites
- Node.js 12+
- PostgreSQL 12+

### 1. Clone and install

```bash
git clone https://github.com/irfandossani2025/hello.git
cd hello

# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cd backend
cp ../.env.example .env
# Edit .env with your DB credentials and secrets
```

### 3. Create database

```sql
-- In psql or pgAdmin:
CREATE DATABASE gifting_crm;
```

### 4. Run database seed (creates tables + admin user)

```bash
cd backend
npm run seed
# Creates admin@giftingcrm.com / Admin@123
```

### 5. Build frontend

```bash
cd frontend
npm run build
```

### 6. Start backend (serves frontend too)

```bash
cd backend
npm start
# Visit http://localhost:3001
```

---

## PLESK DEPLOYMENT GUIDE

### Prerequisites on Server
- Node.js 12 selected in Plesk
- PostgreSQL database created in Plesk (or remote DB)
- Domain `maiscrm.techittechnologies.com` pointed to your server

---

### STEP 1 — Upload Files to Server

**Option A: Git (recommended)**
```bash
# SSH into your server
ssh user@your-server-ip

# Navigate to your domain's web root
cd /var/www/vhosts/techittechnologies.com/maiscrm.techittechnologies.com/httpdocs

# Clone the repo
git clone https://github.com/irfandossani2025/hello.git .
```

**Option B: FTP/SFTP**
- Connect with FileZilla or similar
- Upload the entire project to:
  `/var/www/vhosts/techittechnologies.com/maiscrm.techittechnologies.com/httpdocs/`

---

### STEP 2 — Create PostgreSQL Database in Plesk

1. Log in to **Plesk Panel**
2. Go to **Databases** → **Add Database**
3. Set:
   - Database name: `gifting_crm`
   - Database user: `crm_user`
   - Password: (choose a strong password)
4. Note these credentials for your `.env` file

---

### STEP 3 — Configure Environment Variables

**Via SSH:**
```bash
cd /path/to/project/backend
cp ../.env.example .env
nano .env
```

Fill in:
```env
NODE_ENV=production
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=gifting_crm
DB_USER=crm_user
DB_PASSWORD=your_db_password

JWT_SECRET=generate_a_long_random_string_here_min_32_chars
JWT_EXPIRES_IN=7d

FRONTEND_URL=https://maiscrm.techittechnologies.com

WHATSAPP_VERIFY_TOKEN=gifting_crm_webhook_token
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_API_VERSION=v17.0
```

**Via Plesk Panel (alternative):**
1. Go to **Node.js** settings for the app
2. Under **Environment Variables**, add each key-value pair

---

### STEP 4 — Install Dependencies

**Via SSH:**
```bash
# Backend dependencies
cd /path/to/project/backend
npm install --production

# Frontend dependencies (for building)
cd /path/to/project/frontend
npm install
```

**Via Plesk:**
1. Go to **Node.js** settings
2. Click **NPM Install** — this runs `npm install` in the app root
3. (You'll need to SSH for frontend install)

---

### STEP 5 — Build the React Frontend

```bash
cd /path/to/project/frontend
npm run build
```

This creates `frontend/build/` with static files.
Express serves these automatically.

> **Tip for slow servers:** Build the frontend locally on your PC first,
> then upload only the `frontend/build/` folder via FTP. This avoids
> needing Node 14+ on the build machine.

```bash
# On your local PC:
cd frontend
npm run build
# Then upload frontend/build/ folder to server
```

---

### STEP 6 — Run Database Seed

```bash
cd /path/to/project/backend
npm run seed
```

This creates:
- Admin user: `admin@giftingcrm.com` / `Admin@123`
- 6 sample products

> **IMPORTANT:** Change the admin password immediately after first login!

---

### STEP 7 — Configure Plesk Node.js App

1. In **Plesk**, go to your domain: `maiscrm.techittechnologies.com`
2. Click **Node.js** (in the website tools)
3. Configure:

| Setting              | Value                      |
|----------------------|----------------------------|
| Node.js version      | 12.x                       |
| Application mode     | Production                 |
| Application root     | `/backend`                 |
| Application startup file | `server.js`            |
| Document root        | `/backend` (same)          |

4. Click **Enable Node.js**
5. Click **NPM Install** to install backend packages
6. Click **Restart App**

---

### STEP 8 — SSL Certificate

1. In Plesk, go to your domain
2. Click **SSL/TLS Certificates**
3. Click **Install a free basic certificate provided by Let's Encrypt**
4. Enable **Redirect from HTTP to HTTPS**

---

### STEP 9 — Verify Deployment

Open your browser: `https://maiscrm.techittechnologies.com`

You should see the CRM login page.

Login with:
- Email: `admin@giftingcrm.com`
- Password: `Admin@123`

---

### STEP 10 — Configure WhatsApp Webhook

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Open your WhatsApp Business App
3. Under **Webhooks**, add:
   - **Callback URL:** `https://maiscrm.techittechnologies.com/webhook/whatsapp`
   - **Verify Token:** (must match `WHATSAPP_VERIFY_TOKEN` in your `.env`)
4. Subscribe to **messages** events
5. Get your **Access Token** and **Phone Number ID** from the WhatsApp settings
6. Add them to your `.env` file
7. Restart the app in Plesk

**Test your webhook:**
```bash
curl "https://maiscrm.techittechnologies.com/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=gifting_crm_webhook_token&hub.challenge=test123"
# Should return: test123
```

**WhatsApp Lead Format:**
Send this message to your WhatsApp Business number to auto-create a lead:
```
NEW LEAD
Name: Ali Khan
Company: ABC Corporation
Phone: 03001234567
Note: Interested in branded mugs, 500 pieces
```

---

## Managing the App in Plesk

### Restart the App
1. Plesk Panel → Domain → Node.js → **Restart App**
   OR via SSH: `touch /path/to/backend/server.js` (triggers restart)

### View Logs
1. Plesk Panel → Domain → Node.js → **View Logs**
   OR via SSH: check the Plesk nginx/node logs

### Update the App
```bash
# SSH into server
cd /path/to/project

# Pull latest code
git pull origin claude/node12-plesk-setup-nYkYV

# Rebuild frontend
cd frontend
npm install
npm run build

# Restart backend
cd ../backend
npm install --production
# Then restart in Plesk panel
```

---

## Creating Additional Users

Only admins can create new users. After logging in:

1. Use the API directly (or add a Users admin page later):
```bash
curl -X POST https://maiscrm.techittechnologies.com/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"Sales Rep","email":"sales@company.com","password":"Pass@123","role":"sales"}'
```

---

## Troubleshooting

### App won't start
- Check `.env` file exists in `backend/`
- Verify DB credentials are correct
- Run `npm run seed` to ensure tables exist
- Check Plesk logs for errors

### "Cannot find module" error
- Run `npm install` in the `backend/` directory via Plesk or SSH

### Frontend shows blank page
- Ensure `frontend/build/` exists (run `npm run build` in frontend/)
- Check browser console for errors
- Verify the path in `server.js` points to `../frontend/build`

### Database connection error
- Verify PostgreSQL is running
- Check `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` in `.env`
- Ensure the DB user has full permissions on the database

### WhatsApp webhook fails verification
- Verify `WHATSAPP_VERIFY_TOKEN` in `.env` matches the token in Meta Developer Console
- Ensure the app is running and accessible at the public URL

---

## Security Notes

1. Change default admin password immediately
2. Use a strong `JWT_SECRET` (random 64+ character string)
3. Enable HTTPS/SSL via Plesk Let's Encrypt
4. Keep `NODE_ENV=production` in `.env`
5. Restrict database user permissions to only the `gifting_crm` database
6. Keep `.env` file out of version control (it's in `.gitignore`)

---

*Built for Node.js 12 + Plesk compatibility*
