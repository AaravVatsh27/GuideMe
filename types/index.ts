export type UserRole = "student" | "mentor" | "admin";
export type SessionStatus =
  | "draft"
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "refunded"
  | "no_show";
export type MentorVerificationStatus = "pending" | "verified" | "rejected";
export type MeetingProvider = "daily";
export type SessionDurationMinutes = 30 | 45;

export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SocialLinks {
  instagram?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  whatsapp?: string | null;
}

export interface PlatformUser extends BaseEntity {
  name: string;
  email: string;
  image?: string | null;
  role: UserRole;
  phone?: string | null;
  bio?: string | null;
  timezone?: string | null;
}

export interface StudentProfile extends BaseEntity {
  userId: string;
  currentStage: string;
  targetStreams: string[];
  goals: string[];
  preferredLanguages: string[];
}

export interface MentorProfile extends BaseEntity {
  userId: string;
  headline: string;
  bio: string;
  education: string;
  expertise: string[];
  languages: string[];
  priceInr: number;
  freeIntroEnabled: boolean;
  introDurationMinutes: number;
  sessionDurations: SessionDurationMinutes[];
  verificationStatus: MentorVerificationStatus;
  ratingAverage?: number | null;
  totalReviews?: number;
  totalSessions?: number;
  isActive: boolean;
  socialLinks?: SocialLinks;
}

export interface SessionBooking extends BaseEntity {
  mentorId: string;
  studentId: string;
  scheduledAt: Date | string;
  durationMinutes: SessionDurationMinutes;
  priceInr: number;
  platformFeeInr: number;
  mentorPayoutInr: number;
  status: SessionStatus;
  introCall: boolean;
  meetingProvider: MeetingProvider;
  meetingRoomUrl?: string | null;
  paymentOrderId?: string | null;
  paymentId?: string | null;
  notes?: string | null;
}

export interface MentorReview extends BaseEntity {
  sessionId: string;
  mentorId: string;
  studentId: string;
  rating: number;
  comment?: string | null;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
