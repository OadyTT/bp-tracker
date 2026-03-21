import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════
const APP_VERSION  = "v1.6.3";
const BUILD_DATE   = "20 มี.ค. 2568";
const TRIAL_DAYS   = 60;
const ADMIN_EMAIL  = "thitiphankk@gmail.com";
const ADMIN_LINE   = "Oady";
const KEY_RECORDS  = "bp-records-v1";
const KEY_PATIENT  = "bp-patient-v1";
const KEY_INSTALL  = "bp-install-date";
const KEY_UNLOCKED = "bp-unlocked";
const KEY_ADMIN    = "bp-admin-cfg";
const KEY_BACKUP_TS= "bp-last-backup";
const SCRIPT_URL   = "https://script.google.com/macros/s/AKfycbzmjaZeh-rKiHq643431PmS1l_Z2n1NE4gVz8Hu-THHECV-748Nr5fkB3E0wzFopi4h4w/exec";
// ═══════════════════════════════════════════════

const todayISO = () => new Date().toISOString().split("T")[0];
const nowStr   = () => new Date().toLocaleString("th-TH",{dateStyle:"short",timeStyle:"short"});
const toThai   = (iso) => {
  if (!iso) return "";
  const [y,m,d] = iso.split("-");
  const M=["","ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  return `${parseInt(d)} ${M[parseInt(m)]} ${parseInt(y)+543}`;
};
const lsGet = (k,fb) => { try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;} };
const lsSet = (k,v)  => { try{localStorage.setItem(k,JSON.stringify(v));}catch{} };
const lsRaw = (k)    => { try{return localStorage.getItem(k)||"";}catch{return "";} };

const BP_LEVELS = ["ปกติ","สูงเล็กน้อย","สูงระดับ 1","สูงระดับ 2"];
const bpStatus  = (sys,dia) => {
  const s=parseInt(sys),d=parseInt(dia);
  if(!s||!d) return null;
  if(s<120&&d<80) return {label:"ปกติ",        bg:"#dcfce7",fg:"#166534",bar:"#22c55e"};
  if(s<130&&d<80) return {label:"สูงเล็กน้อย", bg:"#fef9c3",fg:"#854d0e",bar:"#eab308"};
  if(s<140||d<90) return {label:"สูงระดับ 1",  bg:"#ffedd5",fg:"#9a3412",bar:"#f97316"};
  return                 {label:"สูงระดับ 2",  bg:"#fee2e2",fg:"#991b1b",bar:"#ef4444"};
};
const rank = st => st ? BP_LEVELS.indexOf(st.label) : -1;

// ── Server verify (Vercel API) ──────────────────
const verifyCode = async (type, code) => {
  try {
    const res = await fetch("/api/verify", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({type, code}),
    });
    const data = await res.json();
    return data.ok === true;
  } catch { return false; }
};

// ── Notify admin (Email via Apps Script + Line Notify) ──
const notifyAdmin = async (patientName, phone, isTest=false) => {
  try {
    const fd = new FormData();
    fd.append("data", JSON.stringify({
      type:        "payment_request",
      patientName: patientName || "ไม่ระบุ",
      phone:       phone       || "ไม่ระบุ",
      adminEmail:  ADMIN_EMAIL,
      adminLine:   ADMIN_LINE,
      isTest:      isTest,
      timestamp:   new Date().toLocaleString("th-TH"),
      appVersion:  APP_VERSION,
    }));
    await fetch(SCRIPT_URL, { method:"POST", mode:"no-cors", body:fd });
    return { ok: true };
  } catch(e) {
    return { ok: false, err: e.message };
  }
};

// ── Sync one record ─────────────────────────────
const syncToSheet = async (entry, patientName) => {
  try {
    const fd = new FormData();
    fd.append("data", JSON.stringify({...entry, patientName}));
    await fetch(SCRIPT_URL, {method:"POST", mode:"no-cors", body:fd});
    return {ok:true};
  } catch(e) { return {ok:false}; }
};

// ── Sync ALL records ────────────────────────────
const syncAllToSheet = async (records, patientName, onProgress) => {
  let ok=0, fail=0;
  for(let i=0;i<records.length;i++){
    onProgress && onProgress(i+1, records.length);
    const r = await syncToSheet(records[i], patientName);
    if(r.ok) ok++; else fail++;
    await new Promise(res=>setTimeout(res,350));
  }
  return {ok, fail};
};

// ── Input ───────────────────────────────────────
const Input = ({label,value,onChange,type="text",placeholder,unit,readOnly}) => (
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    <label style={{fontSize:17,fontWeight:700,color:"#334155"}}>{label}</label>
    <div style={{position:"relative",display:"flex",alignItems:"center"}}>
      <input type={type} value={value||""} readOnly={readOnly}
        onChange={e=>onChange&&onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",padding:"15px 16px",borderRadius:12,border:"2px solid #cbd5e1",
          fontSize:21,background:readOnly?"#f1f5f9":"#f8fafc",outline:"none",
          fontFamily:"Sarabun,sans-serif",color:"#0f172a",boxSizing:"border-box",
          paddingRight:unit?56:16,fontWeight:600}}
        onFocus={e=>{if(!readOnly)e.target.style.borderColor="#0284c7"}}
        onBlur={e=>e.target.style.borderColor="#cbd5e1"}/>
      {unit&&<span style={{position:"absolute",right:14,fontSize:14,color:"#94a3b8",fontWeight:700}}>{unit}</span>}
    </div>
  </div>
);

// ── SVG Graph ───────────────────────────────────
const BPGraph = ({records}) => {
  const last14=records.slice(-14);
  if(last14.length<2) return <div style={{textAlign:"center",padding:"20px",color:"#94a3b8",fontSize:15}}>ต้องมีข้อมูลอย่างน้อย 2 วัน</div>;
  const W=320,H=160,PL=36,PR=10,PT=10,PB=30,gW=W-PL-PR,gH=H-PT-PB;
  const sysV=last14.map(r=>r.morningSys?+r.morningSys:(r.eveningSys?+r.eveningSys:null));
  const diaV=last14.map(r=>r.morningDia?+r.morningDia:(r.eveningDia?+r.eveningDia:null));
  const all=[...sysV,...diaV].filter(Boolean);
  if(!all.length) return null;
  const minV=Math.max(50,Math.min(...all)-10), maxV=Math.min(200,Math.max(...all)+10);
  const xP=i=>PL+(i/(last14.length-1))*gW;
  const yP=v=>PT+(1-(v-minV)/(maxV-minV))*gH;
  const path=vals=>vals.map((v,i)=>v?`${i===0||!vals[i-1]?"M":"L"}${xP(i)},${yP(v)}`:"").filter(Boolean).join(" ");
  return (
    <div style={{overflowX:"auto"}}>
      <svg width={W} height={H} style={{display:"block",margin:"0 auto"}}>
        {[120,130,140].filter(g=>g>=minV&&g<=maxV).map(g=>(
          <g key={g}>
            <line x1={PL} y1={yP(g)} x2={W-PR} y2={yP(g)} stroke="#fca5a5" strokeWidth="1" strokeDasharray="4"/>
            <text x={PL-2} y={yP(g)+4} fontSize="9" fill="#ef4444" textAnchor="end">{g}</text>
          </g>
        ))}
        <line x1={PL} y1={PT} x2={PL} y2={H-PB} stroke="#e2e8f0" strokeWidth="1"/>
        <line x1={PL} y1={H-PB} x2={W-PR} y2={H-PB} stroke="#e2e8f0" strokeWidth="1"/>
        {[minV,Math.round((minV+maxV)/2),maxV].map(v=>(
          <text key={v} x={PL-4} y={yP(v)+4} fontSize="9" fill="#94a3b8" textAnchor="end">{v}</text>
        ))}
        {last14.map((_,i)=>i%3===0&&<text key={i} x={xP(i)} y={H-4} fontSize="8" fill="#94a3b8" textAnchor="middle">{last14[i].date.slice(8)}</text>)}
        <path d={path(sysV)} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round"/>
        <path d={path(diaV)} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round"/>
        {sysV.map((v,i)=>v&&<circle key={i} cx={xP(i)} cy={yP(v)} r="3" fill="#ef4444"/>)}
        {diaV.map((v,i)=>v&&<circle key={i} cx={xP(i)} cy={yP(v)} r="3" fill="#3b82f6"/>)}
      </svg>
      <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:6,fontSize:13}}>
        <span><span style={{display:"inline-block",width:14,height:3,background:"#ef4444",borderRadius:2,verticalAlign:"middle",marginRight:4}}/>ตัวบน</span>
        <span><span style={{display:"inline-block",width:14,height:3,background:"#3b82f6",borderRadius:2,verticalAlign:"middle",marginRight:4}}/>ตัวล่าง</span>
      </div>
    </div>
  );
};

// ── Health Recommendation ───────────────────────
const getRec = records => {
  const last7=records.slice(-7);
  if(!last7.length) return null;
  const vals=last7.flatMap(r=>[r.morningSys?{s:+r.morningSys,d:+r.morningDia}:null,r.eveningSys?{s:+r.eveningSys,d:+r.eveningDia}:null]).filter(Boolean);
  if(!vals.length) return null;
  const avgS=Math.round(vals.reduce((a,v)=>a+v.s,0)/vals.length);
  const avgD=Math.round(vals.reduce((a,v)=>a+v.d,0)/vals.length);
  const st=bpStatus(avgS,avgD);
  const tips={"ปกติ":["✅ ความดันอยู่ในเกณฑ์ดี ดูแลต่อไป","🥗 รับประทานผักผลไม้ครบ 5 หมู่","🏃 ออกกำลังกาย 30 นาที/วัน"],"สูงเล็กน้อย":["⚠️ ลดเกลือและโซเดียมในอาหาร","🚶 เดิน 30–45 นาที/วัน","😴 นอนหลับ 7–8 ชั่วโมง"],"สูงระดับ 1":["🏥 ควรพบแพทย์เพื่อประเมินการรักษา","🚫 งดอาหารเค็มและแอลกอฮอล์","💊 รับประทานยาตามแพทย์สั่งสม่ำเสมอ"],"สูงระดับ 2":["🚨 ความดันสูงมาก ควรพบแพทย์โดยด่วน","🚫 ห้ามออกกำลังหนักโดยยังไม่ผ่านแพทย์","📞 ปวดศีรษะรุนแรง เจ็บหน้าอก รีบไป ER ทันที"]};
  return {avgS,avgD,status:st,tips:(st?tips[st.label]:[])||[]};
};

