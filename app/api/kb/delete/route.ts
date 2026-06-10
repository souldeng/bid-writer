// app/api/kb/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { removeDocument } from "@/lib/rag";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { docId } = await req.json();
    if (!docId) return NextResponse.json({ error: "缺少 docId" }, { status: 400 });
    await removeDocument(docId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
