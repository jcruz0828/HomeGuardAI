# Environment Variables Setup Guide

## React Native (Expo) Environment Configuration

### Required Environment Variables

Create a `.env` file in the `mobile/` directory with the following variables:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Spring Boot Backend Configuration
# For iOS Simulator: Use localhost (simulator can access host machine's localhost)
# For Physical Device: Use your Mac's local IP address
EXPO_PUBLIC_SPRING_API_BASE_URL=http://localhost:8080/api/v1
# OR for physical device:
# EXPO_PUBLIC_SPRING_API_BASE_URL=http://192.168.254.46:8080/api/v1

# Environment
EXPO_PUBLIC_ENVIRONMENT=development

# Optional: Stream Service
EXPO_PUBLIC_STREAM_BASE_URL=http://localhost:8000
EXPO_PUBLIC_STREAM_SECRET_KEY=your-secret-key
```

### Finding Your Mac's IP Address

Run this command in Terminal to find your Mac's IP:

```bash
# Get your Mac's local IP address
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```

Or use:
```bash
ipconfig getifaddr en0
```

### Platform-Specific Configuration

#### iOS Simulator
- **Can use `localhost`**: The iOS Simulator shares the host machine's network
- **Recommended**: `http://localhost:8080/api/v1`
- **Alternative**: Use your Mac's IP if localhost doesn't work

#### Physical iOS Device
- **Must use IP address**: Physical devices cannot access `localhost`
- **Required**: `http://<YOUR_MAC_IP>:8080/api/v1`
- **Example**: `http://192.168.254.46:8080/api/v1`

#### Android Emulator
- **Use `10.0.2.2`**: Android emulator special IP for host machine
- **Recommended**: `http://10.0.2.2:8080/api/v1`

#### Physical Android Device
- **Must use IP address**: Same as physical iOS
- **Required**: `http://<YOUR_MAC_IP>:8080/api/v1`

### Dynamic IP Detection (Optional)

If your IP changes frequently, you can create a helper script:

```typescript
// mobile/src/utils/getApiBaseUrl.ts
import { Platform } from 'react-native';
import { getApiConfig } from '../config/api';

export const getApiBaseUrl = () => {
  const config = getApiConfig();
  const baseUrl = config.SPRING_API_BASE_URL;
  
  // iOS Simulator can use localhost
  if (Platform.OS === 'ios' && __DEV__) {
    // Check if we're in simulator (you can add detection logic)
    return baseUrl.replace(/192\.168\.\d+\.\d+/, 'localhost');
  }
  
  return baseUrl;
};
```

### Testing Your Configuration

1. **Test Health Endpoint**:
   ```bash
   curl http://localhost:8080/api/v1/health
   # Should return: {"status":"UP","service":"homeguard-api"}
   ```

2. **Test from iOS Simulator Safari**:
   - Open Safari in iOS Simulator
   - Navigate to: `http://localhost:8080/api/v1/health`
   - Should load successfully

3. **Test from Physical Device**:
   - Ensure device is on same WiFi network
   - Open Safari and navigate to: `http://<YOUR_MAC_IP>:8080/api/v1/health`
   - Should load successfully

### Troubleshooting

#### "Network request failed"
- **Check firewall**: Ensure Mac firewall allows connections on port 8080
- **Check IP address**: Verify IP hasn't changed (run `ifconfig` again)
- **Check network**: Ensure device/simulator is on same network
- **Try localhost**: For iOS Simulator, try `localhost` instead of IP

#### "Connection timeout"
- **Check backend**: Ensure Spring Boot is running (`./mvnw spring-boot:run`)
- **Check port**: Verify backend is on port 8080
- **Check CORS**: Backend should allow all origins (already configured)

#### "AbortSignal.timeout is not a function"
- **Fixed**: This has been resolved with the new `fetchWithTimeout` utility
- **No action needed**: The new implementation doesn't use `AbortSignal.timeout()`

### Environment Variable Naming

**Important**: Expo requires the `EXPO_PUBLIC_` prefix for environment variables to be accessible in the app.

- ✅ `EXPO_PUBLIC_SPRING_API_BASE_URL` - Accessible
- ❌ `SPRING_API_BASE_URL` - Not accessible (missing prefix)

