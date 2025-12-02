# HomeGuard AI - Backend API Documentation

## Overview

The HomeGuard AI backend is a Java Spring Boot application that provides a RESTful API for managing users, homes, people, devices, and access control. It integrates with Supabase PostgreSQL for data storage and a Python ML service for face recognition.

## Technology Stack

- **Framework**: Spring Boot 3.5.6
- **Java Version**: 17
- **Database**: PostgreSQL (Supabase)
- **ORM**: Spring Data JPA / Hibernate
- **Security**: Spring Security
- **Build Tool**: Maven

## Project Structure

```
backend/
├── src/main/java/com/homeguard/homeguard_api/
│   ├── config/          # Configuration classes
│   ├── controller/      # REST controllers
│   ├── dto/             # Data Transfer Objects
│   ├── enums/           # Enumeration types
│   ├── exception/       # Custom exceptions
│   ├── model/           # Entity models
│   ├── repository/      # Data access layer
│   ├── service/         # Business logic
│   └── util/            # Utility classes
└── src/main/resources/
    ├── application.properties
    └── db/migration/    # Database migrations
```

## Configuration

### Application Properties

Key configuration in `application.properties`:

```properties
# Server
server.port=8080
base.path=/api/v1

# Database (Supabase)
spring.datasource.url=jdbc:postgresql://...
spring.datasource.username=...
spring.datasource.password=...

# Connection Pooling (PgBouncer compatible)
spring.datasource.hikari.maximum-pool-size=3
spring.datasource.hikari.minimum-idle=1

# ML Service
ml.service.url=http://localhost:8001
```

### Database Configuration

- Uses Supabase PostgreSQL with PgBouncer
- Connection pooling optimized for Supabase limits
- SSL required for all connections
- Prepared statements disabled (PgBouncer compatibility)

## API Endpoints

### Base URL
All endpoints are prefixed with `/api/v1`

### Authentication
Currently, authentication is handled via Supabase Auth. JWT tokens should be included in requests (implementation may vary).

### Controllers

#### 1. User Controller (`/api/v1/users`)

