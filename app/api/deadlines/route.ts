import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUpcomingDeadlines, getUrgentDeadlines } from "@/lib/deadlines";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const upcoming = await getUpcomingDeadlines(userId, 10);
    const urgent = await getUrgentDeadlines(userId);

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
