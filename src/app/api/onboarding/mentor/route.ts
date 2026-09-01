import { Prisma, type MentorTier } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth, updateSession } from "@/Backend/auth";
import { withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { DEFAULT_TIMEZONE } from "@/Backend/server/constants";
import { db } from "@/Backend/server/db";
import { invalidateAllMatchingCaches } from "@/Backend/server/matching";
import { calculateFortyFiveMinutePrice } from "@/Backend/server/mentor-onboarding";
import {
  mentorAvailabilityStepSchema,
  mentorCourseStepSchema,
  mentorExamsStepSchema,
  mentorHelpStepSchema,
  mentorInstitutionStepSchema,
  mentorOnboardingSchema,
  mentorPricingStepSchema,
  mentorProfileStepSchema,
} from "@/Backend/validations/mentor";

const patchRequestSchema = z.object({
  step: z.number().int().min(1).max(7),
  submit: z.boolean().optional(),
  data: z.object({}).passthrough(),
});

const MENTOR_DASHBOARD_PATH = "/dashboard/mentor";

type ExistingMentorState = {
  name: string | null;
  email: string | null;
  image: string | null;
  onboardingComplete: boolean;
  onboardingStep: number;

  mentorProfile: {
    username: string;
    institutionId: string | null;
    college: string | null;
    degree: string | null;
    branch: string | null;
    yearOfStudy: number | null;
    expectedGraduationYear: number | null;
    tier: MentorTier;
    bio: string | null;
    headline: string | null;
    examsCleared: string[];
    examYears: Prisma.JsonValue | null;
    specialisations: string[];
    priceMin: number | null;
    priceMax: number | null;
    linkedinUrl: string | null;
    onboardingStep: number;
  } | null;

  availabilities: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    timezone: string;
  }>;
};

type MentorExamEntryInput = {
  exam: string;
  year?: number | null;
};

function isJsonObject(
  value: Prisma.JsonValue | null | undefined,
): value is Prisma.JsonObject {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function buildUsername(
  name: string | null,
  email: string | null,
  userId: string,
) {
  const source =
    name?.trim() ||
    email?.split("@")[0] ||
    "mentor";

  const normalized = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 16);

  return `${normalized || "mentor"}_${userId.slice(0, 6)}`;
}

