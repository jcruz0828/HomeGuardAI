# HomeGuard AI - ML Service Documentation

## Overview

The ML Service is a Python FastAPI microservice that handles face embedding generation for the HomeGuard AI system. It processes images, detects faces, and generates vector embeddings that can be used for facial recognition.

## Technology Stack

- **Framework**: FastAPI
- **Language**: Python 3.8+
- **Face Recognition**: face_recognition library (dlib)
- **Image Processing**: OpenCV, PIL
- **HTTP Server**: Uvicorn

## Project Structure

```
ml/
├── main.py                    # FastAPI application
├── face_service.py           # Core face processing logic
├── config.py                 # Configuration settings
├── run.py                    # Quick start script
├── start.py                  # Production start script
├── ml_client.py              # Python client library
├── requirements.txt          # Python dependencies
├── Dockerfile               # Docker configuration
├── README.md                # Service documentation
└── QUICK_START.md           # Quick start guide
```

## Features

### Face Embedding Generation
- Converts images to face embeddings (128-dimensional vectors)
- Supports multiple images per person
- Handles multiple faces per image
- Validates image formats

### Image Processing
- Base64 image decoding
- URL-based image loading
- Image format validation
- Face detection and alignment

### API Endpoints
- RESTful API design
- Health check endpoint
- Error handling
- CORS support

## API Endpoints

### Health Check
```
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "message": "HomeGuard AI Facial Recognition Service is running"
}
```

### Generate Face Embeddings
```
POST /embed-faces
```

**Request Body**:
```json
{
  "person_id": "person_123",
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "https://example.com/image.jpg"
  ]
}
```

**Response**:
```json
{
  "person_id": "person_123",
  "face_embeddings": [
    [0.1, 0.2, 0.3, ...],  // 128-dimensional vector
    [0.4, 0.5, 0.6, ...]
  ],
  "face_count": 2,
  "success": true,
  "message": "Successfully processed 2 faces from 2 images"
}
```

## Configuration

### Environment Variables

```bash
ML_HOST=0.0.0.0          # Server host (default: 0.0.0.0)
ML_PORT=8001             # Server port (default: 8001)
ML_WORKERS=1             # Number of workers (default: 1)
FACE_TOLERANCE=0.6       # Face matching tolerance (default: 0.6)
LOG_LEVEL=INFO          # Logging level (default: INFO)
```

### Config File
Configuration managed in `config.py`:
- Host and port settings
- CORS origins
- Logging configuration
- Face recognition parameters

## Face Service

### Core Functionality

The `face_service.py` module provides:

#### `process_images_for_person(person_id, images)`
- Processes multiple images for a person
- Detects faces in each image
- Generates embeddings for detected faces
- Returns all embeddings for the person

**Process Flow**:
1. Validate input images
2. Load/decode images
3. Detect faces in each image
4. Generate embeddings for each face
5. Return aggregated results

#### Image Loading
- Supports base64 encoded images
- Supports image URLs (Supabase URLs)
- Handles various image formats (JPEG, PNG, etc.)

#### Face Detection
- Uses dlib's face detection
- Handles multiple faces per image
- Returns face locations and embeddings

## Installation

### Prerequisites
- Python 3.8 or higher
- pip or conda

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Optional: GPU Support
For better performance with large datasets:
```bash
# Install dlib with CUDA support
# Follow dlib installation instructions for your system
```

## Running the Service

### Quick Start
```bash
python run.py
```

### Development Mode
```bash
python main.py
```

### Production Mode
```bash
python start.py
```

### With Custom Configuration
```bash
ML_HOST=0.0.0.0 ML_PORT=8001 python start.py
```

### Docker
```bash
docker build -t homeguard-ml .
docker run -p 8001:8001 homeguard-ml
```

## Integration with Backend

### Workflow

1. **Face Enrollment**:
   - User uploads images via mobile app
   - Backend stores images in Supabase Storage
   - Backend calls ML service: `POST /embed-faces`
   - ML service processes images and returns embeddings
   - Backend stores embeddings in database

