# HomeGuard AI - Edge Device Documentation

## Overview

The HomeGuard AI edge device is a Raspberry Pi-based system that provides local facial recognition and access control. It operates in "deadbeat" mode, meaning it can function autonomously even when offline, using cached face embeddings for instant access decisions.

## Hardware Requirements

### Required Components
- **Raspberry Pi 4** (recommended) or Raspberry Pi 3B+
- **Camera Module** (Raspberry Pi Camera v2 or USB webcam)
- **Relay Module** (for controlling solenoid lock)
- **12V Power Supply** (for relay/solenoid)
- **MicroSD Card** (32GB+ recommended)
- **GPIO Cables** (for connections)

### Optional Components
- **RFID Reader** (for RFID card access)
- **QR Code Scanner** (for QR code access)
- **LED Indicators** (status feedback)
- **Buzzer** (audio feedback)

## Hardware Connections

### Camera
- Raspberry Pi Camera v2: Connect to CSI port
- USB Webcam: Connect to USB port

### Relay Module
- **GPIO 16** (Pin 36): Control signal
- **12V Power**: Connect to relay module
- **Solenoid Lock**: Connect to relay output

### Power
- **5V**: Raspberry Pi power (via USB-C or micro-USB)
- **12V**: Relay/solenoid power (via barrel jack)

## Software Setup

### Operating System
- **Raspberry Pi OS** (Raspbian) - Latest version
- 64-bit recommended for better performance

### Python Environment
```bash
# Install Python 3.9+
sudo apt update
sudo apt install python3 python3-pip python3-venv

# Create virtual environment
python3 -m venv venv
source venv/bin/activate
```

### Required Python Packages
```bash
pip install RPi.GPIO
pip install opencv-python
pip install face-recognition
pip install requests
pip install numpy
pip install pillow
```

### Camera Setup
```bash
# Enable camera interface
sudo raspi-config
# Navigate to Interface Options > Camera > Enable

# Test camera
raspistill -o test.jpg
```

## Project Structure

```
edge/
├── main.py              # Main edge device application
├── camera_handler.py    # Camera interface (if separate)
├── gpio_controller.py   # GPIO control (if separate)
├── face_recognizer.py   # Face recognition logic (if separate)
└── config.py            # Configuration settings
```

## Current Implementation

### Basic LED Test (`main.py`)
The current implementation includes a basic GPIO test:

```python
# LED pin configuration
LED_PIN = 18  # GPIO 18 (Pin 12 on Pi)

# Blink LED test
def blink_led(duration=1.0, cycles=10):
    # Turn LED on/off
    GPIO.output(LED_PIN, GPIO.HIGH)
    time.sleep(duration)
    GPIO.output(LED_PIN, GPIO.LOW)
```

## Operation Modes

### Online Mode
- Connected to backend API
- Syncs face embeddings periodically
- Sends access logs to backend
- Receives updates and configuration

### Offline Mode (Deadbeat)
- Uses cached face embeddings
- Makes access decisions locally
- Stores access logs locally
- Syncs when connection restored

## Face Recognition Workflow

### 1. Initialization
```
1. Load cached face embeddings from backend
2. Initialize camera
3. Initialize GPIO (relay control)
4. Start recognition loop
```

### 2. Recognition Loop
```
1. Capture image from camera
2. Detect face in image
3. Extract face embedding
4. Compare with cached embeddings
5. If match found:
   - Grant access (activate relay)
   - Log access attempt
   - Sync log to backend (if online)
6. If no match:
   - Deny access
   - Log failed attempt
   - Optionally send alert
```

### 3. Synchronization
```
1. Periodically sync with backend:
   - Fetch new face embeddings
   - Send pending access logs
   - Receive configuration updates
2. Update local cache
3. Continue operation
```

## API Integration

### Backend Endpoints Used

#### Fetch Face Embeddings
```
GET /api/v1/persons?homeId={homeId}
```
Returns persons with face embeddings for the home.

#### Send Access Log
```
POST /api/v1/access-logs
```
Sends access attempt log to backend.

#### Health Check
```
GET /api/v1/health
```
Checks backend connectivity.

### Implementation Example
```python
import requests

# Fetch embeddings
response = requests.get(
    f"{BACKEND_URL}/api/v1/persons",
    params={"homeId": home_id},
    headers={"Authorization": f"Bearer {token}"}
)

# Send access log
requests.post(
    f"{BACKEND_URL}/api/v1/access-logs",
    json={
        "homeId": home_id,
        "personId": person_id,
        "accessType": "FACE",
        "accessResult": "GRANTED",
        "timestamp": datetime.now().isoformat()
    }
)
```

## GPIO Control

