// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { addDocument, type KBDoc } from "@/lib/rag";
import { extractText } from "@/lib/extract";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (e) {
      console.error("FormData parse error:", e);
      return NextResponse.json({ error: "无法解析上传数据，请重试" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    const docType = (formData.get("type") as string) || "other";

    if (!file) {
      return NextResponse.json({ error: "未收到文件，请重新选择" }, { status: 400 });
    }

    const allowedTypes = ["policy", "template", "case", "other"];
    if (!allowedTypes.includes(docType)) {
      return NextResponse.json({ error: "无效的文件分类" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "文件超过 10MB 限制，请压缩后重试" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["txt", "md", "pdf", "docx", "doc"].includes(ext)) {
      return NextResponse.json(
        { error: "仅支持 TXT、MD、PDF、DOCX 格式" },
        { status: 400 }
      );
    }

    let buffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (e) {
      console.error("ArrayBuffer error:", e);
      return NextResponse.json({ error: "读取文件内容失败，请重试" }, { status: 500 });
    }

    const rawText = await extractText(buffer, file.name);

    if (!rawText || rawText.length < 10) {
      return NextResponse.json(
        { error: "文件内容为空或无法解析，请检查文件是否损坏" },
        { status: 400 }
      );
    }

    if (rawText.startsWith("[") && rawText.endsWith("]")) {
      return NextResponse.json({ error: rawText }, { status: 400 });
    }

    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const wordCount = rawText.replace(/\s/g, "").length;
    const summary = rawText.replace(/\s+/g, " ").trim().slice(0, 150) + (rawText.length > 150 ? "…" : "");
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
    console.error("Upload unexpected error:", err);
    return NextResponse.json({ error: "服务器处理出错，请稍后重试" }, { status: 500 });
  }
}