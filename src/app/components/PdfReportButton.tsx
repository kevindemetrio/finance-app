"use client";

import { useState } from "react";
import { CategoryBudget, MonthData } from "../lib/data";

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const PALETTE = ["#E24B4A","#1D9E75","#378ADD","#BA7517","#7F77DD","#D85A30","#D4537E","#639922","#00838F","#888780"];

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}

interface Props {
  year: number;
  month: number;
  data: MonthData;
  totalSavings: number;
  categoryBudgets: CategoryBudget[];
}

export function PdfReportButton({ year, month, data, totalSavings, categoryBudgets }: Props) {
  const [loading, setLoading] = useState(false);

  async function generatePdf() {
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const W = 210, H = 297, mg = 16, cW = W - mg * 2;
      let y = 0;

      const fmt = (n: number) =>
        Math.abs(n).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

      // ── Helpers ──────────────────────────────────────────────────────────────

      function addPage() {
        doc.addPage(); y = mg + 4;
        doc.setFillColor(29,158,117); doc.rect(0,0,W,1.5,"F");
      }
      function space(n: number) { if (y + n > H - mg - 12) addPage(); }

      function sectionTitle(title: string, colorHex = "#1e3a5f") {
        space(14);
        const [r,g,b] = hexToRgb(colorHex);
        doc.setFillColor(r,g,b); doc.rect(mg, y, 3, 8, "F");
        doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(r,g,b);
        doc.text(title, mg+6, y+6); y += 13;
      }

      // Donut drawn with polygon approximation using doc.polygon (works in jsPDF 2.x)
      function drawDonut(cx: number, cy: number, radius: number, slices: {pct:number; color:string}[]) {
        let angle = -Math.PI / 2;
        for (const s of slices) {
          if (s.pct <= 0) continue;
          const sweep = s.pct * 2 * Math.PI;
          const steps = Math.max(4, Math.ceil(sweep / 0.15));
          const pts: number[][] = [];
          pts.push([cx, cy]);
          for (let i = 0; i <= steps; i++) {
            const a = angle + (sweep * i) / steps;
            pts.push([cx + radius * Math.cos(a), cy + radius * Math.sin(a)]);
          }
          const [r,g,b] = hexToRgb(s.color);
          doc.setFillColor(r,g,b);
          doc.setDrawColor(255,255,255); doc.setLineWidth(0.3);
          // use lines() API: array of [dx, dy] from current point
          doc.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i++) doc.lineTo(pts[i][0], pts[i][1]);
          doc.closePath(); doc.fill();
          angle += sweep;
        }
        // Centre hole
        doc.setFillColor(255,255,255);
        doc.setDrawColor(255,255,255);
        doc.circle(cx, cy, radius * 0.52, "F");
      }

      // Horizontal progress bar
      function hBar(label: string, spent: number, budget: number, colorHex: string, rowW: number) {
        space(10);
        const barX = mg + 40, barW = rowW - 40 - 28;
        const [r,g,b] = hexToRgb(colorHex);
        const pct  = budget > 0 ? Math.min(spent/budget, 1.1) : 0;
        const over = budget > 0 && spent > budget;

        doc.setFontSize(7.5); doc.setFont("helvetica","normal"); doc.setTextColor(55,55,55);
        doc.text(label.length > 17 ? label.slice(0,16)+"…" : label, mg, y+4);

        doc.setFillColor(230,230,230); doc.roundedRect(barX, y+1, barW, 4, 0.8, 0.8, "F");
        if (budget > 0) {
          doc.setFillColor(r,g,b);
          doc.roundedRect(barX, y+1, Math.min(pct, 1) * barW, 4, 0.8, 0.8, "F");
        }

        doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(r,g,b);
        doc.text("-"+fmt(spent), mg+rowW, y+4, { align:"right" });

        if (budget > 0) {
          doc.setFontSize(6.5); doc.setFont("helvetica","normal");
          doc.setTextColor(over ? 180 : 110, over ? 0 : 110, over ? 0 : 110);
          doc.text(`${Math.round(pct*100)}%${over?" ↑":" ✓"}`, barX + barW + 2, y+4);
        }
        y += 9;
      }

      // Table helpers
      function tHeader(cols: {l:string; x:number; a?:"right"|"left"}[]) {
        doc.setFillColor(240,245,240); doc.rect(mg, y, cW, 6, "F");
        doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(100,120,100);
        cols.forEach(c => doc.text(c.l, c.x, y+4, { align: c.a||"left" }));
        y += 7;
      }
      function tRow(cells: {t:string; x:number; c?:string; b?:boolean; a?:"right"|"left"}[], idx: number) {
        space(8);
        if (idx%2===0) { doc.setFillColor(252,252,252); doc.rect(mg, y-1, cW, 7, "F"); }
        cells.forEach(cell => {
          doc.setFontSize(8); doc.setFont("helvetica", cell.b ? "bold" : "normal");
          if (cell.c) { const [r,g,b]=hexToRgb(cell.c); doc.setTextColor(r,g,b); }
          else doc.setTextColor(40,40,40);
          doc.text(cell.t, cell.x, y+4.5, { align: cell.a||"left" });
        });
        y += 7;
      }

      // ════════════════════════════════════════════════════════════════════════
      // PORTADA
      // ════════════════════════════════════════════════════════════════════════
      doc.setFillColor(29,158,117); doc.rect(0,0,W,46,"F");
      doc.setFillColor(255,255,255); doc.circle(mg+9,23,9,"F");
      doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(29,158,117);
      doc.text("€", mg+9, 26.5, { align:"center" });
      doc.setFontSize(22); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
      doc.text("Finanzas", mg+23, 20);
      doc.setFontSize(11); doc.setFont("helvetica","normal");
      doc.text(`Informe mensual · ${MONTH_NAMES[month]} ${year}`, mg+23, 29);
      doc.setFontSize(8); doc.text(`Generado el ${new Date().toLocaleDateString("es-ES")}`, W-mg, 29, { align:"right" });
      y = 56;

      // ── Resumen ──────────────────────────────────────────────────────────────
      const incomeTotal = data.incomes.reduce((a,i)=>a+i.amount, 0);
      const fixedTotal  = data.fixedExpenses.reduce((a,i)=>a+i.amount, 0);
      const varTotal    = data.varExpenses.reduce((a,i)=>a+i.amount, 0);
      const savTotal    = data.savingsEntries.reduce((a,i)=>a+i.amount, 0);
      const balance     = incomeTotal - fixedTotal - varTotal - savTotal;
      const paidFixed   = data.fixedExpenses.filter(e=>e.paid).reduce((a,i)=>a+i.amount, 0);
      const pendFixed   = fixedTotal - paidFixed;

      sectionTitle("Resumen del mes", "#1D9E75");

      const metrics = [
        {l:"Ingresos",     v:fmt(incomeTotal),                                   c:"#1D9E75"},
        {l:"Gastos fijos", v:fmt(fixedTotal),                                    c:"#BA7517"},
        {l:"Variables",    v:fmt(varTotal),                                      c:"#E24B4A"},
        {l:"Ahorros",      v:fmt(savTotal),                                      c:"#378ADD"},
        {l:"Balance",      v:(balance>=0?"+ ":"- ")+fmt(Math.abs(balance)),      c:balance>=0?"#1D9E75":"#E24B4A"},
        {l:"Ahorro total", v:fmt(totalSavings),                                  c:"#378ADD"},
      ];
      const bW2=(cW-10)/3, bH2=22;
      metrics.forEach((m,i) => {
        const col=i%3, row=Math.floor(i/3);
        const bx=mg+col*(bW2+5), by=y+row*(bH2+5);
        doc.setFillColor(247,252,247); doc.setDrawColor(210,230,210); doc.setLineWidth(0.3);
        doc.roundedRect(bx, by, bW2, bH2, 2, 2, "FD");
        doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(120,140,120);
        doc.text(m.l.toUpperCase(), bx+4, by+7);
        const [r,g,b]=hexToRgb(m.c);
        doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(r,g,b);
        doc.text(m.v, bx+4, by+17);
      });
      y += bH2*2+5+8;

      // Distribution bar
      if (incomeTotal > 0) {
        space(22);
        doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(80,80,80);
        doc.text("Distribución del ingreso", mg, y); y+=5;
        const distItems = [
          {l:"Fijos",    v:fixedTotal,            c:"#BA7517"},
          {l:"Variables",v:varTotal,              c:"#E24B4A"},
          {l:"Ahorros",  v:savTotal,              c:"#378ADD"},
          {l:"Libre",    v:Math.max(balance,0),   c:"#1D9E75"},
        ];
        let bx2=mg;
        distItems.forEach(it => {
          const w=Math.max((it.v/incomeTotal)*cW,0.5);
          const [r,g,b]=hexToRgb(it.c);
          doc.setFillColor(r,g,b); doc.rect(bx2,y,w,7,"F"); bx2+=w;
        });
        y+=10;
        distItems.forEach((it,i) => {
          const lx=mg+i*46;
          const [r,g,b]=hexToRgb(it.c);
          doc.setFillColor(r,g,b); doc.rect(lx,y,6,3.5,"F");
          doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(70,70,70);
          doc.text(it.l, lx+8, y+3.5);
          doc.setFont("helvetica","bold"); doc.setTextColor(r,g,b);
          doc.text(fmt(it.v), lx+8, y+8);
        });
        y+=13;
      }

      // ════════════════════════════════════════════════════════════════════════
      // INGRESOS
      // ════════════════════════════════════════════════════════════════════════
      space(20); sectionTitle("Ingresos","#1D9E75");
      if (data.incomes.length > 0) {
        const dr=20, dcx=mg+dr+2, dcy=y+dr+2;
        const slices=data.incomes.map((e,i)=>({pct:e.amount/incomeTotal, color:PALETTE[i%PALETTE.length]}));
        drawDonut(dcx,dcy,dr,slices);
        doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(20,100,60);
        doc.text(fmt(incomeTotal), dcx, dcy+2.5, {align:"center"});
        const tX=mg+dr*2+10, tW2=W-mg-tX;
        let ty=y;
        data.incomes.forEach((e,i) => {
          const [r,g,b]=hexToRgb(PALETTE[i%PALETTE.length]);
          doc.setFillColor(r,g,b); doc.rect(tX,ty,3,5,"F");
          doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(40,40,40);
          doc.text(e.name.length>24?e.name.slice(0,23)+"…":e.name, tX+5, ty+4);
          doc.setFont("helvetica","bold"); doc.setTextColor(r,g,b);
          doc.text("+"+fmt(e.amount), tX+tW2, ty+4, {align:"right"});
          doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(140,140,140);
          doc.text(`${Math.round((e.amount/incomeTotal)*100)}%`, tX+tW2-20, ty+4, {align:"right"});
          ty+=8;
        });
        y=Math.max(y+dr*2+8, ty+4);
      } else { doc.setFontSize(8); doc.setTextColor(160,160,160); doc.text("Sin ingresos este mes", mg, y+4); y+=10; }

      // ════════════════════════════════════════════════════════════════════════
      // AHORROS
      // ════════════════════════════════════════════════════════════════════════
      space(20); sectionTitle("Ahorros","#378ADD");
      if (data.savingsEntries.length > 0) {
        const dr=20, dcx=mg+dr+2, dcy=y+dr+2;
        const slices=data.savingsEntries.map((e,i)=>({pct:e.amount/savTotal, color:PALETTE[i%PALETTE.length]}));
        drawDonut(dcx,dcy,dr,slices);
        doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(20,60,140);
        doc.text(fmt(savTotal), dcx, dcy+2.5, {align:"center"});
        const tX=mg+dr*2+10, tW2=W-mg-tX;
        let ty=y;
        data.savingsEntries.forEach((e,i) => {
          const [r,g,b]=hexToRgb(PALETTE[i%PALETTE.length]);
          doc.setFillColor(r,g,b); doc.rect(tX,ty,3,5,"F");
          doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(40,40,40);
          doc.text(e.name.length>24?e.name.slice(0,23)+"…":e.name, tX+5, ty+4);
          doc.setFont("helvetica","bold"); doc.setTextColor(r,g,b);
          doc.text("+"+fmt(e.amount), tX+tW2, ty+4, {align:"right"});
          doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(140,140,140);
          doc.text(`${Math.round((e.amount/savTotal)*100)}%`, tX+tW2-20, ty+4, {align:"right"});
          ty+=8;
        });
        y=Math.max(y+dr*2+6, ty+2);
        space(12);
        doc.setFillColor(232,244,255); doc.roundedRect(mg, y, cW, 10, 2, 2, "F");
        doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(30,80,160);
        doc.text("Total ahorrado acumulado:", mg+4, y+6.5);
        doc.setFont("helvetica","bold"); doc.text(fmt(totalSavings), W-mg-4, y+6.5, {align:"right"});
        y+=14;
      } else { doc.setFontSize(8); doc.setTextColor(160,160,160); doc.text("Sin ahorros este mes", mg, y+4); y+=10; }

      // ════════════════════════════════════════════════════════════════════════
      // GASTOS FIJOS
      // ════════════════════════════════════════════════════════════════════════
      space(20); sectionTitle("Gastos fijos","#BA7517");
      const nPaid=data.fixedExpenses.filter(e=>e.paid).length;
      const nPend=data.fixedExpenses.length - nPaid;
      const fixPct=fixedTotal>0?Math.round((paidFixed/fixedTotal)*100):0;

      // Two boxes
      space(18);
      const sfW2=(cW-6)/2;
      [{l:"Cobrados",v:fmt(paidFixed),sub:`${nPaid} concepto${nPaid!==1?"s":""}`,c:"#1D9E75"},
       {l:"Pendientes",v:fmt(pendFixed),sub:`${nPend} concepto${nPend!==1?"s":""}`,c:pendFixed>0?"#E24B4A":"#888"}
      ].forEach((box,i) => {
        const bx=mg+i*(sfW2+6);
        const [r,g,b]=hexToRgb(box.c);
        doc.setFillColor(247,252,247); doc.setDrawColor(r,g,b); doc.setLineWidth(0.4);
        doc.roundedRect(bx,y,sfW2,14,2,2,"FD");
        doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(110,110,110);
        doc.text(box.l.toUpperCase(), bx+4, y+6);
        doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(r,g,b);
        doc.text(box.v, bx+4, y+13);
        doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(150,150,150);
        doc.text(box.sub, bx+sfW2-3, y+13, {align:"right"});
      });
      y+=18;

      if (fixedTotal>0) {
        space(10);
        doc.setFillColor(230,230,230); doc.roundedRect(mg,y,cW,5,1,1,"F");
        doc.setFillColor(29,158,117); doc.roundedRect(mg,y,(paidFixed/fixedTotal)*cW,5,1,1,"F");
        doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(80,80,80);
        doc.text(`${fixPct}% cobrado`, W-mg, y+4, {align:"right"});
        y+=9;
      }

      if (data.fixedExpenses.length>0) {
        space(16);
        tHeader([
          {l:"CONCEPTO",x:mg+2},{l:"FECHA",x:mg+cW*0.6},{l:"ESTADO",x:mg+cW*0.73},{l:"IMPORTE",x:W-mg-2,a:"right"},
        ]);
        data.fixedExpenses
          .sort((a,b)=>(b.date||"").localeCompare(a.date||""))
          .forEach((e,i) => {
            space(8);
            tRow([
              {t:e.name.length>34?e.name.slice(0,33)+"…":e.name, x:mg+2},
              {t:e.date?e.date.split("-").reverse().slice(0,2).join("/"):"", x:mg+cW*0.6, c:"#888"},
              {t:e.paid?"✓ Cobrado":"Pendiente", x:mg+cW*0.73, c:e.paid?"#1D9E75":"#E24B4A", b:true},
              {t:"-"+fmt(e.amount), x:W-mg-2, a:"right", c:"#BA7517", b:true},
            ], i);
          });
        y+=4;
      }

      // ════════════════════════════════════════════════════════════════════════
      // GASTOS VARIABLES
      // ════════════════════════════════════════════════════════════════════════
      space(20); sectionTitle("Gastos variables","#E24B4A");

      // Global budget alert
      const gBudget=data.varBudget??0;
      if (gBudget>0) {
        space(14);
        const over=varTotal>gBudget;
        const gPct=Math.round((varTotal/gBudget)*100);
        doc.setFillColor(over?255:240, over?240:252, over?240:240);
        doc.setDrawColor(over?200:150, over?0:200, over?0:150); doc.setLineWidth(0.4);
        doc.roundedRect(mg,y,cW,11,2,2,"FD");
        doc.setFontSize(8); doc.setFont("helvetica","normal");
        doc.setTextColor(over?160:40, over?0:100, over?0:40);
        doc.text(
          over
            ? `⚠  Presupuesto superado · ${fmt(varTotal)} / ${fmt(gBudget)}  (+${fmt(varTotal-gBudget)})`
            : `✓  Dentro del presupuesto · ${fmt(varTotal)} / ${fmt(gBudget)}  (${gPct}%)`,
          mg+4, y+7
        );
        y+=15;
      }

      // Category breakdown
      const catSpend: Record<string,number>={};
      for (const e of data.varExpenses) { const c=e.category||"Otro"; catSpend[c]=(catSpend[c]||0)+e.amount; }
      const catArr=Object.entries(catSpend).sort((a,b)=>b[1]-a[1]);

      if (catArr.length>0) {
        space(12);
        doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(80,80,80);
        doc.text("Cumplimiento por categoría", mg, y); y+=7;

        catArr.forEach(([cat,amount],i) => {
          space(10);
          const bEntry=categoryBudgets.find(b=>b.category===cat);
          const budget=bEntry?.budget||0;
          const isOver=budget>0&&amount>budget;
          const colorHex=isOver?"#E24B4A":budget>0&&amount/budget>=0.8?"#BA7517":PALETTE[i%PALETTE.length];
          hBar(cat, amount, budget>0?budget:0, colorHex, cW);
        });

        // Donut
        space(56);
        y+=4;
        const dr2=22, dcx2=mg+dr2+2, dcy2=y+dr2+2;
        const dSlices=catArr.map(([,v],i)=>({pct:v/varTotal,color:PALETTE[i%PALETTE.length]}));
        drawDonut(dcx2,dcy2,dr2,dSlices);
        doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(140,40,40);
        doc.text(fmt(varTotal), dcx2, dcy2+2.5, {align:"center"});

        const tX3=mg+dr2*2+10, tW3=W-mg-tX3;
        let ty3=y;
        catArr.forEach(([cat,amount],i) => {
          const [r,g,b]=hexToRgb(PALETTE[i%PALETTE.length]);
          const bEntry=categoryBudgets.find(b=>b.category===cat);
          doc.setFillColor(r,g,b); doc.rect(tX3,ty3,3,5,"F");
          doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(40,40,40);
          doc.text(cat, tX3+5, ty3+4);
          doc.setFont("helvetica","bold"); doc.setTextColor(r,g,b);
          doc.text("-"+fmt(amount), tX3+tW3, ty3+4, {align:"right"});
          if (bEntry) {
            const ov=amount>bEntry.budget;
            doc.setFontSize(6.5); doc.setFont("helvetica","normal");
            doc.setTextColor(ov?180:100, ov?0:130, ov?0:100);
            doc.text(`límite ${fmt(bEntry.budget)} ${ov?"↑":"✓"}`, tX3+tW3-22, ty3+4, {align:"right"});
          }
          ty3+=8;
        });
        y=Math.max(y+dr2*2+8, ty3+4);
      }

      // Full detail table
      if (data.varExpenses.length>0) {
        space(20);
        doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(80,80,80);
        doc.text("Detalle de movimientos", mg, y); y+=7;
        tHeader([
          {l:"CONCEPTO",x:mg+2},{l:"CATEGORÍA",x:mg+cW*0.46},{l:"NOTA",x:mg+cW*0.65},{l:"IMPORTE",x:W-mg-2,a:"right"},
        ]);
        data.varExpenses
          .sort((a,b)=>(b.date||"").localeCompare(a.date||""))
          .forEach((e,i) => {
            space(8);
            tRow([
              {t:e.name.length>26?e.name.slice(0,25)+"…":e.name, x:mg+2},
              {t:e.category||"", x:mg+cW*0.46, c:"#555"},
              {t:e.notes?(e.notes.length>16?e.notes.slice(0,15)+"…":e.notes):"", x:mg+cW*0.65, c:"#999"},
              {t:"-"+fmt(e.amount), x:W-mg-2, a:"right", c:"#E24B4A", b:true},
            ], i);
          });
        y+=4;
      }

      // ── Footer ────────────────────────────────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nPages=(doc as any).internal.getNumberOfPages();
      for (let p=1; p<=nPages; p++) {
        doc.setPage(p);
        doc.setFillColor(245,250,245); doc.rect(0,H-10,W,10,"F");
        doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(160,160,160);
        doc.text(`Finanzas · ${MONTH_NAMES[month]} ${year}`, mg, H-3.5);
        doc.text(`Página ${p} / ${nPages}`, W-mg, H-3.5, {align:"right"});
      }

      doc.save(`finanzas-${year}-${String(month+1).padStart(2,"0")}.pdf`);
    } catch(err) {
      console.error("PDF error:", err);
      alert("Error generando el PDF. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={generatePdf} disabled={loading}
      className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400
        border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5
        hover:text-neutral-700 dark:hover:text-neutral-200 hover:border-neutral-400
        transition-colors disabled:opacity-50"
      title="Descargar informe PDF del mes"
    >
      <PdfIcon />
      {loading ? "Generando..." : "PDF"}
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
