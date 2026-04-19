"use client";
import { useState, useRef, useCallback } from "react";

// ─── Design tokens ─────────────────────────────────────────────
const T = {
  ink: "#16120e", ink70: "#5a5449", ink40: "#a09890",
  ink15: "#e8e4de", ink06: "#f5f3f0", paper: "#faf8f5",
  red: "#b5271a", redLight: "#fdf0ee",
  gold: "#c8922a", goldLight: "#fdf5e6",
  green: "#1e6641", greenLight: "#eaf4ee",
  blue: "#1b3d6e", blueLight: "#eaf0f8",
};

// ─── Chapter data ──────────────────────────────────────────────
const CHAPTERS = [
  { id: "bg",         label: "项目背景",   sub: "现状分析·必要性" },
  { id: "goal",       label: "建设目标",   sub: "总目标·量化指标" },
  { id: "basis",      label: "政策依据",   sub: "法规·标准·规范" },
  { id: "plan",       label: "总体方案",   sub: "架构设计·建设思路" },
  { id: "content",    label: "建设内容",   sub: "功能模块·系统组成" },
  { id: "tech",       label: "技术路线",   sub: "选型论证·实现方案" },
  { id: "innovation", label: "创新亮点",   sub: "特色优势·差异化" },
  { id: "org",        label: "组织保障",   sub: "机构·人员·制度" },
  { id: "risk",       label: "风险管控",   sub: "风险识别·应对" },
  { id: "budget",     label: "预算说明",   sub: "经费构成·资金安排" },
  { id: "schedule",   label: "实施计划",   sub: "阶段划分·里程碑" },
  { id: "effect",     label: "预期效益",   sub: "经济·社会·数据" },
];

const CHAPTER_PROMPTS: Record<string, string> = {
  bg:         "深入分析建设背景：①国家及地方数字化政策形势；②当前领域现状与主要不足（列举3-4点具体问题）；③建设必要性和紧迫性。层次清晰，有说服力。",
  goal:       "明确总体建设目标和分项目标。总目标1-2段宏观可量化；分项目标按数据资源、平台能力、应用服务、安全保障4-5个维度，每项含具体可衡量指标。",
  basis:      "梳理政策依据和标准规范：①国家+省+地方政策，引用真实文件名；②数据标准+安全标准+互联互通标准；③简述各政策指导意义。",
  plan:       "描述总体方案：①建设原则3-5条；②总体架构分层描述（基础设施→数据→平台→应用→安全体系）；③整体建设路径。架构层次清晰，逻辑严密。",
  content:    "详述建设内容，按4-6个核心模块展开，每模块：①定位与目标；②主要功能3-5个；③模块间关联。具体详实，突出重点。",
  tech:       "阐述技术路线：①核心技术架构；②主要技术选型及理由；③关键技术问题解决方案；④技术先进性与成熟性说明。",
  innovation: "提炼创新亮点三维度：①技术创新；②模式创新；③应用创新。每个亮点：是什么→为什么领先→如何实现，避免空洞。",
  org:        "说明组织保障：①领导机构职责分工；②项目管理团队配置；③制度保障体系；④跨部门协调机制。体现规范性和可执行性。",
  risk:       "识别与应对风险：①技术风险；②管理风险；③数据安全风险；④进度风险。每类：识别→评估→应对措施（不少于2条）。",
  budget:     "说明经费预算：按软件开发（40-60%）、硬件采购、系统集成、数据治理、运维保障、培训推广分类，给出占比及金额；说明资金来源；分年度计划。",
  schedule:   "制定实施计划：三阶段（基础建设期→功能完善期→推广应用期），每阶段：主要工作+里程碑节点+验收成果。进度安排合理可行。",
  effect:     "预测综合效益：①经济效益（效率提升、成本降低，具体数据）；②社会效益（服务改善、透明度提升）；③数据效益（资产积累、共享价值）。量化合理。",
};

// ─── Types ────────────────────────────────────────────────────
interface Project {
  name: string; org: string; level: string; budget: string;
  domain: string; desc: string; edge: string; region: string;
}
interface ChapterData { content: string; wc: number; }

