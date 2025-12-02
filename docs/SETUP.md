# HomeGuard AI - Setup Guide

This guide will help you set up the complete HomeGuard AI system, including the backend, ML service, mobile app, and edge device.

## Prerequisites

### General Requirements
- **Git** - Version control
- **Node.js** (v18+) - For mobile app
- **Java 17** - For backend
- **Python 3.8+** - For ML service
- **Maven 3.6+** - For backend build
- **PostgreSQL** - Database (or Supabase account)

### Platform-Specific
- **iOS Development**: Xcode (for iOS app)
- **Android Development**: Android Studio (for Android app)
- **Raspberry Pi**: Raspberry Pi OS (for edge device)

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd HomeGuardAI
```

### 2. Set Up Supabase

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Note your project URL and API keys
4. Enable pgvector extension in database:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

### 3. Backend Setup

```bash
cd backend

# Configure database in application.properties
# Update:
# - spring.datasource.url
# - spring.datasource.username
# - spring.datasource.password

# Build and run
mvn clean install
mvn spring-boot:run
```

Backend will run on `http://localhost:8080`

### 4. ML Service Setup

```bash
cd ml

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run service
python run.py
```

ML service will run on `http://localhost:8001`

### 5. Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Configure environment
# Create .env file with:
# EXPO_PUBLIC_API_URL=http://your-backend-url
# EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key

# Start Expo
npm start
```

### 6. Edge Device Setup

See [Edge Device Documentation](./EDGE_DEVICE.md) for detailed setup.

## Detailed Setup Instructions

## Backend Setup

### 1. Database Configuration

#### Option A: Supabase (Recommended)

1. Create Supabase project
2. Get connection details:
   - Host: `aws-1-us-east-2.pooler.supabase.com`
   - Port: `6543` (PgBouncer) or `5432` (Direct)
   - Database: `postgres`
   - Username: `postgres.xxxxx`
   - Password: Your project password

3. Update `application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://aws-1-us-east-2.pooler.supabase.com:6543/postgres
spring.datasource.username=postgres.xxxxx
spring.datasource.password=your-password
```

#### Option B: Local PostgreSQL

1. Install PostgreSQL
2. Create database:
```sql
CREATE DATABASE homeguard;
CREATE USER homeguard WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE homeguard TO homeguard;
```

3. Update `application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/homeguard
spring.datasource.username=homeguard
spring.datasource.password=password
```

### 2. Run Database Migrations

**Note**: Flyway is disabled for Supabase. Run migrations manually:

```bash
# Connect to database
psql -h your-host -U your-user -d postgres

# Run migration files from:
backend/src/main/resources/db/migration/
```

Or use Supabase SQL Editor to run migrations.

### 3. Build and Run

```bash
cd backend
mvn clean package
java -jar target/homeguard-api-0.0.1-SNAPSHOT.jar
```

### 4. Verify Backend

```bash
curl http://localhost:8080/api/v1/health
```

## ML Service Setup

### 1. Install System Dependencies

#### macOS
```bash
brew install cmake
brew install dlib
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install cmake
sudo apt-get install libdlib-dev
```

#### Windows
- Install Visual Studio Build Tools
- Install CMake

### 2. Install Python Dependencies

```bash
cd ml
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Note**: `dlib` installation may take time. For GPU support, follow dlib GPU installation guide.

### 3. Configure Service

Create `.env` file (optional):
```bash
ML_HOST=0.0.0.0
ML_PORT=8001
FACE_TOLERANCE=0.6
LOG_LEVEL=INFO
```

### 4. Run Service

```bash
# Development
python main.py

# Production
python start.py

# With custom config
ML_PORT=8001 python start.py
```

### 5. Verify ML Service

```bash
curl http://localhost:8001/health
```

### 6. Test Face Recognition

```bash
python test_facial_recognition.py
```

## Mobile App Setup

### 1. Install Expo CLI

```bash
npm install -g expo-cli
```

### 2. Install Dependencies

```bash
cd mobile
npm install
```

### 3. Configure Environment

Create `.env` file:
```bash
EXPO_PUBLIC_API_URL=http://localhost:8080/api/v1
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Configure API

Update `src/config/api.ts`:
```typescript
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
```

### 5. Run on iOS

```bash
npm run ios
```

**Requirements**:
- macOS
- Xcode installed
- iOS Simulator or physical device

### 6. Run on Android

```bash
npm run android
```

**Requirements**:
- Android Studio installed
- Android emulator or physical device
- Android SDK configured

### 7. Run on Web

```bash
npm run web
```

Opens in browser at `http://localhost:19006`

