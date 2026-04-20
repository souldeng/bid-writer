"use client";
import { useState, useRef, useCallback, useEffect } from "react";

const T = {
  ink:"#16120e",ink70:"#5a5449",ink40:"#a09890",ink15:"#e8e4de",ink06:"#f5f3f0",paper:"#faf8f5",
  red:"#b5271a",redBg:"#fdf0ee",gold:"#c8922a",goldBg:"#fdf5e6",goldLight:"#e8d0a0",
  green:"#1e6641",greenBg:"#eaf4ee",blue:"#1b3d6e",blueBg:"#eaf0f8",purple:"#5b2d8e",purpleBg:"#f3edfb",
};

const CHAPTERS=[
  {id:"bg",label:"项目背景",sub:"现状分析·必要性"},{id:"goal",label:"建设目标",sub:"总目标·量化指标"},
  {id:"basis",label:"政策依据",sub:"法规·标准·规范"},{id:"plan",label:"总体方案",sub:"架构设计·建设思路"},
  {id:"content",label:"建设内容",sub:"功能模块·系统"},{id:"tech",label:"技术路线",sub:"选型论证·实现"},
  {id:"innovation",label:"创新亮点",sub:"特色优势·差异化"},{id:"org",label:"组织保障",sub:"机构·人员·制度"},
  {id:"risk",label:"风险管控",sub:"风险识别·应对"},{id:"budget",label:"预算说明",sub:"经费构成·安排"},
  {id:"schedule",label:"实施计划",sub:"阶段划分·里程碑"},{id:"effect",label:"预期效益",sub:"经济·社会·数据"},
];

const PROMPTS:Record<string,string>={
  bg:"深入分析建设背景：①国家及地方数字化政策形势；②当前领域现状与主要不足（列举3-4点）；③建设必要性和紧迫性。层次清晰，有说服力。",
  goal:"明确总体建设目标和分项目标。总目标1-2段宏观可量化；分项目标按数据资源、平台能力、应用服务、安全保障4-5个维度，每项含具体可衡量指标。",
  basis:"梳理政策依据和标准规范：①国家+省+地方政策，引用真实文件名；②数据标准+安全标准+互联互通标准；③简述各政策指导意义。",
  plan:"描述总体方案：①建设原则3-5条；②总体架构分层描述（基础设施→数据→平台→应用→安全体系）；③整体建设路径。架构层次清晰。",
  content:"详述建设内容，按4-6个核心模块展开，每模块：①定位与目标；②主要功能3-5个；③模块间关联关系。具体详实。",
  tech:"阐述技术路线：①核心技术架构；②主要技术选型及理由；③关键技术问题解决方案；④技术先进性与成熟性说明。",
  innovation:"提炼创新亮点三维度：①技术创新；②模式创新；③应用创新。每个亮点：是什么→为什么领先→如何实现，避免空洞。",
  org:"说明组织保障：①领导机构职责分工；②项目管理团队配置；③制度保障体系；④跨部门协调机制。",
  risk:"识别与应对风险：①技术风险；②管理风险；③数据安全风险；④进度风险。每类：识别→评估→应对措施（不少于2条）。",
  budget:"说明经费预算：按软件开发（40-60%）、硬件采购、系统集成、数据治理、运维保障、培训推广分类，给出占比及金额；资金来源；分年度计划。",
  schedule:"制定实施计划：三阶段（基础建设→功能完善→推广应用期），每阶段：主要工作+里程碑节点+验收成果。",
  effect:"预测综合效益：①经济效益（效率提升、成本降低，具体数据）；②社会效益；③数据效益（资产积累、共享价值）。量化合理。",
};

const DOC_TYPES=[
  {value:"policy",label:"政策文件",color:T.blue,bg:T.blueBg},
  {value:"template",label:"申报模板",color:T.green,bg:T.greenBg},
  {value:"case",label:"案例参考",color:T.purple,bg:T.purpleBg},
  {value:"other",label:"其他材料",color:T.ink70,bg:T.ink06},
];

interface Project{name:string;org:string;level:string;budget:string;domain:string;desc:string;edge:string;region:string;}
interface ChapterData{content:string;wc:number;ragSources?:string[];}
interface KBDoc{id:string;name:string;type:string;size:number;uploadedAt:string;chunkCount:number;summary:string;}
type View="workspace"|"kb"|"export";

function fmtSize(b:number){if(b<1024)return`${b}B`;if(b<1048576)return`${(b/1024).toFixed(1)}KB`;return`${(b/1048576).toFixed(1)}MB`;}
function fmtDate(s:string){return new Date(s).toLocaleDateString("zh-CN",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});}

function Badge({children,color="gray",dot}:{children:React.ReactNode;color?:string;dot?:boolean}){
  const m:Record<string,[string,string]>={gray:[T.ink15,T.ink70],green:[T.greenBg,T.green],red:[T.redBg,T.red],gold:[T.goldBg,T.gold],blue:[T.blueBg,T.blue],purple:[T.purpleBg,T.purple]};
  const[bg,fg]=m[color]||m.gray;
  return<span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:bg,color:fg,fontWeight:500,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:4}}>
    {dot&&<span style={{width:5,height:5,borderRadius:"50%",background:fg,display:"inline-block"}}/>}{children}</span>;
}

