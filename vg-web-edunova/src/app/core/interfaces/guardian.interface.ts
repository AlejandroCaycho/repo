export interface Guardian {
  id?: number;
  personId: number;
  occupation?: string;
  company?: string;
  position?: string;
  educationLevel?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  
  // Campos para mostrar en UI
  personName?: string;
  personDocument?: string;
}

export interface GuardianRequest {
  institutionId: number;
  personId: number;
  occupation?: string;
  company?: string;
  position?: string;
  educationLevel?: string;
}

export interface PersonOption {
  id: number;
  name: string;
  documentNumber: string;
}