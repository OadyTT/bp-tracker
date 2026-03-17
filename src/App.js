import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "bp-records-v1";
const PATIENT_KEY = "bp-patient-v1";
const SCRIPT_URL  = "https://script.google.com/macros/s/AKfycbxN0gf9mWMF9I4fCazGo4WhyWONrStPMiwuM-Xnc6GZSRk7iXf1V6E_HR5NPPkWB2eZ9w/exec";

const todayISO = () => new Date().toISOString().split("T")[0];
const toThai = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const MONTHS = ["","ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  return `${parseInt(d)} ${MONTHS[parseInt(m)]} ${parseInt(y)+543}`;
};

const BP_LEVELS = ["ปกติ","สูงเล็กน้อย","สูงระดับ 1","สูงระดับ 2"];
const bpStatus = (sys, dia) => {
  const s = parseInt(sys), d = parseInt(dia);
  if (!s || !d) return null;
  if (s < 120 && d < 80) return { label:"ปกติ",         bg:"#dcfce7", fg:"#166534", bar:"#22c55e" };
  if (s < 130 && d < 80) return { label:"สูงเล็กน้อย",  bg:"#fef9c3", fg:"#854d0e", bar:"#eab308" };
  if (s < 140 || d < 90) return { label:"สูงระดับ 1",   bg:"#ffedd5", fg:"#9a3412", bar:"#f97316" };
  return                        { label:"สูงระดับ 2",   bg:"#fee2e2", fg:"#991b1b", bar:"#ef4444" };
};

// localStorage helpers
const lsGet = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch(e) { return fallback; }
};
const lsSet = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
};

const Input = ({ label, value, onChange, type="text", placeholder, unit }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
    <label style={{ fontSize:17, fontWeight:700, color:"#334155" }}>{label}</label>
    <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width:"100%", padding:"15px 16px", borderRadius:12,
          border:"2px solid #cbd5e1", fontSize:21, background:"#f8fafc",
          outline:"none", fontFamily:"Sarabun, sans-serif", color:"#0f172a",
          boxSizing:"border-box", paddingRight: unit ? 56 : 16, fontWeight:600,
        }}
        onFocus={e => e.target.style.borderColor="#0284c7"}
        onBlur={e  => e.target.style.borderColor="#cbd5e1"}
      />
      {unit && <span style={{ position:"absolute", right:14, fontSize:14, color:"#94a3b8", fontWeight:700 }}>{unit}</span>}
    </div>
  </div>
);

