import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/server/db";

type RouteParams = { params: Promise<{ username: string }> };

const reviewsQuerySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  wouldRebook: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  sort: z.enum(["recent", "highest", "lowest"]).default("recent"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export async function GET(request: Request, context: RouteParams) {
  const { username } = await context.params;

  if (!username || username.length < 2) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const rawQuery = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = reviewsQuerySchema.safeParse(rawQuery);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { rating, wouldRebook, sort, page, limit } = parsed.data;

  try {
    const mentor = await db.mentorProfile.findUnique({
      where: { username },
      select: { userId: true },
    });

    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    const where: Prisma.ReviewWhereInput = {
      mentorId: mentor.userId,
      isPublic: true,
      ...(rating !== undefined ? { rating } : {}),
      ...(wouldRebook !== undefined ? { wouldRebook } : {}),
    };

    const orderBy: Prisma.ReviewOrderByWithRelationInput =
      sort === "highest"
        ? { rating: "desc" }
        : sort === "lowest"
          ? { rating: "asc" }
          : { createdAt: "desc" };

    const [total, reviews] = await Promise.all([
      db.review.count({ where }),
      db.review.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          rating: true,
          reviewText: true,
          tags: true,
          wouldRebook: true,
          createdAt: true,
          student: {
            select: { name: true, image: true },
          },
          session: {
            select: { type: true, durationMinutes: true },
          },
        },
      }),
    ]);

    // Compute rating distribution
    const distribution = await db.review.groupBy({
      by: ["rating"],
      where: { mentorId: mentor.userId, isPublic: true },
      _count: { rating: true },
    });

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of distribution) {
      ratingDistribution[row.rating] = row._count.rating;
    }

    return NextResponse.json({
      data: reviews,
      ratingDistribution,
      page,
      pageSize: limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("[mentors/reviews]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
