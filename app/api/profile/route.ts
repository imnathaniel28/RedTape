import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, updateUserProfile } from "@/lib/prefiller";

export async function GET() {
  try {
    const profile = getUserProfile();
    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = updateUserProfile(body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
