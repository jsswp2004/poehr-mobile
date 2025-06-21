# PoEHR Mobile - Phase 1 Authentication Setup

## 🎉 Phase 1 Complete - Authentication System

Your React Native app now has a complete authentication system with:

- ✅ Login & Registration screens
- ✅ JWT token storage with AsyncStorage  
- ✅ Role-based authentication (patient, doctor, admin)
- ✅ Protected routes with Expo Router
- ✅ Token expiration handling
- ✅ Beautiful, modern UI

## 🚀 How to Test

### 1. Configure Your Backend URL

Edit `config/api.ts` and replace the IP address with your Django backend:

```typescript
export const API_BASE_URL = 'http://YOUR-COMPUTER-IP:8000';
```

**To find your IP address:**
- Windows: Run `ipconfig` in Command Prompt
- Mac/Linux: Run `ifconfig` in Terminal
- Look for your local network IP (usually 192.168.x.x)

### 2. Start the Development Server

```bash
cd poehr-mobile
npx expo start
```

### 3. Test on Your iPhone

1. Install **Expo Go** from the App Store
2. Scan the QR code with your iPhone camera
3. The app will open in Expo Go

### 4. Test the Authentication Flow

1. **Register a new account:**
   - Choose your role (patient, doctor, admin)
   - Fill in all required fields
   - Tap "Register"

2. **Login:**
   - Use your username and password
   - You'll be redirected to the dashboard

3. **Dashboard Features:**
   - View your user information
   - See role-specific menu items
   - Logout functionality

## 📁 File Structure Created

```
app/
├── _layout.tsx          # Root navigation with auth logic
├── login.tsx           # Login screen
├── register.tsx        # Registration screen
└── (tabs)/
    └── index.tsx       # Dashboard (home screen)
config/
└── api.ts             # API configuration
```

## 🔧 Configuration Notes

### Backend Requirements

Make sure your Django backend has:
- CORS configured to allow your mobile app
- JWT authentication endpoints working
- User registration endpoint returning proper responses

### Mobile App Features

- **Automatic token refresh** (basic implementation)
- **Network error handling**
- **Form validation**
- **Loading states**
- **Role-based UI elements**

## 🎯 Phase 1 Checklist

- [x] Expo project scaffolded
- [x] Navigation configured (Expo Router)
- [x] Login & registration screens implemented
- [x] Token storage via AsyncStorage
- [x] Role-based navigation working
- [x] Protected routes implemented
- [x] JWT token expiration handling
- [x] Beautiful, modern UI design

## 🚀 Ready for Phase 2: Appointments Module

Your authentication system is complete! You can now move on to Phase 2:

- Implement appointment list fetching
- Add calendar view with react-native-calendars
- Create appointment CRUD operations
- Handle blocked dates

## 🐛 Troubleshooting

### Common Issues:

1. **"Network Error" on login:**
   - Check your backend URL in `config/api.ts`
   - Ensure your Django server is running
   - Verify CORS settings

2. **App crashes on login:**
   - Check browser console for errors
   - Verify JWT token format from backend

3. **Can't navigate between screens:**
   - Clear Expo cache: `npx expo start -c`
   - Restart the development server

## 📱 Next Steps

Once you've tested the authentication system:

1. Test with different user roles
2. Verify token persistence (close/reopen app)
3. Test logout functionality
4. Ready to implement Phase 2 features!

---

**Need help?** Check the console for any error messages or network issues.
