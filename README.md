# Rehabilitation Platform - Admin Dashboard

Modern React admin dashboard for managing the rehabilitation platform.

## 🚀 Features

- ✅ Video Management (Upload, Edit, Delete)
- ✅ User Management
- ✅ Category Management
- ✅ Message Center
- ✅ Analytics Dashboard
- ✅ Modern UI with Tailwind CSS
- ✅ Responsive Design

## 📦 Tech Stack

- React 18
- Vite
- React Router v6
- Tailwind CSS
- React Query
- Axios
- Lucide Icons

## 🛠️ Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Update API URL:**
Edit `src/services/api.js` and set your backend URL:
```javascript
const API_URL = 'http://YOUR_IP:3000/api';
```

3. **Run development server:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
```

## 🔐 Default Login

- Email: `admin@rehab.com`
- Password: `admin123`

(Make sure this user exists in your backend database)

## 📁 Project Structure

```
src/
├── components/
│   └── layout/
│       └── Layout.jsx
├── pages/
│   ├── Dashboard.jsx
│   ├── Videos.jsx
│   ├── Users.jsx
│   ├── Categories.jsx
│   ├── Messages.jsx
│   └── Login.jsx
├── services/
│   └── api.js
├── lib/
│   └── AuthContext.jsx
├── App.jsx
└── main.jsx
```

## 🎨 Features Overview

### Dashboard
- Quick stats overview
- Recent activity
- System health

### Video Management
- Upload videos with metadata
- Edit video details
- Delete videos
- Category filtering
- Difficulty level badges

### User Management
- View all users (patients, experts)
- Assign experts to patients
- Edit user details
- User statistics

### Category Management
- Create/Edit/Delete categories
- Organize videos

### Message Center
- View conversations
- Reply to patients
- Send announcements

## 🔧 Configuration

### Backend Integration
Make sure your backend has these endpoints:
- `POST /api/auth/login` - Admin login
- `GET /api/videos` - Get all videos
- `POST /api/videos` - Upload video
- `DELETE /api/videos/:id` - Delete video
- `GET /api/categories` - Get categories
- `GET /api/admin/users` - Get all users
- `GET /api/progress/stats` - Get statistics

## 📱 Responsive Design
- Mobile-friendly sidebar
- Responsive tables
- Optimized for tablets and desktops

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview  # Preview production build
```

### Deploy to Server
```bash
npm run build
# Upload dist/ folder to your web server
```

## 🛡️ Security Notes

1. **Always use HTTPS in production**
2. **Implement proper CORS on backend**
3. **Add rate limiting**
4. **Validate file uploads**
5. **Use environment variables for API URLs**

## 📝 TODO / Enhancements

- [ ] Video upload with drag & drop
- [ ] Advanced filtering and search
- [ ] Export data to CSV/Excel
- [ ] Email notifications
- [ ] Real-time updates (WebSocket)
- [ ] Dark mode
- [ ] Multi-language support

## 🆘 Troubleshooting

**CORS Issues:**
Add to your backend (Express):
```javascript
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));
```

**API Connection:**
Check network tab in browser DevTools
Make sure backend is running on http://192.168.2.2:3000

**Build Errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support

For issues with:
- **Frontend**: Check browser console
- **Backend**: Check server logs
- **Network**: Use browser DevTools Network tab

---

**Status**: ✅ Ready for Development
**Last Updated**: November 23, 2024
