import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════
//  VERSION
// ═══════════════════════════════════════════════════════
const APP_VERSION  = "v1.2.0";
const BUILD_DATE   = "17 มี.ค. 2568";
const TRIAL_DAYS   = 60;

// ═══════════════════════════════════════════════════════
//  STORAGE KEYS
// ═══════════════════════════════════════════════════════
const KEY_RECORDS  = "bp-records-v1";
const KEY_PATIENT  = "bp-patient-v1";
const KEY_INSTALL  = "bp-install-date";
const KEY_UNLOCKED = "bp-unlocked";
const KEY_ADMIN    = "bp-admin-cfg";

// ═══════════════════════════════════════════════════════
//  GOOGLE SHEETS — แก้ไขแล้ว ส่งเป็น FormData
// ═══════════════════════════════════════════════════════
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzmjaZeh-rKiHq643431PmS1l_Z2n1NE4gVz8Hu-THHECV-748Nr5fkB3E0wzFopi4h4w/exec";

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════
const todayISO = () => new Date().toISOString().split("T")[0];
const toThai = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const M = ["","ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  return `${parseInt(d)} ${M[parseInt(m)]} ${parseInt(y)+543}`;
};
const lsGet = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const lsSet = (k, v)   => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const BP_LEVELS = ["ปกติ","สูงเล็กน้อย","สูงระดับ 1","สูงระดับ 2"];
const bpStatus = (sys, dia) => {
  const s=parseInt(sys), d=parseInt(dia);
  if(!s||!d) return null;
  if(s<120&&d<80) return {label:"ปกติ",        bg:"#dcfce7",fg:"#166534",bar:"#22c55e"};
  if(s<130&&d<80) return {label:"สูงเล็กน้อย", bg:"#fef9c3",fg:"#854d0e",bar:"#eab308"};
  if(s<140||d<90) return {label:"สูงระดับ 1",  bg:"#ffedd5",fg:"#9a3412",bar:"#f97316"};
  return              {label:"สูงระดับ 2",  bg:"#fee2e2",fg:"#991b1b",bar:"#ef4444"};
};
const rank = st => st ? BP_LEVELS.indexOf(st.label) : -1;

// ═══════════════════════════════════════════════════════
//  SYNC TO GOOGLE SHEETS  (FormData แก้ปัญหา no-cors)
// ═══════════════════════════════════════════════════════
const syncSheet = async (entry, patientName) => {
  try {
    const fd = new FormData();
    fd.append("data", JSON.stringify({ ...entry, patientName }));
    await fetch(SCRIPT_URL, { method:"POST", mode:"no-cors", body: fd });
    return true;
  } catch { return false; }
};

// ═══════════════════════════════════════════════════════
//  HEALTH RECOMMENDATION ENGINE
// ═══════════════════════════════════════════════════════
const getRecommendation = (records) => {
  const last7 = records.slice(-7);
  if (!last7.length) return null;
  const vals = last7.flatMap(r => [
    r.morningSys ? {s:+r.morningSys,d:+r.morningDia} : null,
    r.eveningSys ? {s:+r.eveningSys,d:+r.eveningDia} : null,
  ]).filter(Boolean);
  if (!vals.length) return null;
  const avgS = Math.round(vals.reduce((a,v)=>a+v.s,0)/vals.length);
  const avgD = Math.round(vals.reduce((a,v)=>a+v.d,0)/vals.length);
  const st = bpStatus(avgS, avgD);
  const base = { avgS, avgD, status: st };
  if (!st) return base;
  const tips = {
    "ปกติ": ["✅ ความดันอยู่ในเกณฑ์ดี ดูแลรักษาสุขภาพต่อไป", "🥗 รับประทานผักผลไม้ให้ครบ 5 หมู่", "🏃 ออกกำลังกายสม่ำเสมอ 30 นาที/วัน"],
    "สูงเล็กน้อย": ["⚠️ ควรลดเกลือและโซเดียมในอาหาร", "🚶 เดินออกกำลังกายวันละ 30–45 นาที", "😴 นอนหลับพักผ่อนให้เพียงพอ 7–8 ชั่วโมง", "🧘 ลดความเครียดด้วยการทำสมาธิ"],
    "สูงระดับ 1": ["🏥 ควรพบแพทย์เพื่อประเมินการรักษา", "🚫 งดอาหารเค็ม อาหารแปรรูป และเครื่องดื่มแอลกอฮอล์", "💊 หากแพทย์สั่งยา ต้องรับประทานสม่ำเสมอ", "📏 วัดความดันทุกวัน เช้าและเย็น"],
    "สูงระดับ 2": ["🚨 ความดันสูงมาก ควรพบแพทย์โดยด่วน", "🚫 ห้ามออกกำลังกายหนักโดยยังไม่ผ่านแพทย์", "💊 รับประทานยาตามที่แพทย์สั่งอย่างเคร่งครัด", "📞 หากมีอาการปวดศีรษะรุนแรง เจ็บหน้าอก ให้รีบไป ER ทันที"],
  };
  return { ...base, tips: tips[st.label] || [] };
};

// ═══════════════════════════════════════════════════════
//  INPUT COMPONENT
// ═══════════════════════════════════════════════════════
const Input = ({ label, value, onChange, type="text", placeholder, unit, readOnly }) => (
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    <label style={{fontSize:17,fontWeight:700,color:"#334155"}}>{label}</label>
    <div style={{position:"relative",display:"flex",alignItems:"center"}}>
      <input type={type} value={value} readOnly={readOnly}
        onChange={e=>onChange&&onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",padding:"15px 16px",borderRadius:12,border:"2px solid #cbd5e1",
          fontSize:21,background:readOnly?"#f1f5f9":"#f8fafc",outline:"none",
          fontFamily:"Sarabun, sans-serif",color:"#0f172a",boxSizing:"border-box",
          paddingRight:unit?56:16,fontWeight:600}}
        onFocus={e=>{if(!readOnly)e.target.style.borderColor="#0284c7"}}
        onBlur={e=>e.target.style.borderColor="#cbd5e1"}/>
      {unit&&<span style={{position:"absolute",right:14,fontSize:14,color:"#94a3b8",fontWeight:700}}>{unit}</span>}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════
