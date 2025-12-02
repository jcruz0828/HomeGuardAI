# HomeGuard AI - Architecture Documentation

## System Architecture Overview

HomeGuard AI follows a hybrid cloud-edge architecture that combines the reliability of cloud services with the low-latency benefits of edge computing.

## High-Level Architecture

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└────────┬────────┘
         │
         │ REST API
         │
┌────────▼─────────────────────────────────────┐
│         Backend Server                        │
│  (Java Spring Boot)                           │
│  - User Management                            │
│  - Home Management                            │
│  - Access Control                             │
│  - API Gateway                                │
└────────┬──────────────────┬───────────────────┘
         │                  │
         │                  │
    ┌────▼────┐        ┌────▼────┐
    │  ML     │        │Database │
    │ Service │        │Supabase │
    │(Python) │        │Postgres │
    └─────────┘        └────┬────┘
                            │
                            │ Sync
                            │
                    ┌───────▼───────┐
                    │  Edge Device  │
                    │ (Raspberry Pi)│
                    │ - Face Rec    │
                    │ - Access Ctrl │
                    └───────────────┘
```

## Component Details

### 1. Mobile Application (React Native)

**Location**: `mobile/`

**Technology Stack**:
- React Native with Expo
- TypeScript
- NativeWind (Tailwind CSS)
- React Navigation
- Supabase Client

**Key Features**:
- Cross-platform (iOS/Android)
- Offline-first design
- Real-time updates
- Camera integration for face enrollment
- Push notifications

**Architecture Patterns**:
- Context API for state management (UserContext, ThemeContext)
- Service layer for API calls
- Navigation-based screen organization
- Component-based UI architecture

### 2. Backend Server (Java Spring Boot)

**Location**: `backend/`

**Technology Stack**:
- Java 17
- Spring Boot 3.5.6
- Spring Security
- Spring Data JPA
- Hibernate
- PostgreSQL Driver

**Architecture Patterns**:
- **Layered Architecture**:
  - Controllers (REST endpoints)
  - Services (Business logic)
  - Repositories (Data access)
  - Models (Entities)
  - DTOs (Data transfer objects)

- **Key Components**:
  - `UserController` - User management
  - `HomeController` - Home operations
  - `PersonController` - People management
  - `AccessLogController` - Access tracking
  - `DeviceController` - Device management
  - `SecuritySettingsController` - Security configuration
  - `MLServiceClient` - ML service integration

**Database Connection**:
- Uses Supabase PostgreSQL with PgBouncer
- Connection pooling (HikariCP)
- Optimized for Supabase's connection limits

### 3. ML Service (Python FastAPI)

**Location**: `ml/`

**Technology Stack**:
- Python 3.8+
- FastAPI
- face_recognition library
- dlib
- OpenCV

**Key Features**:
- Face embedding generation
- Image processing and validation
- RESTful API
- Health monitoring

**Endpoints**:
- `POST /embed-faces` - Generate face embeddings
- `GET /health` - Health check

**Integration**:
- Called by backend when enrolling faces
- Returns embeddings as JSON arrays
- Backend stores embeddings in database

### 4. Edge Device (Raspberry Pi)

**Location**: `edge/`

**Technology Stack**:
- Python 3
- RPi.GPIO
- OpenCV
- Camera libraries

**Key Features**:
- Local facial recognition
- QR code scanning
- Relay/solenoid control
- Offline operation
- Periodic sync with cloud

**Operation Modes**:
- **Online**: Syncs with backend, sends logs
- **Offline**: Uses cached embeddings for recognition

### 5. Database (Supabase PostgreSQL)

**Technology Stack**:
- PostgreSQL
- pgvector extension (for face embeddings)
- Supabase Storage (for images)

**Key Tables**:
- `users` - User accounts
- `homes` - Home/property information
- `persons` - People profiles with face embeddings
- `devices` - IoT device registry
- `access_logs` - Access attempt records
- `home_activities` - Activity tracking
- `security_settings` - Per-home security config
- `home_persons` - Home-person associations
- `user_homes` - User-home relationships

**Special Features**:
- Face embeddings stored as JSON in `persons.face_vector`
- Vector similarity search capability (pgvector)
- Real-time subscriptions via Supabase

## Data Flow

### Face Enrollment Flow

```
1. User uploads images via Mobile App
   ↓
