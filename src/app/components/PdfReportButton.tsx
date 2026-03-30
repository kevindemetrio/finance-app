"use client";

import { useState } from "react";
import { CategoryBudget, MonthData } from "../lib/data";
import { toast } from "./Toast";

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const PALETTE = ["#E24B4A","#1D9E75","#378ADD","#BA7517","#7F77DD","#D85A30","#D4537E","#639922","#00838F","#888780"];

function hex(h: string): [number,number,number] {
  if (!h || h.length < 7) return [80, 80, 80];
  const r = parseInt(h.slice(1,3),16);
  const g = parseInt(h.slice(3,5),16);
  const b = parseInt(h.slice(5,7),16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return [80, 80, 80];
  return [r, g, b];
}

// Safe color setters using CSS hex string — works in all jsPDF versions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setFill(d: any, h: string) { d.setFillColor(h || "#505050"); }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setDraw(d: any, h: string) { d.setDrawColor(h || "#505050"); }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setTxt(d: any, h: string) { d.setTextColor(h || "#323232"); }

interface Props {
  year: number;
  month: number;
  data: MonthData;
  totalSavings: number;
  categoryBudgets: CategoryBudget[];
  carryover: number;
  disabled?: boolean;
}

export function PdfReportButton({ year, month, data, totalSavings, categoryBudgets, carryover, disabled }: Props) {
  const [loading, setLoading] = useState(false);

  async function generatePdf() {
    if (disabled) {
      toast("Actualiza tu plan para exportar PDF", "info");
      return;
    }
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
      const W=210, H=297, mg=14, cW=W-mg*2;
      let y=0;

      const fmtN = (n: number) =>
        Math.abs(n).toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";

      // ── page management ───────────────────────────────────────────────────
      function newPage() {
        doc.addPage(); y=mg;
        setFill(doc,"#1D9E75"); doc.rect(0,0,W,1.2,"F");
      }
      function sp(n: number) { if(y+n>H-mg-10) newPage(); }

      // ── typography helpers ────────────────────────────────────────────────
      function title(t: string, colorHex="#1e3a5f") {
        sp(20);
        // Subtle full-width separator line
        setDraw(doc,"#e8e8e8"); doc.setLineWidth(0.4);
        doc.line(mg, y, W-mg, y);
        y+=7;
        // Left accent bar + title
        setFill(doc,colorHex); doc.rect(mg,y,2.5,8,"F");
        doc.setFontSize(12); doc.setFont("helvetica","bold"); setTxt(doc, colorHex);
        doc.text(t, mg+7, y+6); y+=14;
      }
      function label(t: string, colorHex="#555555") {
        doc.setFontSize(7); doc.setFont("helvetica","normal"); setTxt(doc, colorHex);
        doc.text(t,mg,y);
      }

      // ── metric box ────────────────────────────────────────────────────────
      function metricBox(bx:number,by:number,bw:number,bh:number,lbl:string,val:string,colorHex:string) {
        setFill(doc,"#f7fcf7"); setDraw(doc, colorHex); doc.setLineWidth(0.3);
        doc.roundedRect(bx,by,bw,bh,2,2,"FD");
        doc.setFontSize(6.5); doc.setFont("helvetica","normal"); setTxt(doc,"#788278");
        doc.text(lbl.toUpperCase(),bx+3,by+6);
        doc.setFontSize(10); doc.setFont("helvetica","bold"); setTxt(doc, colorHex);
        doc.text(val,bx+3,by+14);
      }

      // ── horizontal percentage bar ─────────────────────────────────────────
      function bar(lbl:string, spent:number, total:number, colorHex:string) {
        sp(9);
        const maxW=cW-48;
        const pct=total>0?Math.min(spent/total,1):0;
        doc.setFontSize(7.5); doc.setFont("helvetica","normal"); setTxt(doc,"#323232");
        doc.text(lbl.length>18?lbl.slice(0,17)+"…":lbl, mg, y+4);
        setFill(doc,"#e4e4e4"); doc.rect(mg+36,y,maxW,4.5,"F");
        if(pct>0){ setFill(doc, colorHex); doc.rect(mg+36,y,pct*maxW,4.5,"F"); }
        doc.setFontSize(7.5); doc.setFont("helvetica","bold"); setTxt(doc, colorHex);
        doc.text(fmtN(spent),W-mg,y+4,{align:"right"});
        if(total>0){
          doc.setFontSize(6.5); doc.setFont("helvetica","normal"); setTxt(doc,"#828282");
          doc.text(`${Math.round(pct*100)}%`,mg+36+maxW+2,y+4);
        }
        y+=9;
      }

      // ── row in a table ────────────────────────────────────────────────────
      type Col = {t:string;x:number;c?:string;b?:boolean;a?:"right"|"left"};
      function row(cols:Col[], idx:number) {
        sp(7);
        if(idx%2===0){ setFill(doc,"#fafafa"); doc.rect(mg,y-0.5,cW,6.5,"F"); }
        for(const c of cols){
          doc.setFontSize(7.5); doc.setFont("helvetica",c.b?"bold":"normal");
          setTxt(doc, c.c || "#282828");
          doc.text(c.t,c.x,y+4.5,{align:c.a||"left"});
        }
        y+=9;
      }
      function rowHeader(cols:{t:string;x:number;a?:"right"|"left"}[]) {
        sp(7);
        setFill(doc,"#eef4ee"); doc.rect(mg,y,cW,6,"F");
        doc.setFontSize(6.5); doc.setFont("helvetica","bold"); setTxt(doc,"#5a6e5a");
        for(const c of cols) doc.text(c.t,c.x,y+4.5,{align:c.a||"left"});
        y+=7;
      }

      // ── pie chart using only doc.rect slices (safe) ───────────────────────
      // Draw as a segmented square bar (100% = full width) — safe & always works
      function pieBar(items:{label:string;amount:number;color:string}[], total:number) {
        sp(22);
        const barH=8;
        let bx=mg;
        for(const it of items){
          if(it.amount<=0) continue;
          const w=Math.max((it.amount/total)*cW,0.5);
          setFill(doc,it.color); doc.rect(bx,y,w,barH,"F");
          bx+=w;
        }
        y+=barH+2;
        // legend: two columns
        const cols=2, legW=cW/cols;
        items.forEach((it,i)=>{
          if(it.amount<=0) return;
          const col=i%cols, row2=Math.floor(i/cols);
          const lx=mg+col*legW, ly=y+row2*8;
          setFill(doc,it.color); doc.rect(lx,ly+1,5,3.5,"F");
          doc.setFontSize(7); doc.setFont("helvetica","normal"); setTxt(doc,"#373737");
          const lbl=it.label.length>16?it.label.slice(0,15)+"…":it.label;
          doc.text(lbl,lx+7,ly+4.5);
          doc.setFont("helvetica","bold"); setTxt(doc, it.color || "#282828");
          doc.text(fmtN(it.amount),lx+legW-2,ly+4.5,{align:"right"});
          doc.setFontSize(6.5); doc.setFont("helvetica","normal"); setTxt(doc,"#969696");
          doc.text(`${Math.round((it.amount/total)*100)}%`,lx+legW-2,ly+9,{align:"right"});
        });
        const rows=Math.ceil(items.filter(i=>i.amount>0).length/cols);
        y+=rows*8+4;
      }

      // ════════════════════════════════════════════════════════════════════════
      // PORTADA
      // ════════════════════════════════════════════════════════════════════════
      setFill(doc,"#1D9E75"); doc.rect(0,0,W,44,"F");
      // logo box (no circle API needed)
      setFill(doc,"#ffffff"); setDraw(doc,"#ffffff"); doc.setLineWidth(0.5);
      doc.roundedRect(mg+1,15,14,14,3,3,"S");
      doc.setFontSize(11); doc.setFont("helvetica","bold"); setTxt(doc,"#ffffff");
      doc.text("€",mg+8,25.5,{align:"center"});
      doc.setFontSize(21); doc.setFont("helvetica","bold"); setTxt(doc,"#ffffff");
      doc.text("Finanzas",mg+21,18);
      doc.setFontSize(10); doc.setFont("helvetica","normal");
      doc.text(`Informe mensual · ${MONTH_NAMES[month]} ${year}`,mg+21,27);
      doc.setFontSize(7.5);
      doc.text(`Generado el ${new Date().toLocaleDateString("es-ES")}`,W-mg,27,{align:"right"});
      y=54;

      // ════════════════════════════════════════════════════════════════════════
      // RESUMEN
      // ════════════════════════════════════════════════════════════════════════
      const inc=data.incomes.reduce((a,i)=>a+i.amount,0);
      const fix=data.fixedExpenses.reduce((a,i)=>a+i.amount,0);
      const paidFix=data.fixedExpenses.filter(e=>e.paid).reduce((a,i)=>a+i.amount,0);
      const vr=data.varExpenses.filter(e=>e.paid!==false).reduce((a,i)=>a+i.amount,0);
      const sav=data.savingsEntries.reduce((a,i)=>a+i.amount,0);
      const bal=inc+carryover-paidFix-vr-sav;

      title("Resumen del mes","#1D9E75");

      const mets=[
        {l:"Ingresos",     v:fmtN(inc),                             c:"#1D9E75"},
        {l:"Gastos fijos", v:fmtN(fix),                             c:"#BA7517"},
        {l:"Gastos variables", v:fmtN(vr),                           c:"#E24B4A"},
        {l:"Ahorros",      v:fmtN(sav),                             c:"#378ADD"},
        {l:"Balance",      v:(bal>=0?"+ ":"- ")+fmtN(Math.abs(bal)),c:bal>=0?"#1D9E75":"#E24B4A"},
        {l:"Ahorro total", v:fmtN(totalSavings),                    c:"#378ADD"},
      ];
      // Add carryover note below metrics if present
      const mw=(cW-10)/3, mh=18;
      mets.forEach((m,i)=>{
        metricBox(mg+i%3*(mw+5), y+Math.floor(i/3)*(mh+4), mw, mh, m.l, m.v, m.c);
      });
      y+=mh*2+4+14;
      if(carryover>0){
        sp(10);
        setFill(doc,"#f0faf0"); doc.rect(mg,y,cW,8,"F");
        doc.setFontSize(7.5); doc.setFont("helvetica","normal"); setTxt(doc,"#2d6a1e");
        doc.text(`Incluye arrastre del mes anterior: +${fmtN(carryover)}`,mg+3,y+5.5);
        y+=12;
      } else {
        y+=2;
      }

      // Distribution bar
      if(inc>0 || carryover>0){
        sp(26);
        const totalAvailable = inc + carryover;
        doc.setFontSize(8); doc.setFont("helvetica","normal"); setTxt(doc,"#505050");
        doc.text("Distribución del dinero disponible",mg,y); y+=5;
        pieBar([
          ...(carryover>0?[{label:"Arrastre anterior",amount:carryover,color:"#4a9a28"}]:[]),
          {label:"Gastos fijos", amount:fix, color:"#BA7517"},
          {label:"Gastos variables", amount:vr, color:"#E24B4A"},
          {label:"Ahorros",      amount:sav, color:"#378ADD"},
          {label:"Balance libre",amount:Math.max(bal,0),color:"#1D9E75"},
        ], totalAvailable);
      }

      // ════════════════════════════════════════════════════════════════════════
      // INGRESOS
      // ════════════════════════════════════════════════════════════════════════
      sp(28); title("Ingresos","#1D9E75");
      if(data.incomes.length>0){
        pieBar(data.incomes.map((e,i)=>({label:e.name,amount:e.amount,color:PALETTE[i%PALETTE.length]})), inc);
        sp(12);
        rowHeader([{t:"CONCEPTO",x:mg+2},{t:"FECHA",x:mg+cW*0.65},{t:"IMPORTE",x:W-mg-2,a:"right"}]);
        data.incomes.sort((a,b)=>(b.date||"").localeCompare(a.date||"")).forEach((e,i)=>{
          row([
            {t:e.name.length>38?e.name.slice(0,37)+"…":e.name,x:mg+2},
            {t:e.date?e.date.split("-").reverse().slice(0,2).join("/"):"",x:mg+cW*0.65,c:"#888"},
            {t:"+"+fmtN(e.amount),x:W-mg-2,a:"right",c:"#1D9E75",b:true},
          ],i);
        });
      } else { doc.setFontSize(8); setTxt(doc,"#a0a0a0"); doc.text("Sin ingresos",mg,y+4); y+=10; }

      // ════════════════════════════════════════════════════════════════════════
      // AHORROS
      // ════════════════════════════════════════════════════════════════════════
      sp(28); title("Ahorros","#378ADD");
      if(data.savingsEntries.length>0){
        pieBar(data.savingsEntries.map((e,i)=>({label:e.name,amount:e.amount,color:PALETTE[i%PALETTE.length]})), sav);
        sp(10);
        setFill(doc,"#e6f3ff"); doc.rect(mg,y,cW,9,"F");
        doc.setFontSize(8); doc.setFont("helvetica","normal"); setTxt(doc,"#1e50a0");
        doc.text("Total ahorrado acumulado:",mg+3,y+6);
        doc.setFont("helvetica","bold"); doc.text(fmtN(totalSavings),W-mg-3,y+6,{align:"right"});
        y+=13;
        rowHeader([{t:"CONCEPTO",x:mg+2},{t:"FECHA",x:mg+cW*0.65},{t:"IMPORTE",x:W-mg-2,a:"right"}]);
        data.savingsEntries.sort((a,b)=>(b.date||"").localeCompare(a.date||"")).forEach((e,i)=>{
          row([
            {t:e.name.length>38?e.name.slice(0,37)+"…":e.name,x:mg+2},
            {t:e.date?e.date.split("-").reverse().slice(0,2).join("/"):"",x:mg+cW*0.65,c:"#888"},
            {t:"+"+fmtN(e.amount),x:W-mg-2,a:"right",c:"#378ADD",b:true},
          ],i);
        });
      } else { doc.setFontSize(8); setTxt(doc,"#a0a0a0"); doc.text("Sin ahorros",mg,y+4); y+=10; }

      // ════════════════════════════════════════════════════════════════════════
      // GASTOS FIJOS
      // ════════════════════════════════════════════════════════════════════════
      sp(28); title("Gastos fijos","#BA7517");
      const nP=data.fixedExpenses.filter(e=>e.paid).length;
      const nPe=data.fixedExpenses.length-nP;
      const fixPct=fix>0?Math.round((paidFix/fix)*100):0;

      // Two summary boxes
      sp(16);
      const sbW=(cW-5)/2;
      [{l:"Cobrados",v:fmtN(paidFix),s:`${nP} concepto${nP!==1?"s":""}`,c:"#1D9E75"},
       {l:"Pendientes",v:fmtN(fix-paidFix),s:`${nPe} concepto${nPe!==1?"s":""}`,c:fix-paidFix>0?"#E24B4A":"#888"}
      ].forEach((b,i)=>{
        const bx=mg+i*(sbW+5);
        const [r,g,bv]=hex(b.c);
        setFill(doc,"#f7fcf7"); setDraw(doc, b.c); doc.setLineWidth(0.3);
        doc.roundedRect(bx,y,sbW,13,2,2,"FD");
        doc.setFontSize(6.5); doc.setFont("helvetica","normal"); setTxt(doc,"#6e6e6e");
        doc.text(b.l.toUpperCase(),bx+3,y+5.5);
        doc.setFontSize(10); doc.setFont("helvetica","bold"); setTxt(doc, b.c);
        doc.text(b.v,bx+3,y+12);
        doc.setFontSize(6.5); doc.setFont("helvetica","normal"); setTxt(doc,"#969696");
        doc.text(b.s,bx+sbW-2,y+12,{align:"right"});
      });
      y+=17;

      // Progress bar
      if(fix>0){
        sp(9);
        setFill(doc,"#e1e1e1"); doc.rect(mg,y,cW,4.5,"F");
        setFill(doc,"#1D9E75"); doc.rect(mg,y,(paidFix/fix)*cW,4.5,"F");
        doc.setFontSize(7); doc.setFont("helvetica","normal"); setTxt(doc,"#505050");
        doc.text(`${fixPct}% cobrado`,W-mg,y+3.5,{align:"right"});
        y+=9;
      }

      if(data.fixedExpenses.length>0){
        sp(14);
        rowHeader([
          {t:"CONCEPTO",x:mg+2},{t:"FECHA",x:mg+cW*0.58},
          {t:"ESTADO",x:mg+cW*0.72},{t:"IMPORTE",x:W-mg-2,a:"right"},
        ]);
        data.fixedExpenses.sort((a,b)=>(b.date||"").localeCompare(a.date||"")).forEach((e,i)=>{
          row([
            {t:e.name.length>34?e.name.slice(0,33)+"…":e.name,x:mg+2},
            {t:e.date?e.date.split("-").reverse().slice(0,2).join("/"):"",x:mg+cW*0.58,c:"#888"},
            {t:e.paid?"Cobrado":"Pendiente",x:mg+cW*0.72,c:e.paid?"#1D9E75":"#E24B4A",b:true},
            {t:"-"+fmtN(e.amount),x:W-mg-2,a:"right",c:"#BA7517",b:true},
          ],i);
        });
        y+=4;
      }

      // ════════════════════════════════════════════════════════════════════════
      // GASTOS VARIABLES
      // ════════════════════════════════════════════════════════════════════════
      sp(28); title("Gastos variables","#E24B4A");

      // Global budget
      const gB=data.varBudget??0;
      if(gB>0){
        sp(12);
        const gOver=vr>gB, gPct=Math.round((vr/gB)*100);
        setFill(doc, gOver?"#ffeeee":"#eefcee");
        setDraw(doc, gOver?"#b400b4":"#64c864"); doc.setLineWidth(0.3);
        doc.roundedRect(mg,y,cW,10,2,2,"FD");
        doc.setFontSize(8); doc.setFont("helvetica","normal");
        setTxt(doc, gOver?"#960059":"#285a28");
        doc.text(
          gOver
            ? `Presupuesto superado  ${fmtN(vr)} / ${fmtN(gB)}  (+${fmtN(vr-gB)})`
            : `Dentro del presupuesto  ${fmtN(vr)} / ${fmtN(gB)}  (${gPct}%)`,
          mg+4,y+6.5
        );
        y+=14;
      }

      // Category bars
      const catSpend: Record<string,number>={};
      for(const e of data.varExpenses.filter(e=>e.paid!==false)){ const c=e.category||"Otro"; catSpend[c]=(catSpend[c]||0)+e.amount; }
      const cats=Object.entries(catSpend).sort((a,b)=>b[1]-a[1]);

      if(cats.length>0){
        sp(12);
        doc.setFontSize(8.5); doc.setFont("helvetica","bold"); setTxt(doc,"#505050");
        doc.text("Gasto por categoría",mg,y); y+=7;

        cats.forEach(([cat,amount],i)=>{
          sp(9);
          const bEntry=categoryBudgets.find(b=>b.category===cat);
          const bAmt=bEntry?.budget||0;
          const isOver=bAmt>0&&amount>bAmt;
          const clr=isOver?"#E24B4A":bAmt>0&&amount/bAmt>=0.8?"#BA7517":PALETTE[i%PALETTE.length];
          const maxW=cW-48;
          const pct=bAmt>0?Math.min(amount/bAmt,1):vr>0?Math.min(amount/vr,1):0;
          doc.setFontSize(7.5); doc.setFont("helvetica","normal"); setTxt(doc,"#323232");
          doc.text(cat.length>17?cat.slice(0,16)+"…":cat,mg,y+4);
          setFill(doc,"#e4e4e4"); doc.rect(mg+36,y,maxW,4.5,"F");
          setFill(doc, clr); doc.rect(mg+36,y,pct*maxW,4.5,"F");
          doc.setFont("helvetica","bold"); setTxt(doc, clr);
          doc.text("-"+fmtN(amount),W-mg,y+4,{align:"right"});
          doc.setFontSize(6.5); doc.setFont("helvetica","normal");
          if(bAmt>0){
            setTxt(doc, isOver?"#a00000":"#647864");
            doc.text(`${Math.round((amount/bAmt)*100)}% de ${fmtN(bAmt)} ${isOver?"↑":"✓"}`,mg+36+maxW+2,y+4);
          } else if(vr>0) {
            setTxt(doc,"#828282");
            doc.text(`${Math.round((amount/vr)*100)}%`,mg+36+maxW+2,y+4);
          }
          y+=9;
        });

        // Category pie bar
        sp(26);
        y+=4;
        doc.setFontSize(8); doc.setFont("helvetica","normal"); setTxt(doc,"#505050");
        doc.text("Distribución por categoría",mg,y); y+=5;
        pieBar(cats.map(([cat,amount],i)=>({label:cat,amount,color:PALETTE[i%PALETTE.length]})), vr);
      }

      // Detail table
      if(data.varExpenses.length>0){
        sp(18);
        doc.setFontSize(8.5); doc.setFont("helvetica","bold"); setTxt(doc,"#505050");
        doc.text("Detalle de movimientos",mg,y); y+=7;
        rowHeader([
          {t:"CONCEPTO",x:mg+2},{t:"CATEGORÍA",x:mg+cW*0.45},
          {t:"NOTA",x:mg+cW*0.65},{t:"IMPORTE",x:W-mg-2,a:"right"},
        ]);
        data.varExpenses.sort((a,b)=>(b.date||"").localeCompare(a.date||"")).forEach((e,i)=>{
          row([
            {t:e.name.length>26?e.name.slice(0,25)+"…":e.name,x:mg+2},
            {t:e.category||"",x:mg+cW*0.45,c:"#555"},
            {t:e.notes?(e.notes.length>17?e.notes.slice(0,16)+"…":e.notes):"",x:mg+cW*0.65,c:"#999"},
            {t:"-"+fmtN(e.amount),x:W-mg-2,a:"right",c:"#E24B4A",b:true},
          ],i);
        });
        y+=4;
      }

      // ── Footer every page ─────────────────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const np=(doc as any).internal.getNumberOfPages();
      for(let p=1;p<=np;p++){
        doc.setPage(p);
        setFill(doc,"#f4f9f4"); doc.rect(0,H-9,W,9,"F");
        doc.setFontSize(7); doc.setFont("helvetica","normal"); setTxt(doc,"#a0a0a0");
        doc.text(`Finanzas · ${MONTH_NAMES[month]} ${year}`,mg,H-3);
        doc.text(`${p} / ${np}`,W-mg,H-3,{align:"right"});
      }

      doc.save(`finanzas-${year}-${String(month+1).padStart(2,"0")}.pdf`);
    } catch(err) {
      console.error("PDF error:", err);
      toast(`Error generando el PDF: ${err instanceof Error ? err.message : String(err)}`, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={generatePdf} disabled={loading}
      data-tour="pdf-button"
      className={`relative w-9 h-9 flex items-center justify-center rounded-xl
        text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800
        hover:text-neutral-700 dark:hover:text-neutral-200
        transition-colors disabled:opacity-50 ${disabled ? "opacity-40" : ""}`}
      title={disabled ? "Disponible en plan Pro" : "Descargar informe PDF del mes"}
    >
      {loading ? <span className="animate-pulse"><PdfIcon /></span> : <PdfIcon />}
      {disabled && (
        <span className="absolute bottom-1 right-1 text-neutral-500 dark:text-neutral-400">
          <LockIcon />
        </span>
      )}
    </button>
  );
}

function PdfIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}
function LockIcon() {
  return <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
