# HomeGuard AI - Documentation

Welcome to the HomeGuard AI documentation. This comprehensive guide covers all aspects of the HomeGuard AI smart security system.

## 📚 Documentation Index

1. **[Architecture Overview](./ARCHITECTURE.md)** - System architecture and design patterns
2. **[Backend API](./BACKEND.md)** - Java Spring Boot backend documentation
3. **[Mobile App](./MOBILE.md)** - React Native mobile application guide
4. **[ML Service](./ML_SERVICE.md)** - Python face recognition service
5. **[Edge Device](./EDGE_DEVICE.md)** - Raspberry Pi edge device setup
6. **[Setup Guide](./SETUP.md)** - Installation and configuration instructions

## 🏠 What is HomeGuard AI?

HomeGuard AI is a comprehensive smart security system that combines:

- **Facial Recognition** - AI-powered face detection and recognition for access control
- **Multi-Home Management** - Support for multiple properties per user
- **Edge Computing** - Local processing on Raspberry Pi for low-latency access decisions
- **Mobile-First Design** - React Native app for iOS and Android
- **Cloud Integration** - Supabase backend for data storage and synchronization
- **Real-Time Monitoring** - Activity logs and access tracking

## 🏗️ System Components

### 1. Backend (Java Spring Boot)
- RESTful API for all operations
- User authentication and authorization
- Home and person management
- Device management
- Access log tracking
- Integration with ML service

### 2. Mobile App (React Native)
- Cross-platform iOS/Android application
- User authentication
- Home dashboard and management
- People and member management
- Security settings and controls
- Activity monitoring
- Face enrollment

### 3. ML Service (Python FastAPI)
- Face embedding generation
- Facial recognition processing
- Image validation and processing
- RESTful API for backend integration

### 4. Edge Device (Raspberry Pi)
- Local facial recognition
- QR code scanning
- Access control (relay/solenoid lock)
- Camera integration
- Offline operation capability

### 5. Database (Supabase PostgreSQL)
- User and home data
- Person profiles with face embeddings
- Access logs and activities
- Device configurations
- Security settings

## 🚀 Quick Start

1. **Backend Setup**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. **ML Service Setup**
   ```bash
   cd ml
   pip install -r requirements.txt
   python run.py
   ```

3. **Mobile App Setup**
   ```bash
   cd mobile
   npm install
   npm start
   ```

4. **Edge Device Setup**
   ```bash
   cd edge
   python main.py
   ```

For detailed setup instructions, see [Setup Guide](./SETUP.md).

## 📖 Key Features

### User Management
- User registration and authentication
- Multi-home support per user
- Role-based access control (Owner, Admin, Member, Guest)
- User invitations and home sharing

### Home Management
- Create and manage multiple homes
- Set primary home
- Home-specific settings and configurations
- Location tracking (GPS coordinates)

### People Management
- Add people to homes (Family, Guest, Service Provider)
- Face enrollment with multiple images
- RFID card management
- Person profiles with contact information

### Security Features
- Facial recognition access control
- RFID card access
- Access logs and activity tracking
- Security settings per home
- Automatic access rules

### Device Management
- Register and manage IoT devices
- Device status monitoring
- Device type classification (Camera, Lock, Sensor, etc.)
- Home-device associations

### Activity Monitoring
- Real-time activity logs
- Access attempt tracking
- Activity filtering and search
- Global and home-specific views

## 🔧 Technology Stack

- **Backend**: Java 17, Spring Boot 3.5.6, Spring Security, JPA/Hibernate
- **Database**: PostgreSQL (Supabase), pgvector extension
- **Mobile**: React Native, Expo, TypeScript, NativeWind (Tailwind CSS)
- **ML Service**: Python 3.8+, FastAPI, face_recognition library
- **Edge**: Raspberry Pi, Python, RPi.GPIO, OpenCV
- **Infrastructure**: Supabase (Database, Storage, Auth)

## 📝 Project Structure

```
HomeGuardAI/
├── backend/          # Java Spring Boot API
├── mobile/           # React Native mobile app
├── ml/               # Python ML service
├── edge/             # Raspberry Pi edge device code
├── infrastructure/   # Infrastructure as code
└── docs/             # Documentation (this folder)
```

## 🔐 Security Considerations

- JWT-based authentication
- Role-based access control
- Secure password storage
- HTTPS/TLS for all communications
- Face embeddings stored securely
- Access logs for audit trails

## 📞 Support

For issues, questions, or contributions, please refer to the individual component documentation or create an issue in the repository.

## 📄 License

[Add your license information here]

---

**Last Updated**: 2024
**Version**: 1.0.0

