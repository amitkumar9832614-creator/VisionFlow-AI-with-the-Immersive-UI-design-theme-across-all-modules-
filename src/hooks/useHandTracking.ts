import React, { useEffect, useRef, useState, useCallback, RefObject } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { GestureDetectionResult, GestureType, HandLandmark, Handedness } from '../types';
import { createVelocityTracker, detectGesture, detectTwoHandGestures, HandVelocityTracker } from '../lib/gestures/gestureDetector';
import { GestureSmoother } from '../lib/gestures/gestureSmoother';

// Hand landmark connection pairs for skeleton rendering
export const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base connection
  [5, 9], [9, 13], [13, 17]
];

export interface UseHandTrackingProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isCameraActive: boolean;
  onGestureAction?: (gesture: GestureType, result: GestureDetectionResult, isNew: boolean) => void;
  showOverlay?: boolean;
}

export function useHandTracking({
  videoRef,
  canvasRef,
  isCameraActive,
  onGestureAction,
  showOverlay = true,
}: UseHandTrackingProps) {
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [primaryHandResult, setPrimaryHandResult] = useState<GestureDetectionResult | null>(null);
  const [secondaryHandResult, setSecondaryHandResult] = useState<GestureDetectionResult | null>(null);
  const [activeGesture, setActiveGesture] = useState<GestureType>('NONE');

  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());
  const velocityTrackerRef = useRef<HandVelocityTracker>(createVelocityTracker());
  const gestureSmootherRef = useRef<GestureSmoother>(new GestureSmoother(0.35, 500));
  const prevTwoHandDistRef = useRef<number | null>(null);

  // Initialize MediaPipe HandLandmarker
  useEffect(() => {
    let isMounted = true;

    async function loadLandmarker() {
      try {
        setIsModelLoading(true);
        setModelError(null);

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (!isMounted) return;

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        if (isMounted) {
          landmarkerRef.current = handLandmarker;
          setIsModelLoading(false);
        }
      } catch (err: any) {
        console.warn('Failed to initialize MediaPipe HandLandmarker GPU, trying CPU fallback:', err);
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          );
          if (!isMounted) return;

          const handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          if (isMounted) {
            landmarkerRef.current = handLandmarker;
            setIsModelLoading(false);
          }
        } catch (cpuErr: any) {
          console.error('Failed to load MediaPipe Hands on CPU fallback:', cpuErr);
          if (isMounted) {
            setModelError('Computer vision hand tracking initialization note. You can still use voice and mouse controls.');
            setIsModelLoading(false);
          }
        }
      }
    }

    loadLandmarker();

    return () => {
      isMounted = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  // Main Detection and Skeleton Drawing Loop
  const runDetection = useCallback(() => {
    if (!isCameraActive || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState < 2 || video.videoWidth === 0) {
      animationFrameRef.current = requestAnimationFrame(runDetection);
      return;
    }

    // Match canvas dimensions to video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // FPS calculation
    frameCountRef.current++;
    const now = performance.now();
    if (now - lastFpsTimeRef.current >= 1000) {
      setFps(Math.round((frameCountRef.current * 1000) / (now - lastFpsTimeRef.current)));
      frameCountRef.current = 0;
      lastFpsTimeRef.current = now;
    }

    const landmarker = landmarkerRef.current;
    if (landmarker && video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;

      try {
        const results = landmarker.detectForVideo(video, now);

        if (results.landmarks && results.landmarks.length > 0) {
          const detectedHands: GestureDetectionResult[] = [];

          results.landmarks.forEach((rawLandmarks, handIndex) => {
            const handednessStr = results.handednesses?.[handIndex]?.[0]?.displayName || (handIndex === 0 ? 'Right' : 'Left');
            const handedness: Handedness = handednessStr === 'Left' ? 'Left' : 'Right';

            // Invert x coordinate because camera video is mirrored for selfie view
            const mappedLandmarks: HandLandmark[] = rawLandmarks.map((pt) => ({
              x: 1 - pt.x,
              y: pt.y,
              z: pt.z,
            }));

            const handRes = detectGesture(mappedLandmarks, handedness, handIndex === 0 ? velocityTrackerRef.current : undefined);
            detectedHands.push(handRes);
          });

          const primaryHand = detectedHands[0];
          const secondaryHand = detectedHands[1] || null;

          setPrimaryHandResult(primaryHand);
          setSecondaryHandResult(secondaryHand);

          // Check two-hand gestures if 2 hands detected
          let resolvedGesture = primaryHand.gesture;
          if (secondaryHand) {
            const twoHandRes = detectTwoHandGestures(primaryHand, secondaryHand, prevTwoHandDistRef.current);
            prevTwoHandDistRef.current = twoHandRes.distance;
            if (twoHandRes.gesture === 'TWO_HAND_ZOOM') {
              resolvedGesture = 'TWO_HAND_ZOOM';
            }
          } else {
            prevTwoHandDistRef.current = null;
          }

          // Smooth and filter gesture
          const { stableGesture, isNewlyTriggered } = gestureSmootherRef.current.processGesture(resolvedGesture);
          setActiveGesture(stableGesture);

          if (onGestureAction && stableGesture !== 'NONE') {
            onGestureAction(stableGesture, primaryHand, isNewlyTriggered);
          }

          // Draw skeleton overlays if enabled
          if (showOverlay) {
            detectedHands.forEach((hand, idx) => {
              drawHandSkeleton(ctx, hand.landmarks, canvas.width, canvas.height, idx === 0, hand.gesture);
            });
          }
        } else {
          setPrimaryHandResult(null);
          setSecondaryHandResult(null);
          prevTwoHandDistRef.current = null;
          const { stableGesture } = gestureSmootherRef.current.processGesture('NONE');
          setActiveGesture(stableGesture);
        }
      } catch (detectErr) {
        console.warn('Detection frame skip:', detectErr);
      }
    }

    animationFrameRef.current = requestAnimationFrame(runDetection);
  }, [isCameraActive, showOverlay, onGestureAction, videoRef, canvasRef]);

  // Start / Stop animation frame loop
  useEffect(() => {
    if (isCameraActive) {
      animationFrameRef.current = requestAnimationFrame(runDetection);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setPrimaryHandResult(null);
      setSecondaryHandResult(null);
      setActiveGesture('NONE');
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isCameraActive, runDetection]);

  // Trigger test gesture simulation for rapid testing
  const simulateGesture = useCallback(
    (gesture: GestureType) => {
      const mockResult: GestureDetectionResult = {
        gesture,
        confidence: 0.98,
        handedness: 'Right',
        landmarks: [],
        wrist: { x: 0.5, y: 0.8 },
        palmCenter: { x: 0.5, y: 0.5 },
        indexTip: { x: 0.5, y: 0.3 },
        thumbTip: { x: 0.45, y: 0.35 },
        pinchDistance: gesture === 'PINCH' ? 0.05 : 0.4,
        rotationAngle: 0,
        velocity: { vx: 0, vy: 0 },
        rawGesture: gesture,
      };
      setActiveGesture(gesture);
      setPrimaryHandResult(mockResult);
      if (onGestureAction) {
        onGestureAction(gesture, mockResult, true);
      }
    },
    [onGestureAction]
  );

  return {
    isModelLoading,
    modelError,
    fps,
    primaryHandResult,
    secondaryHandResult,
    activeGesture,
    simulateGesture,
    smoother: gestureSmootherRef.current,
  };
}

// Futuristic Hand Skeleton Visualizer
function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmark[],
  width: number,
  height: number,
  isPrimary: boolean,
  currentGesture: GestureType
) {
  if (!landmarks || landmarks.length < 21) return;

  const primaryColor = isPrimary ? '#38bdf8' : '#c084fc'; // Light cyan vs purple
  const glowColor = isPrimary ? 'rgba(56, 189, 248, 0.45)' : 'rgba(192, 132, 252, 0.45)';
  const jointColor = currentGesture === 'PINCH' || currentGesture === 'PINCH_MOVE' ? '#f43f5e' : '#ffffff';

  ctx.save();

  // 1. Draw connection lines
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = primaryColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
    const p1 = landmarks[startIdx];
    const p2 = landmarks[endIdx];
    if (p1 && p2) {
      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    }
  });

  // 2. Draw Joints
  landmarks.forEach((p, idx) => {
    const x = p.x * width;
    const y = p.y * height;
    const isTip = idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20;

    ctx.beginPath();
    ctx.arc(x, y, isTip ? 5.5 : 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = isTip ? primaryColor : jointColor;
    ctx.shadowColor = isTip ? '#38bdf8' : glowColor;
    ctx.shadowBlur = isTip ? 12 : 6;
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();
  });

  // 3. Highlight Pinch Line if pinching
  if (currentGesture === 'PINCH' || currentGesture === 'PINCH_MOVE') {
    const thumb = landmarks[4];
    const index = landmarks[8];
    ctx.beginPath();
    ctx.moveTo(thumb.x * width, thumb.y * height);
    ctx.lineTo(index.x * width, index.y * height);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 14;
    ctx.stroke();
  }

  // 4. Highlight Pointing Tip if Drawing
  if (currentGesture === 'POINTING') {
    const indexTip = landmarks[8];
    ctx.beginPath();
    ctx.arc(indexTip.x * width, indexTip.y * height, 10, 0, 2 * Math.PI);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 16;
    ctx.stroke();
  }

  ctx.restore();
}
