import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, error: "Invalid promo code format" },
        { status: 400 }
      );
    }
    if (code.startsWith("DEMO")) {
      return NextResponse.json({
        valid: true,
        code,
        duration_days: 30,
        applies_to_all_apps: true,
        discount_percent: 100,
      });
    }
    return NextResponse.json(
      { valid: false, error: "Promo code not found or expired" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Promo validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