function buildExistingDraft(
  existing: ExistingMentorState,
) {
  const examYears = isJsonObject(
    existing.mentorProfile?.examYears,
  )
    ? existing.mentorProfile.examYears
    : {};

  return {
    institutionId:
      existing.mentorProfile?.institutionId ??
      undefined,

    college:
      existing.mentorProfile?.college ??
      undefined,

    tier:
      existing.mentorProfile?.tier ??
      undefined,

    degree:
      existing.mentorProfile?.degree ??
      undefined,

    branch:
      existing.mentorProfile?.branch ??
      undefined,

    yearOfStudy:
      existing.mentorProfile?.yearOfStudy ??
      undefined,

    expectedGraduationYear:
      existing.mentorProfile?.expectedGraduationYear ??
      undefined,

    exams:
      existing.mentorProfile?.examsCleared.map(
        (exam) => ({
          exam,
          year:
            typeof examYears[exam] === "number"
              ? (examYears[exam] as number)
              : undefined,
        }),
      ) ?? [],

    specialisations:
      existing.mentorProfile?.specialisations ?? [],

    priceMin:
      existing.mentorProfile?.priceMin ??
      undefined,

    priceMax:
      existing.mentorProfile?.priceMax ??
      undefined,

    headline:
      existing.mentorProfile?.headline ??
      undefined,

    bio:
      existing.mentorProfile?.bio ??
      undefined,

    avatarUrl:
      existing.image ??
      undefined,

    linkedinUrl:
      existing.mentorProfile?.linkedinUrl ??
      undefined,

    timezone:
      existing.availabilities[0]?.timezone ??
      DEFAULT_TIMEZONE,

    availabilitySlots:
      existing.availabilities.map((slot) => ({
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
  };
}

function mergeDraft(
  existingDraft: ReturnType<typeof buildExistingDraft>,
  incoming: Record<string, unknown>,
) {
  return {
    ...existingDraft,
    ...incoming,

    exams: Array.isArray(incoming.exams)
      ? incoming.exams
      : existingDraft.exams,

    specialisations: Array.isArray(
      incoming.specialisations,
    )
      ? incoming.specialisations
      : existingDraft.specialisations,

    availabilitySlots: Array.isArray(
      incoming.availabilitySlots,
    )
      ? incoming.availabilitySlots
      : existingDraft.availabilitySlots,
  };
}

function buildExamYears(
  exams: MentorExamEntryInput[],
) {
  const entries = exams
    .filter(
      (entry) => typeof entry.year === "number",
    )
    .map(
      (entry) =>
        [entry.exam, entry.year] as const,
    );

  return entries.length > 0
    ? (Object.fromEntries(
      entries,
    ) as Prisma.InputJsonObject)
    : Prisma.JsonNull;
}

function getValidatedStepData(
  step: number,
  data: Record<string, unknown>,
) {
  switch (step) {
    case 1:
      return mentorInstitutionStepSchema.safeParse(
        data,
      );

    case 2:
      return mentorCourseStepSchema.safeParse(
        data,
      );

    case 3:
      return mentorExamsStepSchema.safeParse(
        data,
      );

    case 4:
      return mentorHelpStepSchema.safeParse(
        data,
      );

    case 5:
      return mentorPricingStepSchema.safeParse(
        data,
      );

    case 6:
      return mentorProfileStepSchema.safeParse(
        data,
      );

    case 7:
      return mentorAvailabilityStepSchema.safeParse(
        data,
      );

    default:
      return z.never().safeParse(data);
  }
}

export const PATCH = withApiErrorHandling(
  async (request: Request, _context, metadata) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    metadata.setUserId(session.user.id);

    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        {
          error:
            "Only mentors can use this onboarding flow",
        },
        { status: 403 },
      );
    }

    const payload = await request
      .json()
      .catch(() => null);

    const parsedRequest =
      patchRequestSchema.safeParse(payload);

    if (!parsedRequest.success) {
      return NextResponse.json(
        {
          error: "Invalid onboarding request",
          issues:
            parsedRequest.error.flatten(),
        },
        { status: 400 },
      );
    }

    const existing = await db.user.findUnique({
      where: {
        id: session.user.id,
      },

      select: {
        name: true,
        email: true,
        image: true,
        onboardingComplete: true,
        onboardingStep: true,

        mentorProfile: {
          select: {
            username: true,
            institutionId: true,
            college: true,
            degree: true,
            branch: true,
            yearOfStudy: true,
            expectedGraduationYear: true,
            tier: true,
            bio: true,
            headline: true,
            examsCleared: true,
            examYears: true,
            specialisations: true,
            priceMin: true,
            priceMax: true,
            linkedinUrl: true,
            onboardingStep: true,
          },
        },

        availabilities: {
          where: {
            isRecurring: true,
            isActive: true,
          },

          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            timezone: true,
          },

          orderBy: [
            { dayOfWeek: "asc" },
            { startTime: "asc" },
          ],
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const existingDraft =
      buildExistingDraft(existing);

    const mergedDraft = mergeDraft(
      existingDraft,
      parsedRequest.data.data,
    );

    const validatedStep =
      getValidatedStepData(
        parsedRequest.data.step,
        parsedRequest.data.data,
      );

    if (!validatedStep.success) {
      return NextResponse.json(
        {
          error: "Invalid step data",
          issues:
            validatedStep.error.flatten(),
        },
        { status: 400 },
      );
    }

    const finalValidation =
      parsedRequest.data.submit
        ? mentorOnboardingSchema.safeParse(
          mergedDraft,
        )
        : null;

    if (
      finalValidation &&
      !finalValidation.success
    ) {
      return NextResponse.json(
        {
          error:
            "Complete all required mentor onboarding fields before submitting",
          issues:
            finalValidation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const maxSavedStep = Math.max(
      existing.onboardingStep,
      existing.mentorProfile?.onboardingStep ??
      0,
      parsedRequest.data.step,
    );

    const createStepData: Partial<
      Prisma.MentorProfileUncheckedCreateInput
    > = {};

    const updateStepData: Prisma.MentorProfileUncheckedUpdateInput =
      {};

    const userUpdateData: Partial<
      Prisma.UserUncheckedUpdateInput
    > = {
      onboardingStep: maxSavedStep,
    };

    let availabilityStepData:
      | z.infer<
        typeof mentorAvailabilityStepSchema
      >
      | null = null;

    switch (parsedRequest.data.step) {
      case 1: {
        const stepData =
          validatedStep.data as z.infer<
            typeof mentorInstitutionStepSchema
          >;

        /*
         * institutionId is the authoritative institution
         * relationship.
         *
         * We verify that the referenced institution exists
         * and is active before saving it.
         */
        if (stepData.institutionId) {
          const institution =
            await db.institution.findFirst({
              where: {
                id: stepData.institutionId,
                isActive: true,
              },

              select: {
                id: true,
                name: true,
                institutionTier: true,
              },
            });

          if (!institution) {
            return NextResponse.json(
              {
                error:
                  "The selected institution could not be found.",
              },
              { status: 400 },
            );
          }

          createStepData.institutionId =
            institution.id;

          updateStepData.institutionId =
            institution.id;

          /*
           * Keep the legacy display field synchronized.
           */
          createStepData.college =
            stepData.college ||
            institution.name;

          updateStepData.college =
            stepData.college ||
            institution.name;
        } else {
          /*
           * Manual fallback.
           *
           * No institution relation is created when the
           * mentor has not selected a known institution.
           */
          createStepData.institutionId = null;
          updateStepData.institutionId = null;

          createStepData.college =
            stepData.college;

          updateStepData.college =
            stepData.college;
        }

        /*
         * MentorTier remains the mentor-trust field.
         * Do NOT put InstitutionTier into this column.
         */
        createStepData.tier = stepData.tier;
        updateStepData.tier = stepData.tier;

        break;
      }

      case 2: {
        const stepData =
          validatedStep.data as z.infer<
            typeof mentorCourseStepSchema
          >;

        createStepData.degree =
          stepData.degree;

        createStepData.branch =
          stepData.branch;

        createStepData.yearOfStudy =
          stepData.yearOfStudy;

        createStepData.expectedGraduationYear =
          stepData.expectedGraduationYear;

        updateStepData.degree =
          stepData.degree;

        updateStepData.branch =
          stepData.branch;

        updateStepData.yearOfStudy =
          stepData.yearOfStudy;

        updateStepData.expectedGraduationYear =
          stepData.expectedGraduationYear;

        break;
      }

      case 3: {
        const stepData =
          validatedStep.data as z.infer<
            typeof mentorExamsStepSchema
          >;

        createStepData.examsCleared =
          stepData.exams.map(
            (entry) => entry.exam,
          );

        createStepData.examYears =
          buildExamYears(stepData.exams);

        updateStepData.examsCleared =
          stepData.exams.map(
            (entry) => entry.exam,
          );

        updateStepData.examYears =
          buildExamYears(stepData.exams);

        break;
      }

      case 4: {
        const stepData =
          validatedStep.data as z.infer<
            typeof mentorHelpStepSchema
          >;

        createStepData.specialisations =
          stepData.specialisations;

        updateStepData.specialisations =
          stepData.specialisations;

        break;
      }

      case 5: {
        const stepData =
          validatedStep.data as z.infer<
            typeof mentorPricingStepSchema
          >;

        createStepData.priceMin =
          stepData.priceMin;

        createStepData.priceMax =
          calculateFortyFiveMinutePrice(
            stepData.priceMin,
          );

        updateStepData.priceMin =
          stepData.priceMin;

        updateStepData.priceMax =
          calculateFortyFiveMinutePrice(
            stepData.priceMin,
          );

        break;
      }

      case 6: {
        const stepData =
          validatedStep.data as z.infer<
            typeof mentorProfileStepSchema
          >;

        createStepData.headline =
          stepData.headline;

        createStepData.bio =
          stepData.bio;

        createStepData.linkedinUrl =
          stepData.linkedinUrl ?? null;

        updateStepData.headline =
          stepData.headline;

        updateStepData.bio =
          stepData.bio;

        updateStepData.linkedinUrl =
          stepData.linkedinUrl ?? null;

        userUpdateData.image =
          stepData.avatarUrl;

        break;
      }

      case 7: {
        const stepData =
          validatedStep.data as z.infer<
            typeof mentorAvailabilityStepSchema
          >;

        createStepData.isAvailable =
          stepData.availabilitySlots.length >
          0;

        updateStepData.isAvailable =
          stepData.availabilitySlots.length >
          0;

        availabilityStepData =
          stepData;

        break;
      }
    }

    const saved =
      await db.$transaction(async (tx) => {
        const profile =
          await tx.mentorProfile.upsert({
            where: {
              userId: session.user.id,
            },

            create: {
              userId: session.user.id,

              username:
                existing.mentorProfile
                  ?.username ??
                buildUsername(
                  existing.name,
                  existing.email,
                  session.user.id,
                ),

              ...createStepData,

              isVerified: false,

              onboardingStep:
                maxSavedStep,

              lastProfileUpdate:
                new Date(),
            },

            update: {
              ...updateStepData,

              isVerified: false,

              onboardingStep:
                maxSavedStep,

              lastProfileUpdate:
                new Date(),
            },

            select: {
              tier: true,
              institutionId: true,
              onboardingStep: true,
            },
          });

        await tx.user.update({
          where: {
            id: session.user.id,
          },

          data: userUpdateData,
        });

        if (availabilityStepData) {
          await tx.availability.deleteMany({
            where: {
              mentorId: session.user.id,
              isRecurring: true,
            },
          });

          if (
            availabilityStepData
              .availabilitySlots.length > 0
          ) {
            await tx.availability.createMany({
              data: availabilityStepData.availabilitySlots.map(
                (slot) => ({
                  mentorId:
                    session.user.id,

                  dayOfWeek:
                    slot.dayOfWeek,

                  startTime:
                    slot.startTime,

                  endTime:
                    slot.endTime,

                  timezone:
                    availabilityStepData.timezone,

                  isRecurring: true,
                  isActive: true,
                }),
              ),
            });
          }
        }

        if (
          parsedRequest.data.submit &&
          finalValidation?.success
        ) {
          await tx.mentorProfile.update({
            where: {
              userId: session.user.id,
            },

            data: {
              /*
               * Institution relationship.
               */
              institutionId:
                finalValidation.data
                  .institutionId ?? null,

              /*
               * Keep legacy college field synchronized.
               */
              college:
                finalValidation.data
                  .college,

              /*
               * Mentor trust tier remains independent
               * from InstitutionTier.
               */
              tier:
                finalValidation.data.tier,

              degree:
                finalValidation.data.degree,

              branch:
                finalValidation.data.branch,

              yearOfStudy:
                finalValidation.data
                  .yearOfStudy,

              expectedGraduationYear:
                finalValidation.data
                  .expectedGraduationYear,

              examsCleared:
                finalValidation.data.exams.map(
                  (entry) => entry.exam,
                ),

              examYears:
                buildExamYears(
                  finalValidation.data.exams,
                ),

              specialisations:
                finalValidation.data
                  .specialisations,

              priceMin:
                finalValidation.data.priceMin,

              priceMax:
                finalValidation.data.priceMax,

              headline:
                finalValidation.data.headline,

              bio:
                finalValidation.data.bio,

              linkedinUrl:
                finalValidation.data
                  .linkedinUrl ?? null,

              isAvailable:
                finalValidation.data
                  .availabilitySlots.length > 0,

              isVerified: false,

              onboardingStep: 7,

              lastProfileUpdate:
                new Date(),
            },
          });

          await tx.user.update({
            where: {
              id: session.user.id,
            },

            data: {
              image:
                finalValidation.data
                  .avatarUrl,

              onboardingComplete: true,
              onboardingStep: 7,
            },
          });

          await tx.mentorVerification.upsert({
            where: {
              mentorId: session.user.id,
            },

            create: {
              mentorId: session.user.id,
              collegeIdUrl: null,
              status: "PENDING",
              submittedAt: new Date(),
            },

            update: {
              collegeIdUrl: null,
              status: "PENDING",
              reviewedBy: null,
              reviewedAt: null,
              rejectionReason: null,
              submittedAt: new Date(),
            },
          });
        }

        return profile;
      });

    await invalidateAllMatchingCaches();

    if (parsedRequest.data.submit) {
      await updateSession({
        user: {
          role: session.user.role,
          onboardingComplete: true,
        },
      });
    }

    return NextResponse.json({
      savedStep: saved.onboardingStep,
      tier: saved.tier,
      institutionId: saved.institutionId,
      onboardingComplete:
        Boolean(parsedRequest.data.submit),
      status: parsedRequest.data.submit
        ? "PENDING"
        : "DRAFT",
      redirectTo:
        parsedRequest.data.submit
          ? MENTOR_DASHBOARD_PATH
          : null,
    });
  },
  "/api/onboarding/mentor",
);