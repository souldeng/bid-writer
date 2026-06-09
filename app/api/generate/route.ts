// app/api/generate/route.ts
import { NextRequest } from "next/server";
import { retrieve, buildRagContext } from "@/lib/rag";

<<<<<<< HEAD
export const runtime = "nodejs";
=======
export const runtime = "nodejs"; // need globalThis store from rag.ts
>>>>>>> 58e23eafe1172b121ce3e2f387b160dc55300a8a

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, chapterLabel, useRag = true } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "缺少 prompt 参数" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey  = process.env.DOUBAO_API_KEY;
    const modelId = process.env.DOUBAO_MODEL_ID;
    const baseUrl = process.env.DOUBAO_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";

    if (!apiKey || !modelId) {
      return new Response(
        JSON.stringify({ error: "服务端未配置 API Key，请联系管理员" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

<<<<<<< HEAD
    // RAG 检索
=======
    // ── RAG: retrieve relevant chunks ──────────────────────────
>>>>>>> 58e23eafe1172b121ce3e2f387b160dc55300a8a
    let ragContext = "";
    let ragSources: string[] = [];
    if (useRag && chapterLabel) {
      const query = `${chapterLabel} ${prompt.slice(0, 200)}`;
      const chunks = retrieve(query, 6);
      if (chunks.length > 0) {
        ragContext = buildRagContext(chunks);
        ragSources = [...new Set(chunks.map(c => c.docName))];
      }
    }

<<<<<<< HEAD
    const userMessage = prompt + ragContext;

=======
    // ── Build final user message ───────────────────────────────
    const userMessage = prompt + ragContext;

    // ── Call Doubao API (streaming) ────────────────────────────
>>>>>>> 58e23eafe1172b121ce3e2f387b160dc55300a8a
    const doubaoResp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        stream: true,
        max_tokens: 4096,
        temperature: 0.65,
        messages: [
          {
            role: "system",
            content:
              "你是一位拥有15年政务项目申报经验的专家顾问，精通数字政务、数字资源体系建设领域的标书撰写规范。" +
              "写作风格正式、严谨、专业。当参考资料中有相关内容时，优先结合参考资料中的具体表述、数据和案例来生成内容，" +
              "但要用自己的语言重新组织，不要直接大段复制。",
          },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!doubaoResp.ok) {
      const errText = await doubaoResp.text();
      console.error("豆包 API 错误:", errText);
      return new Response(
        JSON.stringify({ error: `豆包 API 返回错误: ${doubaoResp.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

<<<<<<< HEAD
=======
    // ── Stream response back to client ─────────────────────────
    // First, send RAG metadata as a special event
>>>>>>> 58e23eafe1172b121ce3e2f387b160dc55300a8a
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
<<<<<<< HEAD
=======
        // Send RAG source info first
>>>>>>> 58e23eafe1172b121ce3e2f387b160dc55300a8a
        if (ragSources.length > 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ rag: ragSources })}\n\n`)
          );
        }

        const reader = doubaoResp.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              continue;
            }
            try {
              const json = JSON.parse(data);
              const text = json.choices?.[0]?.delta?.content || "";
              if (text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                );
              }
            } catch { /* ignore */ }
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Generate API error:", err);
    return new Response(
      JSON.stringify({ error: "服务器内部错误，请稍后重试" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
