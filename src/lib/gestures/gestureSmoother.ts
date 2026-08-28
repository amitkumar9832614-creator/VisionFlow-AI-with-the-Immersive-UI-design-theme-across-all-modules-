import { GestureType } from '../../types';

export class GestureSmoother {
  private alpha: number; // Smoothing factor (0 = full smoothing, 1 = raw)
  private currentGesture: GestureType = 'NONE';
  private gestureVoteCount: Map<GestureType, number> = new Map();
  private voteThreshold: number = 3; // consecutive frames required for stable gesture
  private lastTriggerTime: Map<GestureType, number> = new Map();
  private debounceMs: number = 600; // debounce for discrete swipe/save actions

  // Smoothed position & rotation
  private smoothedX: number = 0;
  private smoothedY: number = 0;
  private smoothedRotation: number = 0;
  private smoothedScale: number = 1.0;
  private isInitialized: boolean = false;

  constructor(alpha: number = 0.35, debounceMs: number = 600) {
    this.alpha = alpha;
    this.debounceMs = debounceMs;
  }

  public setAlpha(alpha: number) {
    this.alpha = Math.max(0.05, Math.min(1.0, alpha));
  }

  // Smooth position coordinate
  public smoothPosition(x: number, y: number): { x: number; y: number } {
    if (!this.isInitialized) {
      this.smoothedX = x;
      this.smoothedY = y;
      this.isInitialized = true;
      return { x, y };
    }

    // Dead-zone threshold to prevent micro-jitter
    const dx = x - this.smoothedX;
    const dy = y - this.smoothedY;
    const dist = Math.hypot(dx, dy);

    if (dist < 0.003) {
      return { x: this.smoothedX, y: this.smoothedY };
    }

    this.smoothedX = this.smoothedX + this.alpha * dx;
    this.smoothedY = this.smoothedY + this.alpha * dy;

    return { x: this.smoothedX, y: this.smoothedY };
  }

  // Smooth rotation angle (handling 0-360 wrap-around)
  public smoothRotation(angle: number): number {
    let diff = angle - this.smoothedRotation;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;

    // Small dead-zone
    if (Math.abs(diff) < 1.0) {
      return this.smoothedRotation;
    }

    this.smoothedRotation += this.alpha * diff;
    if (this.smoothedRotation < 0) this.smoothedRotation += 360;
    if (this.smoothedRotation >= 360) this.smoothedRotation -= 360;

    return this.smoothedRotation;
  }

  // Smooth scaling factor
  public smoothScale(scale: number): number {
    this.smoothedScale = this.smoothedScale + this.alpha * (scale - this.smoothedScale);
    return this.smoothedScale;
  }

  // Debounced and vote-filtered gesture classifier
  public processGesture(rawGesture: GestureType): {
    stableGesture: GestureType;
    isNewlyTriggered: boolean;
  } {
    const now = Date.now();

    // Increment vote for raw gesture
    const count = (this.gestureVoteCount.get(rawGesture) || 0) + 1;
    this.gestureVoteCount.set(rawGesture, count);

    // Decay other gestures
    for (const [g, c] of this.gestureVoteCount.entries()) {
      if (g !== rawGesture) {
        this.gestureVoteCount.set(g, Math.max(0, c - 1));
      }
    }

    let isNewlyTriggered = false;

    // If votes exceed threshold, switch stable gesture
    if (count >= this.voteThreshold && rawGesture !== this.currentGesture) {
      const isDiscrete =
        rawGesture === 'SWIPE_LEFT' ||
        rawGesture === 'SWIPE_RIGHT' ||
        rawGesture === 'SWIPE_UP' ||
        rawGesture === 'SWIPE_DOWN' ||
        rawGesture === 'THUMBS_UP';

      const lastTime = this.lastTriggerTime.get(rawGesture) || 0;
      if (!isDiscrete || now - lastTime > this.debounceMs) {
        this.currentGesture = rawGesture;
        this.lastTriggerTime.set(rawGesture, now);
        isNewlyTriggered = true;
      }
    }

    return {
      stableGesture: this.currentGesture,
      isNewlyTriggered,
    };
  }

  public reset() {
    this.isInitialized = false;
    this.currentGesture = 'NONE';
    this.gestureVoteCount.clear();
  }
}
