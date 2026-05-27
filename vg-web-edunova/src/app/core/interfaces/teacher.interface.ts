export interface Teacher {
  id?: number;
  personId: number;
  userId?: number;
  teacherCode: string;
  specialty?: string;
  professionalTitle?: string;
  hireDate?: string;
  contractType?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  
  // Campos para mostrar en UI
  personName?: string;
  personDocument?: string;
}

export interface TeacherRequest {
  institutionId: number;
  personId: number;
  userId?: number;
  teacherCode: string;
  specialty?: string;
  professionalTitle?: string;
  hireDate?: string;
  contractType?: string;
}

export interface PersonOption {
  id: number;
  name: string;
  documentNumber: string;
}