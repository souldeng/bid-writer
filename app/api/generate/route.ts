import { NextRequest } from "next/server";

export const runtime = "edge"; // 使用 Edge Runtime，流式响应更快

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "缺少 prompt 参数" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey   = process.env.DOUBAO_API_KEY;
    const modelId  = process.env.DOUBAO_MODEL_ID;
    const baseUrl  = process.env.DOUBAO_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";

    if (!apiKey || !modelId) {
      return new Response(
        JSON.stringify({ error: "服务端未配置 API Key，请联系管理员" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 调用豆包 API（兼容 OpenAI 格式，stream 模式）
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
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "你是一位拥有15年政务项目申报经验的专家顾问，精通数字政务、数字资源体系建设领域的标书撰写规范。写作风格正式、严谨、专业。",
          },
          {
            role: "user",
            content: prompt,
          },
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

    // 把豆包的流式响应直接转发给前端
    // 豆包返回标准 SSE 格式，前端可以直接读取
    const stream = new ReadableStream({
      async start(controller) {
        const reader = doubaoResp.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          // 解析 SSE 数据，提取文本内容
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
              continue;
            }
            try {
              const json = JSON.parse(data);
              const text = json.choices?.[0]?.delta?.content || "";
              if (text) {
                // 转发给前端：每次发一个文本片段
                controller.enqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`)
                );
              }
            } catch {
              // 忽略解析失败的行
            }
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
        // CORS（如果前后端不同域需要）
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("API route 错误:", err);
    return new Response(
      JSON.stringify({ error: "服务器内部错误，请稍后重试" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