**Endpoints**:
- `POST /api/v1/users` - Create new user
- `GET /api/v1/users/{id}` - Get user by ID
- `GET /api/v1/users/email/{email}` - Get user by email
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/page` - Get paginated users
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

**Request/Response DTOs**:
- `UserRequestDto` - Create/update user
- `UserResponseDto` - User data response
- `UserUpdateDto` - Partial update

#### 2. Home Controller (`/api/v1/homes`)

**Endpoints**:
- `POST /api/v1/homes/owner/{ownerId}` - Create home for owner
- `GET /api/v1/homes/{id}` - Get home by ID
- `GET /api/v1/homes/owner/{ownerId}` - Get all homes for owner
- `GET /api/v1/homes/owner/{ownerId}/primary` - Get primary home
- `PUT /api/v1/homes/{id}` - Update home
- `DELETE /api/v1/homes/{id}` - Delete home

**Request/Response DTOs**:
- `HomeRequestDto` - Create home
- `HomeResponseDto` - Home data response
- `HomeUpdateDto` - Update home

#### 3. Person Controller (`/api/v1/persons`)

**Endpoints**:
- `POST /api/v1/persons` - Create person
- `GET /api/v1/persons/{id}` - Get person by ID
- `GET /api/v1/persons` - Get all active persons
- `PUT /api/v1/persons/{id}` - Update person
- `DELETE /api/v1/persons/{id}` - Delete person
- `POST /api/v1/persons/{id}/upload-image` - Upload face images for enrollment

**Request/Response DTOs**:
- `PersonRequestDto` - Create/update person
- `PersonResponseDto` - Person data response
- `PersonEmbeddingDto` - Face embedding data

#### 4. Home Person Controller (`/api/v1/home-persons`)

**Endpoints**:
- `POST /api/v1/home-persons` - Associate person with home
- `GET /api/v1/home-persons/home/{homeId}` - Get all persons for home
- `GET /api/v1/home-persons/person/{personId}` - Get all homes for person
- `PUT /api/v1/home-persons/{id}` - Update association
- `DELETE /api/v1/home-persons/{id}` - Remove association

**Request/Response DTOs**:
- `HomePersonRequestDto` - Create association
- `HomePersonResponseDto` - Association data

#### 5. Device Controller (`/api/v1/devices`)

**Endpoints**:
- `POST /api/v1/devices` - Register device
- `GET /api/v1/devices/{id}` - Get device by ID
- `GET /api/v1/devices/device-id/{deviceId}` - Get by device ID
- `GET /api/v1/devices/homes/{homeId}` - Get devices for home
- `GET /api/v1/devices/owners/{ownerId}` - Get devices for owner
- `PUT /api/v1/devices/{id}` - Update device
- `DELETE /api/v1/devices/{id}` - Delete device

#### 6. Access Log Controller (`/api/v1/access-logs`)

**Endpoints**:
- `POST /api/v1/access-logs` - Create access log entry
- `GET /api/v1/access-logs/{id}` - Get access log by ID
- `GET /api/v1/access-logs/home/{homeId}` - Get logs for home

**Request/Response DTOs**:
- `AccessLogRequestDto` - Create log entry
- `AccessLogResponseDto` - Log data

#### 7. Home Activity Controller (`/api/v1/home-activities`)

**Endpoints**:
- `POST /api/v1/home-activities` - Create activity
- `GET /api/v1/home-activities/home/{homeId}` - Get activities for home
- `GET /api/v1/home-activities/global` - Get global activities

**Request/Response DTOs**:
- `HomeActivityRequestDto` - Create activity
- `HomeActivityResponseDto` - Activity data

#### 8. Security Settings Controller (`/api/v1/security-settings`)

**Endpoints**:
- `POST /api/v1/security-settings` - Create security settings
- `GET /api/v1/security-settings/home/{homeId}` - Get settings for home
- `PUT /api/v1/security-settings/{id}` - Update settings

**Request/Response DTOs**:
- `SecuritySettingsRequestDto` - Create/update settings
- `SecuritySettingsResponseDto` - Settings data

#### 9. Face Recognition Settings Controller (`/api/v1/face-recognition-settings`)

**Endpoints**:
- `POST /api/v1/face-recognition-settings` - Create face recognition settings
- `GET /api/v1/face-recognition-settings/home/{homeId}` - Get settings
- `PUT /api/v1/face-recognition-settings/{id}` - Update settings

#### 10. Home Invitation Controller (`/api/v1/home-invitations`)

**Endpoints**:
- `POST /api/v1/home-invitations` - Create invitation
- `GET /api/v1/home-invitations/{id}` - Get invitation
- `GET /api/v1/home-invitations/user/{userId}` - Get user invitations
- `PUT /api/v1/home-invitations/{id}/accept` - Accept invitation
- `PUT /api/v1/home-invitations/{id}/reject` - Reject invitation

#### 11. App Settings Controller (`/api/v1/app-settings`)

**Endpoints**:
- `POST /api/v1/app-settings` - Create app settings
- `GET /api/v1/app-settings/user/{userId}` - Get user settings
- `PUT /api/v1/app-settings/{id}` - Update settings

#### 12. Health Controller (`/api/v1/health`)

**Endpoints**:
- `GET /api/v1/health` - Health check

## Data Models

### Core Entities

#### User
- `id` (UUID)
- `email` (unique)
- `firstName`, `lastName`
- `phoneNumber`
- `role` (enum: ADMIN, USER)
- `state` (enum: ACTIVE, INACTIVE, SUSPENDED)
- `createdAt`, `updatedAt`

#### Home
- `id` (UUID)
- `owner` (User reference)
- `name`, `address`
- `city`, `state`, `zipCode`, `country`
- `latitude`, `longitude`
- `homeType`
- `isPrimary`, `isActive`
- `description`
- `securitySystemType`

#### Person
- `id` (UUID)
- `name`, `phone`, `email`
- `personType` (enum: FAMILY, GUEST, SERVICE_PROVIDER)
- `profileImagePath`
- `faceVector` (JSON - face embeddings)
- `faceEmbeddingsGeneratedAt`
- `faceImageCount`
- `faceProcessingStatus`
- `isActive`
- `lastSeen`
- `notes`

#### Device
- `id` (UUID)
- `deviceId` (unique identifier)
- `home` (Home reference)
- `owner` (User reference)
- `deviceType` (enum)
- `deviceStatus` (enum)
- `name`, `description`
- `location`
- `configuration` (JSON)

#### AccessLog
- `id` (UUID)
- `home` (Home reference)
- `person` (Person reference, nullable)
- `device` (Device reference, nullable)
- `accessType` (enum: FACE, RFID, QR_CODE, MANUAL)
- `accessResult` (enum: GRANTED, DENIED)
- `accessLevel` (enum)
- `timestamp`
- `details` (JSON)

#### HomeActivity
- `id` (UUID)
- `home` (Home reference)
- `activityType` (enum)
- `priority` (enum)
- `description`
- `metadata` (JSON)
- `timestamp`

## Services

### Core Services

#### UserService
- User CRUD operations
- Email validation
- State management

#### HomeService
- Home CRUD operations
- Primary home management
- Owner validation

#### PersonService
- Person CRUD operations
- Face enrollment workflow
- Integration with ML service

#### MLServiceClient
- Communication with Python ML service
- Face embedding generation
- Health checks
- JSON conversion utilities

#### AccessLogService
- Access log creation
- Query and filtering
- Statistics generation

#### DeviceService
- Device registration
- Status management
- Home-device associations

## Database Migrations

Migrations are located in `src/main/resources/db/migration/`:

- `V1__Create_user_table.sql` - Initial user table
- `V2__Add_user_details_and_settings.sql` - User enhancements
- `V3__Create_device_and_access_tables.sql` - Devices and access logs
- `V8__Convert_ids_to_uuid_strings.sql` - UUID migration
- `V9__Add_person_management_and_home_invitations.sql` - Person system
- `V14__Add_ml_integration_fields.sql` - ML service integration
- `V16__Add_automatic_access_rules_and_face_recognition_settings.sql` - Face recognition
- And more...

**Note**: Flyway is currently disabled in production (Supabase compatibility).

## Error Handling

### Global Exception Handler
Located in `GlobalExceptionHandler.java`:
- Handles all exceptions
- Returns appropriate HTTP status codes
- Provides error messages

### Custom Exceptions
- `UserNotFoundException`
- `HomeNotFoundException`
- `UserAlreadyExistsException`
- `InvalidUserStateException`
- `AppSettingsNotFoundException`
- `SecuritySettingsNotFoundException`

## Security Configuration

### SecurityConfig
- CORS configuration
- Security filters
- Authentication setup
- Authorization rules

## Integration with ML Service

The backend integrates with the Python ML service via `MLServiceClient`:

```java
// Generate face embeddings
List<List<Double>> embeddings = mlServiceClient.generateFaceEmbeddings(
    personId, 
    imageUrls
);

