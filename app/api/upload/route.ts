// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { addDocument, listDocuments, type KBDoc } from "@/lib/rag";
import { extractText } from "@/lib/extract";

export const runtime = "nodejs"; // need fs APIs

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const docType = (formData.get("type") as string) || "other";

    if (!file) {
      return NextResponse.json({ error: "未收到文件" }, { status: 400 });
    }

    const allowedTypes = ["policy", "template", "case", "other"];
    if (!allowedTypes.includes(docType)) {
      return NextResponse.json({ error: "无效的文件类型" }, { status: 400 });
    }

    // Size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "文件过大，请上传 10MB 以内的文件" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["txt", "md", "pdf", "docx", "doc"].includes(ext || "")) {
      return NextResponse.json(
        { error: "仅支持 TXT、MD、PDF、DOCX 格式" },
        { status: 400 }
      );
    }

    // Extract text
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const rawText = await extractText(buffer, file.name);

    if (!rawText || rawText.length < 20) {
      return NextResponse.json(
        { error: "文件内容为空或无法解析，请检查文件" },
        { status: 400 }
      );
    }

    // Build doc metadata
    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const wordCount = rawText.replace(/\s/g, "").length;

    // Simple summary: first 150 chars
    const summary = rawText.replace(/\s+/g, " ").trim().slice(0, 150) + (rawText.length > 150 ? "…" : "");

    // Chunk count estimate
    const chunkCount = Math.ceil(rawText.length / 320);

    const doc: KBDoc = {
      id: docId,
      name: file.name,
      type: docType as KBDoc["type"],
      size: file.size,
      uploadedAt: new Date().toISOString(),
      chunkCount,
      summary,
    };

    addDocument(doc, rawText);

    return NextResponse.json({
      success: true,
      doc,
      stats: { chars: rawText.length, words: wordCount, chunks: chunkCount },
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "服务器处理文件时出错，请重试" }, { status: 500 });
  }
}