export default function App() {
  const [tab,           setTab]           = useState("record");
  const [records,       setRecords]       = useState([]);
  const [patient,       setPatient]       = useState({ name:"", phone:"" });
  const [loaded,        setLoaded]        = useState(false);
  const [toast,         setToast]         = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [capturing,     setCapturing]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const reportRef = useRef(null);

  const [form, setForm] = useState({
    date:todayISO(), morningTime:"", morningSys:"", morningDia:"", morningPulse:"",
    eveningTime:"", eveningSys:"", eveningDia:"", eveningPulse:""
  });

  useEffect(() => {
    setRecords(lsGet(STORAGE_KEY, []));
    setPatient(lsGet(PATIENT_KEY, { name:"", phone:"" }));
    setLoaded(true);
    // load html2canvas
    if (!window._h2cLoaded) {
      window._h2cLoaded = true;
      const sc = document.createElement("script");
      sc.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      document.head.appendChild(sc);
    }
  }, []);

  const toast$ = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null), 3200); };
  const setF   = k => v => setForm(f => ({...f, [k]:v}));
  const rank   = st => st ? BP_LEVELS.indexOf(st.label) : -1;

  // ── Save JPG ──
  const saveJPG = async () => {
    if (!reportRef.current) return;
    if (!window.html2canvas) { toast$("กำลังโหลด กรุณารอแล้วลองใหม่","warn"); return; }
    setCapturing(true);
    try {
      const canvas = await window.html2canvas(reportRef.current, {
        scale: 2.5, useCORS: true, backgroundColor: "#ffffff", logging: false,
      });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.93);
      if (navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `ความดัน_${patient.name||"record"}.jpg`, { type:"image/jpeg" });
        if (navigator.canShare({ files:[file] })) {
          await navigator.share({ files:[file], title:"รายงานความดันโลหิต" });
          toast$("แชร์รูปภาพสำเร็จ ✓");
          setCapturing(false); return;
        }
      }
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `ความดัน_${patient.name||"record"}_${todayISO()}.jpg`;
      a.click();
      toast$("บันทึกรูปภาพแล้ว ✓");
    } catch(err) {
      toast$("เกิดข้อผิดพลาด ลองใหม่","err");
    }
    setCapturing(false);
  };

  // ── Submit ──
  const submit = async () => {
    if (!form.morningSys && !form.eveningSys) { toast$("กรอกค่าความดันอย่างน้อย 1 ช่วง","err"); return; }
    setSaving(true);
    const idx   = records.findIndex(r => r.date === form.date);
    const entry = { ...form, id: idx>=0 ? records[idx].id : Date.now() };
    const next  = idx>=0
      ? records.map((r,i) => i===idx ? entry : r)
      : [...records, entry].sort((a,b)=>a.date.localeCompare(b.date));
    setRecords(next);
    lsSet(STORAGE_KEY, next);

    // sync Google Sheets
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...entry, patientName: patient.name }),
      });
      toast$("บันทึก + ซิงค์ Google Sheets ✓");
    } catch(e) {
      toast$("บันทึกแล้ว (ซิงค์ไม่สำเร็จ)","warn");
    }

    setForm({ date:todayISO(), morningTime:"", morningSys:"", morningDia:"", morningPulse:"", eveningTime:"", eveningSys:"", eveningDia:"", eveningPulse:"" });
    setSaving(false);
    setTab("history");
  };

  const delRecord = id => {
    const next = records.filter(r=>r.id!==id);
    setRecords(next);
    lsSet(STORAGE_KEY, next);
    setDeleteConfirm(null);
    toast$("ลบรายการแล้ว");
  };

  const savePatient = () => {
    lsSet(PATIENT_KEY, patient);
    toast$("บันทึกข้อมูลแล้ว");
  };

  const mStatus = bpStatus(form.morningSys, form.morningDia);
  const eStatus = bpStatus(form.eveningSys, form.eveningDia);

  const S = {
    app:      { fontFamily:"'Sarabun', sans-serif", background:"#f0f9ff", minHeight:"100vh", maxWidth:520, margin:"0 auto", paddingBottom:90 },
    header:   { background:"linear-gradient(135deg,#0284c7,#075985)", padding:"22px 20px 18px", color:"white" },
    card:     { background:"white", borderRadius:18, padding:20, margin:"0 14px 14px", boxShadow:"0 2px 8px rgba(0,0,0,0.07)" },
    grid2:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 },
    secTitle: { fontSize:20, fontWeight:800, marginBottom:16, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" },
    btnMain:  { width:"100%", padding:"18px", background:"linear-gradient(135deg,#0284c7,#075985)", color:"white", border:"none", borderRadius:14, fontSize:20, fontWeight:800, fontFamily:"Sarabun,sans-serif", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 },
    btnGhost: { flex:1, padding:"15px", borderRadius:12, border:"2px solid #0284c7", background:"white", color:"#0284c7", fontSize:18, fontWeight:700, fontFamily:"Sarabun,sans-serif", cursor:"pointer", textAlign:"center" },
    tabBar:   { position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:520, background:"white", borderTop:"2px solid #e2e8f0", display:"flex", zIndex:100 },
    tabItem:  a => ({ flex:1, padding:"10px 4px 8px", border:"none", background:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, color:a?"#0284c7":"#94a3b8", fontFamily:"Sarabun,sans-serif", fontSize:14, fontWeight:a?800:500 }),
    badge:    st => ({ display:"inline-block", padding:"4px 12px", borderRadius:20, fontSize:14, fontWeight:800, background:st.bg, color:st.fg }),
    histCard: { background:"white", borderRadius:16, padding:18, margin:"0 14px 12px", boxShadow:"0 2px 6px rgba(0,0,0,0.07)", borderLeft:"5px solid" },
  };

  if (!loaded) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"Sarabun,sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:52, marginBottom:10 }}>💓</div>
        <div style={{ color:"#64748b", fontSize:22 }}>กำลังโหลด...</div>
      </div>
    </div>
  );

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`
        * { -webkit-tap-highlight-color:transparent; box-sizing:border-box; }
        input[type=number]::-webkit-inner-spin-button { opacity:.4; }
        @media print {
          .no-print { display:none !important; }
          .print-only { display:block !important; }
          @page { size:A4 portrait; margin:15mm; }
          body { background:white; }
        }
        .print-only { display:none; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="no-print" style={{
          position:"fixed", top:18, left:"50%", transform:"translateX(-50%)",
          background: toast.type==="err"?"#ef4444": toast.type==="warn"?"#f59e0b":"#22c55e",
          color:"white", padding:"15px 28px", borderRadius:30, fontSize:18, fontWeight:700,
          zIndex:9999, boxShadow:"0 4px 24px rgba(0,0,0,0.18)", whiteSpace:"nowrap",
        }}>{toast.msg}</div>
      )}

      {/* Delete Modal */}
      {deleteConfirm && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
          <div style={{ background:"white",borderRadius:22,padding:28,width:"100%",maxWidth:340,textAlign:"center" }}>
            <div style={{ fontSize:44, marginBottom:10 }}>🗑️</div>
            <div style={{ fontWeight:800, fontSize:22, marginBottom:6 }}>ลบรายการนี้?</div>
            <div style={{ color:"#64748b", fontSize:18, marginBottom:22 }}>{toThai(deleteConfirm.date)}</div>
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={()=>setDeleteConfirm(null)} style={{ flex:1,padding:16,borderRadius:12,border:"2px solid #e2e8f0",background:"white",fontSize:18,fontFamily:"Sarabun,sans-serif",cursor:"pointer",fontWeight:600 }}>ยกเลิก</button>
              <button onClick={()=>delRecord(deleteConfirm.id)} style={{ flex:1,padding:16,borderRadius:12,border:"none",background:"#ef4444",color:"white",fontSize:18,fontWeight:800,fontFamily:"Sarabun,sans-serif",cursor:"pointer" }}>ลบ</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ PRINT AREA ══ */}
      <div className="print-only" style={{ fontFamily:"Sarabun,sans-serif" }}>
        <div style={{ textAlign:"center", marginBottom:8 }}>
          <div style={{ fontSize:14, fontWeight:800 }}>ตารางบันทึกผลการวัดความดันโลหิตที่บ้าน (Home BP)</div>
        </div>
        <div style={{ display:"flex", gap:30, marginBottom:10, fontSize:12 }}>
          <span>ชื่อ-นามสกุล : <span style={{ borderBottom:"1px solid #000", minWidth:180, display:"inline-block" }}>{patient.name}</span></span>
          <span>โทรศัพท์ : <span style={{ borderBottom:"1px solid #000", minWidth:100, display:"inline-block" }}>{patient.phone}</span></span>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ border:"1px solid #000", padding:"4px 6px", background:"#f5f5f5" }}>วัน เดือน ปี</th>
              <th colSpan={4} style={{ border:"1px solid #000", padding:"4px 6px", background:"#fff9c4" }}>ช่วงเช้า (ก่อนเที่ยง)</th>
              <th colSpan={4} style={{ border:"1px solid #000", padding:"4px 6px", background:"#dbeafe" }}>ช่วงเย็น / กลางคืน</th>
            </tr>
            <tr>
              {["เวลา","ตัวบน","ตัวล่าง","ชีพจร","เวลา","ตัวบน","ตัวล่าง","ชีพจร"].map((h,i)=>(
                <th key={i} style={{ border:"1px solid #000", padding:"3px 5px", background:i<4?"#fefce8":"#eff6ff", fontSize:10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map(r=>(
              <tr key={r.id}>
                <td style={{ border:"1px solid #000", padding:"3px 6px", fontSize:10 }}>{toThai(r.date)}</td>
                {[r.morningTime,r.morningSys,r.morningDia,r.morningPulse,r.eveningTime,r.eveningSys,r.eveningDia,r.eveningPulse].map((v,i)=>(
                  <td key={i} style={{ border:"1px solid #000", padding:"3px 6px", textAlign:"center", fontSize:10, fontWeight:[1,2,5,6].includes(i)?700:400 }}>{v||""}</td>
                ))}
              </tr>
            ))}
            {Array.from({length:Math.max(0,15-records.length)}).map((_,i)=>(
              <tr key={"e"+i}>{Array.from({length:9}).map((_,j)=><td key={j} style={{ border:"1px solid #000", height:20 }}/>)}</tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop:8, fontSize:10 }}>ปกติ: &lt;120/80 mmHg · ชีพจร 60–100 ครั้ง/นาที</div>
      </div>

      {/* ══ SCREEN UI ══ */}
      <div className="no-print">

        {/* Header */}
        <div style={S.header}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:12, opacity:.75, letterSpacing:".1em", textTransform:"uppercase", marginBottom:4 }}>Home BP Tracker</div>
              <div style={{ fontSize:28, fontWeight:800 }}>บันทึกความดันโลหิต</div>
              {patient.name && <div style={{ fontSize:18, opacity:.9, marginTop:3 }}>👤 {patient.name}</div>}
            </div>
            <div style={{ background:"rgba(255,255,255,.2)", borderRadius:14, padding:"8px 16px", textAlign:"center" }}>
              <div style={{ fontSize:30, fontWeight:800, lineHeight:1 }}>{records.length}</div>
              <div style={{ fontSize:13, opacity:.85 }}>รายการ</div>
            </div>
          </div>
        </div>

        {/* ── RECORD ── */}
        {tab==="record" && (
          <div style={{ paddingTop:16 }}>
            <div style={S.card}>
              <Input label="📅  วัน เดือน ปี" type="date" value={form.date} onChange={setF("date")}/>
            </div>

            <div style={{ ...S.card, borderTop:"4px solid #f59e0b" }}>
              <div style={{ ...S.secTitle, color:"#b45309" }}>
                <span style={{ fontSize:26 }}>🌅</span> ช่วงเช้า
                {mStatus && <span style={S.badge(mStatus)}>{mStatus.label}</span>}
              </div>
              <div style={{ marginBottom:14 }}><Input label="เวลา" type="time" value={form.morningTime} onChange={setF("morningTime")}/></div>
              <div style={S.grid2}>
                <Input label="ตัวบน" type="number" value={form.morningSys} onChange={setF("morningSys")} placeholder="120" unit="mmHg"/>
                <Input label="ตัวล่าง" type="number" value={form.morningDia} onChange={setF("morningDia")} placeholder="80" unit="mmHg"/>
              </div>
              <div style={{ marginTop:14 }}>
                <Input label="ชีพจร" type="number" value={form.morningPulse} onChange={setF("morningPulse")} placeholder="75" unit="bpm"/>
              </div>
            </div>

            <div style={{ ...S.card, borderTop:"4px solid #0284c7" }}>
              <div style={{ ...S.secTitle, color:"#0369a1" }}>
                <span style={{ fontSize:26 }}>🌙</span> ช่วงเย็น / กลางคืน
                {eStatus && <span style={S.badge(eStatus)}>{eStatus.label}</span>}
              </div>
              <div style={{ marginBottom:14 }}><Input label="เวลา" type="time" value={form.eveningTime} onChange={setF("eveningTime")}/></div>
              <div style={S.grid2}>
                <Input label="ตัวบน" type="number" value={form.eveningSys} onChange={setF("eveningSys")} placeholder="120" unit="mmHg"/>
                <Input label="ตัวล่าง" type="number" value={form.eveningDia} onChange={setF("eveningDia")} placeholder="80" unit="mmHg"/>
              </div>
              <div style={{ marginTop:14 }}>
                <Input label="ชีพจร" type="number" value={form.eveningPulse} onChange={setF("eveningPulse")} placeholder="75" unit="bpm"/>
              </div>
            </div>

            <div style={{ padding:"0 14px 16px" }}>
              <button onClick={submit} disabled={saving} style={S.btnMain}>
                {saving ? "⏳  กำลังบันทึก..." : "💾  บันทึกความดัน"}
              </button>
            </div>

            <div style={S.card}>
              <div style={{ fontWeight:800, marginBottom:12, fontSize:18 }}>📊 เกณฑ์ระดับความดัน</div>
              {[
                { label:"ปกติ",        range:"< 120/80",      bg:"#dcfce7", fg:"#166534" },
                { label:"สูงเล็กน้อย", range:"120–129/< 80",  bg:"#fef9c3", fg:"#854d0e" },
                { label:"สูงระดับ 1",  range:"130–139/80–89", bg:"#ffedd5", fg:"#9a3412" },
                { label:"สูงระดับ 2",  range:"≥ 140 / ≥ 90",  bg:"#fee2e2", fg:"#991b1b" },
              ].map(s=>(
                <div key={s.label} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <span style={{ ...S.badge(s), minWidth:110, textAlign:"center" }}>{s.label}</span>
                  <span style={{ color:"#475569", fontSize:16 }}>{s.range} mmHg</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab==="history" && (
          <div style={{ paddingTop:16 }}>
            <div style={{ padding:"0 14px 12px", display:"flex", gap:10 }}>
              <button style={S.btnGhost} onClick={()=>setTab("report")}>📸 บันทึกรูป JPG</button>
              <button style={S.btnGhost} onClick={()=>window.print()}>🖨️ พิมพ์ A4</button>
            </div>
            {records.length===0 ? (
              <div style={{ textAlign:"center", padding:"70px 20px", color:"#94a3b8" }}>
                <div style={{ fontSize:60, marginBottom:14 }}>📋</div>
                <div style={{ fontWeight:800, fontSize:22 }}>ยังไม่มีข้อมูล</div>
                <div style={{ fontSize:18, marginTop:6 }}>เริ่มบันทึกความดันได้เลย</div>
              </div>
            ) : (
              [...records].reverse().map(r=>{
                const ms=bpStatus(r.morningSys,r.morningDia);
                const es=bpStatus(r.eveningSys,r.eveningDia);
                const worst = rank(ms)>=rank(es) ? (ms||es) : (es||ms);
                return (
                  <div key={r.id} style={{ ...S.histCard, borderLeftColor: worst?worst.bar:"#e2e8f0" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div>
                        <div style={{ fontWeight:800, fontSize:20 }}>{toThai(r.date)}</div>
                        {worst && <span style={{ ...S.badge(worst), marginTop:5, display:"inline-block" }}>{worst.label}</span>}
                      </div>
                      <button onClick={()=>setDeleteConfirm(r)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:24,color:"#cbd5e1",padding:4 }}>✕</button>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      {r.morningSys && (
                        <div style={{ background:"#fefce8", borderRadius:12, padding:"12px 14px" }}>
                          <div style={{ fontSize:14, color:"#92400e", fontWeight:700, marginBottom:4 }}>🌅 เช้า {r.morningTime && `· ${r.morningTime}`}</div>
                          <div style={{ fontSize:30, fontWeight:800, color:"#0f172a", lineHeight:1.1 }}>
                            {r.morningSys}<span style={{ fontSize:18, fontWeight:600 }}>/{r.morningDia}</span>
                          </div>
                          <div style={{ fontSize:15, color:"#64748b", marginTop:3 }}>💗 {r.morningPulse} bpm</div>
                        </div>
                      )}
                      {r.eveningSys && (
                        <div style={{ background:"#eff6ff", borderRadius:12, padding:"12px 14px" }}>
                          <div style={{ fontSize:14, color:"#1d4ed8", fontWeight:700, marginBottom:4 }}>🌙 เย็น {r.eveningTime && `· ${r.eveningTime}`}</div>
                          <div style={{ fontSize:30, fontWeight:800, color:"#0f172a", lineHeight:1.1 }}>
                            {r.eveningSys}<span style={{ fontSize:18, fontWeight:600 }}>/{r.eveningDia}</span>
                          </div>
                          <div style={{ fontSize:15, color:"#64748b", marginTop:3 }}>💗 {r.eveningPulse} bpm</div>
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
        {tab==="report" && (
          <div style={{ paddingTop:16 }}>
            <div style={{ padding:"0 14px 12px" }}>
              <button
                onClick={saveJPG} disabled={capturing}
                style={{ ...S.btnMain, background:capturing?"#94a3b8":"linear-gradient(135deg,#0f766e,#0d9488)", marginBottom:10 }}
              >
                {capturing ? "⏳ กำลังสร้างรูปภาพ..." : "📸 บันทึกเป็นรูปภาพ (JPG)"}
              </button>
              <button onClick={()=>window.print()} style={{ ...S.btnGhost, width:"100%", display:"block" }}>
                🖨️ พิมพ์ / บันทึก PDF (A4)
              </button>
            </div>

            <div ref={reportRef} style={{ margin:"0 14px 14px", background:"white", borderRadius:18, padding:20, boxShadow:"0 2px 8px rgba(0,0,0,0.07)" }}>
              <div style={{ borderBottom:"3px solid #0284c7", paddingBottom:14, marginBottom:14, textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:800, color:"#0369a1" }}>📋 รายงานความดันโลหิต</div>
                {patient.name && (
                  <div style={{ fontSize:16, color:"#475569", marginTop:4 }}>
                    👤 {patient.name}{patient.phone ? `  ·  📞 ${patient.phone}` : ""}
                  </div>
                )}
                <div style={{ fontSize:14, color:"#94a3b8", marginTop:3 }}>
                  {toThai(todayISO())}  ·  {records.length} รายการ
                </div>
              </div>

              {records.length===0 ? (
                <div style={{ textAlign:"center", padding:"30px 0", color:"#94a3b8", fontSize:18 }}>ยังไม่มีข้อมูล</div>
              ) : (
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ border:"1.5px solid #e2e8f0", padding:"9px 10px", background:"#f0f9ff", fontSize:14, textAlign:"left" }}>วันที่</th>
                      <th colSpan={2} style={{ border:"1.5px solid #e2e8f0", padding:"9px 6px", background:"#fefce8", fontSize:14, textAlign:"center" }}>🌅 เช้า</th>
                      <th colSpan={2} style={{ border:"1.5px solid #e2e8f0", padding:"9px 6px", background:"#eff6ff", fontSize:14, textAlign:"center" }}>🌙 เย็น</th>
                      <th style={{ border:"1.5px solid #e2e8f0", padding:"9px 6px", background:"#f0f9ff", fontSize:14, textAlign:"center" }}>สถานะ</th>
                    </tr>
                    <tr style={{ background:"#f8fafc" }}>
                      <th style={{ border:"1.5px solid #e2e8f0", padding:"5px 10px" }}></th>
                      {["ตัวบน","ตัวล่าง","ตัวบน","ตัวล่าง"].map((h,i)=>(
                        <th key={i} style={{ border:"1.5px solid #e2e8f0", padding:"5px 8px", background:i<2?"#fefce8":"#eff6ff", fontSize:13, fontWeight:600 }}>{h}</th>
                      ))}
                      <th style={{ border:"1.5px solid #e2e8f0", padding:"5px 8px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r,i)=>{
                      const ms=bpStatus(r.morningSys,r.morningDia);
                      const es=bpStatus(r.eveningSys,r.eveningDia);
                      const w = rank(ms)>=rank(es)?(ms||es):(es||ms);
                      return (
                        <tr key={r.id} style={{ background:i%2===0?"white":"#f8fafc" }}>
                          <td style={{ border:"1.5px solid #e2e8f0", padding:"8px 10px", fontWeight:700, fontSize:14, whiteSpace:"nowrap" }}>{toThai(r.date)}</td>
                          <td style={{ border:"1.5px solid #e2e8f0", padding:"8px", textAlign:"center", fontWeight:800, fontSize:17, color:ms?ms.fg:"#1e293b" }}>{r.morningSys||"–"}</td>
                          <td style={{ border:"1.5px solid #e2e8f0", padding:"8px", textAlign:"center", fontWeight:700, fontSize:16 }}>{r.morningDia||"–"}</td>
                          <td style={{ border:"1.5px solid #e2e8f0", padding:"8px", textAlign:"center", fontWeight:800, fontSize:17, color:es?es.fg:"#1e293b" }}>{r.eveningSys||"–"}</td>
                          <td style={{ border:"1.5px solid #e2e8f0", padding:"8px", textAlign:"center", fontWeight:700, fontSize:16 }}>{r.eveningDia||"–"}</td>
                          <td style={{ border:"1.5px solid #e2e8f0", padding:"8px 6px", textAlign:"center" }}>
                            {w && <span style={{ ...S.badge(w), fontSize:12, padding:"3px 8px" }}>{w.label}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              <div style={{ marginTop:14, padding:"10px 14px", background:"#f8fafc", borderRadius:10, display:"flex", flexWrap:"wrap", gap:"6px 16px" }}>
                {[
                  { label:"ปกติ",bg:"#dcfce7",fg:"#166534" },
                  { label:"สูงเล็กน้อย",bg:"#fef9c3",fg:"#854d0e" },
                  { label:"สูงระดับ 1",bg:"#ffedd5",fg:"#9a3412" },
                  { label:"สูงระดับ 2",bg:"#fee2e2",fg:"#991b1b" },
                ].map(s=>(
                  <span key={s.label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:13 }}>
                    <span style={{ width:10, height:10, borderRadius:3, background:s.bg, border:`1.5px solid ${s.fg}`, display:"inline-block" }}/>
                    <span style={{ color:s.fg, fontWeight:700 }}>{s.label}</span>
                  </span>
                ))}
              </div>
            </div>
            <div style={{ textAlign:"center", fontSize:15, color:"#94a3b8", padding:"0 14px 20px", lineHeight:1.8 }}>
              💡 <strong>iOS:</strong> กด "บันทึกเป็นรูปภาพ" → Save Image<br/>
              💡 <strong>Android:</strong> รูปดาวน์โหลดอัตโนมัติ
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab==="settings" && (
          <div style={{ paddingTop:16 }}>
            <div style={S.card}>
              <div style={{ fontWeight:800, fontSize:20, marginBottom:16 }}>👤 ข้อมูลผู้ป่วย</div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <Input label="ชื่อ-นามสกุล" value={patient.name} onChange={v=>setPatient(p=>({...p,name:v}))} placeholder="กรอกชื่อ-นามสกุล"/>
                <Input label="เบอร์โทรศัพท์" type="tel" value={patient.phone} onChange={v=>setPatient(p=>({...p,phone:v}))} placeholder="0xx-xxx-xxxx"/>
                <button onClick={savePatient} style={S.btnMain}>บันทึกข้อมูล</button>
              </div>
            </div>

            {/* Google Sheets status */}
            <div style={{ ...S.card, borderLeft:"5px solid #22c55e" }}>
              <div style={{ fontWeight:800, fontSize:20, marginBottom:8, color:"#166534" }}>✅ Google Sheets เชื่อมต่อแล้ว</div>
              <div style={{ fontSize:15, color:"#475569", lineHeight:1.7, wordBreak:"break-all" }}>
                ข้อมูลจะซิงค์ขึ้น Google Sheets อัตโนมัติทุกครั้งที่กดบันทึก
              </div>
              <div style={{ marginTop:10, background:"#f0fdf4", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#166534", fontFamily:"monospace", wordBreak:"break-all" }}>
                {SCRIPT_URL.slice(0,60)}...
              </div>
            </div>

            <div style={{ ...S.card, borderTop:"4px solid #ef4444" }}>
              <div style={{ fontWeight:800, fontSize:20, marginBottom:12, color:"#ef4444" }}>⚠️ ล้างข้อมูลทั้งหมด</div>
              <button onClick={()=>{
                if (window.confirm("ยืนยันลบข้อมูลทั้งหมด?")) {
                  setRecords([]);
                  lsSet(STORAGE_KEY, []);
                  toast$("ล้างข้อมูลแล้ว");
                }
              }} style={{ width:"100%",padding:15,borderRadius:12,border:"2px solid #ef4444",background:"white",color:"#ef4444",fontSize:19,fontWeight:700,fontFamily:"Sarabun,sans-serif",cursor:"pointer" }}>
                🗑️ ลบข้อมูลทั้งหมด
              </button>
            </div>
          </div>
        )}

        {/* Tab Bar */}
        <div style={S.tabBar}>
          {[
            { id:"record",   icon:"➕", label:"บันทึก" },
            { id:"history",  icon:"📋", label:"ประวัติ" },
            { id:"report",   icon:"📸", label:"รายงาน" },
            { id:"settings", icon:"⚙️", label:"ตั้งค่า" },
          ].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={S.tabItem(tab===t.id)}>
              <span style={{ fontSize:24 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
