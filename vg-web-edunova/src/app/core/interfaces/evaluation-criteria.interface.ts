export interface EvaluationCriteria {
  id?: number;
  subjectId?: number;
  academicPeriodId?: number;
  scaleId: number;
  name: string;
  description?: string;
  type: string;  // competence, capacity, performance
  parentId?: number;
  weight?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  
  // Campos para mostrar en UI
  scaleName?: string;
  parentName?: string;
  childrenCount?: number;
}

export interface EvaluationCriteriaRequest {
  institutionId: number;
  subjectId?: number;
  academicPeriodId?: number;
  scaleId: number;
  name: string;
  description?: string;
  type: string;
  parentId?: number;
  weight?: number;
}

export interface ScaleOption {
  id: number;
  name: string;
  type: string;
}