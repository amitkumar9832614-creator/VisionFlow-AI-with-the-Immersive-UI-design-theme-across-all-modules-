/**
 * VisionFlow AI Types and Interfaces
 */

export type HandLandmark = {
  x: number;
  y: number;
  z?: number;
};

export type Handedness = 'Left' | 'Right';

export type GestureType =
  | 'NONE'
  | 'OPEN_PALM'
  | 'FIST'
  | 'PINCH'
  | 'PINCH_MOVE'
  | 'TWO_FINGER_PINCH'
  | 'POINTING'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT'
  | 'SWIPE_UP'
  | 'SWIPE_DOWN'
  | 'ROTATE'
  | 'ROTATE_CLOCKWISE'
  | 'ROTATE_COUNTER'
  | 'TWO_HAND_ZOOM'
  | 'PEACE'
  | 'THUMBS_UP';

export interface GestureDetectionResult {
  gesture: GestureType;
  confidence: number;
  handedness: Handedness;
  landmarks: HandLandmark[];
  wrist: HandLandmark;
  palmCenter: HandLandmark;
  indexTip: HandLandmark;
  thumbTip: HandLandmark;
  pinchDistance: number;
  rotationAngle: number;
  velocity: { vx: number; vy: number };
  rawGesture: GestureType;
}

export interface GestureMappingConfig {
  openPalm: string;
  fist: string;
  pinch: string;
  pinchMove: string;
  twoFingerPinch: string;
  swipeLeft: string;
  swipeRight: string;
  swipeUp: string;
  swipeDown: string;
  twoHandZoom: string;
  rotation: string;
  pointing: string;
}

export type CommandIntent =
  | 'IMAGE_SEARCH'
  | 'SEARCH_IMAGE'
  | 'IMAGE_GENERATE'
  | 'GENERATE_IMAGE'
  | 'IMAGE_EDIT'
  | 'EDIT_IMAGE'
  | 'CREATE_VARIATION'
  | 'IMAGE_DELETE'
  | 'IMAGE_SAVE'
  | 'SAVE_IMAGE'
  | 'IMAGE_DOWNLOAD'
  | 'ZOOM'
  | 'MOVE'
  | 'ROTATE'
  | 'RESIZE'
  | 'TRANSFORM_IMAGE'
  | 'SELECT_OBJECT'
  | 'NEXT_IMAGE'
  | 'PREVIOUS_IMAGE'
  | 'CAMERA_START'
  | 'CAMERA_STOP'
  | 'GESTURE_MODE'
  | 'AIR_CANVAS'
  | 'AIR_CANVAS_DRAW'
  | 'RESET'
  | 'RESET_CANVAS'
  | 'HELP'
  | 'VISION_ANALYZE'
  | 'VISION_QUERY'
  | 'TRANSFORM_DRAWING'
  | 'GENERAL_ASSIST'
  | 'CHANGE_FILTER'
  | 'APPLY_FILTER';

export interface ParsedAICommand {
  intent: CommandIntent;
  confidence: number;
  query?: string;
  prompt?: string;
  editInstruction?: string;
  actionPayload?: {
    query?: string;
    prompt?: string;
    instruction?: string;
    filterPreset?: string;
    scale?: number;
    rotation?: number;
    deltaX?: number;
    deltaY?: number;
    brightness?: number;
    [key: string]: any;
  };
  parameters?: {
    scale?: number;
    rotation?: number;
    dx?: number;
    dy?: number;
    brightness?: number;
    contrast?: number;
    filter?: string;
    style?: string;
  };
  explanation?: string;
  spokenResponse?: string;
}

export type ImageSourceType = 'AI_GENERATED' | 'SEARCHED_IMAGE' | 'USER_UPLOAD' | 'AIR_DRAWING';

export interface CanvasImageObject {
  id: string;
  url: string;
  thumbnailUrl?: string;
  title: string;
  prompt?: string;
  sourceType: ImageSourceType;
  attribution?: string;
  createdAt: number;
  originalUrl?: string;
  transforms: {
    x: number; // Percentage or px offset
    y: number;
    scale: number; // 1.0 default
    rotation: number; // In degrees
    brightness: number; // 100% default
    contrast: number; // 100% default
    saturation: number; // 100% default
    blur: number; // 0 default
    hueRotate: number; // 0 deg default
    filterPreset: string; // 'none' | 'cinematic' | 'cyberpunk' | 'warm' | 'cool' | 'vintage' | '3d-render'
  };
  isSelected: boolean;
}

export interface AirCanvasStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  lineWidth: number;
}

export interface CommandHistoryItem {
  id: string;
  timestamp: number;
  type: 'VOICE' | 'GESTURE' | 'SYSTEM' | 'VISION';
  input: string;
  actionSummary: string;
  intent?: CommandIntent;
  gesture?: GestureType;
  snapshotUrl?: string;
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  intent?: CommandIntent;
  actionResult?: {
    type: 'image' | 'analysis' | 'status';
    data?: any;
  };
  isLoading?: boolean;
}

export interface VisionAnalysisResult {
  description: string;
  detectedObjects: string[];
  suggestedPrompts: string[];
  timestamp: number;
}
