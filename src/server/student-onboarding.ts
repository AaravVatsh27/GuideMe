export const STUDENT_ONBOARDING_STORAGE_KEY = "guideme.student-onboarding";

export const STUDENT_CLASS_VALUES = [
  "CLASS_10",
  "CLASS_11",
  "CLASS_12",
  "UG_1",
  "UG_2",
  "UG_3",
  "UG_4",
] as const;

export const BOARD_VALUES = ["CBSE", "ICSE", "STATE", "INTERNATIONAL"] as const;

export const STREAM_VALUES = [
  "SCIENCE_PCM",
  "SCIENCE_PCB",
  "COMMERCE",
  "ARTS",
  "ENGINEERING",
  "MEDICAL",
  "LAW",
  "MANAGEMENT",
  "HIGHER_STUDIES",
  "PLACEMENTS",
  "COMPETITIVE_EXAMS",
  "SKILL_BUILDING",
  "ENTREPRENEURSHIP",
  "UNDECIDED",
] as const;

export const CONFUSION_TYPE_VALUES = [
  "STREAM_SELECTION",
  "EXAM_CHOICE",
  "COLLEGE_SELECTION",
  "CAREER_DIRECTION",
  "SUBJECT_COMBINATION",
  "COACHING_SELECTION",
  "PLANNING_NEXT_TWO_YEARS",
  "POST_GRADUATION_PATH",
] as const;

export const LANGUAGE_VALUES = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Bengali",
  "Gujarati",
] as const;

export const INDIAN_STATE_VALUES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export const MAJOR_INDIAN_CITIES = [
  "Ahmedabad",
  "Bengaluru",
  "Bhopal",
  "Bhubaneswar",
  "Chandigarh",
  "Chennai",
  "Coimbatore",
  "Dehradun",
  "Delhi",
  "Faridabad",
  "Ghaziabad",
  "Gurugram",
  "Guwahati",
  "Hyderabad",
  "Indore",
  "Jaipur",
  "Kanpur",
  "Kochi",
  "Kolkata",
  "Lucknow",
  "Ludhiana",
  "Madurai",
  "Meerut",
  "Mumbai",
  "Mysuru",
  "Nagpur",
  "Nashik",
  "Noida",
  "Patna",
  "Pune",
  "Raipur",
  "Ranchi",
  "Surat",
  "Thane",
  "Thiruvananthapuram",
  "Vadodara",
  "Varanasi",
  "Vijayawada",
  "Visakhapatnam",
] as const;

export type StudentClassValue = (typeof STUDENT_CLASS_VALUES)[number];
export type BoardValue = (typeof BOARD_VALUES)[number];
export type StreamValue = (typeof STREAM_VALUES)[number];
export type ConfusionTypeValue = (typeof CONFUSION_TYPE_VALUES)[number];
export type LanguageValue = (typeof LANGUAGE_VALUES)[number];
export type IndianStateValue = (typeof INDIAN_STATE_VALUES)[number];
export type OnboardingIconKey =
  | "atom"
  | "book"
  | "briefcase"
  | "building"
  | "calendar"
  | "compass"
  | "feather"
  | "flag"
  | "globe"
  | "graduation"
  | "help"
  | "layers"
  | "map"
  | "palette"
  | "radar"
  | "rocket"
  | "route"
  | "school"
  | "shuffle"
  | "spark"
  | "stethoscope"
  | "target"
  | "wrench";

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  description: string;
  icon: OnboardingIconKey;
};

export const CLASS_OPTIONS: readonly SelectOption<StudentClassValue>[] = [
  {
    value: "CLASS_10",
    label: "Class 10",
    description: "Deciding your stream starts now.",
    icon: "spark",
  },
  {
    value: "CLASS_11",
    label: "Class 11",
    description: "You are shaping the path toward exams and careers.",
    icon: "compass",
  },
  {
    value: "CLASS_12",
    label: "Class 12",
    description: "You are close to big decisions on exams and colleges.",
    icon: "flag",
  },
  {
    value: "UG_1",
    label: "UG Year 1",
    description: "Early college is the right time to choose direction.",
    icon: "rocket",
  },
  {
    value: "UG_2",
    label: "UG Year 2",
    description: "This is where focus areas start becoming real choices.",
    icon: "layers",
  },
  {
    value: "UG_3",
    label: "UG Year 3",
    description: "Placements, higher studies, and exams start to converge.",
    icon: "radar",
  },
  {
    value: "UG_4",
    label: "UG Year 4",
    description: "You are close to graduation and the next major transition.",
    icon: "graduation",
  },
] as const;

export const BOARD_OPTIONS: readonly SelectOption<BoardValue>[] = [
  {
    value: "CBSE",
    label: "CBSE",
    description: "National curriculum with broad exam and coaching alignment.",
    icon: "book",
  },
  {
    value: "ICSE",
    label: "ICSE",
    description: "Detailed subject depth with strong language and project focus.",
    icon: "feather",
  },
  {
    value: "STATE",
    label: "State Board",
    description: "State-specific syllabus and exam patterns.",
    icon: "map",
  },
  {
    value: "INTERNATIONAL",
    label: "International Board",
    description: "Curriculum like IB or Cambridge with broader global pathways.",
    icon: "globe",
  },
] as const;

