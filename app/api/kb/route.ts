// app/api/kb/route.ts
import { NextResponse } from "next/server";
import { listDocuments } from "@/lib/rag";

export const runtime = "nodejs";

export async function GET() {
<<<<<<< HEAD
  try {
    const docs = listDocuments();
    return NextResponse.json({ docs });
  } catch (err) {
    console.error("KB list error:", err);
    return NextResponse.json({ docs: [] });
  }
=======
  const docs = listDocuments();
  return NextResponse.json({ docs });
>>>>>>> 58e23eafe1172b121ce3e2f387b160dc55300a8a
}
