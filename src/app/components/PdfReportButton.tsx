"use client";

import { useState } from "react";
import { CategoryBudget, MonthData, fmtEur } from "../lib/data";

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const PALETTE = ["#E24B4A","#BA7517","#378ADD","#1D9E75","#7F77DD","#D85A30","#D4537E","#639922","#888780","#00838F"];

interface Props {
  year: number;
  month: number;
  data: MonthData;
  totalSavings: number;
  categoryBudgets: CategoryBudget[];
}

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}

export function PdfReportButton({ year, month, data, totalSavings, categoryBudgets }: Props) {
  const [loading, setLoading] = useState(false);

  async function generatePdf() {
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const W = 210, H = 297;
      const mg = 16;
      const cW = W - mg * 2;
      let y = 0;

      const fmt = (n: number) =>
        Math.abs(n).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

      // ── Page helpers ────────────────────────────────────────────────────────
      function addPage() {
        doc.addPage(); y = mg + 4;
        doc.setFillColor(29, 158, 117);
        doc.rect(0, 0, W, 1.5, "F");
      }
      function space(n: number) { if (y + n > H - mg) addPage(); }

      // ── Section title ───────────────────────────────────────────────────────
      function sectionTitle(title: string, color = "#1e3a5f") {
        space(14);
        const [r, g, b] = hexToRgb(color);
        doc.setFillColor(r, g, b);
        doc.rect(mg, y, 3, 8, "F");
        doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(r, g, b);
        doc.text(title, mg + 6, y + 6);
        y += 12;
      }

      // ── Horizontal bar ──────────────────────────────────────────────────────
      function hBar(label: string, spent: number, budget: number, barColor: string, x: number, bW: number) {
        const maxW = bW - 60;
        const pct  = budget > 0 ? Math.min(spent / budget, 1) : 0;
        const over = budget > 0 && spent > budget;
        const [r, g, b] = hexToRgb(barColor);

        doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(60,60,60);
        const lbl = label.length > 18 ? label.slice(0,17)+"…" : label;
        doc.text(lbl, x, y + 3.5);

        // bg
        doc.setFillColor(235,235,235); doc.roundedRect(x + 38, y, maxW, 5, 1, 1, "F");
        // fill
        if (budget > 0) {
          doc.setFillColor(r, g, b);
          doc.roundedRect(x + 38, y, Math.max(pct * maxW, 1), 5, 1, 1, "F");
          // limit line
          if (over) {
            doc.setDrawColor(200, 0, 0); doc.setLineWidth(0.4);
            doc.line(x + 38 + maxW, y - 1, x + 38 + maxW, y + 6);
          }
        }

        // amount
        doc.setFontSize(7.5); doc.setFont("helvetica","bold");
        doc.setTextColor(over ? 200 : r, over ? 0 : g, over ? 0 : b);
        doc.text(fmt(spent), x + bW, y + 4, { align: "right" });

        if (budget > 0) {
          doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(130,130,130);
          const pctStr = `${Math.round(pct*100)}%${over?" ↑":""}`;
          doc.text(pctStr, x + 38 + maxW + 2, y + 4);
        }
        y += 9;
      }

      // ── Mini donut ──────────────────────────────────────────────────────────
      function donut(cx: number, cy: number, r: number, slices: {pct:number; color:string}[]) {
        let angle = -Math.PI / 2;
        for (const s of slices) {
          if (s.pct <= 0) continue;
          const sweep = s.pct * 2 * Math.PI;
          const end   = angle + sweep;
          const [sr, sg, sb] = hexToRgb(s.color);
          doc.setFillColor(sr, sg, sb);
          // approximate arc with polygon
          const pts: number[][] = [[cx, cy]];
          const steps = Math.max(3, Math.round(sweep / 0.2));
          for (let i = 0; i <= steps; i++) {
            const a = angle + (sweep * i) / steps;
            pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
          }
          // draw as filled polygon
          doc.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i++) doc.lineTo(pts[i][0], pts[i][1]);
          doc.setDrawColor(255,255,255); doc.setLineWidth(0.5);
          // use internal path
          (doc as unknown as {triangle:(x1:number,y1:number,x2:number,y2:number,x3:number,y3:number,s:string)=>void});
          // simple fill via lines from center
          for (let i = 0; i < steps; i++) {
            const a1 = angle + (sweep * i) / steps;
            const a2 = angle + (sweep * (i+1)) / steps;
            doc.triangle(
              cx, cy,
              cx + r * Math.cos(a1), cy + r * Math.sin(a1),
              cx + r * Math.cos(a2), cy + r * Math.sin(a2),
              "F"
            );
          }
          angle = end;
        }
        // White center hole
        doc.setFillColor(255,255,255); doc.circle(cx, cy, r * 0.52, "F");
      }

      // ── Table header ────────────────────────────────────────────────────────
      function tableHeader(cols: {label:string; x:number; align?:"right"|"left"}[]) {
        doc.setFillColor(240, 245, 240);
        doc.rect(mg, y, cW, 6, "F");
        doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(100,120,100);
        for (const col of cols) {
          doc.text(col.label, col.x, y + 4, { align: col.align || "left" });
        }
        y += 7;
      }

      function tableRow(cells: {text:string; x:number; color?:string; bold?:boolean; align?:"right"|"left"}[], idx: number) {
        if (idx % 2 === 0) { doc.setFillColor(252,252,252); doc.rect(mg, y - 1, cW, 7, "F"); }
        for (const cell of cells) {
          doc.setFontSize(8);
          doc.setFont("helvetica", cell.bold ? "bold" : "normal");
          if (cell.color) { const [r,g,b] = hexToRgb(cell.color); doc.setTextColor(r,g,b); }
          else doc.setTextColor(40,40,40);
          doc.text(cell.text, cell.x, y + 4, { align: cell.align || "left" });
        }
        y += 7;
      }

      // ════════════════════════════════════════════════════════════════════════
      // PAGE 1 — COVER + RESUMEN
      // ════════════════════════════════════════════════════════════════════════
      doc.setFillColor(29, 158, 117);
      doc.rect(0, 0, W, 48, "F");

      // Logo
      doc.setFillColor(255,255,255); doc.circle(mg + 8, 24, 9, "F");
      doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(29,158,117);
      doc.text("€", mg + 8, 27.5, { align: "center" });

      doc.setFontSize(22); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
      doc.text("Finanzas", mg + 22, 20);
      doc.setFontSize(11); doc.setFont("helvetica","normal");
      doc.text(`Informe — ${MONTH_NAMES[month]} ${year}`, mg + 22, 29);
      doc.setFontSize(8);
      doc.text(`Generado el ${new Date().toLocaleDateString("es-ES")}`, W - mg, 29, { align: "right" });

      y = 58;

      // ── Totals ──────────────────────────────────────────────────────────────
      const incomeTotal = data.incomes.reduce((a,i) => a+i.amount, 0);
      const fixedTotal  = data.fixedExpenses.reduce((a,i) => a+i.amount, 0);
      const varTotal    = data.varExpenses.reduce((a,i) => a+i.amount, 0);
      const savTotal    = data.savingsEntries.reduce((a,i) => a+i.amount, 0);
      const balance     = incomeTotal - fixedTotal - varTotal - savTotal;
      const paidFixed   = data.fixedExpenses.filter(e=>e.paid).reduce((a,i)=>a+i.amount,0);
      const pendFixed   = fixedTotal - paidFixed;

      sectionTitle("Resumen del mes", "#1D9E75");

      // 6 metric boxes
      const metrics = [
        { label:"Ingresos",     value: fmt(incomeTotal), color:"#1D9E75" },
        { label:"Gastos fijos", value: fmt(fixedTotal),  color:"#BA7517" },
        { label:"Variables",    value: fmt(varTotal),    color:"#E24B4A" },
        { label:"Ahorros",      value: fmt(savTotal),    color:"#378ADD" },
        { label:"Balance",      value: (balance>=0?"+ ":"- ")+fmt(balance), color: balance>=0?"#1D9E75":"#E24B4A" },
        { label:"Ahorro total", value: fmt(totalSavings), color:"#378ADD" },
      ];
      const bW = (cW - 10) / 3, bH = 22;
      metrics.forEach((m, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const bx = mg + col * (bW + 5), by = y + row * (bH + 5);
        doc.setFillColor(247,252,247); doc.setDrawColor(210,230,210);
        doc.roundedRect(bx, by, bW, bH, 3, 3, "FD");
        doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(120,140,120);
        doc.text(m.label.toUpperCase(), bx+5, by+7);
        const [r,g,b] = hexToRgb(m.color);
        doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(r,g,b);
        doc.text(m.value, bx+5, by+17);
      });
      y += bH * 2 + 5 + 10;

      // Balance visual bar
      if (incomeTotal > 0) {
        space(22);
        doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(80,80,80);
        doc.text("Distribución de ingresos", mg, y); y += 5;
        const totalOut = fixedTotal + varTotal + savTotal;
        const items = [
          { label:"Gastos fijos",  amount: fixedTotal, color:"#BA7517" },
          { label:"Variables",     amount: varTotal,   color:"#E24B4A" },
          { label:"Ahorros",       amount: savTotal,   color:"#378ADD" },
          { label:"Balance libre", amount: Math.max(balance, 0), color:"#1D9E75" },
        ];
        let barX = mg;
        for (const item of items) {
          const w = Math.max((item.amount / incomeTotal) * cW, 1);
          const [r,g,b] = hexToRgb(item.color);
          doc.setFillColor(r,g,b);
          doc.rect(barX, y, w, 8, "F");
          barX += w;
        }
        y += 12;
        // Legend
        const legX = [mg, mg+48, mg+96, mg+144];
        items.forEach((it, i) => {
          const [r,g,b] = hexToRgb(it.color);
          doc.setFillColor(r,g,b); doc.rect(legX[i], y, 7, 4, "F");
          doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(80,80,80);
          doc.text(it.label, legX[i]+9, y+3.5);
          doc.setFont("helvetica","bold"); doc.setTextColor(r,g,b);
          doc.text(fmt(it.amount), legX[i]+9, y+8);
        });
        y += 14;
      }

      // ════════════════════════════════════════════════════════════════════════
      // SECCIÓN — INGRESOS
      // ════════════════════════════════════════════════════════════════════════
      space(20);
      sectionTitle("Ingresos", "#1D9E75");

      if (data.incomes.length > 0) {
        // Donut + table side by side
        const donutR = 18, donutCX = mg + donutR + 2, donutCY = y + donutR + 2;
        const maxInc = data.incomes.reduce((a,i)=>a+i.amount,0);

        // Draw donut slices (one per income)
        const incSlices = data.incomes.map((e,i) => ({
          pct: e.amount / maxInc,
          color: PALETTE[i % PALETTE.length],
        }));
        donut(donutCX, donutCY, donutR, incSlices);

        // Center label
        doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(40,80,40);
        doc.text(fmt(maxInc), donutCX, donutCY+2.5, { align:"center" });

        // Table to the right
        const tX = mg + donutR * 2 + 10;
        const tW = W - mg - tX;
        let ty = y;
        data.incomes.forEach((e, i) => {
          space(8);
          const [r,g,b] = hexToRgb(PALETTE[i % PALETTE.length]);
          doc.setFillColor(r,g,b); doc.rect(tX, ty, 3, 5, "F");
          doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(40,40,40);
          const nm = e.name.length > 22 ? e.name.slice(0,21)+"…" : e.name;
          doc.text(nm, tX+5, ty+4);
          doc.setFont("helvetica","bold"); doc.setTextColor(r,g,b);
          doc.text("+"+fmt(e.amount), tX+tW, ty+4, { align:"right" });
          doc.setFont("helvetica","normal"); doc.setTextColor(140,140,140); doc.setFontSize(6.5);
          doc.text(`${Math.round((e.amount/maxInc)*100)}%`, tX+tW-18, ty+4, {align:"right"});
          ty += 8;
        });
        y = Math.max(y + donutR * 2 + 8, ty + 4);
      } else {
        doc.setFontSize(8); doc.setTextColor(160,160,160);
        doc.text("Sin ingresos este mes", mg, y+4); y += 10;
      }

      // ════════════════════════════════════════════════════════════════════════
      // SECCIÓN — AHORROS
      // ════════════════════════════════════════════════════════════════════════
      space(20);
      sectionTitle("Ahorros", "#378ADD");

      if (data.savingsEntries.length > 0) {
        const donutR = 18, donutCX = mg + donutR + 2, donutCY = y + donutR + 2;
        const maxSav = data.savingsEntries.reduce((a,i)=>a+i.amount,0);
        const savSlices = data.savingsEntries.map((e,i) => ({ pct: e.amount/maxSav, color: PALETTE[i%PALETTE.length] }));
        donut(donutCX, donutCY, donutR, savSlices);
        doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(20,70,140);
        doc.text(fmt(maxSav), donutCX, donutCY+2.5, { align:"center" });

        const tX = mg + donutR * 2 + 10, tW = W - mg - tX;
        let ty = y;
        data.savingsEntries.forEach((e, i) => {
          space(8);
          const [r,g,b] = hexToRgb(PALETTE[i % PALETTE.length]);
          doc.setFillColor(r,g,b); doc.rect(tX, ty, 3, 5, "F");
          doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(40,40,40);
          doc.text(e.name.length>22?e.name.slice(0,21)+"…":e.name, tX+5, ty+4);
          doc.setFont("helvetica","bold"); doc.setTextColor(r,g,b);
          doc.text("+"+fmt(e.amount), tX+tW, ty+4, { align:"right" });
          doc.setFont("helvetica","normal"); doc.setTextColor(140,140,140); doc.setFontSize(6.5);
          doc.text(`${Math.round((e.amount/maxSav)*100)}%`, tX+tW-18, ty+4, {align:"right"});
          ty += 8;
        });

        // Total savings to date
        y = Math.max(y + donutR * 2 + 6, ty + 2);
        space(10);
        doc.setFillColor(232,244,255); doc.roundedRect(mg, y, cW, 10, 2, 2, "F");
        doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(30,80,160);
        doc.text("Total ahorrado hasta la fecha:", mg+4, y+6.5);
        doc.setFont("helvetica","bold");
        doc.text(fmt(totalSavings), W-mg-4, y+6.5, { align:"right" });
        y += 14;
      } else {
        doc.setFontSize(8); doc.setTextColor(160,160,160);
        doc.text("Sin ahorros registrados este mes", mg, y+4); y += 10;
      }

      // ════════════════════════════════════════════════════════════════════════
      // SECCIÓN — GASTOS FIJOS
      // ════════════════════════════════════════════════════════════════════════
      space(20);
      sectionTitle("Gastos fijos", "#BA7517");

      // Summary paid / pending
      space(14);
      const fixPaidPct = fixedTotal > 0 ? Math.round((paidFixed/fixedTotal)*100) : 0;
      const nPaid = data.fixedExpenses.filter(e=>e.paid).length;
      const nPend = data.fixedExpenses.length - nPaid;

      // Two summary boxes
      const sfW = (cW - 6) / 2;
      [
        { label:"Cobrados", value: fmt(paidFixed), sub: `${nPaid} concepto${nPaid!==1?"s":""}`, color:"#1D9E75" },
        { label:"Pendientes", value: fmt(pendFixed), sub: `${nPend} concepto${nPend!==1?"s":""}`, color: pendFixed>0?"#E24B4A":"#888" },
      ].forEach((box, i) => {
        const bx = mg + i*(sfW+6);
        const [r,g,b] = hexToRgb(box.color);
        doc.setFillColor(247,252,247); doc.setDrawColor(r,g,b);
        doc.setLineWidth(0.4);
        doc.roundedRect(bx, y, sfW, 14, 2, 2, "FD");
        doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(100,100,100);
        doc.text(box.label.toUpperCase(), bx+5, y+5);
        doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(r,g,b);
        doc.text(box.value, bx+5, y+12);
        doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(140,140,140);
        doc.text(box.sub, bx+sfW-4, y+12, { align:"right" });
      });
      y += 18;

      // Progress bar paid
      if (fixedTotal > 0) {
        space(10);
        doc.setFillColor(235,235,235); doc.roundedRect(mg, y, cW, 5, 1,1,"F");
        doc.setFillColor(29,158,117);
        doc.roundedRect(mg, y, (paidFixed/fixedTotal)*cW, 5, 1,1,"F");
        doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(80,80,80);
        doc.text(`${fixPaidPct}% cobrado`, W-mg, y+4, { align:"right" });
        y += 10;
      }

      // Table
      if (data.fixedExpenses.length > 0) {
        space(16);
        tableHeader([
          { label:"CONCEPTO", x: mg+2 },
          { label:"FECHA",    x: mg+cW*0.58 },
          { label:"ESTADO",   x: mg+cW*0.72 },
          { label:"IMPORTE",  x: W-mg-2, align:"right" },
        ]);
        data.fixedExpenses
          .sort((a,b)=>(b.date||"").localeCompare(a.date||""))
          .forEach((e, i) => {
            space(8);
            tableRow([
              { text: e.name.length>32?e.name.slice(0,31)+"…":e.name, x: mg+2 },
              { text: e.date?e.date.split("-").reverse().slice(0,2).join("/"):"", x: mg+cW*0.58, color:"#888" },
              { text: e.paid?"✓ Cobrado":"Pendiente", x: mg+cW*0.72, color: e.paid?"#1D9E75":"#E24B4A", bold:true },
              { text: "-"+fmt(e.amount), x: W-mg-2, align:"right", color:"#BA7517", bold:true },
            ], i);
          });
        y += 4;
      }

      // ════════════════════════════════════════════════════════════════════════
      // SECCIÓN — GASTOS VARIABLES
      // ════════════════════════════════════════════════════════════════════════
      space(20);
      sectionTitle("Gastos variables", "#E24B4A");

      // Category data
      const catSpend: Record<string, number> = {};
      for (const e of data.varExpenses) {
        const c = e.category || "Otro";
        catSpend[c] = (catSpend[c]||0) + e.amount;
      }
      const catEntries = Object.entries(catSpend).sort((a,b)=>b[1]-a[1]);
      const maxCat = catEntries[0]?.[1] || 1;

      // Global budget status
      const gBudget = data.varBudget ?? 0;
      const gOver   = gBudget > 0 && varTotal > gBudget;
      const gPct    = gBudget > 0 ? Math.round((varTotal/gBudget)*100) : 0;

      if (gBudget > 0) {
        space(16);
        doc.setFillColor(gOver?255:235, gOver?240:248, gOver?240:235);
        doc.setDrawColor(gOver?200:180, gOver?0:200, gOver?0:180);
        doc.setLineWidth(0.4);
        doc.roundedRect(mg, y, cW, 12, 2,2,"FD");
        doc.setFontSize(8); doc.setFont("helvetica","normal");
        doc.setTextColor(gOver?180:60, gOver?0:100, gOver?0:60);
        doc.text(
          gOver
            ? `⚠ Presupuesto superado · ${fmt(varTotal)} de ${fmt(gBudget)} (+${fmt(varTotal-gBudget)})`
            : `✓ Dentro del presupuesto · ${fmt(varTotal)} de ${fmt(gBudget)} (${gPct}%)`,
          mg+5, y+7.5
        );
        y += 16;
      }

      // Category budgets compliance
      if (catEntries.length > 0) {
        space(12);
        doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(80,80,80);
        doc.text("Gasto por categoría", mg, y); y += 7;

        catEntries.forEach(([cat, amount], i) => {
          space(10);
          const catBudget = categoryBudgets.find(b=>b.category===cat);
          const bAmt   = catBudget?.budget || 0;
          const isOver = bAmt > 0 && amount > bAmt;
          const barClr = isOver ? "#E24B4A" : bAmt > 0 && amount/bAmt >= 0.8 ? "#BA7517" : PALETTE[i%PALETTE.length];
          hBar(cat, amount, bAmt > 0 ? bAmt : maxCat, barClr, mg, cW);
        });

        // Donut
        space(donutBlock(y));
        y += 6;
        const donutR2 = 20, donutCX2 = mg + donutR2 + 2, donutCY2 = y + donutR2 + 2;
        const dSlices = catEntries.map(([,v],i) => ({ pct: v/varTotal, color: PALETTE[i%PALETTE.length] }));
        donut(donutCX2, donutCY2, donutR2, dSlices);
        doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(140,40,40);
        doc.text(fmt(varTotal), donutCX2, donutCY2+2.5, { align:"center" });

        // Legend
        const tX2 = mg + donutR2*2+10, tW2 = W-mg-tX2;
        let ty2 = y;
        catEntries.forEach(([cat, amount], i) => {
          space(8);
          const [r,g,b] = hexToRgb(PALETTE[i%PALETTE.length]);
          const bEntry = categoryBudgets.find(b=>b.category===cat);
          doc.setFillColor(r,g,b); doc.rect(tX2, ty2, 3, 5, "F");
          doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(40,40,40);
          doc.text(cat, tX2+5, ty2+4);
          doc.setFont("helvetica","bold"); doc.setTextColor(r,g,b);
          doc.text("-"+fmt(amount), tX2+tW2, ty2+4, { align:"right" });
          if (bEntry) {
            const isOv = amount > bEntry.budget;
            doc.setFontSize(6.5); doc.setFont("helvetica","normal");
            doc.setTextColor(isOv?200:100, isOv?0:140, isOv?0:100);
            doc.text(`límite: ${fmt(bEntry.budget)} ${isOv?"↑":"✓"}`, tX2+tW2-22, ty2+4, {align:"right"});
          }
          ty2 += 8;
        });
        y = Math.max(y + donutR2*2+8, ty2+4);
      }

      // Detail table
      if (data.varExpenses.length > 0) {
        space(20);
        doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(80,80,80);
        doc.text("Detalle de movimientos", mg, y); y += 7;
        tableHeader([
          { label:"CONCEPTO",    x: mg+2 },
          { label:"CAT.",        x: mg+cW*0.45 },
          { label:"NOTA",        x: mg+cW*0.62 },
          { label:"IMPORTE",     x: W-mg-2, align:"right" },
        ]);
        data.varExpenses
          .sort((a,b)=>(b.date||"").localeCompare(a.date||""))
          .forEach((e, i) => {
            space(8);
            tableRow([
              { text: e.name.length>26?e.name.slice(0,25)+"…":e.name, x: mg+2 },
              { text: e.category||"", x: mg+cW*0.45, color:"#555" },
              { text: e.notes ? (e.notes.length>18?e.notes.slice(0,17)+"…":e.notes) : "", x: mg+cW*0.62, color:"#999" },
              { text: "-"+fmt(e.amount), x: W-mg-2, align:"right", color:"#E24B4A", bold:true },
            ], i);
          });
        y += 4;
      }

      // ── Footer on every page ─────────────────────────────────────────────────
      const nPages = (doc as unknown as { internal: { getNumberOfPages: ()=>number } }).internal.getNumberOfPages();
      for (let p = 1; p <= nPages; p++) {
        doc.setPage(p);
        doc.setFillColor(245,250,245); doc.rect(0, H-10, W, 10, "F");
        doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(160,160,160);
        doc.text(`Finanzas · ${MONTH_NAMES[month]} ${year}`, mg, H-3.5);
        doc.text(`Página ${p} / ${nPages}`, W-mg, H-3.5, { align:"right" });
      }

      doc.save(`finanzas-${year}-${String(month+1).padStart(2,"0")}.pdf`);
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

// estimate space needed for donut block
function donutBlock(y: number) { void y; return 50; }

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
