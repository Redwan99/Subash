import { NextResponse } from "next/server";
import { heartbeat, getOnlineCount } from "@/lib/online-tracker";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { sid } = await req.json();
    if (typeof sid === "string" && sid.length > 0 && sid.length <= 64) {
      heartbeat(sid);
    }
    return NextResponse.json({ online: getOnlineCount() });
  } catch {
    return NextResponse.json({ online: getOnlineCount() });
  }
}

export async function GET() {
  return NextResponse.json({ online: getOnlineCount() });
}