2. Mobile App → Backend API (POST /persons/{id}/upload-image)
   ↓
3. Backend stores images in Supabase Storage
   ↓
4. Backend → ML Service (POST /embed-faces)
   ↓
5. ML Service processes images, returns embeddings
   ↓
6. Backend stores embeddings in persons.face_vector
   ↓
7. Backend syncs embeddings to Edge Device (on next sync)
```

### Access Control Flow

```
1. Person approaches Edge Device
   ↓
2. Camera captures image
   ↓
3. Edge Device extracts face embedding
   ↓
4. Edge Device compares with cached embeddings
   ↓
5. If match found:
   - Grant access (activate relay/solenoid)
   - Log access attempt
   - Sync log to backend (when online)
   ↓
6. If no match:
   - Deny access
   - Log failed attempt
   - Optionally send alert
```

### Activity Tracking Flow

```
1. Edge Device records access attempt
   ↓
2. Edge Device → Backend (POST /access-logs)
   ↓
3. Backend creates access log entry
   ↓
4. Backend creates home activity entry
   ↓
5. Mobile App subscribes to real-time updates
   ↓
6. Activity appears in Mobile App
```

## Security Architecture

### Authentication & Authorization

- **JWT-based authentication** (via Supabase Auth)
- **Role-based access control**:
  - Owner: Full control
  - Admin: Management access
  - Member: Limited access
  - Guest: Read-only access

### Data Security

- Face embeddings stored as JSON (encrypted at rest)
- Images stored in Supabase Storage (private buckets)
- All API communications over HTTPS
- Database connections use SSL

### Access Control

- Multi-level access control:
  1. User authentication
  2. Home membership verification
  3. Role-based permissions
  4. Resource-level authorization

## Scalability Considerations

### Backend
- Stateless API design
- Connection pooling for database
- Service layer separation for horizontal scaling
- Caching opportunities (Redis can be added)

### ML Service
- Stateless processing
- Can be horizontally scaled
- GPU support for faster processing

### Edge Device
- Local processing reduces cloud load
- Cached embeddings for offline operation
- Batch sync reduces API calls

### Database
- Indexed queries for performance
- pgvector for efficient similarity search
- Connection pooling via PgBouncer

## Deployment Architecture

### Development
- All services run locally
- Local database or Supabase dev instance
- Mobile app uses Expo development server

### Production
- Backend: Cloud hosting (AWS, GCP, Azure)
- ML Service: Containerized (Docker)
- Database: Supabase (managed PostgreSQL)
- Edge: Raspberry Pi on-premises
- Mobile: App stores (iOS/Android)

## Integration Points

### Backend ↔ ML Service
- REST API calls
- JSON payloads
- Error handling and retries

### Backend ↔ Database
- JPA/Hibernate ORM
- Connection pooling
- Transaction management

### Backend ↔ Supabase Storage
- REST API for file uploads
- Signed URLs for secure access

### Mobile ↔ Backend
- REST API calls
- JWT authentication
- Real-time subscriptions

### Edge ↔ Backend
- REST API for sync
- Periodic polling
- Batch operations

## Error Handling

- **Global Exception Handler** in backend
- **Service-level error handling** with proper HTTP status codes
- **Retry logic** for external service calls
- **Graceful degradation** on edge device (offline mode)

## Monitoring & Logging

- **Backend**: Spring Boot Actuator for health checks
- **ML Service**: FastAPI logging
- **Edge Device**: Local logging with cloud sync
- **Mobile App**: Error tracking and analytics

## Future Enhancements

- WebSocket support for real-time updates
- GraphQL API option
- Microservices architecture (if needed)
- Kubernetes deployment
- Advanced analytics and reporting
- Voice recognition integration
- Multi-factor authentication

---

**Last Updated**: 2024

