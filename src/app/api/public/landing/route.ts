import { NextResponse } from "next/server";

import { getPublicPlatformSnapshot } from "@/Backend/server/public-data";
import { defineRoute } from "@/Backend/lib/define-route";

export const dynamic = "force-dynamic";

export const GET = defineRoute(
  { auth: "none" },
  async () => {
    const snapshot = await getPublicPlatformSnapshot();

    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  },
  "/api/public/landing",
);
