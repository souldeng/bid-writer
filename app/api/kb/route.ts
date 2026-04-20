// app/api/kb/route.ts
import { NextResponse } from "next/server";
import { listDocuments } from "@/lib/rag";

export const runtime = "nodejs";

export async function GET() {
  const docs = listDocuments();
  return NextResponse.json({ docs });
}
