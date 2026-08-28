import { GestureDetectionResult, GestureType, HandLandmark, Handedness } from '../../types';

// Euclidean distance between two 2D/3D points
export function distance(p1: HandLandmark, p2: HandLandmark): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// 2D angle in degrees from p1 to p2
export function angleBetween(p1: HandLandmark, p2: HandLandmark): number {
  const rad = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  let deg = (rad * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return deg;
}

// Finger landmark indices in MediaPipe Hands:
// Thumb: 1, 2, 3, 4 (tip)
// Index: 5, 6, 7, 8 (tip)
// Middle: 9, 10, 11, 12 (tip)
// Ring: 13, 14, 15, 16 (tip)
// Pinky: 17, 18, 19, 20 (tip)
// Wrist: 0

export interface HandVelocityTracker {
  lastPos: { x: number; y: number } | null;
  lastTime: number;
  vx: number;
  vy: number;
  swipeHistory: { dx: number; dy: number; time: number }[];
}

export function createVelocityTracker(): HandVelocityTracker {
  return {
    lastPos: null,
    lastTime: Date.now(),
    vx: 0,
    vy: 0,
    swipeHistory: [],
  };
}

export function updateVelocityTracker(
  tracker: HandVelocityTracker,
  currentPos: { x: number; y: number }
): { vx: number; vy: number; swipe: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | null } {
  const now = Date.now();
  const dt = Math.max(now - tracker.lastTime, 16);

  let vx = 0;
  let vy = 0;
  let swipe: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | null = null;

  if (tracker.lastPos) {
    const dx = currentPos.x - tracker.lastPos.x;
    const dy = currentPos.y - tracker.lastPos.y;
    vx = (dx / dt) * 1000; // normalized units per second
    vy = (dy / dt) * 1000;

    tracker.swipeHistory.push({ dx, dy, time: now });
    // Keep last 300ms
    tracker.swipeHistory = tracker.swipeHistory.filter((item) => now - item.time < 300);

    const totalDx = tracker.swipeHistory.reduce((sum, i) => sum + i.dx, 0);
    const totalDy = tracker.swipeHistory.reduce((sum, i) => sum + i.dy, 0);

    const SWIPE_THRESHOLD = 0.18; // normalized distance in window
    if (Math.abs(totalDx) > SWIPE_THRESHOLD && Math.abs(totalDx) > Math.abs(totalDy) * 1.4) {
      swipe = totalDx > 0 ? 'RIGHT' : 'LEFT';
      tracker.swipeHistory = []; // Reset after swipe detection
    } else if (Math.abs(totalDy) > SWIPE_THRESHOLD && Math.abs(totalDy) > Math.abs(totalDx) * 1.4) {
      swipe = totalDy > 0 ? 'DOWN' : 'UP';
      tracker.swipeHistory = [];
    }
  }

  tracker.lastPos = { ...currentPos };
  tracker.lastTime = now;
  tracker.vx = vx;
  tracker.vy = vy;

  return { vx, vy, swipe };
}

export function detectGesture(
  landmarks: HandLandmark[],
  handedness: Handedness = 'Right',
  tracker?: HandVelocityTracker
): GestureDetectionResult {
  if (!landmarks || landmarks.length < 21) {
    return {
      gesture: 'NONE',
      confidence: 0,
      handedness,
      landmarks: [],
      wrist: { x: 0, y: 0 },
      palmCenter: { x: 0, y: 0 },
      indexTip: { x: 0, y: 0 },
      thumbTip: { x: 0, y: 0 },
      pinchDistance: 1,
      rotationAngle: 0,
      velocity: { vx: 0, vy: 0 },
      rawGesture: 'NONE',
    };
  }

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  const thumbMcp = landmarks[2];
  const indexMcp = landmarks[5];
  const middleMcp = landmarks[9];
  const ringMcp = landmarks[13];
  const pinkyMcp = landmarks[17];

  const indexPip = landmarks[6];
  const middlePip = landmarks[10];
  const ringPip = landmarks[14];
  const pinkyPip = landmarks[18];

  // Palm center
  const palmCenter: HandLandmark = {
    x: (wrist.x + indexMcp.x + middleMcp.x + ringMcp.x + pinkyMcp.x) / 5,
    y: (wrist.y + indexMcp.y + middleMcp.y + ringMcp.y + pinkyMcp.y) / 5,
    z: ((wrist.z || 0) + (indexMcp.z || 0) + (middleMcp.z || 0) + (ringMcp.z || 0) + (pinkyMcp.z || 0)) / 5,
  };

  // Hand scale reference (wrist to middle MCP)
  const handScale = distance(wrist, middleMcp) || 0.2;

  // Distances normalized by handScale
  const pinchDist = distance(thumbTip, indexTip) / handScale;
  const twoFingerPinchDist = distance(indexTip, middleTip) / handScale;

  // Finger extension checks (relative to MCP distance from wrist)
  const isIndexExtended = distance(indexTip, wrist) > distance(indexPip, wrist) * 1.15;
  const isMiddleExtended = distance(middleTip, wrist) > distance(middlePip, wrist) * 1.15;
  const isRingExtended = distance(ringTip, wrist) > distance(ringPip, wrist) * 1.15;
  const isPinkyExtended = distance(pinkyTip, wrist) > distance(pinkyPip, wrist) * 1.15;
  const isThumbExtended = distance(thumbTip, indexMcp) > handScale * 0.7;

  // Rotation angle of hand (vector from wrist to middle MCP)
  const rotationAngle = angleBetween(wrist, middleMcp);

  // Velocity and swipe calculation
  let vx = 0;
  let vy = 0;
  let detectedSwipe: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | null = null;
  if (tracker) {
    const vResult = updateVelocityTracker(tracker, palmCenter);
    vx = vResult.vx;
    vy = vResult.vy;
    detectedSwipe = vResult.swipe;
  }

  const speed = Math.sqrt(vx * vx + vy * vy);

  let gesture: GestureType = 'NONE';
  let confidence = 0.85;

  // 1. Check Swipes first if high velocity swipe was triggered
  if (detectedSwipe) {
    if (detectedSwipe === 'LEFT') gesture = 'SWIPE_LEFT';
    else if (detectedSwipe === 'RIGHT') gesture = 'SWIPE_RIGHT';
    else if (detectedSwipe === 'UP') gesture = 'SWIPE_UP';
    else if (detectedSwipe === 'DOWN') gesture = 'SWIPE_DOWN';
    confidence = 0.94;
  }
  // 2. Pinch Gesture (thumbTip close to indexTip)
  else if (pinchDist < 0.35) {
    if (speed > 1.2) {
      gesture = 'PINCH_MOVE';
      confidence = 0.95;
    } else {
      gesture = 'PINCH';
      confidence = 0.96;
    }
  }
  // 3. Two Finger Pinch (Index and Middle close together, pinching)
  else if (isIndexExtended && isMiddleExtended && twoFingerPinchDist < 0.25 && !isRingExtended && !isPinkyExtended) {
    gesture = 'TWO_FINGER_PINCH';
    confidence = 0.92;
  }
  // 4. Pointing (Only index finger extended) -> Air Canvas Drawing
  else if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    gesture = 'POINTING';
    confidence = 0.93;
  }
  // 5. Peace sign (Index & Middle extended, Ring & Pinky curled)
  else if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended && twoFingerPinchDist > 0.35) {
    gesture = 'PEACE';
    confidence = 0.91;
  }
  // 6. Fist (All fingers curled towards palm)
  else if (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended && !isThumbExtended) {
    gesture = 'FIST';
    confidence = 0.95;
  }
  // 7. Open Palm (All 5 fingers extended outward)
  else if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended && isThumbExtended) {
    gesture = 'OPEN_PALM';
    confidence = 0.97;
  }
  // 8. Thumbs Up (Thumb extended upward, all other fingers closed)
  else if (isThumbExtended && !isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended && thumbTip.y < wrist.y) {
    gesture = 'THUMBS_UP';
    confidence = 0.92;
  }
  else {
    gesture = 'NONE';
    confidence = 0.5;
  }

  return {
    gesture,
    confidence,
    handedness,
    landmarks,
    wrist,
    palmCenter,
    indexTip,
    thumbTip,
    pinchDistance: pinchDist,
    rotationAngle,
    velocity: { vx, vy },
    rawGesture: gesture,
  };
}

// Multi-hand comparison for Two-Hand Zoom
export function detectTwoHandGestures(
  hand1: GestureDetectionResult,
  hand2: GestureDetectionResult,
  prevTwoHandDistance: number | null
): { gesture: GestureType; distance: number; scaleFactor: number } {
  const d = distance(hand1.palmCenter, hand2.palmCenter);
  let scaleFactor = 1.0;
  let gesture: GestureType = 'NONE';

  if (prevTwoHandDistance !== null && prevTwoHandDistance > 0.05) {
    const diff = d - prevTwoHandDistance;
    if (Math.abs(diff) > 0.015) {
      gesture = 'TWO_HAND_ZOOM';
      scaleFactor = d / prevTwoHandDistance;
    }
  }

  return { gesture, distance: d, scaleFactor };
}
