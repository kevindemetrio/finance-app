"use client";

import { useState } from "react";
import { Category, CategoryBudget, Entry, MonthData, fmtEur } from "../lib/data";

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const CAT_COLORS: Record<string, string> = {
  "Alimentación": "#0F6E56", "Ocio": "#A32D2D", "Tecnología": "#3B6D11",
  "Transporte": "#185FA5", "Hogar": "#185FA5", "Salud": "#0F6E56",
  "Ropa": "#993556", "Regalos": "#993556", "Educación": "#3B6D11",
  "Viajes": "#854F0B", "Otro": "#5F5E5A",
};

const DONUT_COLORS = ["#E24B4A","#BA7517","#378ADD","#1D9E75","#7F77DD","#D85A30","#D4537E","#639922","#888780"];

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
      // Dynamically import jsPDF to avoid SSR issues
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const W = 210, H = 297;
      const margin = 16;
      const contentW = W - margin * 2;
      let y = 0;

      // ── Helpers ─────────────────────────────────────────────────────────────
      const fmt = (n: number) => Math.abs(n).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

      function newPage() {
        doc.addPage();
        y = margin;
        // Subtle top bar
        doc.setFillColor(29, 158, 117);
        doc.rect(0, 0, W, 1.5, "F");
      }

      function ensureSpace(needed: number) {
        if (y + needed > H - margin) newPage();
      }

      // ── Cover / Header ───────────────────────────────────────────────────────
      // Green top bar
      doc.setFillColor(29, 158, 117);
      doc.rect(0, 0, W, 42, "F");

      // Logo circle
      doc.setFillColor(255, 255, 255, 0.15);
      doc.setDrawColor(255, 255, 255);
      doc.circle(margin + 8, 21, 8, "D");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("€", margin + 8, 24.5, { align: "center" });

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Finanzas", margin + 20, 18);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(255, 255, 255);
      doc.text(`Informe mensual · ${MONTH_NAMES[month]} ${year}`, margin + 20, 26);

      // Date generated
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(`Generado el ${new Date().toLocaleDateString("es-ES")}`, W - margin, 26, { align: "right" });

      y = 52;

      // ── Summary metrics ──────────────────────────────────────────────────────
      const incomeTotal = data.incomes.reduce((a, i) => a + i.amount, 0);
      const fixedTotal  = data.fixedExpenses.reduce((a, i) => a + i.amount, 0);
      const varTotal    = data.varExpenses.reduce((a, i) => a + i.amount, 0);
      const savTotal    = data.savingsEntries.reduce((a, i) => a + i.amount, 0);
      const balance     = incomeTotal - fixedTotal - varTotal - savTotal;

      const metrics = [
        { label: "Ingresos",      value: fmt(incomeTotal), color: "#1D9E75" as const },
        { label: "Gastos fijos",  value: fmt(fixedTotal),  color: "#BA7517" as const },
        { label: "Variables",     value: fmt(varTotal),    color: "#E24B4A" as const },
        { label: "Ahorros",       value: fmt(savTotal),    color: "#378ADD" as const },
        { label: "Balance",       value: fmt(balance),     color: balance >= 0 ? "#1D9E75" as const : "#E24B4A" as const },
        { label: "Ahorro total",  value: fmt(totalSavings),color: "#378ADD" as const },
      ];

      const boxW = (contentW - 8) / 3;
      const boxH = 20;
      metrics.forEach((m, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const bx = margin + col * (boxW + 4);
        const by = y + row * (boxH + 4);

        doc.setFillColor(248, 250, 248);
        doc.setDrawColor(220, 230, 220);
        doc.roundedRect(bx, by, boxW, boxH, 3, 3, "FD");

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120, 140, 120);
        doc.text(m.label.toUpperCase(), bx + 5, by + 6);

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(m.color);
        doc.text(m.value, bx + 5, by + 14);
      });

      y += boxH * 2 + 4 + 8;

      // ── Gastos variables por categoría ───────────────────────────────────────
      const catSpending: Record<string, number> = {};
      for (const e of data.varExpenses) {
        const cat = e.category || "Otro";
        catSpending[cat] = (catSpending[cat] || 0) + e.amount;
      }
      const catEntries = Object.entries(catSpending).sort((a, b) => b[1] - a[1]);

      if (catEntries.length > 0) {
        ensureSpace(60);

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 58, 95);
        doc.text("Gastos variables por categoría", margin, y);
        y += 7;

        // Simple horizontal bars
        const maxCat = catEntries[0][1];
        const barMaxW = contentW - 60;

        catEntries.forEach(([cat, amount], i) => {
          ensureSpace(10);
          const color = DONUT_COLORS[i % DONUT_COLORS.length];
          const barW = Math.max((amount / maxCat) * barMaxW, 2);
          const budget = categoryBudgets.find(b => b.category === cat as Category);

          // Category name
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 60, 60);
          doc.text(cat, margin, y + 3.5);

          // Bar background
          doc.setFillColor(240, 240, 240);
          doc.roundedRect(margin + 32, y, barMaxW, 5, 1, 1, "F");

          // Bar fill
          const [r, g, b] = hexToRgb(color);
          doc.setFillColor(r, g, b);
          doc.roundedRect(margin + 32, y, barW, 5, 1, 1, "F");

          // Budget limit line
          if (budget && budget.budget > 0) {
            const limitX = margin + 32 + (budget.budget / maxCat) * barMaxW;
            if (limitX <= margin + 32 + barMaxW) {
              doc.setDrawColor(180, 0, 0);
              doc.setLineWidth(0.4);
              doc.line(limitX, y - 1, limitX, y + 6);
            }
          }

          // Amount
          doc.setFontSize(7.5);
          doc.setTextColor(60, 60, 60);
          doc.text(fmt(amount), W - margin, y + 4, { align: "right" });

          // Over budget warning
          if (budget && budget.budget > 0 && amount > budget.budget) {
            doc.setFontSize(6.5);
            doc.setTextColor(180, 0, 0);
            doc.text(`+${fmt(amount - budget.budget)} sobre límite`, W - margin - 24, y + 4, { align: "right" });
          }

          y += 9;
        });

        y += 4;
      }

      // ── Gastos fijos ─────────────────────────────────────────────────────────
      if (data.fixedExpenses.length > 0) {
        ensureSpace(20 + data.fixedExpenses.length * 8);

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 58, 95);
        doc.text("Gastos fijos", margin, y);
        y += 6;

        // Header row
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y, contentW, 6, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text("CONCEPTO", margin + 2, y + 4);
        doc.text("FECHA", margin + contentW * 0.55, y + 4);
        doc.text("ESTADO", margin + contentW * 0.72, y + 4);
        doc.text("IMPORTE", W - margin - 2, y + 4, { align: "right" });
        y += 7;

        data.fixedExpenses
          .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
          .forEach((e, i) => {
            ensureSpace(8);
            if (i % 2 === 0) {
              doc.setFillColor(252, 252, 252);
              doc.rect(margin, y - 1, contentW, 7, "F");
            }
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(40, 40, 40);
            doc.text(e.name, margin + 2, y + 4);
            doc.setTextColor(120, 120, 120);
            doc.text(e.date ? e.date.split("-").reverse().slice(0, 2).join("/") : "", margin + contentW * 0.55, y + 4);
            if (e.paid) {
              doc.setTextColor(29, 158, 117);
              doc.text("✓ Cobrado", margin + contentW * 0.72, y + 4);
            } else {
              doc.setTextColor(180, 60, 60);
              doc.text("Pendiente", margin + contentW * 0.72, y + 4);
            }
            doc.setTextColor(186, 117, 23);
            doc.setFont("helvetica", "bold");
            doc.text(`-${fmt(e.amount)}`, W - margin - 2, y + 4, { align: "right" });
            y += 7;
          });

        y += 4;
      }

      // ── Gastos variables detalle ─────────────────────────────────────────────
      if (data.varExpenses.length > 0) {
        ensureSpace(20 + Math.min(data.varExpenses.length, 10) * 8);

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 58, 95);
        doc.text("Gastos variables", margin, y);
        y += 6;

        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y, contentW, 6, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text("CONCEPTO", margin + 2, y + 4);
        doc.text("CATEGORÍA", margin + contentW * 0.5, y + 4);
        doc.text("NOTA", margin + contentW * 0.72, y + 4);
        doc.text("IMPORTE", W - margin - 2, y + 4, { align: "right" });
        y += 7;

        data.varExpenses
          .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
          .forEach((e, i) => {
            ensureSpace(8);
            if (i % 2 === 0) {
              doc.setFillColor(252, 252, 252);
              doc.rect(margin, y - 1, contentW, 7, "F");
            }
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(40, 40, 40);
            doc.text(e.name.length > 28 ? e.name.slice(0, 27) + "…" : e.name, margin + 2, y + 4);

            if (e.category) {
              const catHex = CAT_COLORS[e.category] || "#5F5E5A";
              const [cr, cg, cb] = hexToRgb(catHex);
              doc.setTextColor(cr, cg, cb);
              doc.text(e.category, margin + contentW * 0.5, y + 4);
            }

            if (e.notes) {
              doc.setTextColor(150, 150, 150);
              doc.setFontSize(7);
              const note = e.notes.length > 22 ? e.notes.slice(0, 21) + "…" : e.notes;
              doc.text(note, margin + contentW * 0.72, y + 4);
            }

            doc.setFontSize(8);
            doc.setTextColor(226, 75, 74);
            doc.setFont("helvetica", "bold");
            doc.text(`-${fmt(e.amount)}`, W - margin - 2, y + 4, { align: "right" });
            y += 7;
          });

        y += 4;
      }

      // ── Ingresos ─────────────────────────────────────────────────────────────
      if (data.incomes.length > 0) {
        ensureSpace(20 + data.incomes.length * 8);

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 58, 95);
        doc.text("Ingresos", margin, y);
        y += 6;

        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y, contentW, 6, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text("CONCEPTO", margin + 2, y + 4);
        doc.text("FECHA", W - margin - 40, y + 4);
        doc.text("IMPORTE", W - margin - 2, y + 4, { align: "right" });
        y += 7;

        data.incomes.forEach((e, i) => {
          ensureSpace(8);
          if (i % 2 === 0) {
            doc.setFillColor(252, 252, 252);
            doc.rect(margin, y - 1, contentW, 7, "F");
          }
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(40, 40, 40);
          doc.text(e.name, margin + 2, y + 4);
          doc.setTextColor(120, 120, 120);
          doc.text(e.date ? e.date.split("-").reverse().slice(0, 2).join("/") : "", W - margin - 40, y + 4);
          doc.setTextColor(29, 158, 117);
          doc.setFont("helvetica", "bold");
          doc.text(`+${fmt(e.amount)}`, W - margin - 2, y + 4, { align: "right" });
          y += 7;
        });

        y += 4;
      }

      // ── Footer on each page ──────────────────────────────────────────────────
      const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(248, 252, 248);
        doc.rect(0, H - 10, W, 10, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(160, 160, 160);
        doc.text(`Finanzas · ${MONTH_NAMES[month]} ${year}`, margin, H - 3.5);
        doc.text(`Página ${p} de ${totalPages}`, W - margin, H - 3.5, { align: "right" });
      }

      doc.save(`finanzas-${year}-${String(month + 1).padStart(2, "0")}.pdf`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={generatePdf}
      disabled={loading}
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

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function PdfIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}
