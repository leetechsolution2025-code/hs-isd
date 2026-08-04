import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const module = searchParams.get("module") || "general";

    // Query project stats
    const total = await prisma.project.count();
    
    // Group by status
    const statusCounts = await prisma.project.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const getCount = (statusName: string) => {
      const match = statusCounts.find(s => s.status?.toLowerCase() === statusName.toLowerCase());
      return match ? match._count.status : 0;
    };

    const countNotStarted = getCount('chưa thực hiện');
    const countInProgress = getCount('đang thực hiện');
    const countPaused = getCount('tạm dừng');
    const countCancelled = getCount('huỷ bỏ');

    const data = [
      { type: "info", text: `Tổng số dự án: ${total}` },
      { type: "info", text: `Chưa thực hiện: ${countNotStarted}` },
      { type: "info", text: `Đang thực hiện: ${countInProgress}` },
      { type: "info", text: `Tạm dừng: ${countPaused}` },
      { type: "info", text: `Huỷ bỏ: ${countCancelled}` }
    ];

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Ticker API error:", error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
