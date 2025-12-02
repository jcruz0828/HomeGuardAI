#!/usr/bin/env python3
"""
Camera Face Detection for HomeGuard Family
Uses face embeddings from Supabase data for Jose and Beautiful Felix
"""

import cv2
import numpy as np
import face_recognition
import json

class HomeGuardFaceDetector:
    """Face detection for HomeGuard family members"""
    
    def __init__(self):
        # Known family members with their face embeddings
        self.known_faces = {
            "Jose": {
                "id": "1c202683-44b7-4dfb-aa54-d69687a6bc94",
                "embedding": np.array([
                    -0.08730487525463104, 0.048169657588005066, -0.03427836298942566, -0.025546537712216377,
                    -0.006310805678367615, -0.07933547347784042, 0.012530720792710781, -0.12153133749961853,
                    0.17661955952644348, -0.08019175380468369, 0.3086265027523041, -0.04337536543607712,
                    -0.16710887849330902, -0.09832894057035446, -0.02646084874868393, 0.08840686082839966,
                    -0.19197088479995728, -0.03913487493991852, -0.03758035600185394, -0.054992057383060455,
                    -0.0012167282402515411, -0.03070126473903656, 0.02418483793735504, 0.09565405547618866,
                    -0.07197947055101395, -0.24471434950828552, -0.054418593645095825, -0.1523052155971527,
                    0.1127895712852478, -0.11566421389579773, -0.05529717728495598, 0.07814272493124008,
                    -0.15387988090515137, -0.096854567527771, 0.008672311902046204, 0.02271692082285881,
                    -0.04264238104224205, -0.018757060170173645, 0.23192459344863892, -0.03696839511394501,
                    -0.10544595867395401, -0.024587348103523254, -0.008971288800239563, 0.3033560514450073,
                    0.1731063723564148, 5.062650889158249E-4, -0.018941078335046768, -0.10201025009155273,
                    0.12470273673534393, -0.2135000377893448, 0.0654887929558754, 0.10319504141807556,
                    0.17778459191322327, 0.03776925802230835, -0.0041017308831214905, -0.12234437465667725,
                    -0.013286590576171875, 0.11608576774597168, -0.20837119221687317, 0.0789814367890358,
                    0.08288577198982239, -0.058779776096343994, -0.03249388933181763, -0.016465194523334503,
                    0.22895681858062744, 0.11233164370059967, -0.11757903546094894, -0.07154510170221329,
                    0.1387830674648285, -0.10695759952068329, -0.007737193256616592, 0.06773481518030167,
                    -0.10645738244056702, -0.2513521611690521, -0.18893280625343323, 0.08505432307720184,
                    0.33229008316993713, 0.172787144780159, -0.12782812118530273, 0.040166109800338745,
                    -0.11634627729654312, -0.045754607766866684, 0.10759995132684708, 0.04666248708963394,
                    -0.059282317757606506, -0.05451221019029617, -0.04706314951181412, 0.08157189190387726,
                    0.1319599449634552, -0.05078718811273575, -0.05490180477499962, 0.1649012267589569,
                    -0.050539687275886536, 0.012678563594818115, -0.021470190957188606, -0.009918496012687683,
                    -0.05908568203449249, 0.07564324885606766, -0.11712668836116791, 0.003865450620651245,
                    0.0681651383638382, -0.02570481039583683, 0.07138020545244217, 0.08471642434597015,
                    -0.15798243880271912, 0.11726181954145432, 0.03444596379995346, -0.01388724148273468,
                    0.08257322758436203, -0.02127157151699066, -0.06301729381084442, -0.04138250648975372,
                    0.11402010917663574, -0.2577500343322754, 0.26324495673179626, 0.10141856968402863,
                    0.10504065454006195, 0.16281306743621826, 0.014976061880588531, 0.01810307800769806,
                    0.0637572854757309, -0.058023110032081604, -0.151642844080925, 0.001730618067085743,
                    0.11132434010505676, 0.010299742221832275, 0.10142870247364044, -0.02754620462656021
                ]),
                "color": (0, 255, 0)  # Green
            },
           
               
        }
        
        self.face_tolerance = 0.6
        print("👥 Loaded face embeddings for family members:")
        for name, data in self.known_faces.items():
            print(f"   ✅ {name} (ID: {data['id'][:8]}...)")
    
    def detect_and_recognize_faces(self, frame: np.ndarray) -> list:
        """Detect and recognize faces in a frame"""
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Find face locations
        face_locations = face_recognition.face_locations(rgb_frame, model="hog")
        
        if not face_locations:
            return []
        
        # Get face encodings
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
        
        recognized_faces = []
        
        for i, face_encoding in enumerate(face_encodings):
            face_location = face_locations[i]
            
            # Compare with all known faces
            best_match = None
            best_distance = float('inf')
            
            for name, data in self.known_faces.items():
                distance = face_recognition.face_distance([data['embedding']], face_encoding)[0]
                
                if distance < best_distance:
                    best_distance = distance
                    best_match = name
            
            # Check if match is good enough
            if best_match and best_distance <= self.face_tolerance:
                confidence = max(0, 1 - best_distance)
                recognized_faces.append({
                    'location': face_location,
                    'name': best_match,
                    'confidence': confidence,
                    'distance': best_distance,
                    'color': self.known_faces[best_match]['color']
                })
            else:
                recognized_faces.append({
                    'location': face_location,
                    'name': "Unknown",
                    'confidence': 0,
                    'distance': best_distance,
                    'color': (0, 0, 255)  # Red for unknown
                })
        
        return recognized_faces
    
    def draw_face_boxes(self, frame: np.ndarray, recognized_faces: list) -> np.ndarray:
        """Draw bounding boxes and labels on the frame"""
        for face in recognized_faces:
            top, right, bottom, left = face['location']
            name = face['name']
            confidence = face['confidence']
            color = face['color']
            
            # Draw rectangle
            cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
            
            # Draw label background
            label = f"{name} ({confidence:.2f})"
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
            cv2.rectangle(frame, (left, top - label_size[1] - 10), 
                         (left + label_size[0], top), color, -1)
            
            # Draw label text
            cv2.putText(frame, label, (left, top - 5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        return frame
    
    def run(self):
        """Run the face detection"""
        print("🎥 Starting HomeGuard Family Face Detection...")
        print("Press 'q' to quit, 't' to adjust tolerance")
        print(f"Current tolerance: {self.face_tolerance}")
        
        # Initialize camera - try different camera indices
        cap = None
        for camera_index in [0, 1, 2]:
            print(f"Trying camera {camera_index}...")
            cap = cv2.VideoCapture(camera_index)
            if cap.isOpened():
                # Test if we can actually read a frame
                ret, test_frame = cap.read()
                if ret and test_frame is not None:
                    print(f"✅ Camera {camera_index} is working")
                    break
                else:
                    print(f"❌ Camera {camera_index} opened but can't read frames")
                    cap.release()
                    cap = None
            else:
                print(f"❌ Could not open camera {camera_index}")
                if cap:
                    cap.release()
                    cap = None
        
        if cap is None:
            print("❌ No working camera found")
            return
        
        # Set camera properties
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FPS, 30)
        
        print("✅ Camera initialized")
        
        frame_count = 0
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    print("❌ Failed to read from camera")
                    print("This might be due to:")
                    print("1. Camera permissions not granted")
                    print("2. Camera being used by another application")
                    print("3. Camera hardware issue")
                    break
                
                frame_count += 1
                
                # Detect and recognize faces every few frames for performance
                if frame_count % 3 == 0:
                    recognized_faces = self.detect_and_recognize_faces(frame)
                else:
                    # Use previous detection results
                    recognized_faces = getattr(self, '_last_recognized_faces', [])
                
                # Store for next frame
                self._last_recognized_faces = recognized_faces
                
                # Draw face boxes
                frame = self.draw_face_boxes(frame, recognized_faces)
                
                # Count recognized family members
                family_counts = {}
                for face in recognized_faces:
                    name = face['name']
                    if name != "Unknown":
                        family_counts[name] = family_counts.get(name, 0) + 1
                
                # Add info text
                info_lines = [
                    f"Total Faces: {len(recognized_faces)} | Tolerance: {self.face_tolerance:.2f}",
                    f"Family Members: {', '.join([f'{name}: {count}' for name, count in family_counts.items()])}" if family_counts else "No family members detected"
                ]
                
                for i, line in enumerate(info_lines):
                    cv2.putText(frame, line, (10, 30 + i * 25), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                # Display frame
                cv2.imshow('HomeGuard Family Face Detection', frame)
                
                # Handle key presses
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    break
                elif key == ord('t'):
                    # Adjust tolerance
                    print(f"\nCurrent tolerance: {self.face_tolerance}")
                    print("Enter new tolerance (0.1-1.0, lower = more strict):")
                    try:
                        new_tolerance = float(input())
                        if 0.1 <= new_tolerance <= 1.0:
                            self.face_tolerance = new_tolerance
                            print(f"Tolerance updated to: {self.face_tolerance}")
                        else:
                            print("Invalid tolerance value")
                    except ValueError:
                        print("Invalid input")
        
        except KeyboardInterrupt:
            print("\n⏹️  Stopping face detection...")
        
        finally:
            cap.release()
            cv2.destroyAllWindows()
            print("✅ Camera released")

def main():
    """Main function"""
    print("🏠 HomeGuard Family Face Detection")
    print("=" * 40)
    
    # Create and run detector
    detector = HomeGuardFaceDetector()
    detector.run()

if __name__ == "__main__":
    main()