2. **Face Recognition** (Future):
   - Edge device captures image
   - Edge device calls ML service: `POST /recognize-face`
   - ML service compares with known embeddings
   - Returns recognition result

### Backend Integration

The backend uses `MLServiceClient` to communicate:

```java
// Generate embeddings
List<List<Double>> embeddings = mlServiceClient.generateFaceEmbeddings(
    personId, 
    imageUrls
);
```

## Python Client Library

### MLServiceClient

Located in `ml_client.py`, provides a Python client:

```python
from ml_client import MLServiceClient

# Initialize client
client = MLServiceClient("http://localhost:8001")

# Check health
if client.health_check():
    print("ML service is healthy")

# Generate embeddings
result = client.embed_faces("person_123", [image1, image2])
if result.success:
    print(f"Generated {result.face_count} embeddings")
```

## Testing

### Test Scripts

1. **Comprehensive Test** (`test_facial_recognition.py`):
   - Tests with generated images
   - Tests with variations
   - Edge case testing

2. **Real Images Test** (`test_with_real_images.py`):
   - Tests with actual image files
   - Validates real-world scenarios

### Running Tests
```bash
python test_facial_recognition.py
python test_with_real_images.py
```

## Performance

### CPU vs GPU
- **CPU**: Default mode, works on any system
- **GPU**: Requires CUDA, significantly faster for large datasets

### Memory Usage
- Face embeddings stored in memory during processing
- Monitor memory with large datasets
- Consider batch processing for multiple people

### Tolerance Tuning
- **Lower tolerance (0.4-0.5)**: More strict matching
- **Higher tolerance (0.6-0.7)**: More permissive matching
- Default: 0.6 (balanced)

## Error Handling

### Common Errors

1. **No faces detected**:
   - Ensure images contain clear, front-facing faces
   - Check image quality and lighting

2. **Low recognition accuracy**:
   - Adjust tolerance value
   - Use more training images
   - Ensure good image quality

3. **Memory issues**:
   - Reduce number of workers
   - Process smaller batches
   - Consider GPU acceleration

4. **Installation issues**:
   - Ensure all dependencies installed
   - Check dlib installation
   - Verify Python version

### Error Responses

```json
{
  "detail": "Error message here"
}
```

HTTP status codes:
- `200` - Success
- `400` - Bad request
- `500` - Internal server error

## Logging

### Log Levels
- `DEBUG` - Detailed debugging information
- `INFO` - General information
- `WARNING` - Warning messages
- `ERROR` - Error messages

### Log Output
- Face detection results
- Recognition confidence scores
- Error messages
- Performance metrics

## Security Considerations

### Input Validation
- Validates image formats
- Checks image sizes
- Sanitizes input data

### CORS Configuration
- Configurable CORS origins
- Secure by default
- Allows backend connections

### Resource Limits
- Consider rate limiting
- Monitor resource usage
- Implement request queuing if needed

## Deployment

### Production Considerations
- Use production WSGI server (Gunicorn + Uvicorn workers)
- Enable HTTPS
- Set up monitoring
- Configure logging
- Use environment variables for secrets

### Docker Deployment
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "start.py"]
```

### Scaling
- Stateless design allows horizontal scaling
- Use load balancer for multiple instances
- Consider GPU instances for better performance

## Future Enhancements

- Face recognition endpoint (compare with known faces)
- Batch processing endpoint
- Model optimization
- GPU acceleration support
- Voice recognition (future)
- Anomaly detection
- Performance metrics endpoint
- Model versioning

## Troubleshooting

### Service Won't Start
- Check Python version (3.8+)
- Verify dependencies installed
- Check port availability
- Review logs for errors

### Poor Recognition Accuracy
- Use higher quality images
- Ensure good lighting
- Use multiple images per person
- Adjust tolerance value
- Check face detection quality

### Performance Issues
- Consider GPU acceleration
- Reduce number of workers
- Optimize image sizes
- Use batch processing

---

**Last Updated**: 2024

