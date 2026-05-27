export interface GradingScale {
  id?: number;
  institutionId: number;
  name: string;
  description?: string;
  type: string;
  minScore: number;
  maxScore: number;
  passingScore: number;
  rounding?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface GradingScaleRequest {
  institutionId: number;
  name: string;
  description?: string;
  type: string;
  minScore: number;
  maxScore: number;
  passingScore: number;
  rounding?: boolean;
}