function Btn({children,onClick,variant="ghost",disabled,full,sm}:{children?:React.ReactNode;onClick?:()=>void;variant?:string;disabled?:boolean;full?:boolean;sm?:boolean;}){
  const vs:Record<string,React.CSSProperties>={
    ghost:{background:"transparent",color:T.ink70,border:`0.5px solid ${T.ink15}`},
    primary:{background:T.ink,color:"#fff",border:"none"},
    red:{background:T.red,color:"#fff",border:"none"},
    blue:{background:T.blue,color:"#fff",border:"none"},
  };
  return<button disabled={disabled} onClick={disabled?undefined:onClick} style={{...vs[variant],padding:sm?"4px 10px":"7px 16px",borderRadius:3,fontSize:sm?11:12,fontWeight:500,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.45:1,width:full?"100%":"auto",display:"inline-flex",alignItems:"center",gap:5,fontFamily:"inherit",transition:"opacity 0.12s"}}>{children}</button>;
}

function SLabel({children}:{children:React.ReactNode}){
  return<div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:T.ink40,marginBottom:8,paddingBottom:6,borderBottom:`0.5px solid ${T.ink15}`}}>{children}</div>;
}

let _tt:ReturnType<typeof setTimeout>;
function Toast({msg,type}:{msg:string;type:"ok"|"err"|"info"}){
  const c={ok:T.green,err:T.red,info:T.ink};
  return<div style={{position:"fixed",bottom:24,right:24,zIndex:300,background:c[type],color:"#fff",padding:"11px 18px",borderRadius:4,fontSize:13,fontWeight:500,boxShadow:"0 4px 16px rgba(0,0,0,0.18)",animation:"slideUp 0.2s ease"}}>{msg}</div>;
}

