// lib/rag.ts
export interface KBChunk {
  id: string;
  docId: string;
  docName: string;
  docType: "policy" | "template" | "case" | "other";
  text: string;
  vector: number[];
  charStart: number;
  charEnd: number;
}

export interface KBDoc {
  id: string;
  name: string;
  type: "policy" | "template" | "case" | "other";
  size: number;
  uploadedAt: string;
  chunkCount: number;
  summary: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __ragChunks: KBChunk[] | undefined;
  // eslint-disable-next-line no-var
  var __ragDocs: KBDoc[] | undefined;
}

function getStore() {
  if (!globalThis.__ragChunks) globalThis.__ragChunks = [];
  if (!globalThis.__ragDocs)   globalThis.__ragDocs   = [];
  return { chunks: globalThis.__ragChunks, docs: globalThis.__ragDocs };
}

export function chunkText(
  text: string,
  chunkSize = 400,
  overlap = 80
): { text: string; charStart: number; charEnd: number }[] {
  const chunks: { text: string; charStart: number; charEnd: number }[] = [];
  const paragraphs = text.split(/\n{2,}/);
  let buffer = "";
  let bufferStart = 0;
  let pos = 0;

  for (const para of paragraphs) {
    const paraText = para.trim();
    if (!paraText) { pos += para.length + 2; continue; }

    if ((buffer + paraText).length > chunkSize && buffer.length > 0) {
      chunks.push({ text: buffer.trim(), charStart: bufferStart, charEnd: bufferStart + buffer.length });
      const overlapText = buffer.slice(-overlap);
      bufferStart = bufferStart + buffer.length - overlap;
      buffer = overlapText + "\n\n" + paraText;
    } else {
      if (buffer === "") bufferStart = pos;
      buffer += (buffer ? "\n\n" : "") + paraText;
    }
    pos += para.length + 2;
  }
  if (buffer.trim()) {
    chunks.push({ text: buffer.trim(), charStart: bufferStart, charEnd: bufferStart + buffer.length });
  }
  return chunks;
}

function textToVector(text: string): number[] {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").slice(0, 1000);
  const dims = 512;
  const vec = new Float32Array(dims);

  for (let i = 0; i < normalized.length - 1; i++) {
    const code = (normalized.charCodeAt(i) * 31 + normalized.charCodeAt(i + 1)) % dims;
    vec[code] += 1;
  }
  for (let i = 0; i < normalized.length - 2; i++) {
    const code = (normalized.charCodeAt(i) * 961 + normalized.charCodeAt(i+1) * 31 + normalized.charCodeAt(i+2)) % dims;
    vec[code] += 0.7;
  }
  const words = normalized.split(/\s+/);
  for (const word of words) {
    let h = 5381;
    for (let i = 0; i < word.length; i++) h = ((h << 5) + h) ^ word.charCodeAt(i);
    vec[((h >>> 0) % dims)] += 2;
  }

  let norm = 0;
  for (let i = 0; i < dims; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  const result: number[] = [];
  for (let i = 0; i < dims; i++) result.push(vec[i] / norm);
  return result;
}

export function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

export function addDocument(doc: KBDoc, rawText: string): void {
  const store = getStore();
  removeDocument(doc.id);
  store.docs.push(doc);

  const rawChunks = chunkText(rawText);
  for (const rc of rawChunks) {
    const chunk: KBChunk = {
      id: `${doc.id}-${Math.random().toString(36).slice(2)}`,
      docId: doc.id,
      docName: doc.name,
      docType: doc.type,
      text: rc.text,
      vector: textToVector(rc.text),
      charStart: rc.charStart,
      charEnd: rc.charEnd,
    };
    store.chunks.push(chunk);
  }
}

export function removeDocument(docId: string): void {
  const store = getStore();
  globalThis.__ragDocs   = store.docs.filter(d => d.id !== docId);
  globalThis.__ragChunks = store.chunks.filter(c => c.docId !== docId);
}

export function listDocuments(): KBDoc[] {
  return getStore().docs;
}

export function retrieve(query: string, topK = 5): KBChunk[] {
  const store = getStore();
  if (store.chunks.length === 0) return [];
  const qVec = textToVector(query);
  const scored = store.chunks.map(chunk => ({
    chunk,
    score: cosineSim(qVec, chunk.vector),
  }));
  scored.sort((a, b) => b.score - a.score);
  const docCount: Record<string, number> = {};
  const results: KBChunk[] = [];
  for (const { chunk, score } of scored) {
    if (score < 0.05) break;
    docCount[chunk.docId] = (docCount[chunk.docId] || 0) + 1;
    if (docCount[chunk.docId] > 2) continue;
    results.push(chunk);
    if (results.length >= topK) break;
  }
  return results;
}

export function buildRagContext(chunks: KBChunk[]): string {
  if (chunks.length === 0) return "";
  const grouped: Record<string, string[]> = {};
  for (const c of chunks) {
    if (!grouped[c.docName]) grouped[c.docName] = [];
    grouped[c.docName].push(c.text);
  }
  const parts = Object.entries(grouped).map(([name, texts]) =>
    `【参考文件：${name}】\n${texts.join("\n…\n")}`
  );
  return `\n\n## 知识库参考资料（请结合以下内容生成，可适当引用）\n${parts.join("\n\n")}`;
}
