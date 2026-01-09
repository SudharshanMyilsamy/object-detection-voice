
export interface DetectionResult {
  label: string;
  confidence: number;
  box_2d?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
}

export type TabType = 'overview' | 'code' | 'preview';

export interface ProjectConfig {
  minConfidence: number;
  cooldownSeconds: number;
  modelType: 'YOLOv8-nano' | 'MobileNet SSD';
}
