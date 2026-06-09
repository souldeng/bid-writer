// app/api/kb/route.ts
import { NextResponse } from "next/server";
import { listDocuments } from "@/lib/rag";

export const runtime = "nodejs";

export async function GET() {
  try {
    const docs = listDocuments();
    return NextResponse.json({ docs });
  } catch (err) {
    console.error("KB list error:", err);
    return NextResponse.json({ docs: [] });
  }
}
