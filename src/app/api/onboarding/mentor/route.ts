import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { updateSession } from "@/Backend/auth";
import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { db } from "@/Backend/server/db";
import { invalidateAllMatchingCaches } from "@/Backend/server/matching";
import { calculateFortyFiveMinutePrice, retireMentorAvailability } from "@/shared/mentor-onboarding";
import { mentorAvailabilityStepSchema, mentorCourseStepSchema, mentorExamsStepSchema, mentorHelpStepSchema, mentorInstitutionStepSchema, mentorOnboardingSchema, mentorPricingStepSchema, mentorProfileStepSchema } from "@/Backend/validations/mentor";
import { defineRoute } from "@/Backend/lib/define-route";

import { MENTOR_DASHBOARD_PATH, buildExamYears, buildExistingDraft, buildUsername, getValidatedStepData, mergeDraft, patchRequestSchema } from "@/Backend/server/mentor-onboarding-draft";
import { setMentorVerification } from "@/Backend/server/mentor-state";

export const PATCH = defineRoute(
  { roles: ["MENTOR"], forbiddenMessage: "Only mentors can use this onboarding flow" },
  async (request: Request, _context, { session }) => {

    const payload = await request
      .json()
      .catch(() => null);

    const parsedRequest =
      patchRequestSchema.safeParse(payload);

    if (!parsedRequest.success) {
      return apiErrorResponse("Invalid onboarding request", 400, parsedRequest.error.flatten());
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
      return apiErrorResponse("User not found", 404);
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
      return apiErrorResponse("Invalid step data", 400, validatedStep.error.flatten());
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
      return apiErrorResponse("Complete all required mentor onboarding fields before submitting", 400, finalValidation.error.flatten());
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
            return apiErrorResponse("The selected institution could not be found.", 400);
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
         * MentorTier is the mentor-trust field and is assigned by admins
         * during verification, so the submitted value is never stored.
         */

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
          await retireMentorAvailability(tx, {
            mentorId: session.user.id,
            isRecurring: true,
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
               * Mentor trust tier is admin-assigned and
               * is not taken from the submission.
               */

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

          await setMentorVerification(tx, session.user.id, { status: "PENDING" });
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
