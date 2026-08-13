import { MentorTier } from "@prisma/client";

export enum CollegeType {
  IIT = "IIT",
  NIT = "NIT",
  IIIT = "IIIT",
  IIM = "IIM",
  AIIMS = "AIIMS",
  BITS = "BITS",
  STATE = "STATE",
  PRIVATE = "PRIVATE",
  OTHER = "OTHER",
}

export interface CollegeDomainData {
  domain: string;
  collegeName: string;
  tier: MentorTier;
  type: CollegeType;
  state?: string;
  city?: string;
}