// Convert to JSON for storage
String jsonEmbeddings = mlServiceClient.embeddingsToJson(embeddings);
```

## Running the Application

### Development
```bash
cd backend
mvn spring-boot:run
```

### Production
```bash
mvn clean package
java -jar target/homeguard-api-0.0.1-SNAPSHOT.jar
```

### Environment Variables
- Database credentials (if not in application.properties)
- ML service URL
- Supabase configuration

## Testing

### Unit Tests
Located in `src/test/java/`

### Integration Tests
Test controllers and services with Spring Boot Test

## API Documentation

### Swagger/OpenAPI
(Can be added with SpringDoc OpenAPI)

### Postman Collection
(Can be generated for API testing)

## Performance Considerations

- Connection pooling (HikariCP)
- Lazy loading for relationships
- Indexed database queries
- Batch operations where possible
- Caching opportunities (Redis can be added)

## Monitoring

### Health Checks
- `/api/v1/health` - Basic health check
- Spring Boot Actuator endpoints (if enabled)

### Logging
- SLF4J with Logback
- Log levels configurable
- Request/response logging

## Future Enhancements

- WebSocket support for real-time updates
- GraphQL API
- Advanced caching (Redis)
- Rate limiting
- API versioning
- Comprehensive API documentation (Swagger)
- Background job processing
- Email notifications
- Push notification service

---

**Last Updated**: 2024

