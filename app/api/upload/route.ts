// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { addDocument, type KBDoc } from "@/lib/rag";
import { extractText } from "@/lib/extract";

<<<<<<< HEAD
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

=======
export const runtime = "nodejs"; // need fs APIs

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
>>>>>>> 58e23eafe1172b121ce3e2f387b160dc55300a8a
    const file = formData.get("file") as File | null;
    const docType = (formData.get("type") as string) || "other";

    if (!file) {
<<<<<<< HEAD
      return NextResponse.json({ error: "未收到文件，请重新选择" }, { status: 400 });
    }

    // 校验文件类型分类
    const allowedTypes = ["policy", "template", "case", "other"];
    if (!allowedTypes.includes(docType)) {
      return NextResponse.json({ error: "无效的文件分类" }, { status: 400 });
    }

    // 校验文件大小：10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "文件超过 10MB 限制，请压缩后重试" }, { status: 400 });
    }

    // 校验文件扩展名
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["txt", "md", "pdf", "docx", "doc"].includes(ext)) {
=======
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
>>>>>>> 58e23eafe1172b121ce3e2f387b160dc55300a8a
      return NextResponse.json(
        { error: "仅支持 TXT、MD、PDF、DOCX 格式" },
        { status: 400 }
      );
    }

<<<<<<< HEAD
    // 提取文本
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
=======
    // Extract text
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const rawText = await extractText(buffer, file.name);

    if (!rawText || rawText.length < 20) {
      return NextResponse.json(
        { error: "文件内容为空或无法解析，请检查文件" },
>>>>>>> 58e23eafe1172b121ce3e2f387b160dc55300a8a
        { status: 400 }
      );
    }

<<<<<<< HEAD
    // 如果文本是解析失败的占位符，也返回错误
    if (rawText.startsWith("[") && rawText.endsWith("]")) {
      return NextResponse.json({ error: rawText }, { status: 400 });
    }

    // 构建文档元数据
    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const wordCount = rawText.replace(/\s/g, "").length;
    const summary = rawText.replace(/\s+/g, " ").trim().slice(0, 150) + (rawText.length > 150 ? "…" : "");
=======
    // Build doc metadata
    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const wordCount = rawText.replace(/\s/g, "").length;

    // Simple summary: first 150 chars
    const summary = rawText.replace(/\s+/g, " ").trim().slice(0, 150) + (rawText.length > 150 ? "…" : "");

    // Chunk count estimate
>>>>>>> 58e23eafe1172b121ce3e2f387b160dc55300a8a
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

<<<<<<< HEAD
    console.log(`[Upload] 成功：${file.name}，${wordCount} 字，${chunkCount} 片段`);

=======
>>>>>>> 58e23eafe1172b121ce3e2f387b160dc55300a8a
    return NextResponse.json({
      success: true,
      doc,
      stats: { chars: rawText.length, words: wordCount, chunks: chunkCount },
    });
  } catch (err) {
<<<<<<< HEAD
    console.error("Upload unexpected error:", err);
    return NextResponse.json({ error: "服务器处理出错，请稍后重试" }, { status: 500 });
=======
    console.error("Upload error:", err);
    return NextResponse.json({ error: "服务器处理文件时出错，请重试" }, { status: 500 });
>>>>>>> 58e23eafe1172b121ce3e2f387b160dc55300a8a
  }
}
