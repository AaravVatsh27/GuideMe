import {
  MentorTier,
  VerificationEvidenceType,
  VerificationProvider,
  VerificationStatus,
} from "@prisma/client";

export interface VerificationEvidenceData {
  id: string;
  mentorId: string;
  type: VerificationEvidenceType;
  provider: VerificationProvider;
  status: VerificationStatus;
  confidence?: number;
  metadata?: Record<string, unknown>;
  verifiedAt?: Date;
  createdAt: Date;
}

export interface VerificationResult {
  status: VerificationStatus;
  tier?: MentorTier;
  confidence?: number;
  evidenceId?: string;
}