export const SCHOOL_STREAM_OPTIONS: readonly SelectOption<StreamValue>[] = [
  {
    value: "SCIENCE_PCM",
    label: "Science (PCM)",
    description: "Physics, Chemistry, Maths for engineering, tech, and analytics.",
    icon: "atom",
  },
  {
    value: "SCIENCE_PCB",
    label: "Science (PCB)",
    description: "Physics, Chemistry, Biology for medicine and life sciences.",
    icon: "stethoscope",
  },
  {
    value: "COMMERCE",
    label: "Commerce",
    description: "Accounts, business, economics, finance, and management tracks.",
    icon: "briefcase",
  },
  {
    value: "ARTS",
    label: "Arts & Humanities",
    description: "Humanities, social sciences, design, media, and public policy.",
    icon: "palette",
  },
  {
    value: "UNDECIDED",
    label: "Not sure yet / Confused",
    description: "You need help narrowing down options before committing.",
    icon: "help",
  },
] as const;

export const UG_FOCUS_OPTIONS: readonly SelectOption<StreamValue>[] = [
  {
    value: "PLACEMENTS",
    label: "Placements & Jobs",
    description: "Getting internship-ready, placement-ready, and interview-ready.",
    icon: "briefcase",
  },
  {
    value: "HIGHER_STUDIES",
    label: "Higher Studies",
    description: "Planning for masters, research, or studying abroad.",
    icon: "graduation",
  },
  {
    value: "COMPETITIVE_EXAMS",
    label: "Competitive Exams",
    description: "Preparing for exams like CAT, GATE, GRE, UPSC, or other tests.",
    icon: "target",
  },
  {
    value: "SKILL_BUILDING",
    label: "Building Skills",
    description: "Strengthening technical, creative, or domain-specific skills.",
    icon: "wrench",
  },
  {
    value: "ENTREPRENEURSHIP",
    label: "Startup / Entrepreneurship",
    description: "Exploring business ideas, startups, and independent paths.",
    icon: "rocket",
  },
  {
    value: "UNDECIDED",
    label: "Not sure yet / Confused",
    description: "You need clarity before deciding your main next move.",
    icon: "help",
  },
] as const;

export const BASE_CONFUSION_OPTIONS: readonly SelectOption<ConfusionTypeValue>[] = [
  {
    value: "STREAM_SELECTION",
    label: "Which stream to choose",
    description: "You want help narrowing down the right academic track.",
    icon: "shuffle",
  },
  {
    value: "EXAM_CHOICE",
    label: "Which exam to prepare for",
    description: "You are unsure which entrance or competitive exam matters most.",
    icon: "target",
  },
  {
    value: "COLLEGE_SELECTION",
    label: "Which college to target",
    description: "You want clarity on the right colleges and what is realistic.",
    icon: "building",
  },
  {
    value: "CAREER_DIRECTION",
    label: "What career this stream leads to",
    description: "You want to understand what outcomes your current path creates.",
    icon: "route",
  },
  {
    value: "PLANNING_NEXT_TWO_YEARS",
    label: "How to plan my next 2 years",
    description: "You need a structured roadmap rather than scattered advice.",
    icon: "calendar",
  },
  {
    value: "COACHING_SELECTION",
    label: "Whether to join coaching",
    description: "You are unsure if coaching is necessary or worth the tradeoff.",
    icon: "school",
  },
] as const;

export const UG_ONLY_CONFUSION_OPTION: SelectOption<ConfusionTypeValue> = {
  value: "POST_GRADUATION_PATH",
  label: "What to do after graduation",
  description: "You want clarity on jobs, higher studies, exams, or other next steps.",
  icon: "graduation",
};

export function isSchoolClass(value: string | null | undefined): value is StudentClassValue {
  return value === "CLASS_10" || value === "CLASS_11" || value === "CLASS_12";
}

export function isUGClass(value: string | null | undefined): value is StudentClassValue {
  return value === "UG_1" || value === "UG_2" || value === "UG_3" || value === "UG_4";
}

export function requiresBoard(value: string | null | undefined) {
  return isSchoolClass(value);
}

export function getStepThreeQuestion(value: string | null | undefined) {
  if (value === "CLASS_10") {
    return "What stream are you considering?";
  }

  if (value === "CLASS_11" || value === "CLASS_12") {
    return "What stream are you in?";
  }

  return "What's your main focus right now?";
}

export function getStepThreeOptions(value: string | null | undefined) {
  return isUGClass(value) ? UG_FOCUS_OPTIONS : SCHOOL_STREAM_OPTIONS;
}

export function getConfusionOptions(value: string | null | undefined) {
  return isUGClass(value)
    ? [...BASE_CONFUSION_OPTIONS, UG_ONLY_CONFUSION_OPTION]
    : BASE_CONFUSION_OPTIONS;
}

export function getAllowedStreamValues(value: string | null | undefined) {
  return getStepThreeOptions(value).map((option) => option.value);
}

export function getClassOption(value: string | null | undefined) {
  return CLASS_OPTIONS.find((option) => option.value === value) ?? null;
}

export function getBoardOption(value: string | null | undefined) {
  return BOARD_OPTIONS.find((option) => option.value === value) ?? null;
}

export function getStreamOption(
  value: string | null | undefined,
  studentClass?: string | null,
) {
  return getStepThreeOptions(studentClass).find((option) => option.value === value) ?? null;
}

export function getConfusionOption(value: string | null | undefined, studentClass?: string | null) {
  return getConfusionOptions(studentClass).find((option) => option.value === value) ?? null;
}
