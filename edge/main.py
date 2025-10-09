#!/usr/bin/env python3
"""
HomeGuard AI - Simple LED Blink Test
Basic GPIO test for Raspberry Pi
"""

import time
import RPi.GPIO as GPIO

# LED pin configuration
LED_PIN = 18  # GPIO 18 (Pin 12 on Pi)

def setup_gpio():
    """Setup GPIO pins"""
    GPIO.setmode(GPIO.BCM)  # Use BCM pin numbering
    GPIO.setup(LED_PIN, GPIO.OUT)
    print(f"LED connected to GPIO {LED_PIN}")

def blink_led(duration=1.0, cycles=10):
    """Blink LED for specified duration and cycles"""
    print(f"Starting LED blink test - {cycles} cycles, {duration}s each")
    
    for i in range(cycles):
        print(f"Cycle {i+1}/{cycles}")
        
        # Turn LED on
        GPIO.output(LED_PIN, GPIO.HIGH)
        print("  LED ON")
        time.sleep(duration)
        
        # Turn LED off
        GPIO.output(LED_PIN, GPIO.LOW)
        print("  LED OFF")
        time.sleep(duration)
    
    print("Blink test completed!")

def cleanup():
    """Cleanup GPIO pins"""
    GPIO.cleanup()
    print("GPIO cleanup completed")

if __name__ == "__main__":
    try:
        print("HomeGuard AI - LED Blink Test")
        print("=" * 40)
        
        # Setup GPIO
        setup_gpio()
        
        # Run blink test
        blink_led(duration=0.5, cycles=10)
        
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Always cleanup
        cleanup()
        print("Program ended")