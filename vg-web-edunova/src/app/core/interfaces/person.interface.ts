export interface Person {
  id?: number;
  institutionId: number;
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  ubigeo?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface PersonRequest {
  institutionId: number;
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  ubigeo?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
}