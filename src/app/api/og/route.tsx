import * as Sentry from "@sentry/nextjs";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Extract params from URL
    const name = searchParams.get("name") || "Mentor";
    const college = searchParams.get("college") || "Expert Guide";
    const rating = searchParams.get("rating") || "5.0";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fff",
            backgroundImage: "radial-gradient(circle at 25px 25px, #f1f5f9 2%, transparent 0%), radial-gradient(circle at 75px 75px, #f1f5f9 2%, transparent 0%)",
            backgroundSize: "100px 100px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              padding: "40px 60px",
              borderRadius: "40px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "120px",
                height: "120px",
                borderRadius: "60px",
                backgroundColor: "#0ea5e9",
                color: "#fff",
                fontSize: "60px",
                fontWeight: "bold",
                marginBottom: "20px",
              }}
            >
              {name.charAt(0)}
            </div>
            <h1
              style={{
                fontSize: "60px",
                fontWeight: "bold",
                color: "#0f172a",
                margin: "0",
                textAlign: "center",
              }}
            >
              {name}
            </h1>
            <p
              style={{
                fontSize: "30px",
                color: "#64748b",
                margin: "10px 0 20px",
                textAlign: "center",
              }}
            >
              {college}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#f8fafc",
                padding: "10px 25px",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
              }}
            >
              <span style={{ fontSize: "24px", color: "#f59e0b", marginRight: "8px" }}>★</span>
              <span style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b" }}>
                {rating} rating
              </span>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "40px",
              right: "40px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "24px", fontWeight: "bold", color: "#0ea5e9" }}>GuideMe</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    Sentry.captureException(error);

    return Response.json(
      {
        success: false,
        error: "Internal server error",
        status: 500,
      },
      { status: 500 }
    );
  }
}
