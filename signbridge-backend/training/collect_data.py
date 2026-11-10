"""
ISL Data Collection Script
===========================
Run this script with your webcam to collect hand landmark sequences for training.

Usage:
  python collect_data.py --sign "Namaste" --samples 50

Controls:
  SPACE  = Start recording a 30-frame sequence
  Q      = Quit and save collected data

Install dependencies:
  pip install opencv-python mediapipe numpy
"""

import argparse
import os
import json
import time

try:
    import cv2
    import mediapipe as mp
    import numpy as np
except ImportError:
    print("Install: pip install opencv-python mediapipe numpy")
    raise

SEQUENCE_LEN = 30
OUTPUT_DIR   = os.path.join(os.path.dirname(__file__), "data")


def collect(sign_name: str, num_samples: int):
    safe_name = sign_name.replace("/", "_").replace(" ", "_")
    target_dir = os.path.join(OUTPUT_DIR, safe_name)
    os.makedirs(target_dir, exist_ok=True)

    mp_hands = mp.solutions.hands
    hands    = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7)
    cap      = cv2.VideoCapture(0)
    sample_count = 0

    print(f"\nCollecting {num_samples} samples for sign: '{sign_name}'")
    print("Press SPACE to record one 30-frame sequence. Press Q to quit.\n")

    while sample_count < num_samples:
        ret, frame = cap.read()
        if not ret:
            break

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results   = hands.process(frame_rgb)

        cv2.putText(frame, f"Sign: {sign_name}  ({sample_count}/{num_samples})",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        cv2.putText(frame, "SPACE=Record  Q=Quit",
                    (10, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)

        cv2.imshow("SignBridge Data Collection", frame)
        key = cv2.waitKey(1) & 0xFF

        if key == ord('q'):
            break

        if key == ord(' '):
            sequence = []
            print(f"Recording sample {sample_count + 1}...", end=" ", flush=True)

            for _ in range(SEQUENCE_LEN):
                ret, frame = cap.read()
                if not ret:
                    break
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results   = hands.process(frame_rgb)

                frame_data = []
                if results.multi_hand_landmarks:
                    for lm in results.multi_hand_landmarks[0].landmark:
                        frame_data.append({"x": lm.x, "y": lm.y, "z": lm.z})
                else:
                    frame_data = [{"x": 0.0, "y": 0.0, "z": 0.0}] * 21

                sequence.append(frame_data)
                time.sleep(1 / 30)

            filename = os.path.join(target_dir, f"sample_{sample_count:04d}.json")
            with open(filename, "w") as f:
                json.dump(sequence, f)
            sample_count += 1
            print("✓ Saved")

    cap.release()
    cv2.destroyAllWindows()
    print(f"\nDone! Collected {sample_count} samples for '{sign_name}'.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--sign",    required=True, help="ISL sign label to collect")
    parser.add_argument("--samples", type=int, default=50, help="Number of samples per sign")
    args = parser.parse_args()
    collect(args.sign, args.samples)

