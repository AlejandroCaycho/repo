export interface StudentGuardian {
  guardianId: number;
  studentId: number;
  relationship: string;
  isPrimaryGuardian?: boolean;
  livesWithStudent?: boolean;
  authorizedPickup?: boolean;
  createdAt?: string;

  studentName?: string;
  studentEnrollment?: string;
  guardianName?: string;
  guardianDocument?: string;
}

export interface StudentGuardianRequest {
  guardianId: number;
  studentId: number;
  relationship: string;
  isPrimaryGuardian?: boolean;
  livesWithStudent?: boolean;
  authorizedPickup?: boolean;
}