### Relay Control
```python
import RPi.GPIO as GPIO

# Setup
GPIO.setmode(GPIO.BCM)
GPIO.setup(RELAY_PIN, GPIO.OUT)

# Activate relay (unlock)
GPIO.output(RELAY_PIN, GPIO.HIGH)
time.sleep(2)  # Keep unlocked for 2 seconds

# Deactivate relay (lock)
GPIO.output(RELAY_PIN, GPIO.LOW)
```

### Pin Configuration
- **GPIO 16** (Pin 36): Relay control
- **GPIO 18** (Pin 12): LED indicator (optional)

## Camera Integration

### Raspberry Pi Camera
```python
from picamera import PiCamera

camera = PiCamera()
camera.resolution = (640, 480)
camera.start_preview()
time.sleep(2)  # Camera warm-up
camera.capture('image.jpg')
```

### USB Webcam
```python
import cv2

cap = cv2.VideoCapture(0)
ret, frame = cap.read()
cv2.imwrite('image.jpg', frame)
cap.release()
```

## Face Recognition

### Using face_recognition Library
```python
import face_recognition

# Load known face embeddings
known_encodings = load_cached_embeddings()

# Capture image
image = capture_image()

# Find faces
face_locations = face_recognition.face_locations(image)
face_encodings = face_recognition.face_encodings(image, face_locations)

# Compare
for face_encoding in face_encodings:
    matches = face_recognition.compare_faces(
        known_encodings, 
        face_encoding, 
        tolerance=0.6
    )
    if True in matches:
        # Grant access
        unlock_door()
```

## Configuration

### Configuration File
```python
# config.py
BACKEND_URL = "http://your-backend-url/api/v1"
SYNC_INTERVAL = 300  # 5 minutes
FACE_TOLERANCE = 0.6
UNLOCK_DURATION = 2  # seconds
CAMERA_RESOLUTION = (640, 480)
```

### Environment Variables
```bash
export BACKEND_URL="http://your-backend-url"
export HOME_ID="your-home-id"
export API_TOKEN="your-api-token"
```

## Running the Edge Device

### Development
```bash
cd edge
python main.py
```

### Production (as service)
```bash
# Create systemd service
sudo nano /etc/systemd/system/homeguard-edge.service

[Unit]
Description=HomeGuard AI Edge Device
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/HomeGuardAI/edge
ExecStart=/home/pi/HomeGuardAI/edge/venv/bin/python main.py
Restart=always

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl enable homeguard-edge
sudo systemctl start homeguard-edge
```

## Security Considerations

### Local Storage
- Face embeddings cached securely
- Access logs stored locally
- Encryption for sensitive data (future)

### Network Security
- HTTPS for all API calls
- Token-based authentication
- Secure credential storage

### Physical Security
- Secure device mounting
- Tamper detection (future)
- Encrypted storage

## Troubleshooting

### Camera Not Working
```bash
# Check camera connection
vcgencmd get_camera

# Enable camera
sudo raspi-config
# Interface Options > Camera > Enable

# Test camera
raspistill -o test.jpg
```

### GPIO Issues
```bash
# Check GPIO permissions
groups
# Add user to gpio group
sudo usermod -a -G gpio $USER

# Test GPIO
python -c "import RPi.GPIO as GPIO; print('GPIO OK')"
```

### Network Issues
```bash
# Check network connection
ping google.com

# Check backend connectivity
curl http://your-backend-url/api/v1/health
```

### Face Recognition Issues
- Ensure good lighting
- Check camera focus
- Verify face embeddings loaded
- Check tolerance settings

## Performance Optimization

### Camera Settings
- Lower resolution for faster processing
- Adjust frame rate
- Optimize image quality

### Recognition Optimization
- Cache embeddings in memory
- Batch comparisons
- Use optimized face_recognition settings

### Network Optimization
- Batch sync operations
- Compress data transfers
- Use efficient protocols

## Future Enhancements

- QR code scanning support
- RFID card reader integration
- Voice recognition
- Anomaly detection
- Local alert system
- Battery backup support
- Advanced logging
- Remote configuration
- Over-the-air updates
- Multi-camera support

## Schematic Reference

Based on the KiCad schematic:
- **12V Power Source** → **Barrel Jack** → **Relay**
- **Raspberry Pi GPIO 16** → **Relay Control**
- **Relay** → **Solenoid Lock**
- **Camera** → **Raspberry Pi CSI/USB**
- **Combined Ground** for all components

## Maintenance

### Regular Tasks
- Update face embeddings cache
- Clear old access logs
- Monitor disk space
- Check camera lens cleanliness
- Verify GPIO connections

### Logs
- Access logs stored locally
- System logs in `/var/log/`
- Application logs in edge device directory

---

**Last Updated**: 2024

