import { db } from "@/server/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 25;

    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const safeLimit = Math.min(Math.max(limit, 1), 25);

    const results = await db.institution.findMany({
      where: {
        isActive: true,
        OR: [
          {
            name: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
          {
            shortName: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        slug: true,
        city: true,
        state: true,
        academicCategory: true,
        institutionClassification: true,
        institutionTier: true,
      },
      orderBy: [
        {
          institutionTier: "asc",
        },
        {
          name: "asc",
        },
      ],
      take: safeLimit,
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Institution search failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}