// ─── Small components ──────────────────────────────────────────
function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: string }) {
  const map: Record<string, [string, string]> = {
    gray:  [T.ink15, T.ink70],   green: [T.greenLight, T.green],
    red:   [T.redLight, T.red],  gold:  [T.goldLight, T.gold],
    blue:  [T.blueLight, T.blue],
  };
  const [bg, fg] = map[color] || map.gray;
  return (
    <span style={{
      fontSize: 11, padding: "2px 9px", borderRadius: 20,
      background: bg, color: fg, fontWeight: 500, whiteSpace: "nowrap", display: "inline-block",
    }}>{children}</span>
  );
}

function Btn({ children, onClick, variant = "ghost", disabled, full, small }: {
  children: React.ReactNode; onClick?: () => void; variant?: string;
  disabled?: boolean; full?: boolean; small?: boolean;
}) {
  const vs: Record<string, React.CSSProperties> = {
    ghost:   { background: "transparent", color: T.ink70, border: `0.5px solid ${T.ink15}` },
    primary: { background: T.ink,  color: "#fff", border: "none" },
    gold:    { background: T.gold, color: "#fff", border: "none" },
  };
  return (
    <button disabled={disabled} onClick={disabled ? undefined : onClick} style={{
      ...vs[variant], padding: small ? "4px 10px" : "7px 14px",
      borderRadius: 3, fontSize: small ? 11 : 12, fontWeight: 500,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1, width: full ? "100%" : "auto",
      display: "inline-flex", alignItems: "center", gap: 5, transition: "opacity 0.15s",
    }}>{children}</button>
  );
}

// ─── Project Modal ─────────────────────────────────────────────
function ProjectModal({ project, onSave, onClose }: {
  project: Project | null;
  onSave: (p: Project) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState<Project>(project || {
    name: "", org: "", level: "省级", budget: "500-2000万",
    domain: "数字资源体系建设", desc: "", edge: "", region: "",
  });
  const set = (k: keyof Project, v: string) => setF(p => ({ ...p, [k]: v }));
  const inp: React.CSSProperties = {
    width: "100%", padding: "8px 10px", border: `0.5px solid ${T.ink15}`,
    borderRadius: 3, fontSize: 13, color: T.ink, background: "#fff",
  };
  return (
    <div onClick={e => { if (e.target === e.currentTarget && project) onClose(); }} style={{
      position: "fixed", inset: 0, background: "rgba(22,18,14,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, backdropFilter: "blur(2px)",
    }}>
      <div style={{
        background: "#fff", borderRadius: 6, width: 540, maxWidth: "92vw",
        maxHeight: "90vh", overflow: "auto",
        boxShadow: "0 8px 40px rgba(0,0,0,0.2), 0 0 0 0.5px rgba(0,0,0,0.05)",
      }}>
        <div style={{
          padding: "20px 24px 16px", borderBottom: `0.5px solid ${T.ink15}`,
          display: "flex", alignItems: "center",
        }}>
          <span style={{ fontFamily: "serif", fontSize: 17, fontWeight: 700, flex: 1 }}>项目基本信息</span>
          {project && (
            <button onClick={onClose} style={{
              width: 28, height: 28, borderRadius: "50%", background: T.ink06,
              border: "none", cursor: "pointer", fontSize: 15, color: T.ink70,
            }}>✕</button>
          )}
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {([["项目名称 *", "name", "如：XX市数字资源体系建设项目"],
               ["申报主体 *", "org", "如：XX市大数据局"]] as const).map(([label, key, ph]) => (
              <label key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, color: T.ink70, fontWeight: 500 }}>{label}</span>
                <input style={inp} value={f[key]} placeholder={ph}
                  onChange={e => set(key as keyof Project, e.target.value)} />
              </label>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: T.ink70, fontWeight: 500 }}>申报级别</span>
              <select style={inp} value={f.level} onChange={e => set("level", e.target.value)}>
                {["国家级","省级","市级","区县级"].map(o => <option key={o}>{o}</option>)}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: T.ink70, fontWeight: 500 }}>项目预算</span>
              <select style={inp} value={f.budget} onChange={e => set("budget", e.target.value)}>
                {["100万以下","100-500万","500-2000万","2000万-1亿","1亿以上"].map(o => <option key={o}>{o}</option>)}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: T.ink70, fontWeight: 500 }}>所在地区</span>
              <input style={inp} value={f.region} placeholder="如：广东省广州市"
                onChange={e => set("region", e.target.value)} />
            </label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: T.ink70, fontWeight: 500 }}>建设领域</span>
            <select style={inp} value={f.domain} onChange={e => set("domain", e.target.value)}>
              {["数字资源体系建设","一体化政务服务平台","政务数据共享与治理",
                "数字基础设施建设","智慧城市综合建设","数字政府能力提升"].map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: T.ink70, fontWeight: 500 }}>核心建设内容 *</span>
            <textarea style={{ ...inp, resize: "vertical", minHeight: 80, lineHeight: 1.6 }}
              value={f.desc} onChange={e => set("desc", e.target.value)}
              placeholder="如：建设城市级数据中台，整合全市政务数据资源，实现跨部门数据共享与业务协同…" />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: T.ink70, fontWeight: 500 }}>项目特色与优势（选填）</span>
            <textarea style={{ ...inp, resize: "vertical", minHeight: 56, lineHeight: 1.6 }}
              value={f.edge} onChange={e => set("edge", e.target.value)}
              placeholder="如：率先引入数据要素市场化配置机制；已有XX个部门数据接入基础…" />
          </label>
        </div>
        <div style={{
          padding: "14px 24px", borderTop: `0.5px solid ${T.ink15}`,
          display: "flex", justifyContent: "flex-end", gap: 8,
        }}>
          {project && <Btn onClick={onClose}>取消</Btn>}
          <Btn variant="primary" onClick={() => {
            if (!f.name || !f.org || !f.desc) { alert("请填写项目名称、申报主体和核心建设内容"); return; }
            onSave(f);
          }}>保存项目信息</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Validation ────────────────────────────────────────────────