## Edge Device Setup

### 1. Install Raspberry Pi OS

1. Download Raspberry Pi Imager
2. Flash Raspberry Pi OS to microSD card
3. Enable SSH and configure WiFi (if needed)
4. Boot Raspberry Pi

### 2. Initial Setup

```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install Python and dependencies
sudo apt install python3 python3-pip python3-venv git

# Enable camera (if using Pi Camera)
sudo raspi-config
# Interface Options > Camera > Enable
```

### 3. Clone and Setup

```bash
# Clone repository
git clone <repository-url>
cd HomeGuardAI/edge

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Configure

Create `config.py`:
```python
BACKEND_URL = "http://your-backend-url/api/v1"
HOME_ID = "your-home-id"
API_TOKEN = "your-api-token"
RELAY_PIN = 16
CAMERA_RESOLUTION = (640, 480)
```

### 5. Test Hardware

```bash
# Test GPIO
python main.py  # LED blink test

# Test camera
raspistill -o test.jpg
```

### 6. Run as Service

See [Edge Device Documentation](./EDGE_DEVICE.md) for service setup.

## Supabase Storage Setup

### 1. Create Storage Buckets

1. Go to Supabase Dashboard > Storage
2. Create bucket: `person-images` (private)
3. Create bucket: `access-logs` (private)
4. Configure bucket policies

### 2. Configure Backend

Update backend to use Supabase Storage for image uploads.

## Configuration Summary

### Backend Configuration
- **Port**: 8080
- **Base Path**: `/api/v1`
- **Database**: Supabase PostgreSQL
- **ML Service URL**: `http://localhost:8001`

### ML Service Configuration
- **Port**: 8001
- **Host**: 0.0.0.0
- **Tolerance**: 0.6

### Mobile App Configuration
- **API URL**: `http://localhost:8080/api/v1`
- **Supabase URL**: Your Supabase project URL
- **Supabase Key**: Your Supabase anon key

### Edge Device Configuration
- **Backend URL**: Your backend URL
- **Home ID**: Your home ID
- **GPIO Pin**: 16 (relay control)

## Verification Checklist

- [ ] Backend running on port 8080
- [ ] ML service running on port 8001
- [ ] Database connected and migrations run
- [ ] Supabase Storage buckets created
- [ ] Mobile app connects to backend
- [ ] Edge device connects to backend
- [ ] Camera working on edge device
- [ ] GPIO working on edge device
- [ ] Face recognition working end-to-end

## Troubleshooting

### Backend Issues

**Database Connection Failed**:
- Check database credentials
- Verify network connectivity
- Check Supabase connection pool limits

**Port Already in Use**:
```bash
# Find process using port
lsof -i :8080
# Kill process
kill -9 <PID>
```

### ML Service Issues

**dlib Installation Failed**:
- Install cmake first
- Follow dlib installation guide for your OS
- Consider using conda for easier installation

**No Faces Detected**:
- Check image quality
- Ensure images contain faces
- Verify face_recognition library working

### Mobile App Issues

**Cannot Connect to Backend**:
- Check API URL in `.env`
- Verify backend is running
- Check network connectivity
- Review CORS settings

**Expo Build Fails**:
- Clear cache: `expo start -c`
- Delete `node_modules` and reinstall
- Check Node.js version

### Edge Device Issues

**Camera Not Working**:
- Enable camera in raspi-config
- Check camera connection
- Verify permissions

**GPIO Permission Denied**:
```bash
sudo usermod -a -G gpio $USER
# Log out and back in
```

## Production Deployment

### Backend
- Deploy to cloud (AWS, GCP, Azure)
- Use environment variables for config
- Enable HTTPS
- Set up monitoring

### ML Service
- Containerize with Docker
- Deploy to container service
- Scale horizontally if needed

### Mobile App
- Build for App Store (iOS)
- Build for Play Store (Android)
- Configure production API URLs

### Edge Device
- Set up as systemd service
- Configure auto-start
- Set up remote monitoring

## Next Steps

1. Read [Architecture Documentation](./ARCHITECTURE.md)
2. Review [Backend API Documentation](./BACKEND.md)
3. Check [Mobile App Documentation](./MOBILE.md)
4. See [ML Service Documentation](./ML_SERVICE.md)
5. Review [Edge Device Documentation](./EDGE_DEVICE.md)

## Support

For issues or questions:
- Check individual component documentation
- Review troubleshooting sections
- Check GitHub issues
- Contact support team

---

**Last Updated**: 2024