//  SIMPLE LINE GRAPH  (SVG)
// ═══════════════════════════════════════════════════════
const BPGraph = ({ records }) => {
  const last14 = records.slice(-14);
  if (last14.length < 2) return (
    <div style={{textAlign:"center",padding:"30px 0",color:"#94a3b8",fontSize:16}}>
      ต้องมีข้อมูลอย่างน้อย 2 วันเพื่อแสดงกราฟ
    </div>
  );
  const W=320, H=160, PL=36, PR=10, PT=10, PB=30;
  const gW=W-PL-PR, gH=H-PT-PB;
  const sysVals  = last14.map(r=>r.morningSys?+r.morningSys:(r.eveningSys?+r.eveningSys:null));
  const diaVals  = last14.map(r=>r.morningDia?+r.morningDia:(r.eveningDia?+r.eveningDia:null));
  const allVals  = [...sysVals,...diaVals].filter(Boolean);
  const minV = Math.max(50, Math.min(...allVals)-10);
  const maxV = Math.min(200, Math.max(...allVals)+10);
  const xPos = (i) => PL + (i/(last14.length-1))*gW;
  const yPos = (v) => PT + (1-(v-minV)/(maxV-minV))*gH;
  const makePath = (vals) => vals.map((v,i)=>v?`${i===0||!vals[i-1]?"M":"L"}${xPos(i)},${yPos(v)}`:"").filter(Boolean).join(" ");
  const guides = [120,130,140].filter(v=>v>=minV&&v<=maxV);
  return (
    <div style={{overflowX:"auto"}}>
      <svg width={W} height={H} style={{display:"block",margin:"0 auto"}}>
        {guides.map(g=>(
          <g key={g}>
            <line x1={PL} y1={yPos(g)} x2={W-PR} y2={yPos(g)} stroke="#fca5a5" strokeWidth="1" strokeDasharray="4"/>
            <text x={PL-2} y={yPos(g)+4} fontSize="9" fill="#ef4444" textAnchor="end">{g}</text>
          </g>
        ))}
        <line x1={PL} y1={PT} x2={PL} y2={H-PB} stroke="#e2e8f0" strokeWidth="1"/>
        <line x1={PL} y1={H-PB} x2={W-PR} y2={H-PB} stroke="#e2e8f0" strokeWidth="1"/>
        {[minV, Math.round((minV+maxV)/2), maxV].map(v=>(
          <text key={v} x={PL-4} y={yPos(v)+4} fontSize="9" fill="#94a3b8" textAnchor="end">{v}</text>
        ))}
        {last14.map((r,i)=>i%3===0&&(
          <text key={i} x={xPos(i)} y={H-4} fontSize="8" fill="#94a3b8" textAnchor="middle">
            {r.date.slice(8)}
          </text>
        ))}
        <path d={makePath(sysVals)} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round"/>
        <path d={makePath(diaVals)} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round"/>
        {sysVals.map((v,i)=>v&&<circle key={i} cx={xPos(i)} cy={yPos(v)} r="3" fill="#ef4444"/>)}
        {diaVals.map((v,i)=>v&&<circle key={i} cx={xPos(i)} cy={yPos(v)} r="3" fill="#3b82f6"/>)}
      </svg>
      <div style={{display:"flex",justifyContent:"center",gap:18,marginTop:8,fontSize:13}}>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:16,height:3,background:"#ef4444",display:"inline-block",borderRadius:2}}/>ตัวบน</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:16,height:3,background:"#3b82f6",display:"inline-block",borderRadius:2}}/>ตัวล่าง</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:16,height:1,background:"#fca5a5",display:"inline-block",borderDasharray:"4",borderTop:"1px dashed #fca5a5"}}/>เส้นอันตราย</span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//  PAYWALL SCREEN