function ProjectModal({project,onSave,onClose}:{project:Project|null;onSave:(p:Project)=>void;onClose:()=>void;}){
  const[f,setF]=useState<Project>(project||{name:"",org:"",level:"省级",budget:"500-2000万",domain:"数字资源体系建设",desc:"",edge:"",region:""});
  const set=(k:keyof Project,v:string)=>setF(p=>({...p,[k]:v}));
  const inp:React.CSSProperties={width:"100%",padding:"8px 10px",border:`0.5px solid ${T.ink15}`,borderRadius:3,fontSize:13,color:T.ink,background:"#fff",fontFamily:"inherit"};
  return(
    <div onClick={e=>{if(e.target===e.currentTarget&&project)onClose();}} style={{position:"fixed",inset:0,background:"rgba(22,18,14,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(2px)"}}>
      <div style={{background:"#fff",borderRadius:8,width:560,maxWidth:"92vw",maxHeight:"92vh",overflow:"auto",boxShadow:"0 12px 48px rgba(0,0,0,0.22)"}}>
        <div style={{padding:"22px 26px 16px",borderBottom:`0.5px solid ${T.ink15}`,display:"flex",alignItems:"center"}}>
          <span style={{fontFamily:"serif",fontSize:18,fontWeight:700,flex:1}}>项目基本信息</span>
          {project&&<button onClick={onClose} style={{width:28,height:28,borderRadius:"50%",background:T.ink06,border:"none",cursor:"pointer",fontSize:15,color:T.ink70}}>✕</button>}
        </div>
        <div style={{padding:"20px 26px",display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {([["项目名称 *","name","如：XX市数字资源体系建设项目"],["申报主体 *","org","如：XX市大数据局"]]as const).map(([l,k,ph])=>(
              <label key={k} style={{display:"flex",flexDirection:"column",gap:4}}>
                <span style={{fontSize:12,color:T.ink70,fontWeight:500}}>{l}</span>
                <input style={inp} value={f[k]} placeholder={ph} onChange={e=>set(k,e.target.value)}/>
              </label>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <label style={{display:"flex",flexDirection:"column",gap:4}}><span style={{fontSize:12,color:T.ink70,fontWeight:500}}>申报级别</span>
              <select style={inp} value={f.level} onChange={e=>set("level",e.target.value)}>{["国家级","省级","市级","区县级"].map(o=><option key={o}>{o}</option>)}</select></label>
            <label style={{display:"flex",flexDirection:"column",gap:4}}><span style={{fontSize:12,color:T.ink70,fontWeight:500}}>项目预算</span>
              <select style={inp} value={f.budget} onChange={e=>set("budget",e.target.value)}>{["100万以下","100-500万","500-2000万","2000万-1亿","1亿以上"].map(o=><option key={o}>{o}</option>)}</select></label>
            <label style={{display:"flex",flexDirection:"column",gap:4}}><span style={{fontSize:12,color:T.ink70,fontWeight:500}}>所在地区</span>
              <input style={inp} value={f.region} placeholder="如：广东省广州市" onChange={e=>set("region",e.target.value)}/></label>
          </div>
          <label style={{display:"flex",flexDirection:"column",gap:4}}><span style={{fontSize:12,color:T.ink70,fontWeight:500}}>建设领域</span>
            <select style={inp} value={f.domain} onChange={e=>set("domain",e.target.value)}>{["数字资源体系建设","一体化政务服务平台","政务数据共享与治理","数字基础设施建设","智慧城市综合建设","数字政府能力提升"].map(o=><option key={o}>{o}</option>)}</select></label>
          <label style={{display:"flex",flexDirection:"column",gap:4}}><span style={{fontSize:12,color:T.ink70,fontWeight:500}}>核心建设内容 *</span>
            <textarea style={{...inp,resize:"vertical",minHeight:80,lineHeight:1.6}} value={f.desc} placeholder="如：建设城市级数据中台，整合全市政务数据资源，实现跨部门数据共享与业务协同…" onChange={e=>set("desc",e.target.value)}/></label>
          <label style={{display:"flex",flexDirection:"column",gap:4}}><span style={{fontSize:12,color:T.ink70,fontWeight:500}}>项目特色与优势（选填）</span>
            <textarea style={{...inp,resize:"vertical",minHeight:56,lineHeight:1.6}} value={f.edge} placeholder="如：率先引入数据要素市场化配置机制；已有XX个部门数据接入基础…" onChange={e=>set("edge",e.target.value)}/></label>
        </div>
        <div style={{padding:"14px 26px",borderTop:`0.5px solid ${T.ink15}`,display:"flex",justifyContent:"flex-end",gap:8}}>
          {project&&<Btn onClick={onClose}>取消</Btn>}
          <Btn variant="primary" onClick={()=>{if(!f.name||!f.org||!f.desc){alert("请填写项目名称、申报主体和核心建设内容");return;}onSave(f);}}>保存项目信息</Btn>
        </div>
      </div>
    </div>
  );
}

function KBPanel({onToast}:{onToast:(m:string,t:"ok"|"err"|"info")=>void}){
  const[docs,setDocs]=useState<KBDoc[]>([]);
  const[uploading,setUploading]=useState(false);
  const[dragOver,setDragOver]=useState(false);
  const[selType,setSelType]=useState("policy");
  const[loading,setLoading]=useState(true);
  const fileRef=useRef<HTMLInputElement>(null);

  const fetchDocs=useCallback(async()=>{
    try{const r=await fetch("/api/kb");const d=await r.json();setDocs(d.docs||[]);}catch{}setLoading(false);
  },[]);
  useEffect(()=>{fetchDocs();},[fetchDocs]);

  const uploadFiles=async(files:FileList|null)=>{
    if(!files||!files.length)return;
    setUploading(true);let ok=0,fail=0;
    for(const f of Array.from(files)){
      const fd=new FormData();fd.append("file",f);fd.append("type",selType);
      try{const r=await fetch("/api/upload",{method:"POST",body:fd});const d=await r.json();if(d.success)ok++;else{fail++;onToast(`「${f.name}」：${d.error}`,"err");}}
      catch{fail++;onToast(`「${f.name}」网络错误`,"err");}
    }
    if(ok>0)onToast(`成功上传 ${ok} 个文件到知识库`,"ok");
    setUploading(false);fetchDocs();
  };

  const deleteDoc=async(id:string,name:string)=>{
    if(!confirm(`确定删除「${name}」？`))return;
    try{await fetch("/api/kb/delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({docId:id})});onToast(`已删除「${name}」`,"ok");fetchDocs();}
    catch{onToast("删除失败","err");}
  };

  return(
    <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column",padding:24,gap:20}}>
      <div>
        <h2 style={{fontFamily:"serif",fontSize:20,fontWeight:700,marginBottom:6}}>知识库管理</h2>
        <p style={{fontSize:13,color:T.ink70,lineHeight:1.6}}>上传政策文件、申报模板、参考案例，AI 生成时将自动检索相关内容，提升内容专业度和准确性。支持 PDF、DOCX、TXT 格式。</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1.7fr",gap:20,flex:1,overflow:"hidden"}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:"#fff",borderRadius:8,padding:20,border:`0.5px solid ${T.ink15}`}}>
            <SLabel>文件类型</SLabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
              {DOC_TYPES.map(t=>(
                <button key={t.value} onClick={()=>setSelType(t.value)} style={{padding:"8px 10px",borderRadius:4,border:`0.5px solid ${selType===t.value?t.color:T.ink15}`,background:selType===t.value?t.bg:T.ink06,color:selType===t.value?t.color:T.ink70,fontFamily:"inherit",fontSize:12,fontWeight:selType===t.value?600:400,cursor:"pointer",textAlign:"left",transition:"all 0.12s"}}>
                  {t.label}
                </button>
              ))}
            </div>
            <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);uploadFiles(e.dataTransfer.files);}}
              onClick={()=>!uploading&&fileRef.current?.click()}
              style={{border:`1.5px dashed ${dragOver?T.gold:T.ink15}`,borderRadius:6,padding:"28px 16px",textAlign:"center",cursor:uploading?"not-allowed":"pointer",background:dragOver?T.goldBg:T.ink06,transition:"all 0.15s"}}>
              <div style={{fontSize:28,marginBottom:8}}>{uploading?"⏳":"📂"}</div>
              <div style={{fontSize:13,color:T.ink,fontWeight:500,marginBottom:4}}>{uploading?"正在处理文件…":"点击选择 或 拖拽文件到此处"}</div>
              <div style={{fontSize:11,color:T.ink40}}>PDF · DOCX · TXT · MD · 最大 10MB</div>
              <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.doc,.txt,.md" style={{display:"none"}} onChange={e=>uploadFiles(e.target.files)}/>
            </div>
          </div>
          <div style={{background:T.goldBg,borderRadius:8,padding:16,border:`0.5px solid ${T.goldLight}`}}>
            <div style={{fontSize:12,fontWeight:600,color:T.gold,marginBottom:8}}>💡 上传建议</div>
            <div style={{fontSize:12,color:T.ink70,lineHeight:1.9}}>
              <div>· <strong>政策文件</strong>：数字政府、数据要素政策原文</div>
              <div>· <strong>申报模板</strong>：招标文件、章节格式说明</div>
              <div>· <strong>案例参考</strong>：历史中标方案（脱敏后）</div>
              <div>· 文件越精准，生成质量越高</div>
            </div>
          </div>
        </div>

        <div style={{background:"#fff",borderRadius:8,border:`0.5px solid ${T.ink15}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:`0.5px solid ${T.ink15}`,display:"flex",alignItems:"center"}}>
            <span style={{fontSize:13,fontWeight:600,flex:1}}>已上传文件</span>
            <Badge color="gray">{docs.length} 个文件</Badge>
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            {loading?<div style={{padding:24,textAlign:"center",color:T.ink40,fontSize:13}}>加载中…</div>
            :docs.length===0?<div style={{padding:40,textAlign:"center"}}><div style={{fontSize:32,marginBottom:10}}>📭</div><div style={{fontSize:13,color:T.ink40}}>知识库为空，上传文件后 AI 生成质量将显著提升</div></div>
            :docs.map(doc=>{
              const ti=DOC_TYPES.find(t=>t.value===doc.type)||DOC_TYPES[3];
              const icon=doc.name.endsWith(".pdf")?"📕":doc.name.endsWith(".docx")||doc.name.endsWith(".doc")?"📘":"📄";
              return(
                <div key={doc.id} style={{padding:"14px 18px",borderBottom:`0.5px solid ${T.ink06}`,display:"flex",gap:12,alignItems:"flex-start"}}>
                  <div style={{fontSize:22,marginTop:2}}>{icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                      <span style={{fontSize:13,fontWeight:500,color:T.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:220}}>{doc.name}</span>
                      <span style={{fontSize:10,padding:"1px 7px",borderRadius:10,background:ti.bg,color:ti.color,fontWeight:500,flexShrink:0}}>{ti.label}</span>
                    </div>
                    <div style={{fontSize:11,color:T.ink40,lineHeight:1.5,marginBottom:4}}>{doc.summary}</div>
                    <div style={{display:"flex",gap:10,fontSize:11,color:T.ink40}}>
                      <span>{fmtSize(doc.size)}</span><span>·</span><span>{doc.chunkCount} 片段</span><span>·</span><span>{fmtDate(doc.uploadedAt)}</span>
                    </div>
                  </div>
                  <button onClick={()=>deleteDoc(doc.id,doc.name)} style={{background:"none",border:"none",cursor:"pointer",color:T.ink40,fontSize:16,padding:4,borderRadius:3}} title="删除">🗑</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportPanel({project,chapters}:{project:Project|null;chapters:Record<string,ChapterData>}){
  const done=CHAPTERS.filter(c=>chapters[c.id]);
  const total=done.reduce((s,c)=>s+chapters[c.id].wc,0);
  const dl=(content:string,name:string,mime:string)=>{
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([content],{type:`${mime};charset=utf-8`}));a.download=name;a.click();
  };
  const exportTxt=()=>{
    if(!done.length){alert("暂无已生成章节");return;}
    const hdr=`${project?.name||"标书"}\n申报主体：${project?.org||""}  |  ${project?.level||""}  |  ${project?.budget||""}\n导出：${new Date().toLocaleString("zh-CN")}\n\n`;
    const body=done.map(c=>`${"=".repeat(36)}\n第${CHAPTERS.indexOf(c)+1}章  ${c.label}\n${"=".repeat(36)}\n\n${chapters[c.id].content}`).join("\n\n\n");
    dl(hdr+body,`${project?.name||"标书"}_草稿.txt`,"text/plain");
  };
  const exportMd=()=>{
    if(!done.length){alert("暂无已生成章节");return;}
    const hdr=`# ${project?.name||"标书"}\n\n**申报主体**：${project?.org}  |  **级别**：${project?.level}  |  **预算**：${project?.budget}\n\n---\n\n`;
    const body=done.map(c=>`## 第${CHAPTERS.indexOf(c)+1}章 ${c.label}\n\n${chapters[c.id].content}`).join("\n\n---\n\n");
    dl(hdr+body,`${project?.name||"标书"}_草稿.md`,"text/markdown");
  };
  return(
    <div style={{flex:1,overflow:"auto",padding:24}}>
      <h2 style={{fontFamily:"serif",fontSize:20,fontWeight:700,marginBottom:6}}>导出与汇总</h2>
      <p style={{fontSize:13,color:T.ink70,marginBottom:20}}>汇总所有已生成章节，选择格式导出完整草稿文件。</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
        {[["已完成章节",`${done.length}/${CHAPTERS.length}`],["总字数",total.toLocaleString()],["完成率",`${Math.round(done.length/CHAPTERS.length*100)}%`],["项目",project?.name||"未设置"]].map(([l,v])=>(
          <div key={l} style={{background:"#fff",borderRadius:8,padding:"14px 16px",border:`0.5px solid ${T.ink15}`}}>
            <div style={{fontSize:11,color:T.ink40,marginBottom:4}}>{l}</div>
            <div style={{fontSize:18,fontWeight:600,color:T.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
        {[["📄","导出为 TXT","纯文本，可直接粘贴到 Word 或其他编辑器",exportTxt,"primary"],["📝","导出为 Markdown","带结构的 MD 文件，适合技术团队协作编辑",exportMd,"blue"]].map(([icon,title,desc,fn,v])=>(
          <div key={title as string} style={{background:"#fff",borderRadius:8,padding:20,border:`0.5px solid ${T.ink15}`}}>
            <div style={{fontSize:20,marginBottom:8}}>{icon}</div>
            <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{title}</div>
            <div style={{fontSize:12,color:T.ink70,marginBottom:14}}>{desc}</div>
            <Btn variant={v as string} onClick={fn as ()=>void} full>{title}</Btn>
          </div>
        ))}
      </div>
      <div style={{background:"#fff",borderRadius:8,border:`0.5px solid ${T.ink15}`,overflow:"hidden"}}>
        <div style={{padding:"13px 18px",borderBottom:`0.5px solid ${T.ink15}`,fontSize:13,fontWeight:600}}>章节完成情况</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr"}}>
          {CHAPTERS.map((ch,i)=>{const d=chapters[ch.id];return(
            <div key={ch.id} style={{padding:"12px 16px",borderBottom:`0.5px solid ${T.ink06}`,borderRight:(i+1)%3!==0?`0.5px solid ${T.ink06}`:"none",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:16}}>{d?"✅":"⬜"}</span>
              <div><div style={{fontSize:12,fontWeight:500,color:d?T.ink:T.ink40}}>{ch.label}</div>{d&&<div style={{fontSize:10,color:T.ink40}}>{d.wc}字</div>}</div>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

function Validation({content,wordTarget}:{content:string;wordTarget:number}){
  const wc=content.replace(/\s/g,"").length;
  const pol=(content.match(/《[^》]+》/g)||[]).length;
  const str=/[（(][一二三四五六七八九十][）)]|[一二三四五六七八九十][、．]/.test(content);
  const ban=["绝对第一","全国唯一","保证中标"].filter(w=>content.includes(w));
  return(
    <div style={{padding:"10px 14px",background:T.ink06,borderRadius:4,border:`0.5px solid ${T.ink15}`,marginTop:10}}>
      <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:T.ink40,marginBottom:6}}>质量检查</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
        <Badge color={wc>=wordTarget*0.82?"green":"red"}>{wc>=wordTarget*0.82?`字数达标（${wc}字）`:`字数偏少（${wc}/${wordTarget}字）`}</Badge>
        <Badge color={pol>0?"green":"gold"}>{pol>0?`引用政策 ${pol} 处`:"建议增加政策引用"}</Badge>
        <Badge color={str?"green":"gold"}>{str?"章节结构清晰":"建议增加小节标题"}</Badge>
        <Badge color={ban.length===0?"green":"red"}>{ban.length===0?"合规词汇通过":`含风险词：${ban.join("、")}`}</Badge>
      </div>
    </div>
  );
}

export default function Page(){
  const[project,setProject]=useState<Project|null>(null);
  const[showModal,setShowModal]=useState(true);
  const[view,setView]=useState<View>("workspace");
  const[selectedId,setSelectedId]=useState<string|null>(null);
  const[wordTarget,setWordTarget]=useState(1500);
  const[extra,setExtra]=useState("");
  const[useRag,setUseRag]=useState(true);
  const[chapters,setChapters]=useState<Record<string,ChapterData>>({});
  const[generating,setGenerating]=useState(false);
  const[genId,setGenId]=useState<string|null>(null);
  const[display,setDisplay]=useState("");
  const[streaming,setStreaming]=useState(false);
  const[error,setError]=useState("");
  const[ragSources,setRagSources]=useState<string[]>([]);
  const[kbCount,setKbCount]=useState(0);
  const[toast,setToast]=useState<{msg:string;type:"ok"|"err"|"info"}|null>(null);
  const outputRef=useRef<HTMLDivElement>(null);

  const selCh=CHAPTERS.find(c=>c.id===selectedId);
  const curData=selectedId?chapters[selectedId]:null;
  const doneCount=Object.keys(chapters).length;

  const refreshKb=useCallback(async()=>{
    try{const r=await fetch("/api/kb");const d=await r.json();setKbCount((d.docs||[]).length);}catch{}
  },[]);
  useEffect(()=>{refreshKb();},[refreshKb]);

  const showToast=useCallback((msg:string,type:"ok"|"err"|"info"="info")=>{
    setToast({msg,type});clearTimeout(_tt);_tt=setTimeout(()=>setToast(null),3000);
  },[]);

  const buildPrompt=useCallback((id:string,variant?:string)=>{
    if(!project)return"";
    const ch=CHAPTERS.find(c=>c.id===id)!;
    const done=CHAPTERS.filter(c=>chapters[c.id]&&c.id!==id).map(c=>`· ${c.label}（${chapters[c.id].wc}字）`).join("\n");
    return`## 项目信息\n- 项目名称：${project.name}\n- 申报主体：${project.org}\n- 申报级别：${project.level}\n- 项目预算：${project.budget}\n- 建设领域：${project.domain}\n- 所在地区：${project.region||"（未指定）"}\n- 核心建设内容：${project.desc}\n${project.edge?`- 项目特色优势：${project.edge}`:""}\n${done?`\n## 已完成章节\n${done}`:""}\n\n## 当前任务\n章节名称：${ch.label}\n目标字数：约${wordTarget}字（允许±15%）\n${PROMPTS[id]}\n${extra?`\n补充要求：${extra}`:""}\n${variant?`\n风格要求：${variant}`:""}\n\n## 规范\n1. 正式公文风格，使用"（一）（二）"或"一、二、"作小标题\n2. 只引用真实政策文件名，不编造政策编号\n3. 数据与项目规模匹配，量化目标合理可信\n4. 直接输出章节内容，无需解释说明\n\n请撰写「${ch.label}」：`;
  },[project,chapters,wordTarget,extra]);

  const generate=useCallback(async(variant?:string)=>{
    if(!project||!selectedId||generating)return;
    setGenerating(true);setGenId(selectedId);setDisplay("");setStreaming(true);setError("");setRagSources([]);
    try{
      const resp=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:buildPrompt(selectedId,variant),chapterLabel:CHAPTERS.find(c=>c.id===selectedId)?.label||"",useRag})});
      if(!resp.ok){const e=await resp.json();throw new Error(e.error||`错误 ${resp.status}`);}
      const reader=resp.body!.getReader();const decoder=new TextDecoder();let full="";
      while(true){
        const{done,value}=await reader.read();if(done)break;
        for(const line of decoder.decode(value,{stream:true}).split("\n")){
          if(!line.startsWith("data: "))continue;const data=line.slice(6).trim();if(data==="[DONE]")break;
          try{const j=JSON.parse(data);if(j.rag){setRagSources(j.rag);continue;}if(j.text){full+=j.text;setDisplay(full);if(outputRef.current)outputRef.current.scrollTop=outputRef.current.scrollHeight;}}catch{}
        }
      }
      if(!full)throw new Error("AI 未返回内容，请重试");
      const wc=full.replace(/\s/g,"").length;
      setChapters(prev=>({...prev,[selectedId]:{content:full,wc}}));
      showToast(`「${selCh?.label}」生成完成，共 ${wc} 字`,"ok");
    }catch(e:any){setError(e.message||"生成失败");showToast(e.message||"生成失败","err");}
    finally{setGenerating(false);setGenId(null);setStreaming(false);}
  },[project,selectedId,generating,buildPrompt,useRag,selCh,showToast]);

  const selectCh=(id:string)=>{setSelectedId(id);setError("");setRagSources([]);if(chapters[id])setDisplay(chapters[id].content);else setDisplay("");};
  const copy=()=>{const t=curData?.content||display;if(t)navigator.clipboard.writeText(t).then(()=>showToast("已复制到剪贴板","ok"));};

  const nav=[{id:"workspace"as View,label:"生成工作台",icon:"✍️"},{id:"kb"as View,label:`知识库${kbCount>0?` (${kbCount})`:""}`,icon:"📚"},{id:"export"as View,label:"导出汇总",icon:"📤"}];

  return(
    <div style={{display:"flex",height:"100vh",overflow:"hidden",fontFamily:"'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif",background:T.paper,color:T.ink,fontSize:14}}>
      <style suppressHydrationWarning>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes glow{0%,100%{opacity:1}50%{opacity:0.3}}@keyframes slideUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>

      {/* Sidebar */}
      <aside style={{width:220,minWidth:220,background:T.ink,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"20px 16px 14px",borderBottom:"0.5px solid rgba(255,255,255,0.07)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,fontFamily:"serif",fontSize:18,fontWeight:700,color:"#fff",letterSpacing:"0.03em"}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:T.red,display:"inline-block",boxShadow:`0 0 6px ${T.red}80`}}/>标智 BidAI
          </div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",marginTop:4}}>政务申报标书智能生成</div>
        </div>

        <div style={{padding:"10px 8px 4px"}}>
          {nav.map(item=>(
            <button key={item.id} onClick={()=>setView(item.id)} style={{display:"flex",alignItems:"center",gap:9,width:"100%",padding:"9px 10px",borderRadius:4,border:"none",background:view===item.id?"rgba(255,255,255,0.1)":"transparent",color:view===item.id?"#fff":"rgba(255,255,255,0.5)",fontSize:12,fontWeight:view===item.id?500:400,textAlign:"left",fontFamily:"inherit",transition:"all 0.12s"}}>
              <span style={{fontSize:14}}>{item.icon}</span>{item.label}
            </button>
          ))}
        </div>

        {project&&(
          <div style={{margin:"8px 8px 0",padding:"10px",background:"rgba(255,255,255,0.05)",borderRadius:4}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.22)",marginBottom:4,letterSpacing:"0.06em",textTransform:"uppercase"}}>当前项目</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.7)",lineHeight:1.4,marginBottom:3}}>{project.name}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:7}}>{project.org}</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}><Badge color="gold">{doneCount}/{CHAPTERS.length} 章</Badge>{kbCount>0&&<Badge color="blue">知识库 {kbCount}</Badge>}</div>
          </div>
        )}

        {view==="workspace"&&(
          <>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.2)",padding:"12px 16px 4px",letterSpacing:"0.1em",textTransform:"uppercase"}}>章节导航</div>
            <div style={{flex:1,overflowY:"auto",paddingBottom:8}}>
              {CHAPTERS.map((ch,i)=>{
                const active=selectedId===ch.id,done=!!chapters[ch.id],isGen=genId===ch.id;
                return<div key={ch.id} onClick={()=>selectCh(ch.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 14px",cursor:"pointer",borderLeft:`2px solid ${active?T.red:"transparent"}`,background:active?"rgba(181,39,26,0.08)":"transparent",transition:"all 0.12s"}}>
                  <span style={{fontSize:9,color:"rgba(255,255,255,0.18)",minWidth:16,fontFamily:"monospace"}}>{String(i+1).padStart(2,"0")}</span>
                  <span style={{fontSize:12,flex:1,color:active?"#fff":"rgba(255,255,255,0.52)"}}>{ch.label}</span>
                  <span style={{width:5,height:5,borderRadius:"50%",flexShrink:0,background:isGen?T.gold:done?T.green:"rgba(255,255,255,0.1)",animation:isGen?"glow 1s infinite":"none"}}/>
                </div>;
              })}
            </div>
          </>
        )}
        {view!=="workspace"&&<div style={{flex:1}}/>}

        <div style={{padding:"10px",borderTop:"0.5px solid rgba(255,255,255,0.07)"}}>
          <button onClick={()=>setShowModal(true)} style={{width:"100%",padding:"7px",background:"transparent",border:"0.5px solid rgba(255,255,255,0.14)",borderRadius:3,color:"rgba(255,255,255,0.45)",fontSize:11,fontFamily:"inherit"}}>
            ✎ {project?"编辑项目信息":"填写项目信息"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <header style={{height:50,background:"#fff",borderBottom:`0.5px solid ${T.ink15}`,display:"flex",alignItems:"center",padding:"0 20px",gap:10,flexShrink:0}}>
          <div style={{fontFamily:"serif",fontSize:15,fontWeight:700,flex:1}}>{project?project.name:"政务申报标书生成工作台"}</div>
          {project&&<span style={{fontSize:11,color:T.ink70,padding:"3px 10px",background:T.ink06,borderRadius:20}}>{project.level} · {project.budget} · {project.domain}</span>}
          {kbCount>0&&<span style={{fontSize:11,color:T.blue,padding:"3px 10px",background:T.blueBg,borderRadius:20,cursor:"pointer"}} onClick={()=>setView("kb")}>📚 知识库 {kbCount} 个文件</span>}
        </header>

        {view==="kb"&&<div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}><KBPanel onToast={(m,t)=>{showToast(m,t);refreshKb();}}/></div>}
        {view==="export"&&<div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}><ExportPanel project={project} chapters={chapters}/></div>}

        {view==="workspace"&&(
          <div style={{flex:1,overflow:"hidden",display:"flex"}}>
            {/* Left panel */}
            <div style={{width:290,minWidth:290,background:"#fff",borderRight:`0.5px solid ${T.ink15}`,display:"flex",flexDirection:"column",overflowY:"auto",padding:16}}>
              <div style={{marginBottom:18}}>
                <SLabel>选择章节</SLabel>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                  {CHAPTERS.map(ch=>{const sel=selectedId===ch.id,done=!!chapters[ch.id];return(
                    <button key={ch.id} onClick={()=>selectCh(ch.id)} style={{padding:"8px 10px",borderRadius:3,textAlign:"left",border:`0.5px solid ${sel?T.red:done?T.green+"55":T.ink15}`,background:sel?T.redBg:done?T.greenBg+"90":T.ink06,cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s"}}>
                      <div style={{fontSize:12,color:sel?T.red:done?T.green:T.ink,fontWeight:sel||done?500:400}}>{ch.label}</div>
                      <div style={{fontSize:10,color:done?T.green:T.ink40,marginTop:2}}>{done?"✓ 已生成":ch.sub}</div>
                    </button>
                  );})}
                </div>
              </div>

              <div style={{marginBottom:18}}>
                <SLabel>目标字数</SLabel>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {([["~800字",800],["~1500字",1500],["~2500字",2500],["~4000字",4000]]as const).map(([l,v])=>(
                    <button key={v} onClick={()=>setWordTarget(v)} style={{padding:"4px 11px",borderRadius:20,fontSize:11,border:`0.5px solid ${wordTarget===v?T.ink:T.ink15}`,background:wordTarget===v?T.ink:"transparent",color:wordTarget===v?"#fff":T.ink70,fontFamily:"inherit"}}>{l}</button>
                  ))}
                </div>
              </div>

              <div style={{marginBottom:18}}>
                <SLabel>知识库检索（RAG）</SLabel>
                <div onClick={()=>setUseRag(v=>!v)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:useRag&&kbCount>0?T.blueBg:T.ink06,borderRadius:4,border:`0.5px solid ${useRag&&kbCount>0?T.blue+"44":T.ink15}`,cursor:"pointer"}}>
                  <div style={{width:32,height:18,borderRadius:9,background:useRag?T.blue:T.ink15,position:"relative",transition:"background 0.2s",flexShrink:0}}>
                    <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:useRag?16:2,transition:"left 0.2s"}}/>
                  </div>
                  <div>
                    <div style={{fontSize:12,fontWeight:500,color:useRag?T.blue:T.ink70}}>{useRag?"已启用知识库参考":"知识库检索已关闭"}</div>
                    <div style={{fontSize:10,color:T.ink40,marginTop:1}}>{kbCount>0?`${kbCount} 个文件可检索`:"知识库为空，前往「知识库」上传文件"}</div>
                  </div>
                </div>
                {kbCount===0&&<button onClick={()=>setView("kb")} style={{width:"100%",marginTop:6,padding:"6px",background:"transparent",border:`0.5px dashed ${T.ink15}`,borderRadius:3,color:T.ink40,fontSize:11,fontFamily:"inherit"}}>+ 去知识库上传参考文件</button>}
              </div>

              <div style={{marginBottom:18}}>
                <SLabel>补充要求（选填）</SLabel>
                <textarea value={extra} onChange={e=>setExtra(e.target.value)} placeholder='如：重点突出数据要素流通；需引用"十四五"规划；侧重技术创新…' style={{width:"100%",padding:"8px 10px",border:`0.5px solid ${T.ink15}`,borderRadius:3,fontSize:12,color:T.ink,resize:"vertical",minHeight:60,lineHeight:1.6,background:"#fff",fontFamily:"inherit"}}/>
              </div>

              <div style={{marginTop:"auto",paddingTop:12,borderTop:`0.5px solid ${T.ink15}`}}>
                <button disabled={!selectedId||!project||generating} onClick={()=>generate()} style={{width:"100%",padding:"10px",borderRadius:3,border:"none",background:(!selectedId||!project||generating)?T.ink40:T.ink,color:"#fff",fontSize:14,fontWeight:500,fontFamily:"inherit",cursor:(!selectedId||!project||generating)?"not-allowed":"pointer"}}>
                  {generating?"⏳ 生成中…":selCh?`生成「${selCh.label}」`:"请先选择章节"}
                </button>
                <div style={{fontSize:11,color:T.ink40,textAlign:"center",marginTop:5}}>豆包 AI{useRag&&kbCount>0?" + 知识库":""}· 请核实后使用</div>

                {curData&&!generating&&(
                  <div style={{marginTop:14}}>
                    <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:T.ink40,marginBottom:6}}>快速优化</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {[["更技术化","更技术化，增加技术细节和实现路径"],["强化政策","更偏政策导向，加强政策依据引用"],["增加指标","增加具体数据指标和量化目标"],["精练语言","语言更精练，保留核心观点"],["扩充篇幅","适当扩充内容，增加论述深度"]].map(([l,d])=>(
                        <button key={l} onClick={()=>generate(d)} style={{padding:"4px 10px",borderRadius:20,fontSize:11,border:`0.5px solid ${T.ink15}`,background:T.ink06,color:T.ink70,fontFamily:"inherit"}}>{l}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right output */}
            <div style={{flex:1,background:T.ink06,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              {selectedId&&(
                <div style={{padding:"10px 20px",background:"#fff",borderBottom:`0.5px solid ${T.ink15}`,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                  <span style={{fontFamily:"serif",fontSize:14,fontWeight:700,flex:1}}>{selCh?.label||"—"}</span>
                  {generating?<Badge color="gold">生成中…</Badge>:error?<Badge color="red">失败</Badge>:curData?<Badge color="green">已完成</Badge>:<Badge color="gray">待生成</Badge>}
                  {curData&&<Badge color="blue">{curData.wc} 字</Badge>}
                  {ragSources.length>0&&<Badge color="purple" dot>RAG 增强</Badge>}
                  <Btn onClick={copy} sm>复制</Btn>
                  <Btn onClick={()=>generate()} disabled={generating||!project} sm>重新生成</Btn>
                </div>
              )}

              <div ref={outputRef} style={{flex:1,overflowY:"auto",padding:20}}>
                {!selectedId?(
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:14,color:T.ink40,textAlign:"center"}}>
                    <div style={{width:64,height:64,borderRadius:"50%",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,boxShadow:"0 1px 8px rgba(0,0,0,0.07)"}}>📋</div>
                    <div style={{fontFamily:"serif",fontSize:16,color:T.ink}}>开始生成标书内容</div>
                    <div style={{fontSize:13,maxWidth:280,lineHeight:1.7}}>{!project?"请先点击左下角「填写项目信息」":"在左侧选择章节，设置字数，点击生成"}</div>
                    {!project&&<Btn variant="primary" onClick={()=>setShowModal(true)}>填写项目信息</Btn>}
                    {project&&kbCount===0&&(
                      <div style={{padding:"12px 16px",background:T.goldBg,borderRadius:6,border:`0.5px solid ${T.goldLight}`,fontSize:12,color:T.gold,maxWidth:280,textAlign:"left",lineHeight:1.7}}>
                        💡 上传政策文件和申报模板到知识库，可显著提升生成质量
                        <button onClick={()=>setView("kb")} style={{display:"block",width:"100%",marginTop:8,color:T.gold,background:"none",border:`0.5px solid ${T.gold}`,borderRadius:3,padding:"5px 10px",fontSize:11,fontFamily:"inherit",cursor:"pointer"}}>去上传文件 →</button>
                      </div>
                    )}
                  </div>
                ):error?(
                  <div style={{padding:20,background:T.redBg,borderRadius:6,border:`0.5px solid ${T.red}33`,color:T.red,fontSize:13,lineHeight:1.7}}>
                    <strong>生成失败：</strong>{error}
                    <div style={{marginTop:10}}><Btn onClick={()=>generate()} variant="red" sm>重新生成</Btn></div>
                  </div>
                ):(
                  <div>
                    {ragSources.length>0&&<div style={{marginBottom:10,padding:"9px 14px",background:T.purpleBg,borderRadius:4,border:`0.5px solid ${T.purple}33`,fontSize:11,color:T.purple}}>📚 本次参考了知识库：{ragSources.join("、")}</div>}
                    <div style={{background:"#fff",borderRadius:6,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",marginBottom:10}}>
                      <div style={{padding:"12px 20px",borderBottom:`0.5px solid ${T.ink15}`,display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontFamily:"serif",fontSize:13,fontWeight:700,flex:1}}>第 {CHAPTERS.findIndex(c=>c.id===selectedId)+1} 章 · {selCh?.label}</span>
                        <span style={{fontSize:11,color:T.ink40}}>目标 {wordTarget} 字</span>
                      </div>
                      <div style={{padding:"24px",fontSize:14,lineHeight:2,color:T.ink,whiteSpace:"pre-wrap",fontFamily:"inherit",minHeight:200}}>
                        {display||(!generating&&<span style={{color:T.ink40}}>点击左侧「生成」按钮开始写作…</span>)}
                        {streaming&&<span style={{display:"inline-block",width:2,height:"1em",background:T.red,marginLeft:1,verticalAlign:"text-bottom",animation:"blink 0.7s infinite"}}/>}
                      </div>
                      {curData&&!streaming&&(
                        <div style={{padding:"9px 20px",borderTop:`0.5px solid ${T.ink15}`,fontSize:11,color:T.ink40,display:"flex",gap:10}}>
                          <span>字数：{curData.wc}</span><span style={{color:T.ink15}}>·</span>
                          <span>达成率：{Math.round(curData.wc/wordTarget*100)}%</span><span style={{color:T.ink15}}>·</span>
                          <span>豆包 Doubao-pro</span>
                          {ragSources.length>0&&<><span style={{color:T.ink15}}>·</span><span style={{color:T.purple}}>RAG 增强</span></>}
                        </div>
                      )}
                    </div>
                    {curData&&!streaming&&<Validation content={curData.content} wordTarget={wordTarget}/>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal&&<ProjectModal project={project} onSave={p=>{setProject(p);setShowModal(false);showToast("项目信息已保存","ok");}} onClose={()=>{if(project)setShowModal(false);}}/>}
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
    </div>
  );
}
