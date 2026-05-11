import { NextResponse } from "next/server";

import { getPublicPlatformSnapshot } from "@/server/public-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getPublicPlatformSnapshot();

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
