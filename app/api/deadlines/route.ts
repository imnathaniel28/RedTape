import { NextResponse } from "next/server";
import { getUpcomingDeadlines, getUrgentDeadlines } from "@/lib/deadlines";

export async function GET() {
  try {
    const upcoming = getUpcomingDeadlines(10);
    const urgent = getUrgentDeadlines();

    return NextResponse.json({
      success: true,
      data: { upcoming, urgent },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