function Validation({ content, wordTarget }: { content: string; wordTarget: number }) {
  const wc = content.replace(/\s/g, "").length;
  const policies = (content.match(/《[^》]+》/g) || []).length;
  const hasStruct = /[（(][一二三四五六七八九十][）)]|[一二三四五六七八九十][、．]/.test(content);
  const banned = ["绝对第一","全国唯一","保证中标"].filter(w => content.includes(w));
  return (
    <div style={{
      marginTop: 10, padding: "12px 16px", background: T.ink06,
      borderRadius: 4, border: `0.5px solid ${T.ink15}`,
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.ink40, marginBottom: 8 }}>
        质量检查
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <Badge color={wc >= wordTarget * 0.82 ? "green" : "red"}>
          {wc >= wordTarget * 0.82 ? `字数达标（${wc}字）` : `字数偏少（${wc}/${wordTarget}字）`}
        </Badge>
        <Badge color={policies > 0 ? "green" : "gold"}>
          {policies > 0 ? `引用政策 ${policies} 处` : "建议增加政策引用"}
        </Badge>
        <Badge color={hasStruct ? "green" : "gold"}>
          {hasStruct ? "章节结构清晰" : "建议增加小节标题"}
        </Badge>
        <Badge color={banned.length === 0 ? "green" : "red"}>
          {banned.length === 0 ? "合规词汇通过" : `含风险词：${banned.join("、")}`}
        </Badge>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────
export default function Page() {
  const [project, setProject]       = useState<Project | null>(null);
  const [showModal, setShowModal]   = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wordTarget, setWordTarget] = useState(1500);
  const [extra, setExtra]           = useState("");
  const [chapters, setChapters]     = useState<Record<string, ChapterData>>({});
  const [generating, setGenerating] = useState(false);
  const [genId, setGenId]           = useState<string | null>(null);
  const [display, setDisplay]       = useState("");
  const [streaming, setStreaming]   = useState(false);
  const [error, setError]           = useState("");
  const outputRef = useRef<HTMLDivElement>(null);

  const selCh   = CHAPTERS.find(c => c.id === selectedId);
  const curData = selectedId ? chapters[selectedId] : null;
  const doneCount = Object.keys(chapters).length;

  // Build the prompt to send to our backend
  const buildPrompt = useCallback((id: string, variant?: string) => {
    if (!project) return "";
    const ch = CHAPTERS.find(c => c.id === id)!;
    const done = CHAPTERS.filter(c => chapters[c.id] && c.id !== id)
      .map(c => `· ${c.label}（${chapters[c.id].wc}字）`).join("\n");

    return `## 项目信息
- 项目名称：${project.name}
- 申报主体：${project.org}
- 申报级别：${project.level}
- 项目预算：${project.budget}
- 建设领域：${project.domain}
- 所在地区：${project.region || "（未指定）"}
- 核心建设内容：${project.desc}
${project.edge ? `- 项目特色优势：${project.edge}` : ""}
${done ? `\n## 已完成章节（请保持全文一致性）\n${done}` : ""}

## 当前任务
章节名称：${ch.label}
目标字数：约${wordTarget}字（允许±15%浮动）
${CHAPTER_PROMPTS[id]}
${extra ? `\n补充要求：${extra}` : ""}
${variant ? `\n风格要求：${variant}` : ""}

## 写作规范
1. 使用正式公文风格，语言严谨专业，避免口语化
2. 段落结构清晰，使用"（一）（二）"或"一、二、"作为小标题
3. 只引用真实存在的政策文件名称，不编造政策编号
4. 数据和指标要与项目规模匹配，量化目标合理可信
5. 内容紧密结合项目实际，避免通用套话
6. 直接输出章节内容，不要输出任何解释说明

请撰写「${ch.label}」章节内容：`;
  }, [project, chapters, wordTarget, extra]);

  // Generate: call our own backend /api/generate (which calls Doubao)
  const generate = useCallback(async (variant?: string) => {
    if (!project || !selectedId || generating) return;
    setGenerating(true);
    setGenId(selectedId);
    setDisplay("");
    setStreaming(true);
    setError("");

    const prompt = buildPrompt(selectedId, variant);

    try {
      // 调用自己的后端，后端再调豆包（API Key 安全存在服务器）
      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || `服务错误 ${resp.status}`);
      }

      // 读取 SSE 流式响应
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const json = JSON.parse(data);
            if (json.text) {
              fullText += json.text;
              setDisplay(fullText);
              // Auto-scroll
              if (outputRef.current) {
                outputRef.current.scrollTop = outputRef.current.scrollHeight;
              }
            }
          } catch { /* ignore parse errors */ }
        }
      }

      if (!fullText) throw new Error("AI 未返回内容，请重试");

      const wc = fullText.replace(/\s/g, "").length;
      setChapters(prev => ({ ...prev, [selectedId]: { content: fullText, wc } }));
      setDisplay(fullText);

    } catch (err: any) {
      setError(err.message || "生成失败，请检查网络后重试");
      setDisplay("");
    } finally {
      setGenerating(false);
      setGenId(null);
      setStreaming(false);
    }
  }, [project, selectedId, generating, buildPrompt]);

  const selectCh = (id: string) => {
    setSelectedId(id);
    setError("");
    if (chapters[id]) setDisplay(chapters[id].content);
    else setDisplay("");
  };

  const copy = () => {
    const t = curData?.content || display;
    if (t) navigator.clipboard.writeText(t).then(() => alert("已复制到剪贴板"));
  };

  const exportAll = () => {
    const done = CHAPTERS.filter(c => chapters[c.id]);
    if (!done.length) { alert("暂无已生成章节"); return; }
    const body = done.map(c =>
      `第${CHAPTERS.indexOf(c)+1}章 ${c.label}\n\n${chapters[c.id].content}`
    ).join("\n\n\n");
    const full = `${project?.name || "标书"}\n${"=".repeat(32)}\n\n${body}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([full], { type: "text/plain;charset=utf-8" }));
    a.download = `${project?.name || "标书"}_草稿.txt`;
    a.click();
  };

  const showRight = selectedId && (streaming || display || curData || error);

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      fontFamily: "'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif",
      background: T.paper, color: T.ink, fontSize: 14,
    }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes glow  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        input:focus, select:focus, textarea:focus {
          outline: none !important;
          border-color: ${T.gold} !important;
          box-shadow: 0 0 0 2px ${T.gold}22 !important;
        }
        button { cursor: pointer; }
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 228, minWidth: 228, background: T.ink,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ padding: "20px 18px 14px", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            fontFamily: "serif", fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "0.03em",
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%", background: T.red,
              display: "inline-block", boxShadow: `0 0 6px ${T.red}80`,
            }} />
            标智 BidAI
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4, letterSpacing: "0.05em" }}>
            政务申报标书智能生成
          </div>
        </div>

        {project && (
          <div style={{ padding: "10px 16px 8px", borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>当前项目</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{project.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>{project.org} · {project.level}</div>
            <div style={{ marginTop: 7 }}><Badge color="gold">{doneCount}/{CHAPTERS.length} 章</Badge></div>
          </div>
        )}

        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", padding: "10px 18px 4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          章节导航
        </div>
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
          {CHAPTERS.map((ch, i) => {
            const active = selectedId === ch.id;
            const done = !!chapters[ch.id];
            const isGen = genId === ch.id;
            return (
              <div key={ch.id} onClick={() => selectCh(ch.id)} style={{
                display: "flex", alignItems: "center", gap: 9, padding: "8px 16px", cursor: "pointer",
                borderLeft: `2px solid ${active ? T.red : "transparent"}`,
                background: active ? "rgba(181,39,26,0.08)" : "transparent",
                transition: "all 0.12s",
              }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", minWidth: 18, fontFamily: "monospace" }}>
                  {String(i+1).padStart(2, "0")}
                </span>
                <span style={{ fontSize: 12, flex: 1, color: active ? "#fff" : "rgba(255,255,255,0.52)", lineHeight: 1.3 }}>
                  {ch.label}
                </span>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: isGen ? T.gold : done ? T.green : "rgba(255,255,255,0.1)",
                  animation: isGen ? "glow 1s infinite" : "none",
                }} />
              </div>
            );
          })}
        </div>

        <div style={{ padding: "10px 14px", borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
          <button onClick={exportAll} style={{
            width: "100%", padding: "7px", background: "transparent",
            border: "0.5px solid rgba(255,255,255,0.14)", borderRadius: 3,
            color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "inherit",
          }}>⬇ 导出全文草稿</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <header style={{
          height: 52, background: "#fff", borderBottom: `0.5px solid ${T.ink15}`,
          display: "flex", alignItems: "center", padding: "0 20px", gap: 10, flexShrink: 0,
        }}>
          <div style={{ fontFamily: "serif", fontSize: 15, fontWeight: 700, flex: 1 }}>
            {project ? project.name : "政务申报标书生成工作台"}
          </div>
          {project && (
            <span style={{ fontSize: 11, color: T.ink70, padding: "3px 10px", background: T.ink06, borderRadius: 20 }}>
              {project.level} · {project.budget} · {project.domain}
            </span>
          )}
          <Btn onClick={() => setShowModal(true)}>✎ {project ? "编辑项目" : "填写项目信息"}</Btn>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>

          {/* Left control panel */}
          <div style={{
            width: 296, minWidth: 296, background: "#fff",
            borderRight: `0.5px solid ${T.ink15}`,
            display: "flex", flexDirection: "column", overflowY: "auto", padding: 16,
          }}>
            {/* Chapter grid */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink40, marginBottom: 9, paddingBottom: 6, borderBottom: `0.5px solid ${T.ink15}` }}>
                选择章节
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                {CHAPTERS.map(ch => {
                  const sel = selectedId === ch.id;
                  const done = !!chapters[ch.id];
                  return (
                    <button key={ch.id} onClick={() => selectCh(ch.id)} style={{
                      padding: "8px 10px", borderRadius: 3, textAlign: "left",
                      border: `0.5px solid ${sel ? T.red : done ? T.green + "55" : T.ink15}`,
                      background: sel ? T.redLight : done ? T.greenLight + "90" : T.ink06,
                      cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                    }}>
                      <div style={{ fontSize: 12, color: sel ? T.red : done ? T.green : T.ink, fontWeight: sel || done ? 500 : 400 }}>
                        {ch.label}
                      </div>
                      <div style={{ fontSize: 10, color: done ? T.green : T.ink40, marginTop: 2 }}>
                        {done ? "✓ 已生成" : ch.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Word target */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink40, marginBottom: 8, paddingBottom: 6, borderBottom: `0.5px solid ${T.ink15}` }}>
                目标字数
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {([["~800字", 800], ["~1500字", 1500], ["~2500字", 2500], ["~4000字", 4000]] as const).map(([label, val]) => (
                  <button key={val} onClick={() => setWordTarget(val)} style={{
                    padding: "4px 11px", borderRadius: 20, fontSize: 11,
                    border: `0.5px solid ${wordTarget === val ? T.ink : T.ink15}`,
                    background: wordTarget === val ? T.ink : "transparent",
                    color: wordTarget === val ? "#fff" : T.ink70, transition: "all 0.12s",
                    fontFamily: "inherit",
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {/* Extra */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink40, marginBottom: 8, paddingBottom: 6, borderBottom: `0.5px solid ${T.ink15}` }}>
                补充要求（选填）
              </div>
              <textarea value={extra} onChange={e => setExtra(e.target.value)}
                placeholder='如：重点突出数据要素流通机制；需引用"十四五"规划；偏技术路线描述…'
                style={{
                  width: "100%", padding: "8px 10px", border: `0.5px solid ${T.ink15}`,
                  borderRadius: 3, fontSize: 12, color: T.ink, resize: "vertical",
                  minHeight: 64, lineHeight: 1.6, background: "#fff", fontFamily: "inherit",
                }} />
            </div>

            {/* Generate */}
            <div style={{ marginTop: "auto", paddingTop: 12, borderTop: `0.5px solid ${T.ink15}` }}>
              <button
                disabled={!selectedId || !project || generating}
                onClick={() => generate()}
                style={{
                  width: "100%", padding: "10px", borderRadius: 3, border: "none",
                  background: (!selectedId || !project || generating) ? T.ink40 : T.ink,
                  color: "#fff", fontSize: 14, fontWeight: 500, fontFamily: "inherit",
                  cursor: (!selectedId || !project || generating) ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}>
                {generating ? "⏳ 生成中…" : selCh ? `生成「${selCh.label}」` : "请先选择章节"}
              </button>
              <div style={{ fontSize: 11, color: T.ink40, textAlign: "center", marginTop: 6 }}>
                豆包 AI 生成 · 请核实政策引用后使用
              </div>

              {/* Refine pills */}
              {curData && !generating && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink40, marginBottom: 7 }}>
                    快速优化
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {([
                      ["更技术化", "更技术化，增加技术细节和实现路径"],
                      ["强化政策", "更偏政策导向，加强政策依据引用"],
                      ["增加指标", "增加具体数据指标和量化目标"],
                      ["精练语言", "语言更精练，保留核心观点减少冗余"],
                    ] as const).map(([label, dir]) => (
                      <button key={label} onClick={() => generate(dir)} style={{
                        padding: "4px 10px", borderRadius: 20, fontSize: 11,
                        border: `0.5px solid ${T.ink15}`, background: T.ink06,
                        color: T.ink70, transition: "all 0.12s", fontFamily: "inherit",
                      }}>{label}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right output panel */}
          <div style={{ flex: 1, background: T.ink06, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {showRight && (
              <div style={{
                padding: "10px 20px", background: "#fff", borderBottom: `0.5px solid ${T.ink15}`,
                display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
              }}>
                <span style={{ fontFamily: "serif", fontSize: 14, fontWeight: 700, flex: 1 }}>
                  {selCh?.label}
                </span>
                {generating ? <Badge color="gold">生成中…</Badge> : error ? <Badge color="red">生成失败</Badge> : <Badge color="green">已完成</Badge>}
                {curData && <Badge color="blue">{curData.wc} 字</Badge>}
                <Btn onClick={copy} small>复制全文</Btn>
                <Btn onClick={() => generate()} disabled={generating} small>重新生成</Btn>
              </div>
            )}

            <div ref={outputRef} style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {!showRight ? (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", height: "100%", gap: 14, color: T.ink40, textAlign: "center",
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%", background: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 26, boxShadow: "0 1px 8px rgba(0,0,0,0.07)",
                  }}>📋</div>
                  <div style={{ fontFamily: "serif", fontSize: 16, color: T.ink }}>开始生成标书内容</div>
                  <div style={{ fontSize: 13, maxWidth: 260, lineHeight: 1.6 }}>
                    {!project ? "请先点击右上角「填写项目信息」" : "在左侧选择章节，设置字数目标，点击生成"}
                  </div>
                  {!project && <Btn variant="primary" onClick={() => setShowModal(true)}>填写项目信息</Btn>}
                </div>
              ) : (
                <div>
                  {error ? (
                    <div style={{
                      padding: 20, background: T.redLight, borderRadius: 5,
                      border: `0.5px solid ${T.red}33`, color: T.red, fontSize: 13, lineHeight: 1.7,
                    }}>
                      <strong>生成失败：</strong>{error}
                      <br /><br />
                      <Btn onClick={() => generate()} variant="primary" small>重新生成</Btn>
                    </div>
                  ) : (
                    <>
                      <div style={{
                        background: "#fff", borderRadius: 5, marginBottom: 10,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)",
                      }}>
                        <div style={{
                          padding: "12px 20px", borderBottom: `0.5px solid ${T.ink15}`,
                          display: "flex", alignItems: "center", gap: 10,
                        }}>
                          <span style={{ fontFamily: "serif", fontSize: 13, fontWeight: 700, flex: 1 }}>
                            第 {CHAPTERS.findIndex(c => c.id === selectedId)+1} 章 · {selCh?.label}
                          </span>
                          <span style={{ fontSize: 11, color: T.ink40 }}>目标 {wordTarget} 字</span>
                        </div>
                        <div style={{
                          padding: "24px", fontSize: 14, lineHeight: 2, color: T.ink,
                          whiteSpace: "pre-wrap", fontFamily: "'Noto Sans SC',sans-serif", minHeight: 200,
                        }}>
                          {display}
                          {streaming && (
                            <span style={{
                              display: "inline-block", width: 2, height: "1em",
                              background: T.red, marginLeft: 1, verticalAlign: "text-bottom",
                              animation: "blink 0.7s infinite",
                            }} />
                          )}
                        </div>
                        {curData && !streaming && (
                          <div style={{
                            padding: "9px 20px", borderTop: `0.5px solid ${T.ink15}`,
                            fontSize: 11, color: T.ink40, display: "flex", gap: 10,
                          }}>
                            <span>字数：{curData.wc}</span>
                            <span style={{ color: T.ink15 }}>·</span>
                            <span>达成率：{Math.round(curData.wc / wordTarget * 100)}%</span>
                            <span style={{ color: T.ink15 }}>·</span>
                            <span>模型：豆包 Doubao-pro</span>
                          </div>
                        )}
                      </div>
                      {curData && !streaming && (
                        <Validation content={curData.content} wordTarget={wordTarget} />
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <ProjectModal
          project={project}
          onSave={p => { setProject(p); setShowModal(false); }}
          onClose={() => { if (project) setShowModal(false); }}
        />
      )}
    </div>
  );
}
