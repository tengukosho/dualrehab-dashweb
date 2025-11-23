# 👤 Creating Admin Users

## Quick Method - Use Registration Endpoint

Run this command (replace with your backend IP if different):

```bash
curl -X POST http://192.168.2.2:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rehab.com",
    "password": "admin123",
    "name": "Admin User",
    "role": "admin"
  }'
```

**For Expert accounts:**
```bash
curl -X POST http://192.168.2.2:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "expert@rehab.com",
    "password": "expert123",
    "name": "Dr. Expert",
    "role": "expert",
    "hospital": "General Hospital"
  }'
```

---

## Access Control 🔐

**Web Dashboard Access:**
- ✅ Admin users - Full access (manage videos, users, categories, messages)
- ✅ Expert users - Can access dashboard (view patients, messages)
- ❌ Patient users - **BLOCKED** (must use mobile app)

**Mobile App Access:**
- ✅ Patient users - Full access
- ✅ Expert users - Can also use mobile app
- ⚠️ Admin users - Can use mobile app but designed for patients

---

## User Roles

### Admin
- **Purpose:** System administrators
- **Access:** Full web dashboard access
- **Permissions:** 
  - Upload/edit/delete videos
  - Manage all users
  - Create/edit categories
  - View all messages
  - System settings

### Expert (Rehabilitation Specialist)
- **Purpose:** Healthcare professionals managing patients
- **Access:** Web dashboard + mobile app
- **Permissions:**
  - View assigned patients
  - Message patients
  - View patient progress
  - Cannot modify global video library

### Patient
- **Purpose:** End users doing rehabilitation
- **Access:** Mobile app ONLY
- **Permissions:**
  - View videos
  - Schedule exercises
  - Track progress
  - Message assigned expert

---

## Creating Users via Database (Alternative)

If registration endpoint doesn't work, create directly in database:

```sql
-- SQLite example (if using Prisma + SQLite)
-- You need to hash the password first using bcrypt

INSERT INTO User (email, password, name, role, createdAt, updatedAt) 
VALUES (
  'admin@rehab.com',
  -- Use bcrypt to hash 'admin123' - this is example hash
  '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFG',
  'Admin User',
  'admin',
  datetime('now'),
  datetime('now')
);
```

**Better:** Use your backend's seed script if available.

---

## Test Login

After creating admin user:

1. Go to **http://localhost:5173**
2. Enter credentials:
   - Email: `admin@rehab.com`
   - Password: `admin123`
3. You should see the dashboard!

**If patient tries to login:**
- Error: "Access denied. Admin or Expert account required."
- They should use the Android mobile app instead

---

## Current Users in Your System

Based on your Android app testing, you likely have:

**Patients:**
- `patient1@email.com` / `patient123` ❌ Cannot access web
- `patient2@email.com` / `patient123` ❌ Cannot access web

**Experts:**
- Create one using the curl command above ✅
- Or check if any exist in your database

**Admins:**
- Create using the curl command above ✅

---

## Security Best Practices

1. **Change default passwords** in production
2. **Use strong passwords** for admin accounts
3. **Limit admin accounts** - only create for trusted staff
4. **Use HTTPS** in production
5. **Enable 2FA** (future enhancement)

---

## Troubleshooting

**"Access denied" error when patient tries to login:**
- ✅ This is correct! Patients use mobile app
- Tell them to download the Android app

**Registration endpoint not working:**
- Check backend is running
- Verify CORS is enabled
- Check backend logs for errors

**Forgot admin password:**
- Reset via database
- Or create new admin account
- Add password reset feature (future)

---

## Quick Commands

**Create admin:**
```bash
curl -X POST http://YOUR_BACKEND_IP:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rehab.com","password":"admin123","name":"Admin","role":"admin"}'
```

**Create expert:**
```bash
curl -X POST http://YOUR_BACKEND_IP:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"expert@rehab.com","password":"expert123","name":"Dr. Expert","role":"expert"}'
```

**Test login:**
```bash
curl -X POST http://YOUR_BACKEND_IP:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rehab.com","password":"admin123"}'
```

---

**Status:** ✅ Role-based access control implemented  
**Next:** Create admin account and start managing videos!