// ═══════════════════════════════════════════════
//  UPGRADE SCREEN COMPONENT
// ═══════════════════════════════════════════════
const UpgradeScreen = ({adminCfg, trialLeft, daysUsed, onUnlock, onClose}) => {
  const FREE_FEATURES = [
    "บันทึกความดันเช้า-เย็น",
    "ดูประวัติย้อนหลัง",
    "รายงานความดันเบื้องต้น",
    "ใช้งานได้ 60 วัน",
  ];
  const FULL_FEATURES = [
    { icon:"♾️", title:"ใช้งานได้ไม่จำกัดวัน", desc:"จ่ายครั้งเดียว ไม่มีค่ารายเดือน" },
    { icon:"📊", title:"กราฟแนวโน้มความดัน", desc:"ติดตามค่าเฉลี่ย 7–30 วัน เห็นทิศทางสุขภาพ" },
    { icon:"🩺", title:"คำแนะนำสุขภาพอัจฉริยะ", desc:"วิเคราะห์ค่าความดันและแนะนำตามมาตรฐาน WHO/AHA" },
    { icon:"☁️", title:"Backup อัตโนมัติขึ้น Cloud", desc:"ข้อมูลปลอดภัย ไม่หายแม้เปลี่ยนมือถือ" },
    { icon:"📸", title:"รายงาน JPG & PDF A4", desc:"พิมพ์ใบรายงานให้แพทย์ได้ทันที" },
    { icon:"🔔", title:"แจ้งเตือนวัดความดัน", desc:"เตือนเช้า-เย็น ไม่ลืมวัดความดัน (เร็วๆ นี้)" },
    { icon:"👨‍👩‍👧", title:"แชร์กับครอบครัว", desc:"ให้ลูกหลานติดตามสุขภาพคุณได้ (เร็วๆ นี้)" },
    { icon:"🏥", title:"ส่งรายงานแพทย์โดยตรง", desc:"เชื่อมต่อคลินิก/โรงพยาบาล (เร็วๆ นี้)" },
  ];

  return (
    <div style={{fontFamily:"'Sarabun',sans-serif",background:"#f0f9ff",minHeight:"100vh",maxWidth:520,margin:"0 auto",paddingBottom:30}}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a5f)",padding:"24px 20px 28px",color:"white",position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,left:16,background:"rgba(255,255,255,.15)",border:"none",borderRadius:8,color:"white",fontSize:14,padding:"6px 12px",cursor:"pointer",fontFamily:"Sarabun,sans-serif"}}>
          ← ย้อนกลับ
        </button>
        <div style={{textAlign:"center",paddingTop:8}}>
          <div style={{fontSize:48,marginBottom:8}}>💎</div>
          <div style={{fontSize:26,fontWeight:800,marginBottom:4}}>Full Version</div>
          <div style={{fontSize:16,opacity:.85}}>ดูแลสุขภาพหัวใจได้อย่างมืออาชีพ</div>
          {trialLeft>0&&(
            <div style={{marginTop:12,background:"rgba(234,179,8,.2)",border:"1.5px solid rgba(234,179,8,.5)",borderRadius:12,padding:"8px 16px",display:"inline-block",fontSize:14}}>
              ⏳ ทดลองใช้เหลือ <strong style={{color:"#fde68a",fontSize:18}}>{trialLeft} วัน</strong>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div style={{margin:"20px 14px 0",background:"white",borderRadius:18,overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}>
        {/* Header row — 3 columns: feature | free | full */}
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",textAlign:"center"}}>
          <div style={{padding:"14px 12px",background:"#f8fafc",borderBottom:"2px solid #e2e8f0",borderRight:"1px solid #e2e8f0"}}/>
          <div style={{padding:"14px 8px",background:"#f8fafc",borderBottom:"2px solid #e2e8f0",borderRight:"1px solid #e2e8f0"}}>
            <div style={{fontSize:20}}>🆓</div>
            <div style={{fontWeight:800,fontSize:15,marginTop:2}}>ฟรี</div>
            <div style={{fontSize:12,color:"#64748b"}}>60 วัน</div>
          </div>
          <div style={{padding:"14px 8px",background:"linear-gradient(135deg,#0284c7,#075985)",borderBottom:"2px solid #0369a1"}}>
            <div style={{fontSize:20}}>💎</div>
            <div style={{fontWeight:800,fontSize:15,marginTop:2,color:"white"}}>Full Version</div>
            <div style={{fontSize:12,color:"#bae6fd"}}>{adminCfg.price||"จ่ายครั้งเดียว"}</div>
          </div>
        </div>
        {/* Feature rows */}
        {[
          ["บันทึกความดัน เช้า-เย็น","✅","✅"],
          ["ดูประวัติย้อนหลัง","✅","✅"],
          ["กราฟแนวโน้มความดัน","❌","✅"],
          ["คำแนะนำสุขภาพ WHO/AHA","❌","✅"],
          ["รายงาน PDF / JPG","❌","✅"],
          ["Backup Cloud อัตโนมัติ","❌","✅"],
          ["แจ้งเตือนวัดความดัน","❌","✅"],
          ["ไม่จำกัดเวลา","❌","✅"],
        ].map(([feat,free,full],i)=>(
          <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",borderBottom:i<7?"1px solid #f1f5f9":"none",background:i%2===0?"white":"#f8fafc"}}>
            <div style={{padding:"11px 14px",fontSize:14,color:"#475569",borderRight:"1px solid #f1f5f9"}}>{feat}</div>
            <div style={{padding:"11px 0",textAlign:"center",fontSize:17,borderRight:"1px solid #f1f5f9"}}>{free}</div>
            <div style={{padding:"11px 0",textAlign:"center",fontSize:17}}>{full}</div>
          </div>
        ))}
      </div>

      {/* Features Detail */}
      <div style={{margin:"16px 14px 0"}}>
        <div style={{fontWeight:800,fontSize:19,marginBottom:12,color:"#0f172a"}}>✨ สิ่งที่คุณได้รับใน Full Version</div>
        {FULL_FEATURES.map((f,i)=>(
          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:14,background:"white",borderRadius:14,padding:"14px 16px",marginBottom:10,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",borderLeft:f.desc.includes("เร็วๆ นี้")?"4px solid #e2e8f0":"4px solid #0284c7"}}>
            <div style={{fontSize:28,flexShrink:0}}>{f.icon}</div>
            <div>
              <div style={{fontWeight:800,fontSize:16,color:"#0f172a",marginBottom:2}}>
                {f.title}
                {f.desc.includes("เร็วๆ นี้")&&<span style={{fontSize:11,background:"#fef9c3",color:"#92400e",borderRadius:6,padding:"2px 6px",marginLeft:6,fontWeight:700}}>เร็วๆ นี้</span>}
              </div>
              <div style={{fontSize:14,color:"#64748b",lineHeight:1.5}}>{f.desc.replace(" (เร็วๆ นี้)","")}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Testimonial */}
      <div style={{margin:"16px 14px 0",background:"linear-gradient(135deg,#fef9c3,#fef3c7)",borderRadius:18,padding:20,border:"1.5px solid #fde68a"}}>
        <div style={{fontSize:24,marginBottom:6}}>💬</div>
        <div style={{fontSize:15,color:"#78350f",lineHeight:1.8,fontStyle:"italic"}}>
          "ตั้งแต่ใช้แอปนี้บันทึกความดันทุกวัน แพทย์บอกว่าสุขภาพดีขึ้นเยอะ เพราะติดตามได้สม่ำเสมอ"
        </div>
        <div style={{fontSize:13,color:"#92400e",fontWeight:700,marginTop:8}}>— คุณสมศรี อายุ 68 ปี ผู้ป่วยความดันโลหิตสูง</div>
      </div>

      {/* Urgency */}
      {trialLeft>0&&trialLeft<=14&&(
        <div style={{margin:"14px 14px 0",background:"#fee2e2",borderRadius:14,padding:"14px 16px",border:"1.5px solid #fca5a5",textAlign:"center"}}>
          <div style={{fontWeight:800,fontSize:16,color:"#991b1b",marginBottom:4}}>⏰ ทดลองใช้เหลืออีก {trialLeft} วันเท่านั้น!</div>
          <div style={{fontSize:14,color:"#7f1d1d"}}>อย่าให้ข้อมูลสุขภาพของคุณหยุดชะงัก อัปเกรดวันนี้เลย</div>
        </div>
      )}

      {/* Price + CTA */}
      <div style={{margin:"16px 14px 0",background:"white",borderRadius:18,padding:20,boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}>
        {adminCfg.price&&(
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:14,color:"#64748b"}}>ราคาพิเศษ</div>
            <div style={{fontSize:36,fontWeight:800,color:"#0284c7"}}>{adminCfg.price}</div>
            <div style={{fontSize:14,color:"#22c55e",fontWeight:700}}>✅ จ่ายครั้งเดียว ใช้ได้ตลอดชีพ</div>
          </div>
        )}
        {adminCfg.qrUrl&&(
          <div style={{textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:15,fontWeight:700,color:"#475569",marginBottom:8}}>สแกน QR โอนเงินได้เลย</div>
            <img
              src={adminCfg.qrUrl}
              alt="QR Payment"
              style={{width:200,height:200,borderRadius:12,border:"2px solid #e2e8f0",objectFit:"contain",background:"white"}}
              onError={e=>{e.target.style.display="none";e.target.nextSibling&&(e.target.nextSibling.style.display="block");}}
            />
            <div style={{display:"none",background:"#fef9c3",borderRadius:10,padding:"10px 14px",fontSize:14,color:"#92400e"}}>
              ⚠️ ไม่สามารถโหลดรูป QR ได้ กรุณาติดต่อ Line: {ADMIN_LINE}
            </div>
          </div>
        )}
        {!adminCfg.qrUrl&&(adminCfg.bankName||adminCfg.phone)&&(
          <div style={{background:"#fef9c3",borderRadius:14,padding:"14px 16px",marginBottom:14,textAlign:"center",fontSize:15,color:"#92400e",lineHeight:1.7}}>
            📞 ติดต่อรับ QR Code โอนเงินได้ที่<br/>
            Line: <strong>{ADMIN_LINE}</strong>
            {adminCfg.phone&&<span> · โทร: <strong>{adminCfg.phone}</strong></span>}
          </div>
        )}
        {(adminCfg.bankName||adminCfg.accountNo)&&(
          <div style={{background:"#f0f9ff",borderRadius:12,padding:"12px 16px",marginBottom:14,fontSize:15,lineHeight:2}}>
            {adminCfg.bankName&&<div>🏦 <strong>{adminCfg.bankName}</strong></div>}
            {adminCfg.accountNo&&<div>📋 เลขบัญชี: <strong>{adminCfg.accountNo}</strong></div>}
            {adminCfg.accountName&&<div>👤 ชื่อ: <strong>{adminCfg.accountName}</strong></div>}
          </div>
        )}
        {adminCfg.phone&&(
          <div style={{textAlign:"center",marginBottom:14,fontSize:15,color:"#0369a1",fontWeight:700}}>
            📞 ติดต่อสอบถาม: <a href={`tel:${adminCfg.phone}`} style={{color:"#0284c7"}}>{adminCfg.phone}</a>
          </div>
        )}
        <button onClick={onUnlock} style={{width:"100%",padding:"20px",background:"linear-gradient(135deg,#0284c7,#075985)",color:"white",border:"none",borderRadius:14,fontSize:21,fontWeight:800,fontFamily:"Sarabun,sans-serif",cursor:"pointer",boxShadow:"0 4px 16px rgba(2,132,199,0.4)"}}>
          🔓 ปลดล็อค Full Version
        </button>
        <div style={{textAlign:"center",marginTop:10,fontSize:13,color:"#94a3b8"}}>
          หลังโอนเงินแล้ว รับรหัสปลดล็อคทาง Line: <strong>{ADMIN_LINE}</strong>
        </div>
      </div>

      {/* Free features reminder */}
      <div style={{margin:"14px 14px 0",background:"#f8fafc",borderRadius:14,padding:16}}>
        <div style={{fontWeight:700,fontSize:15,color:"#475569",marginBottom:8}}>🆓 สิ่งที่มีในเวอร์ชันฟรี (60 วัน)</div>
        {FREE_FEATURES.map((f,i)=>(
          <div key={i} style={{fontSize:14,color:"#64748b",padding:"4px 0",display:"flex",alignItems:"center",gap:8}}>
            <span style={{color:"#22c55e",fontWeight:700}}>✓</span>{f}
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
//  PAYWALL COMPONENT
// ═══════════════════════════════════════════════
const Paywall = ({adminCfg, onUnlock, onBack}) => {
  const [code,    setCode]    = useState("");
  const [err,     setErr]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [notified,setNotified]= useState(false);
  const [nLoading,setNLoading]= useState(false);
  const [phone,   setPhone]   = useState("");

  const tryUnlock = async () => {
    if(!code.trim()) return;
    setLoading(true);
    const valid = await verifyCode("unlock", code.trim());
    setLoading(false);
    if(valid){ onUnlock(); }
    else { setErr(true); setTimeout(()=>setErr(false),2500); }
  };

  const doNotify = async () => {
    if(!phone.trim()){return;}
    setNLoading(true);
    const res = await notifyAdmin(adminCfg.patientName||"ไม่ระบุ", phone, false);
    setNLoading(false);
    if(res.ok){
      setNotified(true);
    } else {
      // แม้ no-cors จะไม่รู้ผล → แสดงว่าส่งแล้ว
      setNotified(true);
    }
  };

  // คำนวณวันที่ใช้ไปแล้ว
  const installDate = lsRaw(KEY_INSTALL);
  const daysUsed = installDate ? Math.floor((Date.now()-new Date(installDate))/(86400000)) : TRIAL_DAYS;
  const daysLeft = Math.max(0, TRIAL_DAYS - daysUsed);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(2,132,199,0.97)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"Sarabun,sans-serif",overflowY:"auto"}}>
      <div style={{background:"white",borderRadius:24,padding:24,width:"100%",maxWidth:380,margin:"auto"}}>
        {/* Back button */}
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#64748b",fontSize:16,cursor:"pointer",fontFamily:"Sarabun,sans-serif",marginBottom:12,padding:0}}>
          ← ย้อนกลับ
        </button>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:44,marginBottom:6}}>🔒</div>
          <div style={{fontSize:22,fontWeight:800,color:"#0369a1"}}>ระยะทดลองใช้</div>
            <div style={{fontSize:20,fontWeight:800,color:"#0369a1"}}>สนับสนุนค่ากาแฟ</div>
          <div style={{fontSize:15,color:"#64748b",marginTop:4,lineHeight:1.7}}>
            จ่ายเพียง 299 บาท ตลอดชีพครับ ใช้ฟรีได้อีก <strong>{TRIAL_DAYS} วัน</strong> ขอบคุณครับ<br/>
            ใช้ไปแล้ว {daysUsed} วัน | เหลือ <span style={{color:"#ef4444",fontWeight:800}}>{daysLeft} วัน</span>
          </div>
        </div>

        {/* Payment info */}
        {(adminCfg.price||adminCfg.bankName||adminCfg.qrUrl)&&(
          <div style={{background:"#f0f9ff",borderRadius:14,padding:"14px 16px",marginBottom:14,textAlign:"left",fontSize:15,lineHeight:2}}>
            {adminCfg.price&&<div>💰 ราคา Full Version: <strong>{adminCfg.price}</strong></div>}
            {adminCfg.bankName&&<div>🏦 ธนาคาร: <strong>{adminCfg.bankName}</strong></div>}
            {adminCfg.accountNo&&<div>📋 เลขบัญชี: <strong>{adminCfg.accountNo}</strong></div>}
            {adminCfg.accountName&&<div>👤 ชื่อบัญชี: <strong>{adminCfg.accountName}</strong></div>}
            {adminCfg.phone&&<div>📞 ติดต่อซื้อ: <strong>{adminCfg.phone}</strong></div>}
          </div>
        )}

        {adminCfg.qrUrl&&(
          <div style={{textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:15,fontWeight:700,color:"#475569",marginBottom:8}}>สแกน QR โอนเงิน</div>
            <img src={adminCfg.qrUrl} alt="QR" style={{width:200,height:200,borderRadius:12,border:"2px solid #e2e8f0"}} onError={e=>e.target.style.display="none"}/>
          </div>
        )}

        {/* Notify admin */}
        {!notified?(
          <div style={{background:"#fefce8",borderRadius:12,padding:14,marginBottom:14}}>
            <div style={{fontSize:15,fontWeight:700,color:"#92400e",marginBottom:8}}>📲 แจ้งชำระเงิน เพื่อรับรหัสปลดล็อค</div>
            <div style={{fontSize:14,color:"#78350f",marginBottom:10}}>
              ระบบจะแจ้งเจ้าหน้าที่ทาง Email & Line
            </div>
            <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="เบอร์มือถือของคุณ"
              style={{width:"100%",padding:"12px",borderRadius:10,border:"1.5px solid #fde68a",fontSize:18,fontFamily:"Sarabun,sans-serif",boxSizing:"border-box",marginBottom:10,outline:"none"}}/>
            <button onClick={doNotify} disabled={nLoading||!phone}
              style={{width:"100%",padding:"13px",background:nLoading?"#94a3b8":"linear-gradient(135deg,#f59e0b,#d97706)",color:"white",border:"none",borderRadius:10,fontSize:17,fontWeight:800,fontFamily:"Sarabun,sans-serif",cursor:"pointer"}}>
              {nLoading?"⏳ กำลังส่ง...":"📲 แจ้งชำระเงิน"}
            </button>
          </div>
        ):(
          <div style={{background:"#dcfce7",borderRadius:12,padding:14,marginBottom:14,textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:4}}>✅</div>
            <div style={{fontSize:15,fontWeight:700,color:"#166534"}}>ส่งแจ้งเจ้าหน้าที่แล้ว</div>
            <div style={{fontSize:14,color:"#15803d"}}>รอรับรหัสปลดล็อคทาง Line: {ADMIN_LINE}</div>
          </div>
        )}

        {/* Unlock code */}
        <div style={{fontSize:15,color:"#475569",marginBottom:8,textAlign:"center"}}>ใส่รหัสปลดล็อคที่ได้รับ</div>
        <input value={code} onChange={e=>setCode(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&tryUnlock()}
          placeholder="รหัสปลดล็อค"
          style={{width:"100%",padding:"14px",borderRadius:12,border:`2px solid ${err?"#ef4444":"#cbd5e1"}`,fontSize:18,fontFamily:"Sarabun,sans-serif",boxSizing:"border-box",textAlign:"center",fontWeight:700,outline:"none",marginBottom:err?6:12}}/>
        {err&&<div style={{color:"#ef4444",fontSize:15,marginBottom:8,textAlign:"center"}}>❌ รหัสไม่ถูกต้อง ลองใหม่อีกครั้ง</div>}
        <button onClick={tryUnlock} disabled={loading}
          style={{width:"100%",padding:"16px",background:loading?"#94a3b8":"linear-gradient(135deg,#0284c7,#075985)",color:"white",border:"none",borderRadius:12,fontSize:20,fontWeight:800,fontFamily:"Sarabun,sans-serif",cursor:"pointer"}}>
          {loading?"⏳ กำลังตรวจสอบ...":"🔓 ปลดล็อค Full Version"}
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════
export default function App() {
  const [tab,           setTab]           = useState("home");
  const [records,       setRecords]       = useState([]);
  const [patient,       setPatient]       = useState({name:"",phone:""});
  const [loaded,        setLoaded]        = useState(false);
  const [toast,         setToast]         = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [capturing,     setCapturing]     = useState(false);
  const [syncing,       setSyncing]       = useState(false);
  const [syncProg,      setSyncProg]      = useState(null);
  const [lastBackup,    setLastBackup]    = useState("");
  const [lastSheetSync, setLastSheetSync] = useState("");
  const [sheetStatus,   setSheetStatus]   = useState("unknown"); // unknown | ok | error
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showDeleteZone,setShowDeleteZone]= useState(false);
  const [editRecord,    setEditRecord]    = useState(null);
  const [trialLeft,     setTrialLeft]     = useState(TRIAL_DAYS);
  const [daysUsed,      setDaysUsed]      = useState(0);
  const [isUnlocked,    setIsUnlocked]    = useState(false);
  const [showPaywall,   setShowPaywall]   = useState(false);
  const [showUpgrade,   setShowUpgrade]   = useState(false);
  const [adminCfg,      setAdminCfg]      = useState({unlockCode:"",qrUrl:"",bankName:"",accountNo:"",accountName:"",price:"",phone:"",adminPass:""});
  const [adminTap,      setAdminTap]      = useState(0);
  const [showAdmin,     setShowAdmin]     = useState(false);
  const [adminAuth,     setAdminAuth]     = useState(false);
  const [adminPass,     setAdminPass]     = useState("");
  const [adminLoading,  setAdminLoading]  = useState(false);
  const [testNotifyLoading, setTestNotifyLoading] = useState(false);
  const [showGuide,     setShowGuide]     = useState(false);
  const [testResult,    setTestResult]    = useState(null);
  const reportRef = useRef(null);

  const emptyForm = {date:todayISO(),morningTime:"",morningSys:"",morningDia:"",morningPulse:"",eveningTime:"",eveningSys:"",eveningDia:"",eveningPulse:""};
  const [form, setForm] = useState(emptyForm);

  // ── INIT ──
  useEffect(()=>{
    setRecords(lsGet(KEY_RECORDS,[]));
    setPatient(lsGet(KEY_PATIENT,{name:"",phone:""}));
    setAdminCfg(lsGet(KEY_ADMIN,{unlockCode:"",qrUrl:"",bankName:"",accountNo:"",accountName:"",price:"",phone:"",adminPass:""}));
    setLastBackup(lsRaw(KEY_BACKUP_TS));
    setLastSheetSync(lsRaw("bp-sheet-sync-ts")||"");
    const unlocked = lsGet(KEY_UNLOCKED,false);
    setIsUnlocked(unlocked);
    if(!unlocked){
      let inst = localStorage.getItem(KEY_INSTALL);
      if(!inst){ inst=new Date().toISOString(); localStorage.setItem(KEY_INSTALL,inst); }
      const used = Math.floor((Date.now()-new Date(inst))/(86400000));
      const left = Math.max(0, TRIAL_DAYS-used);
      setDaysUsed(used); setTrialLeft(left);
      if(left===0) setShowPaywall(true);
    }
    if(!window._h2cLoaded){
      window._h2cLoaded=true;
      const sc=document.createElement("script");
      sc.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      document.head.appendChild(sc);
    }
    setLoaded(true);
  },[]);

  const toast$ = (msg,type="ok",dur=3500)=>{setToast({msg,type});setTimeout(()=>setToast(null),dur);};
  const doUnlock = ()=>{lsSet(KEY_UNLOCKED,true);setIsUnlocked(true);setShowPaywall(false);toast$("🎉 ปลดล็อคสำเร็จ! ยินดีต้อนรับสู่ Full Version");};

  // ── CHANGE DATE (auto-load existing) ──
  const changeDate = (newDate) => {
    const ex = records.find(r=>r.date===newDate);
    if(ex){ setForm({...ex}); toast$(`📋 โหลดข้อมูล ${toThai(newDate)} แล้ว`,"ok",2000); }
    else   { setForm({...emptyForm, date:newDate}); }
  };
  const setF = k=>v=>{ if(k==="date"){changeDate(v);return;} setForm(f=>({...f,[k]:v})); };

  // ── SUBMIT (save/update) ──
  const submit = async () => {
    if(!form.morningSys&&!form.morningDia&&!form.eveningSys&&!form.eveningDia){
      toast$("กรอกค่าความดันอย่างน้อย 1 ช่วง","err"); return;
    }
    if(!isUnlocked&&trialLeft===0){setShowPaywall(true);return;}
    setSaving(true);
    const idx = records.findIndex(r=>r.date===form.date);
    const ex  = idx>=0 ? records[idx] : null;
    const entry = {
      date: form.date, id: ex?ex.id:Date.now(),
      morningTime:  form.morningSys?form.morningTime :(ex?.morningTime ||""),
      morningSys:   form.morningSys||ex?.morningSys  ||"",
      morningDia:   form.morningSys?form.morningDia  :(ex?.morningDia  ||""),
      morningPulse: form.morningSys?form.morningPulse:(ex?.morningPulse||""),
      eveningTime:  form.eveningSys?form.eveningTime :(ex?.eveningTime ||""),
      eveningSys:   form.eveningSys||ex?.eveningSys  ||"",
      eveningDia:   form.eveningSys?form.eveningDia  :(ex?.eveningDia  ||""),
      eveningPulse: form.eveningSys?form.eveningPulse:(ex?.eveningPulse||""),
    };
    const next = idx>=0 ? records.map((r,i)=>i===idx?entry:r) : [...records,entry].sort((a,b)=>a.date.localeCompare(b.date));
    setRecords(next); lsSet(KEY_RECORDS,next);
    const res = await syncToSheet(entry, patient.name);
    if(res.ok){
      const ts=nowStr(); localStorage.setItem("bp-sheet-sync-ts",ts); setLastSheetSync(ts);
      setSheetStatus("ok");
    } else {
      setSheetStatus("error");
    }
    toast$(res.ok?`✅ ${ex?"อัปเดต":"บันทึก"} + ซิงค์ Google Sheets สำเร็จ`:`💾 ${ex?"อัปเดต":"บันทึก"}ในเครื่องแล้ว (ออฟไลน์)`,res.ok?"ok":"warn");
    setForm(emptyForm); setSaving(false); setTab("history");
  };

  // ── EDIT from history ──
  const openEdit = (r) => {
    setEditRecord(r);
    setForm({...r});
    setTab("record");
  };

  // ── DELETE ──
  const delRecord = id => {
    const next=records.filter(r=>r.id!==id);
    setRecords(next); lsSet(KEY_RECORDS,next);
    setDeleteConfirm(null); toast$("ลบรายการแล้ว");
  };

  // ── BACKUP to device (รองรับ iOS + Android) ──
  const exportBackup = async () => {
    const jsonStr = JSON.stringify({version:APP_VERSION,patient,records,exportedAt:new Date().toISOString()},null,2);
    const blob = new Blob([jsonStr], {type:"application/json"});
    const filename = `bp-backup_${patient.name||"record"}_${todayISO()}.json`;
    const ts = nowStr();

    // iOS Safari — ใช้ Web Share API (รองรับ iOS 15+)
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], filename, {type:"application/json"});
        if (navigator.canShare({files:[file]})) {
          await navigator.share({files:[file], title:"BP Backup", text:"ไฟล์สำรองข้อมูลความดัน"});
          localStorage.setItem(KEY_BACKUP_TS, ts); setLastBackup(ts);
          toast$("📥 แชร์ไฟล์สำรองสำเร็จ ✓");
          return;
        }
      } catch(e) {
        if (e.name !== "AbortError") {
          // ถ้า share ล้มเหลว ไม่ใช่ user cancel → ลอง fallback
        } else { return; } // user กด cancel
      }
    }

    // Android / Desktop — download ปกติ
    if (!navigator.userAgent.includes("iPhone") && !navigator.userAgent.includes("iPad")) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(()=>URL.revokeObjectURL(a.href), 10000);
      localStorage.setItem(KEY_BACKUP_TS, ts); setLastBackup(ts);
      toast$("📥 บันทึกไฟล์สำรองในเครื่องแล้ว ✓");
      return;
    }

    // iOS Fallback — เปิดหน้าต่างใหม่ให้กด Share > Save to Files
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      toast$("iOS: กด Share ↗ → Save to Files เพื่อบันทึก","ok",6000);
    } else {
      // Fallback สุดท้าย — แสดง JSON ใน textarea ให้ copy
      toast$("กรุณา copy ข้อความด้านล่างเพื่อสำรองข้อมูล","warn",4000);
    }
    localStorage.setItem(KEY_BACKUP_TS, ts); setLastBackup(ts);
    setTimeout(()=>URL.revokeObjectURL(url), 60000);
  };

  // ── BACKUP all to Google Sheets ──
  const backupToSheet = async () => {
    if(records.length===0){toast$("ยังไม่มีข้อมูลให้ backup","warn");return;}
    setSyncing(true); setSyncProg({current:0,total:records.length});
    const res = await syncAllToSheet(records, patient.name, (cur,tot)=>setSyncProg({current:cur,total:tot}));
    setSyncing(false); setSyncProg(null);
    if(res.fail===0){
      const ts=nowStr(); localStorage.setItem("bp-sheet-sync-ts",ts); setLastSheetSync(ts);
      setSheetStatus("ok");
    } else {
      setSheetStatus(res.ok>0?"ok":"error");
    }
    toast$(res.fail===0?`✅ อัปโหลด ${res.ok} รายการสำเร็จ`:`⚠️ สำเร็จ ${res.ok} / ไม่สำเร็จ ${res.fail} รายการ`,res.fail===0?"ok":"warn",5000);
  };

  // ── IMPORT ──
  const importBackup = e => {
    const file=e.target.files[0]; if(!file)return;
    const r=new FileReader();
    r.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(d.records){setRecords(d.records);lsSet(KEY_RECORDS,d.records);}if(d.patient){setPatient(d.patient);lsSet(KEY_PATIENT,d.patient);}toast$(`📤 นำเข้า ${d.records?.length||0} รายการสำเร็จ ✓`);}catch{toast$("ไฟล์ไม่ถูกต้อง","err");}};
    r.readAsText(file); e.target.value="";
  };

  // ── TEST BACKUP ──
  const testBackup = async () => {
    setTestResult({testing:true});
    let devOk=false, sheetOk=false;
    try{ const b=new Blob(["test"],{type:"application/json"}); URL.revokeObjectURL(URL.createObjectURL(b)); devOk=true; }catch{}
    const testE={date:"TEST-"+todayISO(),id:Date.now(),morningSys:"999",morningDia:"999",morningPulse:"",morningTime:"",eveningSys:"",eveningDia:"",eveningPulse:"",eveningTime:""};
    const res=await syncToSheet(testE,"__TEST__");
    sheetOk=res.ok;
    setTestResult({testing:false,devOk,sheetOk});
    setSheetStatus(sheetOk ? "ok" : "error");
    toast$(`เครื่อง: ${devOk?"✅":"❌"}  ·  Google Sheets: ${sheetOk?"✅":"❌"}`, devOk&&sheetOk?"ok":"warn", 5000);
  };

  // ── PRINT / PDF ── (Blob URL — ใช้งานได้บนมือถือทุกรุ่น)
  const doPrint = () => {
    if(!records.length){toast$("ยังไม่มีข้อมูล","warn");return;}
    const rows = records.map(r=>{
      const ms=bpStatus(r.morningSys,r.morningDia);
      const es=bpStatus(r.eveningSys,r.eveningDia);
      const w=rank(ms)>=rank(es)?(ms||es):(es||ms);
      return `<tr>
        <td style="text-align:left">${toThai(r.date)}</td>
        <td style="color:#92400e;font-size:10px">${r.morningTime||"–"}</td>
        <td style="font-weight:700;color:${ms?ms.fg:"#000"}">${r.morningSys||"–"}</td>
        <td>${r.morningDia||"–"}</td>
        <td style="font-size:10px">${r.morningPulse||"–"}</td>
        <td style="color:#1d4ed8;font-size:10px">${r.eveningTime||"–"}</td>
        <td style="font-weight:700;color:${es?es.fg:"#000"}">${r.eveningSys||"–"}</td>
        <td>${r.eveningDia||"–"}</td>
        <td style="font-size:10px">${r.eveningPulse||"–"}</td>
        <td style="background:${w?w.bg:"#fff"};color:${w?w.fg:"#000"};font-weight:700;font-size:10px">${w?w.label:""}</td>
      </tr>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>รายงานความดันโลหิต — ${patient.name||""}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700;800&display=swap');
    *{font-family:'Sarabun',sans-serif;box-sizing:border-box;margin:0;padding:0;}
    body{background:white;padding:12mm 15mm;}
    @page{size:A4 portrait;margin:12mm 15mm;}
    h2{text-align:center;color:#0369a1;margin-bottom:4px;font-size:18pt;}
    .sub{text-align:center;color:#475569;font-size:11pt;margin-bottom:3px;}
    .meta{text-align:center;color:#94a3b8;font-size:9pt;margin-bottom:12px;}
    table{width:100%;border-collapse:collapse;font-size:10pt;page-break-inside:auto;}
    tr{page-break-inside:avoid;page-break-after:auto;}
    thead{display:table-header-group;}
    th,td{border:1px solid #94a3b8;padding:5px 5px;text-align:center;vertical-align:middle;}
    th{background:#0284c7;color:white;font-weight:700;font-size:9pt;}
    tr:nth-child(even) td{background:#f8fafc;}
    .legend{margin-top:10px;display:flex;gap:14px;flex-wrap:wrap;font-size:9pt;}
    .dot{width:10px;height:10px;border-radius:2px;display:inline-block;margin-right:3px;vertical-align:middle;}
    .footer{text-align:right;font-size:8pt;color:#94a3b8;margin-top:8px;border-top:1px solid #e2e8f0;padding-top:6px;}
    .print-btn{display:block;margin:0 auto 16px;padding:12px 32px;background:#0284c7;color:white;border:none;border-radius:10px;font-size:16pt;font-family:'Sarabun',sans-serif;font-weight:700;cursor:pointer;}
    @media print{.print-btn{display:none!important;}}
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ พิมพ์ / บันทึกเป็น PDF</button>
  <h2>📋 รายงานความดันโลหิต</h2>
  ${patient.name?`<div class="sub">👤 ${patient.name}${patient.phone?` &nbsp;·&nbsp; 📞 ${patient.phone}`:""}</div>`:""}
  <div class="meta">พิมพ์วันที่ ${toThai(todayISO())} &nbsp;·&nbsp; ${records.length} รายการ &nbsp;·&nbsp; Home BP Tracker ${APP_VERSION}</div>
  <table>
    <thead>
      <tr>
        <th rowspan="2" style="background:#374151">วันที่</th>
        <th colspan="4" style="background:#92400e">🌅 ช่วงเช้า</th>
        <th colspan="4" style="background:#1d4ed8">🌙 ช่วงเย็น/กลางคืน</th>
        <th rowspan="2" style="background:#374151">สถานะ</th>
      </tr>
      <tr>
        <th style="background:#b45309;font-size:8pt">เวลา</th>
        <th style="background:#b45309">ตัวบน</th>
        <th style="background:#b45309">ตัวล่าง</th>
        <th style="background:#b45309;font-size:8pt">ชีพจร</th>
        <th style="background:#2563eb;font-size:8pt">เวลา</th>
        <th style="background:#2563eb">ตัวบน</th>
        <th style="background:#2563eb">ตัวล่าง</th>
        <th style="background:#2563eb;font-size:8pt">ชีพจร</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="legend">
    <span><span class="dot" style="background:#dcfce7;border:1px solid #166534"></span><span style="color:#166534;font-weight:700">ปกติ</span> &lt;120/80</span>
    <span><span class="dot" style="background:#fef9c3;border:1px solid #854d0e"></span><span style="color:#854d0e;font-weight:700">สูงเล็กน้อย</span> 120–129</span>
    <span><span class="dot" style="background:#ffedd5;border:1px solid #9a3412"></span><span style="color:#9a3412;font-weight:700">สูงระดับ 1</span> 130–139</span>
    <span><span class="dot" style="background:#fee2e2;border:1px solid #991b1b"></span><span style="color:#991b1b;font-weight:700">สูงระดับ 2</span> ≥140 mmHg</span>
  </div>
  <div class="footer">ค่าปกติ: ความดันตัวบน &lt;120 / ตัวล่าง &lt;80 mmHg &nbsp;·&nbsp; ชีพจร 60–100 ครั้ง/นาที &nbsp;·&nbsp; อ้างอิง: WHO, AHA 2023</div>
</body>
</html>`;

    // สร้าง Blob URL — ใช้งานได้บนมือถือทุกรุ่น ไม่โดน block
    const blob = new Blob([html], {type:"text/html;charset=utf-8"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.target   = "_blank";
    a.rel      = "noopener";
    a.click();
    // clean up หลัง 60 วินาที
    setTimeout(()=>URL.revokeObjectURL(url), 60000);
    toast$("เปิดหน้ารายงานแล้ว — กดปุ่ม 🖨️ เพื่อพิมพ์","ok",4000);
  };

  // ── SAVE JPG ──
  const saveJPG = async () => {
    if(!reportRef.current) return;
    if(!window.html2canvas){toast$("กำลังโหลด กรุณารอแล้วลองใหม่","warn");return;}
    setCapturing(true);
    try{
      const canvas=await window.html2canvas(reportRef.current,{scale:2.5,useCORS:true,backgroundColor:"#ffffff",logging:false});
      const dataUrl=canvas.toDataURL("image/jpeg",0.93);
      if(navigator.canShare){
        const blob=await(await fetch(dataUrl)).blob();
        const file=new File([blob],`ความดัน_${patient.name||"record"}.jpg`,{type:"image/jpeg"});
        if(navigator.canShare({files:[file]})){await navigator.share({files:[file],title:"รายงานความดันโลหิต"});toast$("แชร์สำเร็จ ✓");setCapturing(false);return;}
      }
      const a=document.createElement("a");a.href=dataUrl;a.download=`ความดัน_${patient.name||"record"}_${todayISO()}.jpg`;a.click();
      toast$("บันทึกรูปภาพแล้ว ✓");
    }catch{toast$("เกิดข้อผิดพลาด","err");}
    setCapturing(false);
  };

  // ── ADMIN ──
  // ── TEST NOTIFICATION ──
  const testNotify = async () => {
    setTestNotifyLoading(true);
    const res = await notifyAdmin(
      patient.name || "Admin Test",
      patient.phone || "000-000-0000",
      true // isTest flag
    );
    setTestNotifyLoading(false);
    if (res.ok) {
      toast$("📨 ส่งแจ้งเตือนทดสอบแล้ว ตรวจสอบ Email และ Line ของ Admin","ok",6000);
    } else {
      toast$("❌ ส่งแจ้งเตือนไม่สำเร็จ ตรวจสอบ Apps Script","err",5000);
    }
  };

  const handleVerTap=()=>{const n=adminTap+1;if(n>=5){setShowAdmin(true);setAdminTap(0);}else{setAdminTap(n);setTimeout(()=>setAdminTap(0),3000);}};

  const rec=getRec(records);
  const mStatus=bpStatus(form.morningSys,form.morningDia);
  const eStatus=bpStatus(form.eveningSys,form.eveningDia);

  const S={
    app:     {fontFamily:"'Sarabun', sans-serif",background:"#f0f9ff",minHeight:"100vh",maxWidth:520,margin:"0 auto",paddingBottom:90},
    header:  {background:"linear-gradient(135deg,#0284c7,#075985)",padding:"22px 20px 18px",color:"white"},
    card:    {background:"white",borderRadius:18,padding:20,margin:"0 14px 14px",boxShadow:"0 2px 8px rgba(0,0,0,0.07)"},
    grid2:   {display:"grid",gridTemplateColumns:"1fr 1fr",gap:14},
    btnMain: {width:"100%",padding:"18px",background:"linear-gradient(135deg,#0284c7,#075985)",color:"white",border:"none",borderRadius:14,fontSize:20,fontWeight:800,fontFamily:"Sarabun,sans-serif",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8},
    btnGhost:{flex:1,padding:"15px",borderRadius:12,border:"2px solid #0284c7",background:"white",color:"#0284c7",fontSize:17,fontWeight:700,fontFamily:"Sarabun,sans-serif",cursor:"pointer",textAlign:"center"},
    tabBar:  {position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:520,background:"white",borderTop:"2px solid #e2e8f0",display:"flex",zIndex:100},
    tabItem: a=>({flex:1,padding:"10px 2px 8px",border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,color:a?"#0284c7":"#94a3b8",fontFamily:"Sarabun,sans-serif",fontSize:12,fontWeight:a?800:500}),
    badge:   st=>({display:"inline-block",padding:"4px 10px",borderRadius:20,fontSize:13,fontWeight:800,background:st.bg,color:st.fg}),
    histCard:{background:"white",borderRadius:16,padding:18,margin:"0 14px 12px",boxShadow:"0 2px 6px rgba(0,0,0,0.07)",borderLeft:"5px solid"},
    secTitle:{fontSize:20,fontWeight:800,marginBottom:16,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"},
  };

  if(!loaded) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"Sarabun,sans-serif"}}><div style={{textAlign:"center"}}><div style={{fontSize:52,marginBottom:10}}>💓</div><div style={{color:"#64748b",fontSize:22}}>กำลังโหลด...</div></div></div>;

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`*{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}input[type=number]::-webkit-inner-spin-button{opacity:.4;}`}</style>

      {/* Toast */}
      {toast&&<div style={{position:"fixed",top:18,left:"50%",transform:"translateX(-50%)",background:toast.type==="err"?"#ef4444":toast.type==="warn"?"#f59e0b":"#22c55e",color:"white",padding:"14px 24px",borderRadius:30,fontSize:17,fontWeight:700,zIndex:9999,boxShadow:"0 4px 24px rgba(0,0,0,0.18)",maxWidth:"92vw",textAlign:"center",lineHeight:1.5}}>{toast.msg}</div>}

      {/* Upgrade Screen */}
      {showUpgrade&&(
        <div style={{position:"fixed",inset:0,zIndex:800,overflowY:"auto",background:"#f0f9ff"}}>
          <UpgradeScreen
            adminCfg={adminCfg}
            trialLeft={trialLeft}
            daysUsed={daysUsed}
            onUnlock={()=>{setShowUpgrade(false);setShowPaywall(true);}}
            onClose={()=>setShowUpgrade(false)}
          />
        </div>
      )}

      {/* Paywall */}
      {showPaywall&&<Paywall adminCfg={{...adminCfg,patientName:patient.name}} onUnlock={doUnlock} onBack={()=>setShowPaywall(false)}/>}

      {/* Delete Confirm */}
      {deleteConfirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"white",borderRadius:22,padding:28,width:"100%",maxWidth:340,textAlign:"center"}}>
            <div style={{fontSize:44,marginBottom:10}}>🗑️</div>
            <div style={{fontWeight:800,fontSize:22,marginBottom:6}}>ลบรายการนี้?</div>
            <div style={{color:"#64748b",fontSize:18,marginBottom:22}}>{toThai(deleteConfirm.date)}</div>
            <div style={{display:"flex",gap:12}}>
              <button onClick={()=>setDeleteConfirm(null)} style={{flex:1,padding:16,borderRadius:12,border:"2px solid #e2e8f0",background:"white",fontSize:18,fontFamily:"Sarabun,sans-serif",cursor:"pointer",fontWeight:600}}>ยกเลิก</button>
              <button onClick={()=>delRecord(deleteConfirm.id)} style={{flex:1,padding:16,borderRadius:12,border:"none",background:"#ef4444",color:"white",fontSize:18,fontWeight:800,fontFamily:"Sarabun,sans-serif",cursor:"pointer"}}>ลบ</button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Progress */}
      {syncing&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"white",borderRadius:22,padding:28,width:"100%",maxWidth:320,textAlign:"center"}}>
            <div style={{fontSize:44,marginBottom:10}}>☁️</div>
            <div style={{fontWeight:800,fontSize:20,marginBottom:8}}>กำลังอัปโหลดข้อมูล</div>
            <div style={{color:"#64748b",fontSize:16,marginBottom:14}}>{syncProg?.current} / {syncProg?.total} รายการ</div>
            <div style={{background:"#e2e8f0",borderRadius:10,height:14,overflow:"hidden"}}>
              <div style={{background:"linear-gradient(135deg,#0284c7,#0ea5e9)",height:"100%",borderRadius:10,width:`${syncProg?Math.round(syncProg.current/syncProg.total*100):0}%`,transition:"width 0.3s"}}/>
            </div>
            <div style={{marginTop:8,fontSize:15,color:"#64748b"}}>{syncProg?Math.round(syncProg.current/syncProg.total*100):0}%</div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuide&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}}>
          <div style={{background:"white",borderRadius:22,padding:22,width:"100%",maxWidth:400,margin:"auto"}}>
            <div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:36}}>📖</div><div style={{fontWeight:800,fontSize:22,color:"#0284c7"}}>คู่มือการใช้งาน</div></div>
            {[{icon:"➕",t:"บันทึกความดัน",d:"กดแท็บ 'บันทึก' → เลือกวันที่ → กรอกค่าเช้า หรือ เย็น หรือทั้งคู่ → กดบันทึก ข้อมูลซิงค์ Google Sheets อัตโนมัติ"},
              {icon:"📋",t:"ดูประวัติ & แก้ไข",d:"กดแท็บ 'ประวัติ' ดูรายการ กราฟ คำแนะนำ กด ✏️ เพื่อแก้ไขเพิ่มข้อมูลในรายการที่มีอยู่แล้ว"},
              {icon:"📸",t:"รายงาน",d:"บันทึกเป็นรูปภาพ JPG หรือกด 'พิมพ์ A4' จะเปิดหน้าต่างพิมพ์ใหม่ รองรับหลายหน้า"},
              {icon:"⚙️",t:"ตั้งค่า & Backup",d:"กรอกชื่อ-เบอร์ และกด backup ทุกสัปดาห์ มีแสดงเวลาล่าสุดที่ backup"},
              {icon:"💓",t:"เกณฑ์ความดัน",d:"ปกติ <120/80 · สูงเล็กน้อย 120-129 · สูงระดับ 1 130-139 · สูงระดับ 2 ≥140 (mmHg)"},
            ].map((item,i)=>(
              <div key={i} style={{display:"flex",gap:12,marginBottom:12,padding:"12px 14px",background:"#f8fafc",borderRadius:12}}>
                <div style={{fontSize:26,flexShrink:0}}>{item.icon}</div>
                <div><div style={{fontWeight:800,fontSize:17,marginBottom:2}}>{item.t}</div><div style={{fontSize:14,color:"#64748b",lineHeight:1.6}}>{item.d}</div></div>
              </div>
            ))}
            <button onClick={()=>setShowGuide(false)} style={{...S.btnMain,marginTop:4}}>เข้าใจแล้ว ✓</button>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {showAdmin&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}}>
          <div style={{background:"white",borderRadius:22,padding:22,width:"100%",maxWidth:400,margin:"auto"}}>
            <div style={{fontWeight:800,fontSize:22,marginBottom:14,color:"#0284c7"}}>🔧 Admin Panel</div>
            {!adminAuth?(
              <div>
                <Input label="รหัสผ่าน Admin" type="password" value={adminPass} onChange={setAdminPass} placeholder="กรอกรหัส Admin"/>
                <div style={{marginTop:12,display:"flex",gap:10}}>
                  <button onClick={()=>{setShowAdmin(false);setAdminPass("");}} style={S.btnGhost}>ยกเลิก</button>
                  <button onClick={async()=>{
                    setAdminLoading(true);
                    const v=await verifyCode("admin",adminPass);
                    setAdminLoading(false);
                    if(v){setAdminAuth(true);}else toast$("รหัสผ่านไม่ถูกต้อง","err");
                  }} style={{...S.btnMain,flex:1}} disabled={adminLoading}>
                    {adminLoading?"⏳ ตรวจสอบ...":"เข้าสู่ระบบ"}
                  </button>
                </div>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div style={{background:"#f0fdf4",borderRadius:12,padding:12,fontSize:14,color:"#166534",lineHeight:1.7}}>
                  📊 รายการในเครื่องนี้: <strong>{records.length}</strong> รายการ<br/>
                  👤 ผู้ใช้: <strong>{patient.name||"ยังไม่ตั้งชื่อ"}</strong><br/>
                  📬 แจ้งเตือนไปที่: {ADMIN_EMAIL} · Line: {ADMIN_LINE}
                </div>

                {/* Test Notification Buttons */}
                <div style={{background:"#eff6ff",borderRadius:12,padding:14}}>
                  <div style={{fontWeight:700,fontSize:15,color:"#1d4ed8",marginBottom:8}}>
                    🔔 ทดสอบระบบแจ้งเตือน Admin
                  </div>
                  <div style={{fontSize:13,color:"#3730a3",marginBottom:10,lineHeight:1.6}}>
                    กดเพื่อส่งการแจ้งเตือนทดสอบ → Email: {ADMIN_EMAIL}<br/>
                    Apps Script จะส่ง Email + Line Notify อัตโนมัติ
                  </div>
                  <button
                    onClick={testNotify}
                    disabled={testNotifyLoading}
                    style={{width:"100%",padding:"13px",background:testNotifyLoading?"#94a3b8":"linear-gradient(135deg,#1d4ed8,#1e40af)",color:"white",border:"none",borderRadius:10,fontSize:16,fontWeight:700,fontFamily:"Sarabun,sans-serif",cursor:"pointer",marginBottom:8}}
                  >
                    {testNotifyLoading?"⏳ กำลังส่ง...":"📧 ทดสอบส่ง Email แจ้งเตือน"}
                  </button>
                  <div style={{fontSize:12,color:"#64748b",textAlign:"center"}}>
                    * ต้องอัปเดต Apps Script ใหม่ก่อนจึงจะส่งได้จริง
                  </div>
                </div>
                <Input label="ราคา Full Version" value={adminCfg.price||""} onChange={v=>setAdminCfg(c=>({...c,price:v}))} placeholder="เช่น 299 บาท/ตลอดชีพ"/>
                <Input label="เบอร์ติดต่อ Admin" value={adminCfg.phone||""} onChange={v=>setAdminCfg(c=>({...c,phone:v}))} placeholder="เช่น 089-xxx-xxxx"/>
                <Input label="ธนาคาร" value={adminCfg.bankName||""} onChange={v=>setAdminCfg(c=>({...c,bankName:v}))} placeholder="กสิกรไทย"/>
                <Input label="เลขบัญชี" value={adminCfg.accountNo||""} onChange={v=>setAdminCfg(c=>({...c,accountNo:v}))} placeholder="xxx-x-xxxxx-x"/>
                <Input label="ชื่อเจ้าของบัญชี" value={adminCfg.accountName||""} onChange={v=>setAdminCfg(c=>({...c,accountName:v}))} placeholder="ชื่อ นามสกุล"/>
                <Input label="URL รูป QR Code" value={adminCfg.qrUrl||""} onChange={v=>setAdminCfg(c=>({...c,qrUrl:v}))} placeholder="https://..."/>
                <div style={{background:"#fffbeb",borderRadius:12,padding:12,fontSize:13,color:"#713f12",lineHeight:1.7}}>
                  💡 รหัสปลดล็อคและรหัส Admin ตั้งที่ Vercel → Environment Variables<br/>
                  UNLOCK_CODE และ ADMIN_PASS<br/>
                  📱 LINE: ใช้ Messaging API (LINE Notify ยกเลิกแล้ว 31 มี.ค. 68)
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>{setShowAdmin(false);setAdminAuth(false);setAdminPass("");}} style={S.btnGhost}>ปิด</button>
                  <button onClick={()=>{lsSet(KEY_ADMIN,adminCfg);toast$("บันทึกการตั้งค่าแล้ว");setShowAdmin(false);setAdminAuth(false);setAdminPass("");}} style={{...S.btnMain,flex:1,fontSize:17}}>💾 บันทึก</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <div style={S.header}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:11,opacity:.75,letterSpacing:".1em",textTransform:"uppercase",marginBottom:4}}>Home BP Tracker</div>
            <div style={{fontSize:26,fontWeight:800}}>บันทึกความดันโลหิต</div>
            {patient.name&&<div style={{fontSize:17,opacity:.9,marginTop:2}}>👤 {patient.name}</div>}
            {!isUnlocked&&<div style={{fontSize:13,background:"rgba(255,255,255,.2)",borderRadius:8,padding:"3px 10px",marginTop:4,display:"inline-block"}}>⏳ ทดลองใช้ เหลือ {trialLeft} วัน (ใช้ไป {daysUsed} วัน)</div>}
            {isUnlocked&&<div style={{fontSize:13,background:"rgba(255,255,255,.2)",borderRadius:8,padding:"3px 10px",marginTop:4,display:"inline-block"}}>✅ Full Version ไม่จำกัดวัน</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
            <div style={{background:"rgba(255,255,255,.2)",borderRadius:14,padding:"7px 14px",textAlign:"center"}}>
              <div style={{fontSize:28,fontWeight:800,lineHeight:1}}>{records.length}</div>
              <div style={{fontSize:12,opacity:.85}}>รายการ</div>
            </div>
            <button onClick={handleVerTap} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:8,color:"white",fontSize:12,padding:"4px 10px",cursor:"pointer",fontFamily:"Sarabun,sans-serif"}}>{APP_VERSION}</button>
          </div>
        </div>
      </div>

      {/* ═══ HOME ═══ */}
      {tab==="home"&&(
        <div style={{paddingTop:18}}>
          <div style={{padding:"0 14px",marginBottom:14}}>
            <div style={{fontWeight:800,fontSize:19,marginBottom:14,color:"#0369a1"}}>🚀 เริ่มต้นใช้งาน</div>
            {[
              {num:1,icon:"📱",title:"เพิ่ม Shortcut ที่หน้าจอมือถือ",desc:"เปิดแอปได้เร็วโดยไม่ต้องจำลิงก์",color:"#0284c7",bg:"#eff6ff",
                action:()=>{if(/iPhone|iPad|iPod/.test(navigator.userAgent)){toast$('🍎 iOS: กด Share ↗ → "Add to Home Screen"',"ok",5000);}else{toast$('🤖 Android: กด ⋮ เมนู → "Add to Home screen"',"ok",5000);}}},
              {num:2,icon:"📖",title:"อ่านคำแนะนำการใช้งาน",desc:"ทำความเข้าใจระบบก่อนเริ่มบันทึก",color:"#059669",bg:"#f0fdf4",action:()=>setShowGuide(true)},
              {num:3,icon:"☁️",title:"Backup ข้อมูล",desc:"เก็บสำรองในเครื่องและ Google Sheets",color:"#7c3aed",bg:"#faf5ff",action:()=>setTab("settings")},
            ].map(step=>(
              <button key={step.num} onClick={step.action}
                style={{width:"100%",display:"flex",alignItems:"center",gap:14,background:step.bg,borderRadius:16,padding:"16px 18px",marginBottom:12,border:`2px solid ${step.color}20`,cursor:"pointer",textAlign:"left",fontFamily:"Sarabun,sans-serif"}}>
                <div style={{width:44,height:44,borderRadius:12,background:step.color,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,fontWeight:800}}>{step.num}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:17,fontWeight:800,color:"#0f172a",marginBottom:2}}>{step.icon} {step.title}</div>
                  <div style={{fontSize:14,color:"#64748b"}}>{step.desc}</div>
                </div>
                <div style={{fontSize:22,color:step.color}}>›</div>
              </button>
            ))}
          </div>

          {records.length>0&&(()=>{
            const last=records[records.length-1];
            const ms=bpStatus(last.morningSys,last.morningDia);
            const es=bpStatus(last.eveningSys,last.eveningDia);
            const w=rank(ms)>=rank(es)?(ms||es):(es||ms);
            return(
              <div style={{...S.card,borderLeft:`5px solid ${w?w.bar:"#22c55e"}`}}>
                <div style={{fontWeight:800,fontSize:17,marginBottom:8}}>📊 บันทึกล่าสุด — {toThai(last.date)}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {last.morningSys&&<div style={{background:"#fefce8",borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:13,color:"#92400e",fontWeight:700}}>🌅 เช้า {last.morningTime&&`· ${last.morningTime}`}</div>
                    <div style={{fontSize:26,fontWeight:800}}>{last.morningSys}<span style={{fontSize:15}}>/{last.morningDia}</span></div>
                  </div>}
                  {last.eveningSys&&<div style={{background:"#eff6ff",borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:13,color:"#1d4ed8",fontWeight:700}}>🌙 เย็น {last.eveningTime&&`· ${last.eveningTime}`}</div>
                    <div style={{fontSize:26,fontWeight:800}}>{last.eveningSys}<span style={{fontSize:15}}>/{last.eveningDia}</span></div>
                  </div>}
                </div>
                {w&&<div style={{marginTop:8}}><span style={S.badge(w)}>{w.label}</span></div>}
              </div>
            );
          })()}

          {/* Upgrade banner สำหรับ trial users */}
          {!isUnlocked&&(
            <div style={{margin:"0 14px 14px"}}>
              <button onClick={()=>setShowUpgrade(true)} style={{width:"100%",background:"linear-gradient(135deg,#0f172a,#1e3a5f)",border:"none",borderRadius:16,padding:"16px 20px",cursor:"pointer",fontFamily:"Sarabun,sans-serif",textAlign:"left",display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontSize:32,flexShrink:0}}>💎</div>
                <div style={{flex:1}}>
                  <div style={{color:"white",fontWeight:800,fontSize:16,marginBottom:2}}>อัปเกรดเป็น Full Version</div>
                  <div style={{color:"#93c5fd",fontSize:13,lineHeight:1.5}}>กราฟ · คำแนะนำสุขภาพ · PDF · ไม่จำกัดวัน{adminCfg.price?` · ${adminCfg.price}`:""}</div>
                </div>
                <div style={{color:"#60a5fa",fontSize:22}}>›</div>
              </button>
            </div>
          )}

          <div style={{padding:"0 14px 16px"}}>
            <button onClick={()=>setTab("record")} style={{...S.btnMain,fontSize:22,padding:"20px"}}>➕ บันทึกความดันวันนี้</button>
          </div>
        </div>
      )}

      {/* ═══ RECORD ═══ */}
      {tab==="record"&&(
        <div style={{paddingTop:16}}>
          {editRecord&&(
            <div style={{margin:"0 14px 10px",background:"#fef9c3",borderRadius:12,padding:"10px 14px",fontSize:15,color:"#92400e",fontWeight:700}}>
              ✏️ กำลังแก้ไขวันที่ {toThai(editRecord.date)} — กดบันทึกเพื่ออัปเดต
              <button onClick={()=>{setEditRecord(null);setForm(emptyForm);}} style={{float:"right",background:"none",border:"none",color:"#9a3412",cursor:"pointer",fontSize:20}}>✕</button>
            </div>
          )}
          <div style={S.card}>
            <Input label="📅  วัน เดือน ปี" type="date" value={form.date} onChange={setF("date")}/>
            {(()=>{
              const ex=records.find(r=>r.date===form.date);
              if(!ex) return <div style={{marginTop:10,fontSize:15,color:"#94a3b8",background:"#f8fafc",borderRadius:10,padding:"8px 12px"}}>📝 วันใหม่ — กรอกเช้า หรือ เย็น หรือทั้งคู่ก็ได้</div>;
              return <div style={{marginTop:10,fontSize:15,background:"#fefce8",borderRadius:10,padding:"10px 12px",border:"1.5px solid #fde68a"}}>
                <div style={{fontWeight:700,color:"#92400e",marginBottom:3}}>✏️ มีข้อมูลวันนี้แล้ว — เพิ่ม/แก้ไขได้เลย</div>
                <div style={{color:"#78350f",fontSize:14}}>
                  {ex.morningSys?`🌅 เช้า: ${ex.morningSys}/${ex.morningDia}`:"🌅 เช้า: ยังไม่มี"}
                  {"  ·  "}
                  {ex.eveningSys?`🌙 เย็น: ${ex.eveningSys}/${ex.eveningDia}`:"🌙 เย็น: ยังไม่มี"}
                </div>
              </div>;
            })()}
          </div>

          <div style={{...S.card,borderTop:"4px solid #f59e0b"}}>
            <div style={{...S.secTitle,color:"#b45309"}}><span style={{fontSize:26}}>🌅</span>ช่วงเช้า{mStatus&&<span style={S.badge(mStatus)}>{mStatus.label}</span>}</div>
            <div style={{marginBottom:14}}><Input label="เวลา" type="time" value={form.morningTime} onChange={setF("morningTime")}/></div>
            <div style={S.grid2}>
              <Input label="ตัวบน" type="number" value={form.morningSys} onChange={setF("morningSys")} placeholder="120" unit="mmHg"/>
              <Input label="ตัวล่าง" type="number" value={form.morningDia} onChange={setF("morningDia")} placeholder="80" unit="mmHg"/>
            </div>
            <div style={{marginTop:14}}><Input label="ชีพจร" type="number" value={form.morningPulse} onChange={setF("morningPulse")} placeholder="75" unit="bpm"/></div>
          </div>

          <div style={{...S.card,borderTop:"4px solid #0284c7"}}>
            <div style={{...S.secTitle,color:"#0369a1"}}><span style={{fontSize:26}}>🌙</span>ช่วงเย็น / กลางคืน{eStatus&&<span style={S.badge(eStatus)}>{eStatus.label}</span>}</div>
            <div style={{marginBottom:14}}><Input label="เวลา" type="time" value={form.eveningTime} onChange={setF("eveningTime")}/></div>
            <div style={S.grid2}>
              <Input label="ตัวบน" type="number" value={form.eveningSys} onChange={setF("eveningSys")} placeholder="120" unit="mmHg"/>
              <Input label="ตัวล่าง" type="number" value={form.eveningDia} onChange={setF("eveningDia")} placeholder="80" unit="mmHg"/>
            </div>
            <div style={{marginTop:14}}><Input label="ชีพจร" type="number" value={form.eveningPulse} onChange={setF("eveningPulse")} placeholder="75" unit="bpm"/></div>
          </div>

          <div style={{padding:"0 14px 16px"}}>
            <button onClick={submit} disabled={saving} style={S.btnMain}>{saving?"⏳ กำลังบันทึก...":"💾 บันทึกความดัน"}</button>
          </div>

          <div style={S.card}>
            <div style={{fontWeight:800,marginBottom:12,fontSize:18}}>📊 เกณฑ์ระดับความดัน</div>
            {[{label:"ปกติ",range:"< 120/80",bg:"#dcfce7",fg:"#166534"},{label:"สูงเล็กน้อย",range:"120–129/< 80",bg:"#fef9c3",fg:"#854d0e"},{label:"สูงระดับ 1",range:"130–139/80–89",bg:"#ffedd5",fg:"#9a3412"},{label:"สูงระดับ 2",range:"≥ 140/≥ 90",bg:"#fee2e2",fg:"#991b1b"}].map(s=>(
              <div key={s.label} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <span style={{...S.badge(s),minWidth:110,textAlign:"center"}}>{s.label}</span>
                <span style={{color:"#475569",fontSize:16}}>{s.range} mmHg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ HISTORY ═══ */}
      {tab==="history"&&(
        <div style={{paddingTop:16}}>
          <div style={{padding:"0 14px 12px",display:"flex",gap:10}}>
            <button style={S.btnGhost} onClick={()=>setTab("report")}>📸 รายงาน</button>
            <button style={S.btnGhost} onClick={doPrint}>🖨️ พิมพ์ A4</button>
          </div>
          {records.length>=2&&<div style={S.card}><div style={{fontWeight:800,fontSize:18,marginBottom:12}}>📈 กราฟ 14 วันล่าสุด</div><BPGraph records={records}/></div>}
          {rec&&(
            <div style={{...S.card,borderLeft:`5px solid ${rec.status?.bar||"#22c55e"}`}}>
              <div style={{fontWeight:800,fontSize:18,marginBottom:8}}>🩺 คำแนะนำสุขภาพ</div>
              <div style={{fontSize:15,color:"#475569",marginBottom:10}}>ค่าเฉลี่ย 7 วัน: <strong style={{color:rec.status?.fg}}>{rec.avgS}/{rec.avgD} mmHg</strong>{rec.status&&<span style={{...S.badge(rec.status),marginLeft:8,fontSize:13}}>{rec.status.label}</span>}</div>
              {rec.tips.map((t,i)=><div key={i} style={{fontSize:15,color:"#334155",padding:"6px 0",borderBottom:i<rec.tips.length-1?"1px solid #f1f5f9":""}}>{t}</div>)}
              <div style={{fontSize:12,color:"#94a3b8",marginTop:8}}>อ้างอิง: WHO, AHA, ESC Guidelines 2023</div>
            </div>
          )}
          {records.length===0?(
            <div style={{textAlign:"center",padding:"70px 20px",color:"#94a3b8"}}>
              <div style={{fontSize:60,marginBottom:14}}>📋</div>
              <div style={{fontWeight:800,fontSize:22}}>ยังไม่มีข้อมูล</div>
              <div style={{fontSize:18,marginTop:6}}>เริ่มบันทึกความดันได้เลย</div>
            </div>
          ):(
            [...records].reverse().map(r=>{
              const ms=bpStatus(r.morningSys,r.morningDia);
              const es=bpStatus(r.eveningSys,r.eveningDia);
              const worst=rank(ms)>=rank(es)?(ms||es):(es||ms);
              return(
                <div key={r.id} style={{...S.histCard,borderLeftColor:worst?worst.bar:"#e2e8f0"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div>
                      <div style={{fontWeight:800,fontSize:20}}>{toThai(r.date)}</div>
                      {worst&&<span style={{...S.badge(worst),marginTop:5,display:"inline-block"}}>{worst.label}</span>}
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>openEdit(r)} style={{background:"#eff6ff",border:"none",borderRadius:8,cursor:"pointer",fontSize:18,padding:"4px 10px",color:"#0284c7"}}>✏️</button>
                      <button onClick={()=>setDeleteConfirm(r)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:"#cbd5e1",padding:4}}>✕</button>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {r.morningSys&&<div style={{background:"#fefce8",borderRadius:12,padding:"12px 14px"}}>
                      <div style={{fontSize:13,color:"#92400e",fontWeight:700,marginBottom:4}}>🌅 เช้า {r.morningTime&&`· ${r.morningTime}`}</div>
                      <div style={{fontSize:28,fontWeight:800,lineHeight:1.1}}>{r.morningSys}<span style={{fontSize:17}}>/{r.morningDia}</span></div>
                      <div style={{fontSize:14,color:"#64748b",marginTop:3}}>💗 {r.morningPulse} bpm</div>
                    </div>}
                    {r.eveningSys&&<div style={{background:"#eff6ff",borderRadius:12,padding:"12px 14px"}}>
                      <div style={{fontSize:13,color:"#1d4ed8",fontWeight:700,marginBottom:4}}>🌙 เย็น {r.eveningTime&&`· ${r.eveningTime}`}</div>
                      <div style={{fontSize:28,fontWeight:800,lineHeight:1.1}}>{r.eveningSys}<span style={{fontSize:17}}>/{r.eveningDia}</span></div>
                      <div style={{fontSize:14,color:"#64748b",marginTop:3}}>💗 {r.eveningPulse} bpm</div>
                    </div>}
                    {!r.morningSys&&<div style={{background:"#f8fafc",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <button onClick={()=>openEdit(r)} style={{background:"none",border:"2px dashed #cbd5e1",borderRadius:10,padding:"8px 14px",color:"#94a3b8",fontSize:14,cursor:"pointer",fontFamily:"Sarabun,sans-serif"}}>+ เพิ่มข้อมูลเช้า</button>
                    </div>}
                    {!r.eveningSys&&<div style={{background:"#f8fafc",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <button onClick={()=>openEdit(r)} style={{background:"none",border:"2px dashed #cbd5e1",borderRadius:10,padding:"8px 14px",color:"#94a3b8",fontSize:14,cursor:"pointer",fontFamily:"Sarabun,sans-serif"}}>+ เพิ่มข้อมูลเย็น</button>
                    </div>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══ REPORT ═══ */}
      {tab==="report"&&(
        <div style={{paddingTop:16}}>
          <div style={{padding:"0 14px 12px"}}>
            <button onClick={saveJPG} disabled={capturing} style={{...S.btnMain,background:capturing?"#94a3b8":"linear-gradient(135deg,#0f766e,#0d9488)",marginBottom:10}}>
              {capturing?"⏳ กำลังสร้างรูปภาพ...":"📸 บันทึกเป็นรูปภาพ (JPG)"}
            </button>
            <button onClick={doPrint} style={{...S.btnGhost,width:"100%",display:"block",background:"#f0f9ff",border:"2px solid #0284c7"}}>
              🖨️ เปิดหน้ารายงาน A4 (พิมพ์ / PDF)
            </button>
          </div>
          <div ref={reportRef} style={{margin:"0 14px 14px",background:"white",borderRadius:18,padding:20,boxShadow:"0 2px 8px rgba(0,0,0,0.07)"}}>
            <div style={{borderBottom:"3px solid #0284c7",paddingBottom:14,marginBottom:14,textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:800,color:"#0369a1"}}>📋 รายงานความดันโลหิต</div>
              {patient.name&&<div style={{fontSize:16,color:"#475569",marginTop:4}}>👤 {patient.name}{patient.phone?`  ·  📞 ${patient.phone}`:""}</div>}
              <div style={{fontSize:14,color:"#94a3b8",marginTop:3}}>{toThai(todayISO())}  ·  {records.length} รายการ  ·  {APP_VERSION}</div>
            </div>
            {records.length===0?<div style={{textAlign:"center",padding:"30px 0",color:"#94a3b8",fontSize:18}}>ยังไม่มีข้อมูล</div>:(
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr>
                    <th style={{border:"1.5px solid #e2e8f0",padding:"7px 8px",background:"#f0f9ff",fontSize:13,textAlign:"left"}}>วันที่</th>
                    <th colSpan={3} style={{border:"1.5px solid #e2e8f0",padding:"7px 4px",background:"#fefce8",fontSize:13,textAlign:"center"}}>🌅 เช้า</th>
                    <th colSpan={3} style={{border:"1.5px solid #e2e8f0",padding:"7px 4px",background:"#eff6ff",fontSize:13,textAlign:"center"}}>🌙 เย็น</th>
                    <th style={{border:"1.5px solid #e2e8f0",padding:"7px 4px",background:"#f0f9ff",fontSize:13,textAlign:"center"}}>สถานะ</th>
                  </tr>
                  <tr>
                    <th style={{border:"1.5px solid #e2e8f0",padding:"4px 8px"}}></th>
                    {["เวลา","ตัวบน","ตัวล่าง","เวลา","ตัวบน","ตัวล่าง"].map((h,i)=>(
                      <th key={i} style={{border:"1.5px solid #e2e8f0",padding:"4px 5px",background:i<3?"#fefce8":"#eff6ff",fontSize:12,fontWeight:600}}>{h}</th>
                    ))}
                    <th style={{border:"1.5px solid #e2e8f0",padding:"4px 5px"}}></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r,i)=>{
                    const ms=bpStatus(r.morningSys,r.morningDia);
                    const es=bpStatus(r.eveningSys,r.eveningDia);
                    const w=rank(ms)>=rank(es)?(ms||es):(es||ms);
                    return(
                      <tr key={r.id} style={{background:i%2===0?"white":"#f8fafc"}}>
                        <td style={{border:"1.5px solid #e2e8f0",padding:"7px 8px",fontWeight:700,fontSize:13,whiteSpace:"nowrap"}}>{toThai(r.date)}</td>
                        <td style={{border:"1.5px solid #e2e8f0",padding:"7px 5px",textAlign:"center",fontSize:12,color:"#92400e"}}>{r.morningTime||"–"}</td>
                        <td style={{border:"1.5px solid #e2e8f0",padding:"7px 5px",textAlign:"center",fontWeight:800,fontSize:15,color:ms?ms.fg:"#1e293b"}}>{r.morningSys||"–"}</td>
                        <td style={{border:"1.5px solid #e2e8f0",padding:"7px 5px",textAlign:"center",fontWeight:700,fontSize:14}}>{r.morningDia||"–"}</td>
                        <td style={{border:"1.5px solid #e2e8f0",padding:"7px 5px",textAlign:"center",fontSize:12,color:"#1d4ed8"}}>{r.eveningTime||"–"}</td>
                        <td style={{border:"1.5px solid #e2e8f0",padding:"7px 5px",textAlign:"center",fontWeight:800,fontSize:15,color:es?es.fg:"#1e293b"}}>{r.eveningSys||"–"}</td>
                        <td style={{border:"1.5px solid #e2e8f0",padding:"7px 5px",textAlign:"center",fontWeight:700,fontSize:14}}>{r.eveningDia||"–"}</td>
                        <td style={{border:"1.5px solid #e2e8f0",padding:"7px 4px",textAlign:"center"}}>{w&&<span style={{...S.badge(w),fontSize:11,padding:"2px 6px"}}>{w.label}</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <div style={{marginTop:12,padding:"8px 12px",background:"#f8fafc",borderRadius:10,display:"flex",flexWrap:"wrap",gap:"5px 14px"}}>
              {[{label:"ปกติ",bg:"#dcfce7",fg:"#166534"},{label:"สูงเล็กน้อย",bg:"#fef9c3",fg:"#854d0e"},{label:"สูงระดับ 1",bg:"#ffedd5",fg:"#9a3412"},{label:"สูงระดับ 2",bg:"#fee2e2",fg:"#991b1b"}].map(s=>(
                <span key={s.label} style={{display:"flex",alignItems:"center",gap:4,fontSize:12}}>
                  <span style={{width:9,height:9,borderRadius:2,background:s.bg,border:`1.5px solid ${s.fg}`,display:"inline-block"}}/>
                  <span style={{color:s.fg,fontWeight:700}}>{s.label}</span>
                </span>
              ))}
            </div>
          </div>
          <div style={{textAlign:"center",fontSize:14,color:"#94a3b8",padding:"0 14px 20px",lineHeight:1.8}}>
            💡 <strong>iOS:</strong> กด "บันทึกเป็นรูปภาพ" → Save Image<br/>
            💡 <strong>Android:</strong> รูปดาวน์โหลดอัตโนมัติ<br/>
            💡 <strong>พิมพ์ A4:</strong> กดปุ่มด้านบน → เลือกเครื่องพิมพ์หรือ Save as PDF
          </div>
        </div>
      )}

      {/* ═══ SETTINGS ═══ */}
      {tab==="settings"&&(
        <div style={{paddingTop:16}}>
          {/* Patient info */}
          <div style={S.card}>
            <div style={{fontWeight:800,fontSize:20,marginBottom:8}}>👤 ข้อมูลของฉัน</div>
            <div style={{fontSize:15,color:"#166534",background:"#f0fdf4",borderRadius:10,padding:"10px 14px",marginBottom:14}}>
              🔒 ข้อมูลเก็บในมือถือนี้เท่านั้น ไม่ปนกับผู้ใช้คนอื่น
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <Input label="ชื่อ-นามสกุล" value={patient.name} onChange={v=>setPatient(p=>({...p,name:v}))} placeholder="กรอกชื่อ-นามสกุล"/>
              <Input label="เบอร์โทรศัพท์" type="tel" value={patient.phone} onChange={v=>setPatient(p=>({...p,phone:v}))} placeholder="0xx-xxx-xxxx"/>
              <button onClick={()=>{lsSet(KEY_PATIENT,patient);toast$("บันทึกข้อมูลแล้ว");}} style={S.btnMain}>บันทึกข้อมูล</button>
            </div>
          </div>

          {/* Trial / Unlock */}
          {!isUnlocked&&(
            <div style={{...S.card,borderLeft:"5px solid #f59e0b",background:"#fffbeb"}}>
              <div style={{fontWeight:800,fontSize:20,marginBottom:6,color:"#92400e"}}>⏳ ระยะทดลองใช้</div>
              <div style={{fontSize:16,color:"#713f12",marginBottom:4}}>
                ใช้ไปแล้ว <strong>{daysUsed} วัน</strong> เหลือ <strong style={{fontSize:22,color:"#ef4444"}}>{trialLeft} วัน</strong>
              </div>
              <div style={{fontSize:14,color:"#78350f",marginBottom:12}}>
                (นับจากวันที่ติดตั้งครั้งแรก {lsRaw(KEY_INSTALL)?toThai(lsRaw(KEY_INSTALL).slice(0,10)):"-"})
              </div>
              {adminCfg.phone&&<div style={{fontSize:15,color:"#92400e",marginBottom:10}}>📞 ติดต่อซื้อ Full Version: <strong>{adminCfg.phone}</strong></div>}
              <button onClick={()=>setShowUpgrade(true)} style={{...S.btnMain,background:"linear-gradient(135deg,#f59e0b,#d97706)"}}>💎 ดูรายละเอียด Full Version</button>
            </div>
          )}
          {isUnlocked&&<div style={{...S.card,borderLeft:"5px solid #22c55e"}}><div style={{fontWeight:800,fontSize:20,color:"#166534"}}>✅ Full Version — ใช้งานได้ไม่จำกัดวัน</div></div>}

          {/* Backup */}
          <div style={{...S.card,borderTop:"4px solid #7c3aed"}}>
            <div style={{fontWeight:800,fontSize:20,marginBottom:6}}>☁️ Backup ข้อมูล</div>
            <div style={{fontSize:14,color:"#64748b",marginBottom:14}}>แนะนำให้ backup ทุกสัปดาห์</div>

            {/* Test */}
            <div style={{background:"#f0f9ff",borderRadius:14,padding:14,marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:16,color:"#0369a1",marginBottom:8}}>🔍 ทดสอบระบบ Backup</div>
              <button onClick={testBackup} style={{...S.btnMain,background:"linear-gradient(135deg,#0369a1,#0284c7)",fontSize:17}}>
                🔍 ทดสอบเชื่อมต่อ
              </button>
              {testResult&&!testResult.testing&&(
                <div style={{marginTop:10,fontSize:14,lineHeight:2}}>
                  <div style={{color:testResult.devOk?"#166534":"#991b1b"}}>{testResult.devOk?"✅":"❌"} Backup เครื่อง: {testResult.devOk?"ใช้ได้":"ไม่สำเร็จ"}</div>
                  <div style={{color:testResult.sheetOk?"#166534":"#991b1b"}}>{testResult.sheetOk?"✅":"❌"} Google Sheets: {testResult.sheetOk?"ใช้ได้":"ไม่สำเร็จ — ตรวจสอบ Apps Script"}</div>
                </div>
              )}
            </div>

            {/* Device backup */}
            <div style={{background:"#faf5ff",borderRadius:14,padding:14,marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:16,color:"#7c3aed",marginBottom:8}}>📥 บันทึกในเครื่อง (.json)</div>
              <button onClick={exportBackup} style={{...S.btnMain,background:"linear-gradient(135deg,#7c3aed,#6d28d9)",fontSize:17}}>
                📥 บันทึกไฟล์สำรอง
              </button>
              {lastBackup&&<div style={{marginTop:8,fontSize:12,color:"#7c3aed",textAlign:"center"}}>🕐 Backup ล่าสุด: {lastBackup}</div>}
            </div>

            {/* Sheet backup */}
            <div style={{background:"#f0fdf4",borderRadius:14,padding:14,marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:16,color:"#059669",marginBottom:8}}>☁️ อัปโหลดขึ้น Google Sheets ({records.length} รายการ)</div>
              <button onClick={backupToSheet} disabled={syncing} style={{...S.btnMain,background:"linear-gradient(135deg,#059669,#047857)",fontSize:17}}>
                {syncing?"⏳ กำลังอัปโหลด...":"☁️ อัปโหลดทั้งหมดขึ้น Sheets"}
              </button>
              {lastSheetSync&&<div style={{marginTop:8,fontSize:12,color:"#059669",textAlign:"center"}}>🕐 Sync ล่าสุด: {lastSheetSync}</div>}
            </div>

            {/* Import */}
            <div style={{background:"#fff7ed",borderRadius:14,padding:14}}>
              <div style={{fontWeight:700,fontSize:16,color:"#c2410c",marginBottom:8}}>📤 นำเข้าข้อมูล (Restore)</div>
              <label style={{...S.btnGhost,display:"block",cursor:"pointer",borderColor:"#c2410c",color:"#c2410c",border:"2px solid #c2410c",borderRadius:12,padding:"15px",textAlign:"center",fontFamily:"Sarabun,sans-serif",fontSize:17,fontWeight:700}}>
                📤 เลือกไฟล์สำรอง (.json)
                <input type="file" accept=".json" onChange={importBackup} style={{display:"none"}}/>
              </label>
            </div>
          </div>

          {/* Google Sheets status — dynamic */}
          {(()=>{
            const cfg = {
              unknown: { border:"#94a3b8", bg:"#f8fafc", dot:"#94a3b8", icon:"⚪", title:"Google Sheets — ยังไม่ได้ทดสอบ", sub:"กดบันทึกข้อมูลหรือทดสอบ Backup เพื่อตรวจสอบ" },
              ok:      { border:"#22c55e", bg:"#f0fdf4", dot:"#22c55e", icon:"🟢", title:"Google Sheets เชื่อมต่อสำเร็จ",   sub:"ข้อมูลซิงค์อัตโนมัติ · Admin ดูได้ใน sheet \"BP_Records\"" },
              error:   { border:"#ef4444", bg:"#fef2f2", dot:"#ef4444", icon:"🔴", title:"Google Sheets เชื่อมต่อไม่ได้",    sub:"ตรวจสอบ Apps Script URL หรือ Deploy ใหม่" },
            }[sheetStatus];
            return (
              <div style={{...S.card,borderLeft:`5px solid ${cfg.border}`,background:cfg.bg}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                  <span style={{fontSize:18}}>{cfg.icon}</span>
                  <div style={{fontWeight:800,fontSize:18,color:sheetStatus==="ok"?"#166534":sheetStatus==="error"?"#991b1b":"#64748b"}}>{cfg.title}</div>
                </div>
                <div style={{fontSize:15,color:"#475569",lineHeight:1.7}}>{cfg.sub}</div>
                {lastSheetSync&&sheetStatus==="ok"&&<div style={{fontSize:12,color:"#22c55e",marginTop:6}}>🕐 Sync ล่าสุด: {lastSheetSync}</div>}
              </div>
            );
          })()}

          {/* Version */}
          <div style={S.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:800,fontSize:18}}>🏷️ เวอร์ชัน {APP_VERSION}</div>
                <div style={{fontSize:15,color:"#64748b",marginTop:4}}>อัปเดต {BUILD_DATE}</div>
                <div style={{fontSize:13,color:"#94a3b8",marginTop:2}}>แตะ version ที่ header 5 ครั้ง = Admin</div>
              </div>
            </div>
          </div>

          {/* Hidden danger zone */}
          <div style={S.card}>
            <button onClick={()=>setShowDeleteZone(v=>!v)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"Sarabun,sans-serif",fontSize:15,color:"#94a3b8",padding:0}}>
              {showDeleteZone?"▲ ซ่อนตัวเลือกขั้นสูง":"▼ แสดงตัวเลือกขั้นสูง"}
            </button>
            {showDeleteZone&&(
              <div style={{marginTop:14,borderTop:"2px dashed #fee2e2",paddingTop:14}}>
                <div style={{fontWeight:800,fontSize:18,marginBottom:6,color:"#ef4444"}}>⚠️ ล้างข้อมูลทั้งหมด</div>
                <div style={{fontSize:14,color:"#64748b",marginBottom:12}}>⚠️ กรุณา backup ก่อน — ไม่สามารถกู้คืนได้</div>
                <button onClick={()=>{if(window.confirm("ยืนยันลบข้อมูลทั้งหมด? ไม่สามารถกู้คืนได้")){setRecords([]);lsSet(KEY_RECORDS,[]);toast$("ล้างข้อมูลแล้ว");}}} style={{width:"100%",padding:15,borderRadius:12,border:"2px solid #ef4444",background:"white",color:"#ef4444",fontSize:18,fontWeight:700,fontFamily:"Sarabun,sans-serif",cursor:"pointer"}}>
                  🗑️ ลบข้อมูลทั้งหมด
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB BAR ═══ */}
      <div style={S.tabBar}>
        {[{id:"home",icon:"🏠",label:"หน้าหลัก"},{id:"record",icon:"➕",label:"บันทึก"},{id:"history",icon:"📋",label:"ประวัติ"},{id:"report",icon:"📸",label:"รายงาน"},{id:"settings",icon:"⚙️",label:"ตั้งค่า"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={S.tabItem(tab===t.id)}>
            <span style={{fontSize:22}}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
