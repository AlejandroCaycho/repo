export type StudentGradeMovementType = 'promotion' | 'repetition' | 'transfer' | 'withdrawal';

export interface StudentGradeHistoryRequest {
  institutionId: number;
  studentId: number;
  previousGradeId?: number | null;
  newGradeId: number;
  academicYearId: number;
  movementType: StudentGradeMovementType;
  reason?: string | null;
  authorizedBy?: number | null;
  changeDate?: string | null;
}

export interface StudentGradeHistoryResponse {
  id: number;
  studentId: number;
  previousGradeId?: number | null;
  newGradeId: number;
  academicYearId: number;
  movementType: StudentGradeMovementType;
  reason?: string | null;
  authorizedBy?: number | null;
  changeDate: string;
  createdAt?: string;

  studentName?: string;
  previousGradeName?: string;
  newGradeName?: string;
  academicYearName?: string;
}
