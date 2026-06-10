// lib/extract.ts
export async function extractText(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  if (ext === "txt" || ext === "md") {
    return buffer.toString("utf-8");
  }

  if (ext === "pdf") {
    try {
      // 直接引用内部模块，绕过 pdf-parse 入口文件在 Vercel 环境下读取测试文件的已知 bug
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse: any = (await import("pdf-parse/lib/pdf-parse.js" as string)).default
        ?? (await import("pdf-parse/lib/pdf-parse.js" as string));
      const data = await pdfParse(buffer);
      return data.text || "";
    } catch (e) {
      console.error("PDF parse error:", e);
      return "[PDF 解析失败，请转换为 TXT 格式后重试]";
    }
  }

  if (ext === "docx" || ext === "doc") {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    } catch (e) {
      console.error("DOCX parse error:", e);
      return "[DOCX 解析失败，请转换为 TXT 格式后重试]";
    }
  }

  return "[不支持的文件格式，请上传 PDF、DOCX 或 TXT 文件]";
}
