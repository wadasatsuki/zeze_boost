import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ADMIN_ID: !!process.env.ADMIN_ID,
    ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
  });
}
