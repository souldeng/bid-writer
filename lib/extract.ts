// lib/extract.ts
// 从上传文件中提取纯文本

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
      // Dynamic import to avoid edge runtime issues
      const pdfParse = (await import("pdf-parse")).default;
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
