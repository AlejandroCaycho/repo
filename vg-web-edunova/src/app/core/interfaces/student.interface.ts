export interface Student {
  id?: number;
  personId: number;
  gradeId: number;
  academicYearId: number;
  enrollmentNumber: string;
  studentCode?: string;
  modularCode?: string;
  admissionDate?: string;
  previousSchool?: string;
  academicStatus?: string;
  generalAverage?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  
  // Campos para mostrar en UI
  personName?: string;
  personDocument?: string;
  gradeName?: string;
  academicYearName?: string;
}

export interface StudentRequest {
  institutionId: number;
  personId: number;
  gradeId: number;
  academicYearId: number;
  enrollmentNumber: string;
  studentCode?: string;
  modularCode?: string;
  admissionDate?: string;
  previousSchool?: string;
  academicStatus?: string;
}

export interface PersonOption {
  id: number;
  name: string;
  documentNumber: string;
}