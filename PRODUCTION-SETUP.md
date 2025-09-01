# 🚀 PoEHR Mobile - Production Setup Guide

## 📋 Quick Setup Checklist

### ✅ Step 1: Update Production URL

1. Open `config/api.ts`
2. Replace `"https://your-production-domain.com"` with your actual backend URL
3. Example: `"https://api.yourcompany.com"` or `"https://poehr-backend.herokuapp.com"`

### ✅ Step 2: Update App Configuration

1. Open `app.json`
2. Update `"your-production-domain.com"` in iOS security settings
3. Set your desired app name and identifiers

### ✅ Step 3: Test API Connection

1. Run the test script: `node scripts/test-production-api.js`
2. Or use the in-app API debugger (🔧 API Debug button in development)
3. Verify all endpoints return expected responses

### ✅ Step 4: Environment-Specific Testing

#### Development Testing:

```bash
# Test with local backend
npx expo start

# Test with localhost (emulator)
# Update API_BASE_URL to LOCALHOST_API_URL in config/api.ts temporarily
```

#### Production Testing:

```bash
# Update config/api.ts with production URL
# Test authentication and all features
npx expo start --no-dev --minify
```

### ✅ Step 5: Build for Production

#### For EAS Build (Recommended):

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for both platforms
eas build --platform all

# Or build individually
eas build --platform ios
eas build --platform android
```

#### For Local Development Build:

```bash
# iOS (requires Xcode and macOS)
npx expo run:ios --configuration Release

# Android
npx expo run:android --variant release
```

## 🔧 Configuration Files Updated

### 1. `config/api.ts`

- ✅ Environment-based URL switching
- ✅ Development and production URLs
- ✅ Debug utilities
- ✅ Connection testing

### 2. `app.json`

- ✅ Production app metadata
- ✅ Security configurations
- ✅ Platform-specific settings
- ✅ Bundle identifiers

### 3. `eas.json`

- ✅ Build configurations
- ✅ Development, preview, and production builds
- ✅ Resource allocation settings

### 4. `components/APIDebugger.tsx`

- ✅ In-app API testing
- ✅ Configuration viewer
- ✅ Token management
- ✅ Endpoint testing

## 🌐 Backend Requirements

Your production backend should have:

### ✅ HTTPS Certificate

- SSL/TLS encryption enabled
- Valid certificate from trusted CA

### ✅ CORS Configuration

```python
# Django settings.py
CORS_ALLOWED_ORIGINS = [
    "exp://your-expo-domain",  # Expo Go
    "poehrmobile://",          # Custom scheme
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False  # Set to False for production
```

### ✅ Mobile-Friendly Headers

```python
# Additional CORS headers for mobile
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

## 📱 App Store Preparation

### iOS App Store

1. Set up Apple Developer account
2. Create App Store Connect app
3. Configure signing certificates
4. Build with EAS: `eas build --platform ios`
5. Submit: `eas submit --platform ios`

### Google Play Store

1. Set up Google Play Console account
2. Create new app
3. Generate signing key
4. Build with EAS: `eas build --platform android`
5. Submit: `eas submit --platform android`

## 🧪 Testing Workflow

### Pre-Production Testing:

1. ✅ Test all authentication flows
2. ✅ Test appointment creation/editing
3. ✅ Test patient management
4. ✅ Test availability/schedule management
5. ✅ Test offline scenarios
6. ✅ Test error handling

### Production Verification:

1. ✅ Verify SSL certificate
2. ✅ Test from different networks
3. ✅ Test push notifications (if implemented)
4. ✅ Monitor error reporting
5. ✅ Performance testing

## 🔍 Troubleshooting

### Common Issues:

#### Network Security (iOS)

- Ensure HTTPS is used for production
- Update NSAppTransportSecurity in app.json

#### CORS Errors

- Check backend CORS configuration
- Verify allowed origins include your app

#### Authentication Issues

- Test token refresh mechanism
- Verify JWT secret consistency

#### API Timeouts

- Check network connectivity
- Increase timeout values if needed

## 📞 Next Steps After Setup

1. **Replace Production URL**: Update `config/api.ts` with your actual backend URL
2. **Test Connection**: Use the API debugger or test script
3. **Build for Testing**: Create preview builds for testing
4. **Deploy to Stores**: Submit to App Store and Play Store when ready

## 🆘 Need Help?

If you encounter issues:

1. Check the API debugger for connection status
2. Run the test script to verify backend connectivity
3. Review backend logs for errors
4. Test with a simple REST client first

---

**Ready to go live? Update your production URL and start testing! 🚀**