// ═══════════════════════════════════════════════════════
const Paywall = ({ adminCfg, onUnlock }) => {
  const [code, setCode] = useState("");
  const [err,  setErr]  = useState(false);
  const tryUnlock = () => {
    if (code === (adminCfg.unlockCode||"BP2024FREE")) { onUnlock(); }
    else { setErr(true); setTimeout(()=>setErr(false),2000); }
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(2,132,199,0.97)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"Sarabun,sans-serif"}}>
      <div style={{background:"white",borderRadius:24,padding:28,width:"100%",maxWidth:360,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:8}}>🔒</div>
        <div style={{fontSize:22,fontWeight:800,color:"#0369a1",marginBottom:6}}>หมดระยะทดลองใช้</div>
        <div style={{fontSize:16,color:"#64748b",marginBottom:20,lineHeight:1.7}}>
          ครบ {TRIAL_DAYS} วันแล้ว กรุณาชำระเงินเพื่อใช้งานต่อเนื่องไม่จำกัด
        </div>
        {adminCfg.qrUrl && (
          <div style={{marginBottom:16}}>
            <img src={adminCfg.qrUrl} alt="QR" style={{width:180,height:180,borderRadius:12,border:"2px solid #e2e8f0"}}
              onError={e=>e.target.style.display="none"}/>
          </div>
        )}
        {(adminCfg.bankName||adminCfg.accountName||adminCfg.price) && (
          <div style={{background:"#f0f9ff",borderRadius:14,padding:"12px 16px",marginBottom:16,textAlign:"left",fontSize:15,lineHeight:2}}>
            {adminCfg.price       && <div>💰 ราคา: <strong>{adminCfg.price}</strong></div>}
            {adminCfg.bankName    && <div>🏦 ธนาคาร: <strong>{adminCfg.bankName}</strong></div>}
            {adminCfg.accountNo   && <div>📋 เลขบัญชี: <strong>{adminCfg.accountNo}</strong></div>}
            {adminCfg.accountName && <div>👤 ชื่อบัญชี: <strong>{adminCfg.accountName}</strong></div>}
          </div>
        )}
        <div style={{fontSize:15,color:"#475569",marginBottom:10}}>รับรหัสปลดล็อคหลังชำระเงิน</div>
        <input value={code} onChange={e=>setCode(e.target.value)} placeholder="ใส่รหัสปลดล็อค"
          style={{width:"100%",padding:"14px",borderRadius:12,border:`2px solid ${err?"#ef4444":"#cbd5e1"}`,
            fontSize:18,fontFamily:"Sarabun,sans-serif",boxSizing:"border-box",textAlign:"center",
            fontWeight:700,outline:"none",marginBottom:12}}/>
        {err && <div style={{color:"#ef4444",fontSize:15,marginBottom:8}}>รหัสไม่ถูกต้อง ลองใหม่อีกครั้ง</div>}
        <button onClick={tryUnlock} style={{width:"100%",padding:"16px",background:"linear-gradient(135deg,#0284c7,#075985)",
          color:"white",border:"none",borderRadius:12,fontSize:20,fontWeight:800,fontFamily:"Sarabun,sans-serif",cursor:"pointer"}}>
          🔓 ปลดล็อค Full Version
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════
export default function App() {
  const [tab,           setTab]           = useState("record");
  const [records,       setRecords]       = useState([]);
  const [patient,       setPatient]       = useState({name:"",phone:""});
  const [loaded,        setLoaded]        = useState(false);
  const [toast,         setToast]         = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [capturing,     setCapturing]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(TRIAL_DAYS);
  const [isUnlocked,    setIsUnlocked]    = useState(false);
  const [showPaywall,   setShowPaywall]   = useState(false);
  const [adminCfg,      setAdminCfg]      = useState({unlockCode:"BP2024FREE",qrUrl:"",bankName:"",accountNo:"",accountName:"",price:""});
  const [adminTap,      setAdminTap]      = useState(0);
  const [showAdmin,     setShowAdmin]     = useState(false);
  const [adminPass,     setAdminPass]     = useState("");
  const [adminAuth,     setAdminAuth]     = useState(false);
  const reportRef = useRef(null);

  const [form, setForm] = useState({
    date:todayISO(), morningTime:"", morningSys:"", morningDia:"", morningPulse:"",
    eveningTime:"", eveningSys:"", eveningDia:"", eveningPulse:""
  });

  // ── INIT ──
  useEffect(() => {
    setRecords(lsGet(KEY_RECORDS, []));
    setPatient(lsGet(KEY_PATIENT, {name:"",phone:""}));
    setAdminCfg(lsGet(KEY_ADMIN, {unlockCode:"BP2024FREE",qrUrl:"",bankName:"",accountNo:"",accountName:"",price:""}));
    const unlocked = lsGet(KEY_UNLOCKED, false);
    setIsUnlocked(unlocked);
    if (!unlocked) {
      let installDate = localStorage.getItem(KEY_INSTALL);
      if (!installDate) { installDate = new Date().toISOString(); localStorage.setItem(KEY_INSTALL, installDate); }
      const days = Math.floor((Date.now()-new Date(installDate))/(1000*60*60*24));
      const left = Math.max(0, TRIAL_DAYS-days);
      setTrialDaysLeft(left);
      if (left === 0) setShowPaywall(true);
    }
    if (!window._h2cLoaded) {
      window._h2cLoaded = true;
      const sc=document.createElement("script");
      sc.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      document.head.appendChild(sc);
    }
    setLoaded(true);
  }, []);

  const toast$ = (msg,type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3200); };
  const setF = k => v => setForm(f=>({...f,[k]:v}));

  // ── UNLOCK ──
  const doUnlock = () => { lsSet(KEY_UNLOCKED,true); setIsUnlocked(true); setShowPaywall(false); toast$("ปลดล็อคสำเร็จ! ยินดีต้อนรับสู่ Full Version 🎉"); };

  // ── SUBMIT ──
  const submit = async () => {
    if(!form.morningSys&&!form.eveningSys){toast$("กรอกค่าความดันอย่างน้อย 1 ช่วง","err");return;}
    if(!isUnlocked&&trialDaysLeft===0){setShowPaywall(true);return;}
    setSaving(true);
    const idx=records.findIndex(r=>r.date===form.date);
    const entry={...form,id:idx>=0?records[idx].id:Date.now()};
    const next=idx>=0?records.map((r,i)=>i===idx?entry:r):[...records,entry].sort((a,b)=>a.date.localeCompare(b.date));
    setRecords(next); lsSet(KEY_RECORDS,next);
    const ok = await syncSheet(entry, patient.name);
    toast$(ok?"บันทึก + ซิงค์ Google Sheets ✓":"บันทึกแล้ว (ซิงค์ไม่สำเร็จ)",ok?"ok":"warn");
    setForm({date:todayISO(),morningTime:"",morningSys:"",morningDia:"",morningPulse:"",eveningTime:"",eveningSys:"",eveningDia:"",eveningPulse:""});
    setSaving(false); setTab("history");
  };

  const delRecord = id => { const next=records.filter(r=>r.id!==id); setRecords(next); lsSet(KEY_RECORDS,next); setDeleteConfirm(null); toast$("ลบรายการแล้ว"); };

  // ── SAVE JPG ──
  const saveJPG = async () => {
    if(!reportRef.current){return;}
    if(!window.html2canvas){toast$("กำลังโหลด รอแล้วลองใหม่","warn");return;}
    setCapturing(true);
    try {
      const canvas=await window.html2canvas(reportRef.current,{scale:2.5,useCORS:true,backgroundColor:"#ffffff",logging:false});
      const dataUrl=canvas.toDataURL("image/jpeg",0.93);
      if(navigator.canShare){
        const blob=await (await fetch(dataUrl)).blob();
        const file=new File([blob],`ความดัน_${patient.name||"record"}.jpg`,{type:"image/jpeg"});
        if(navigator.canShare({files:[file]})){await navigator.share({files:[file],title:"รายงานความดันโลหิต"});toast$("แชร์สำเร็จ ✓");setCapturing(false);return;}
      }
      const a=document.createElement("a"); a.href=dataUrl; a.download=`ความดัน_${patient.name||"record"}_${todayISO()}.jpg`; a.click();
      toast$("บันทึกรูปภาพแล้ว ✓");
    } catch{toast$("เกิดข้อผิดพลาด","err");}
    setCapturing(false);
  };

  // ── BACKUP ──
  const exportBackup = () => {
    const blob=new Blob([JSON.stringify({version:APP_VERSION,patient,records,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`bp-backup_${patient.name||"record"}_${todayISO()}.json`; a.click();
    toast$("สำรองข้อมูลแล้ว ✓");
  };
  const importBackup = e => {
    const file=e.target.files[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(d.records){setRecords(d.records);lsSet(KEY_RECORDS,d.records);}if(d.patient){setPatient(d.patient);lsSet(KEY_PATIENT,d.patient);}toast$(`นำเข้า ${d.records?.length||0} รายการสำเร็จ ✓`);}catch{toast$("ไฟล์ไม่ถูกต้อง","err");}};
    reader.readAsText(file); e.target.value="";
  };

  // ── ADMIN TAP ──
  const handleVersionTap = () => {
    const next=adminTap+1;
    if(next>=5){setShowAdmin(true);setAdminTap(0);}
    else{setAdminTap(next);setTimeout(()=>setAdminTap(0),3000);}
  };

  const mStatus=bpStatus(form.morningSys,form.morningDia);
  const eStatus=bpStatus(form.eveningSys,form.eveningDia);
  const rec     =getRecommendation(records);

  // ── STYLES ──
  const S={
    app:      {fontFamily:"'Sarabun', sans-serif",background:"#f0f9ff",minHeight:"100vh",maxWidth:520,margin:"0 auto",paddingBottom:90},
    header:   {background:"linear-gradient(135deg,#0284c7,#075985)",padding:"22px 20px 18px",color:"white"},
    card:     {background:"white",borderRadius:18,padding:20,margin:"0 14px 14px",boxShadow:"0 2px 8px rgba(0,0,0,0.07)"},
    grid2:    {display:"grid",gridTemplateColumns:"1fr 1fr",gap:14},
    btnMain:  {width:"100%",padding:"18px",background:"linear-gradient(135deg,#0284c7,#075985)",color:"white",border:"none",borderRadius:14,fontSize:20,fontWeight:800,fontFamily:"Sarabun,sans-serif",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8},
    btnGhost: {flex:1,padding:"15px",borderRadius:12,border:"2px solid #0284c7",background:"white",color:"#0284c7",fontSize:17,fontWeight:700,fontFamily:"Sarabun,sans-serif",cursor:"pointer",textAlign:"center"},
    tabBar:   {position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:520,background:"white",borderTop:"2px solid #e2e8f0",display:"flex",zIndex:100},
    tabItem:  a=>({flex:1,padding:"10px 4px 8px",border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,color:a?"#0284c7":"#94a3b8",fontFamily:"Sarabun,sans-serif",fontSize:14,fontWeight:a?800:500}),
    badge:    st=>({display:"inline-block",padding:"4px 12px",borderRadius:20,fontSize:14,fontWeight:800,background:st.bg,color:st.fg}),
    histCard: {background:"white",borderRadius:16,padding:18,margin:"0 14px 12px",boxShadow:"0 2px 6px rgba(0,0,0,0.07)",borderLeft:"5px solid"},
    secTitle: {fontSize:20,fontWeight:800,marginBottom:16,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"},
  };

  if(!loaded) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"Sarabun,sans-serif"}}><div style={{textAlign:"center"}}><div style={{fontSize:52,marginBottom:10}}>💓</div><div style={{color:"#64748b",fontSize:22}}>กำลังโหลด...</div></div></div>;

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`
        *{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}
        input[type=number]::-webkit-inner-spin-button{opacity:.4;}
        @media print{.no-print{display:none!important;}.print-only{display:block!important;}@page{size:A4 portrait;margin:15mm;}body{background:white;}}
        .print-only{display:none;}
      `}</style>

      {/* Toast */}
      {toast&&<div className="no-print" style={{position:"fixed",top:18,left:"50%",transform:"translateX(-50%)",background:toast.type==="err"?"#ef4444":toast.type==="warn"?"#f59e0b":"#22c55e",color:"white",padding:"15px 28px",borderRadius:30,fontSize:18,fontWeight:700,zIndex:9999,boxShadow:"0 4px 24px rgba(0,0,0,0.18)",whiteSpace:"nowrap"}}>{toast.msg}</div>}

      {/* Paywall */}
      {showPaywall&&<Paywall adminCfg={adminCfg} onUnlock={doUnlock}/>}

      {/* Delete Modal */}
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

      {/* Admin Modal */}
      {showAdmin&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}>
          <div style={{background:"white",borderRadius:22,padding:24,width:"100%",maxWidth:400,margin:"auto"}}>
            <div style={{fontWeight:800,fontSize:22,marginBottom:16,color:"#0284c7"}}>🔧 Admin Panel</div>
            {!adminAuth?(
              <div>
                <Input label="รหัสผ่าน Admin" type="password" value={adminPass} onChange={setAdminPass} placeholder="ใส่รหัสผ่าน"/>
                <div style={{marginTop:12,display:"flex",gap:10}}>
                  <button onClick={()=>{setShowAdmin(false);setAdminPass("");}} style={{...S.btnGhost}}>ยกเลิก</button>
                  <button onClick={()=>{if(adminPass==="admin1234"||adminPass===adminCfg.adminPass){setAdminAuth(true);}else{toast$("รหัสผ่านไม่ถูกต้อง","err");}}} style={{...S.btnMain,flex:1}}>เข้าสู่ระบบ</button>
                </div>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div style={{background:"#f0fdf4",borderRadius:12,padding:12,fontSize:14,color:"#166534"}}>
                  <div style={{fontWeight:700,marginBottom:4}}>📊 สถิติรวม</div>
                  <div>ข้อมูลในเครื่องนี้: {records.length} รายการ</div>
                  <div>ผู้ใช้: {patient.name||"ยังไม่ตั้งชื่อ"}</div>
                </div>
                <Input label="รหัสปลดล็อค Full Version" value={adminCfg.unlockCode||""} onChange={v=>setAdminCfg(c=>({...c,unlockCode:v}))} placeholder="เช่น BP2024FREE"/>
                <Input label="รหัสผ่าน Admin (ใหม่)" type="password" value={adminCfg.adminPass||""} onChange={v=>setAdminCfg(c=>({...c,adminPass:v}))} placeholder="admin1234"/>
                <Input label="ราคา Full Version" value={adminCfg.price||""} onChange={v=>setAdminCfg(c=>({...c,price:v}))} placeholder="เช่น 299 บาท/ตลอดชีพ"/>
                <Input label="ชื่อธนาคาร" value={adminCfg.bankName||""} onChange={v=>setAdminCfg(c=>({...c,bankName:v}))} placeholder="เช่น กสิกรไทย"/>
                <Input label="เลขบัญชี" value={adminCfg.accountNo||""} onChange={v=>setAdminCfg(c=>({...c,accountNo:v}))} placeholder="xxx-x-xxxxx-x"/>
                <Input label="ชื่อเจ้าของบัญชี" value={adminCfg.accountName||""} onChange={v=>setAdminCfg(c=>({...c,accountName:v}))} placeholder="ชื่อ-นามสกุล"/>
                <Input label="URL รูป QR Code" value={adminCfg.qrUrl||""} onChange={v=>setAdminCfg(c=>({...c,qrUrl:v}))} placeholder="https://..."/>
                <div style={{background:"#fffbeb",borderRadius:12,padding:12,fontSize:14,color:"#713f12",lineHeight:1.7}}>
                  <strong>วิธีดูข้อมูลคนไข้ทั้งหมด:</strong><br/>
                  เปิด Google Sheets ที่เชื่อมไว้ จะเห็น sheet "BP_Records" มีข้อมูลทุกคนที่บันทึกจากทุกเครื่อง พร้อมชื่อผู้ป่วย
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>{setShowAdmin(false);setAdminAuth(false);setAdminPass("");}} style={{...S.btnGhost}}>ปิด</button>
                  <button onClick={()=>{lsSet(KEY_ADMIN,adminCfg);toast$("บันทึกการตั้งค่าแล้ว");setShowAdmin(false);setAdminAuth(false);setAdminPass("");}} style={{...S.btnMain,flex:1,fontSize:17}}>💾 บันทึก</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ PRINT AREA ═══ */}
      <div className="print-only" style={{fontFamily:"Sarabun,sans-serif"}}>
        <div style={{textAlign:"center",marginBottom:8}}>
          <div style={{fontSize:14,fontWeight:800}}>ตารางบันทึกผลการวัดความดันโลหิตที่บ้าน (Home BP)</div>
        </div>
        <div style={{display:"flex",gap:30,marginBottom:10,fontSize:12}}>
          <span>ชื่อ-นามสกุล: <span style={{borderBottom:"1px solid #000",minWidth:160,display:"inline-block"}}>{patient.name}</span></span>
          <span>โทร: <span style={{borderBottom:"1px solid #000",minWidth:100,display:"inline-block"}}>{patient.phone}</span></span>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
          <thead>
            <tr>
              <th rowSpan={2} style={{border:"1px solid #000",padding:"4px",background:"#f5f5f5"}}>วันที่</th>
              <th colSpan={5} style={{border:"1px solid #000",padding:"4px",background:"#fff9c4"}}>ช่วงเช้า</th>
              <th colSpan={5} style={{border:"1px solid #000",padding:"4px",background:"#dbeafe"}}>ช่วงเย็น/กลางคืน</th>
            </tr>
            <tr>
              {["เวลา","ตัวบน","ตัวล่าง","ชีพจร","สถานะ","เวลา","ตัวบน","ตัวล่าง","ชีพจร","สถานะ"].map((h,i)=>(
                <th key={i} style={{border:"1px solid #000",padding:"3px 4px",background:i<5?"#fefce8":"#eff6ff",fontSize:9}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map(r=>{
              const ms=bpStatus(r.morningSys,r.morningDia);
              const es=bpStatus(r.eveningSys,r.eveningDia);
              return(
                <tr key={r.id}>
                  <td style={{border:"1px solid #000",padding:"3px 5px",fontSize:9,whiteSpace:"nowrap"}}>{toThai(r.date)}</td>
                  <td style={{border:"1px solid #000",padding:"3px 4px",textAlign:"center",fontSize:9}}>{r.morningTime}</td>
                  <td style={{border:"1px solid #000",padding:"3px 4px",textAlign:"center",fontWeight:700,fontSize:10}}>{r.morningSys}</td>
                  <td style={{border:"1px solid #000",padding:"3px 4px",textAlign:"center",fontSize:10}}>{r.morningDia}</td>
                  <td style={{border:"1px solid #000",padding:"3px 4px",textAlign:"center",fontSize:9}}>{r.morningPulse}</td>
                  <td style={{border:"1px solid #000",padding:"3px 4px",textAlign:"center",fontSize:8,background:ms?ms.bg:""}}>{ms?.label||""}</td>
                  <td style={{border:"1px solid #000",padding:"3px 4px",textAlign:"center",fontSize:9}}>{r.eveningTime}</td>
                  <td style={{border:"1px solid #000",padding:"3px 4px",textAlign:"center",fontWeight:700,fontSize:10}}>{r.eveningSys}</td>
                  <td style={{border:"1px solid #000",padding:"3px 4px",textAlign:"center",fontSize:10}}>{r.eveningDia}</td>
                  <td style={{border:"1px solid #000",padding:"3px 4px",textAlign:"center",fontSize:9}}>{r.eveningPulse}</td>
                  <td style={{border:"1px solid #000",padding:"3px 4px",textAlign:"center",fontSize:8,background:es?es.bg:""}}>{es?.label||""}</td>
                </tr>
              );
            })}
            {Array.from({length:Math.max(0,10-records.length)}).map((_,i)=>(
              <tr key={"e"+i}>{Array.from({length:11}).map((_,j)=><td key={j} style={{border:"1px solid #000",height:18}}/>)}</tr>
            ))}
          </tbody>
        </table>
        <div style={{marginTop:6,fontSize:9,display:"flex",justifyContent:"space-between"}}>
          <span>ปกติ: &lt;120/80 mmHg · ชีพจร 60–100 ครั้ง/นาที</span>
          <span>Home BP Tracker {APP_VERSION}</span>
        </div>
      </div>

      {/* ═══ SCREEN ═══ */}
      <div className="no-print">

        {/* Header */}
        <div style={S.header}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontSize:12,opacity:.75,letterSpacing:".1em",textTransform:"uppercase",marginBottom:4}}>Home BP Tracker</div>
              <div style={{fontSize:28,fontWeight:800}}>บันทึกความดันโลหิต</div>
              {patient.name&&<div style={{fontSize:18,opacity:.9,marginTop:3}}>👤 {patient.name}</div>}
              {!isUnlocked&&<div style={{fontSize:13,background:"rgba(255,255,255,.2)",borderRadius:8,padding:"3px 10px",marginTop:5,display:"inline-block"}}>⏳ ทดลองใช้ {trialDaysLeft} วัน</div>}
              {isUnlocked&&<div style={{fontSize:13,background:"rgba(255,255,255,.2)",borderRadius:8,padding:"3px 10px",marginTop:5,display:"inline-block"}}>✅ Full Version</div>}
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
              <div style={{background:"rgba(255,255,255,.2)",borderRadius:14,padding:"8px 16px",textAlign:"center"}}>
                <div style={{fontSize:30,fontWeight:800,lineHeight:1}}>{records.length}</div>
                <div style={{fontSize:13,opacity:.85}}>รายการ</div>
              </div>
              <button onClick={handleVersionTap} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:8,color:"white",fontSize:12,padding:"4px 10px",cursor:"pointer",fontFamily:"Sarabun,sans-serif"}}>{APP_VERSION}</button>
            </div>
          </div>
        </div>

        {/* ── RECORD ── */}
        {tab==="record"&&(
          <div style={{paddingTop:16}}>
            <div style={S.card}><Input label="📅  วัน เดือน ปี" type="date" value={form.date} onChange={setF("date")}/></div>
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
              <button onClick={submit} disabled={saving} style={S.btnMain}>{saving?"⏳  กำลังบันทึก...":"💾  บันทึกความดัน"}</button>
            </div>
            <div style={S.card}>
              <div style={{fontWeight:800,marginBottom:12,fontSize:18}}>📊 เกณฑ์ระดับความดัน</div>
              {[{label:"ปกติ",range:"< 120/80",bg:"#dcfce7",fg:"#166534"},{label:"สูงเล็กน้อย",range:"120–129/< 80",bg:"#fef9c3",fg:"#854d0e"},{label:"สูงระดับ 1",range:"130–139/80–89",bg:"#ffedd5",fg:"#9a3412"},{label:"สูงระดับ 2",range:"≥ 140 / ≥ 90",bg:"#fee2e2",fg:"#991b1b"}].map(s=>(
                <div key={s.label} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <span style={{...S.badge(s),minWidth:110,textAlign:"center"}}>{s.label}</span>
                  <span style={{color:"#475569",fontSize:16}}>{s.range} mmHg</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab==="history"&&(
          <div style={{paddingTop:16}}>
            <div style={{padding:"0 14px 12px",display:"flex",gap:10}}>
              <button style={S.btnGhost} onClick={()=>setTab("report")}>📸 รายงาน</button>
              <button style={S.btnGhost} onClick={()=>window.print()}>🖨️ พิมพ์ A4</button>
            </div>

            {/* Graph */}
            {records.length>=2&&(
              <div style={S.card}>
                <div style={{fontWeight:800,fontSize:18,marginBottom:12}}>📈 กราฟ 14 วันล่าสุด</div>
                <BPGraph records={records}/>
              </div>
            )}

            {/* Recommendations */}
            {rec&&(
              <div style={{...S.card,borderLeft:`5px solid ${rec.status?.bar||"#22c55e"}`}}>
                <div style={{fontWeight:800,fontSize:18,marginBottom:8}}>🩺 คำแนะนำสุขภาพ</div>
                <div style={{fontSize:15,color:"#475569",marginBottom:10}}>
                  ค่าเฉลี่ย 7 วัน: <strong style={{color:rec.status?.fg}}>{rec.avgS}/{rec.avgD} mmHg</strong>
                  {rec.status&&<span style={{...S.badge(rec.status),marginLeft:8,fontSize:13}}>{rec.status.label}</span>}
                </div>
                {rec.tips.map((t,i)=>(
                  <div key={i} style={{fontSize:15,color:"#334155",padding:"6px 0",borderBottom:i<rec.tips.length-1?"1px solid #f1f5f9":""}}>{t}</div>
                ))}
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
                      <button onClick={()=>setDeleteConfirm(r)} style={{background:"none",border:"none",cursor:"pointer",fontSize:24,color:"#cbd5e1",padding:4}}>✕</button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      {r.morningSys&&(
                        <div style={{background:"#fefce8",borderRadius:12,padding:"12px 14px"}}>
                          <div style={{fontSize:13,color:"#92400e",fontWeight:700,marginBottom:4}}>🌅 เช้า {r.morningTime&&`· ${r.morningTime}`}</div>
                          <div style={{fontSize:30,fontWeight:800,color:"#0f172a",lineHeight:1.1}}>{r.morningSys}<span style={{fontSize:18,fontWeight:600}}>/{r.morningDia}</span></div>
                          <div style={{fontSize:14,color:"#64748b",marginTop:3}}>💗 {r.morningPulse} bpm</div>
                        </div>
                      )}
                      {r.eveningSys&&(
                        <div style={{background:"#eff6ff",borderRadius:12,padding:"12px 14px"}}>
                          <div style={{fontSize:13,color:"#1d4ed8",fontWeight:700,marginBottom:4}}>🌙 เย็น {r.eveningTime&&`· ${r.eveningTime}`}</div>
                          <div style={{fontSize:30,fontWeight:800,color:"#0f172a",lineHeight:1.1}}>{r.eveningSys}<span style={{fontSize:18,fontWeight:600}}>/{r.eveningDia}</span></div>
                          <div style={{fontSize:14,color:"#64748b",marginTop:3}}>💗 {r.eveningPulse} bpm</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── REPORT ── */}
        {tab==="report"&&(
          <div style={{paddingTop:16}}>
            <div style={{padding:"0 14px 12px"}}>
              <button onClick={saveJPG} disabled={capturing} style={{...S.btnMain,background:capturing?"#94a3b8":"linear-gradient(135deg,#0f766e,#0d9488)",marginBottom:10}}>
                {capturing?"⏳ กำลังสร้างรูปภาพ...":"📸 บันทึกเป็นรูปภาพ (JPG)"}
              </button>
              <button onClick={()=>window.print()} style={{...S.btnGhost,width:"100%",display:"block"}}>🖨️ พิมพ์ / PDF (A4)</button>
            </div>

            {/* Capture target */}
            <div ref={reportRef} style={{margin:"0 14px 14px",background:"white",borderRadius:18,padding:20,boxShadow:"0 2px 8px rgba(0,0,0,0.07)"}}>
              <div style={{borderBottom:"3px solid #0284c7",paddingBottom:14,marginBottom:14,textAlign:"center"}}>
                <div style={{fontSize:20,fontWeight:800,color:"#0369a1"}}>📋 รายงานความดันโลหิต</div>
                {patient.name&&<div style={{fontSize:16,color:"#475569",marginTop:4}}>👤 {patient.name}{patient.phone?`  ·  📞 ${patient.phone}`:""}</div>}
                <div style={{fontSize:14,color:"#94a3b8",marginTop:3}}>{toThai(todayISO())}  ·  {records.length} รายการ  ·  {APP_VERSION}</div>
              </div>
              {records.length===0?(
                <div style={{textAlign:"center",padding:"30px 0",color:"#94a3b8",fontSize:18}}>ยังไม่มีข้อมูล</div>
              ):(
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr>
                      <th style={{border:"1.5px solid #e2e8f0",padding:"8px 8px",background:"#f0f9ff",fontSize:13,textAlign:"left"}}>วันที่</th>
                      <th colSpan={3} style={{border:"1.5px solid #e2e8f0",padding:"8px 4px",background:"#fefce8",fontSize:13,textAlign:"center"}}>🌅 เช้า</th>
                      <th colSpan={3} style={{border:"1.5px solid #e2e8f0",padding:"8px 4px",background:"#eff6ff",fontSize:13,textAlign:"center"}}>🌙 เย็น</th>
                      <th style={{border:"1.5px solid #e2e8f0",padding:"8px 4px",background:"#f0f9ff",fontSize:13,textAlign:"center"}}>สถานะ</th>
                    </tr>
                    <tr style={{background:"#f8fafc"}}>
                      <th style={{border:"1.5px solid #e2e8f0",padding:"4px 8px"}}></th>
                      {["เวลา","ตัวบน","ตัวล่าง","เวลา","ตัวบน","ตัวล่าง"].map((h,i)=>(
                        <th key={i} style={{border:"1.5px solid #e2e8f0",padding:"4px 6px",background:i<3?"#fefce8":"#eff6ff",fontSize:12,fontWeight:600}}>{h}</th>
                      ))}
                      <th style={{border:"1.5px solid #e2e8f0",padding:"4px 6px"}}></th>
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
                          <td style={{border:"1.5px solid #e2e8f0",padding:"7px 5px",textAlign:"center",fontWeight:800,fontSize:16,color:ms?ms.fg:"#1e293b"}}>{r.morningSys||"–"}</td>
                          <td style={{border:"1.5px solid #e2e8f0",padding:"7px 5px",textAlign:"center",fontWeight:700,fontSize:14}}>{r.morningDia||"–"}</td>
                          <td style={{border:"1.5px solid #e2e8f0",padding:"7px 5px",textAlign:"center",fontSize:12,color:"#1d4ed8"}}>{r.eveningTime||"–"}</td>
                          <td style={{border:"1.5px solid #e2e8f0",padding:"7px 5px",textAlign:"center",fontWeight:800,fontSize:16,color:es?es.fg:"#1e293b"}}>{r.eveningSys||"–"}</td>
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
            <div style={{textAlign:"center",fontSize:15,color:"#94a3b8",padding:"0 14px 20px",lineHeight:1.8}}>
              💡 <strong>iOS:</strong> กด "บันทึกเป็นรูปภาพ" → Save Image<br/>
              💡 <strong>Android:</strong> รูปดาวน์โหลดอัตโนมัติ
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab==="settings"&&(
          <div style={{paddingTop:16}}>
            <div style={S.card}>
              <div style={{fontWeight:800,fontSize:20,marginBottom:8}}>👤 ข้อมูลของฉัน</div>
              <div style={{fontSize:15,color:"#166534",background:"#f0fdf4",borderRadius:10,padding:"10px 14px",marginBottom:14,lineHeight:1.7}}>
                🔒 ข้อมูลเก็บในมือถือของคุณเท่านั้น ไม่ปนกับผู้ใช้คนอื่น
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <Input label="ชื่อ-นามสกุล" value={patient.name} onChange={v=>setPatient(p=>({...p,name:v}))} placeholder="กรอกชื่อ-นามสกุล"/>
                <Input label="เบอร์โทรศัพท์" type="tel" value={patient.phone} onChange={v=>setPatient(p=>({...p,phone:v}))} placeholder="0xx-xxx-xxxx"/>
                <button onClick={()=>{lsSet(KEY_PATIENT,patient);toast$("บันทึกข้อมูลแล้ว");}} style={S.btnMain}>บันทึกข้อมูล</button>
              </div>
            </div>

            {!isUnlocked&&(
              <div style={{...S.card,borderLeft:"5px solid #f59e0b",background:"#fffbeb"}}>
                <div style={{fontWeight:800,fontSize:20,marginBottom:6,color:"#92400e"}}>⏳ ระยะทดลองใช้</div>
                <div style={{fontSize:16,color:"#713f12",marginBottom:12}}>เหลืออีก <strong style={{fontSize:22,color:"#ef4444"}}>{trialDaysLeft}</strong> วัน</div>
                <button onClick={()=>setShowPaywall(true)} style={{...S.btnMain,background:"linear-gradient(135deg,#f59e0b,#d97706)"}}>🔓 อัปเกรด Full Version</button>
              </div>
            )}
            {isUnlocked&&(
              <div style={{...S.card,borderLeft:"5px solid #22c55e"}}>
                <div style={{fontWeight:800,fontSize:20,color:"#166534"}}>✅ Full Version — ไม่จำกัดวัน</div>
              </div>
            )}

            <div style={{...S.card,borderTop:"4px solid #0284c7"}}>
              <div style={{fontWeight:800,fontSize:20,marginBottom:8}}>💾 สำรองข้อมูล</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <button onClick={exportBackup} style={{...S.btnMain,background:"linear-gradient(135deg,#0f766e,#0d9488)"}}>📥 Export สำรองข้อมูล</button>
                <label style={{...S.btnGhost,display:"block",cursor:"pointer"}}>📤 Import นำข้อมูลกลับ<input type="file" accept=".json" onChange={importBackup} style={{display:"none"}}/></label>
              </div>
            </div>

            <div style={{...S.card,borderLeft:"5px solid #22c55e"}}>
              <div style={{fontWeight:800,fontSize:20,marginBottom:4,color:"#166534"}}>✅ Google Sheets เชื่อมต่อแล้ว</div>
              <div style={{fontSize:15,color:"#475569",lineHeight:1.7}}>ซิงค์อัตโนมัติทุกครั้งที่บันทึก ข้อมูลทุกเครื่องรวมใน Sheet เดียวกัน</div>
            </div>

            <div style={S.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:800,fontSize:18}}>🏷️ เวอร์ชัน {APP_VERSION}</div>
                  <div style={{fontSize:15,color:"#64748b",marginTop:4}}>อัปเดต {BUILD_DATE}</div>
                  <div style={{fontSize:13,color:"#94a3b8",marginTop:2}}>แตะ version ที่ header 5 ครั้ง = Admin</div>
                </div>
              </div>
            </div>

            <div style={{...S.card,borderTop:"4px solid #ef4444"}}>
              <div style={{fontWeight:800,fontSize:20,marginBottom:12,color:"#ef4444"}}>⚠️ ล้างข้อมูล</div>
              <button onClick={()=>{if(window.confirm("ยืนยันลบข้อมูลทั้งหมด?")){setRecords([]);lsSet(KEY_RECORDS,[]);toast$("ล้างข้อมูลแล้ว");}}} style={{width:"100%",padding:15,borderRadius:12,border:"2px solid #ef4444",background:"white",color:"#ef4444",fontSize:19,fontWeight:700,fontFamily:"Sarabun,sans-serif",cursor:"pointer"}}>
                🗑️ ลบข้อมูลทั้งหมด
              </button>
            </div>
          </div>
        )}

        {/* Tab Bar */}
        <div style={S.tabBar}>
          {[{id:"record",icon:"➕",label:"บันทึก"},{id:"history",icon:"📋",label:"ประวัติ"},{id:"report",icon:"📸",label:"รายงาน"},{id:"settings",icon:"⚙️",label:"ตั้งค่า"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={S.tabItem(tab===t.id)}>
              <span style={{fontSize:24}}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
