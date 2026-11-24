'use client';

import React from 'react';

interface FormattedMessageProps {
  content: string;
  onExportPdf?: (title: string, htmlContent: string) => void;
}

export default function FormattedMessage({ content, onExportPdf }: FormattedMessageProps) {
  // Función para renderizar tablas Markdown como elementos HTML estilizados
  const renderContent = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];
    let tableKey = 0;

    const flushTable = () => {
      if (tableHeaders.length > 0 && tableRows.length > 0) {
        const currentHeaders = [...tableHeaders];
        const currentRows = [...tableRows];
        const currentKey = `table-${tableKey++}`;

        elements.push(
          <div key={currentKey} className="my-3 overflow-hidden rounded-xl border border-cyan-500/30 bg-slate-950/70 shadow-lg shadow-black/40">
            {/* Barra superior de la tabla con botón de exportar PDF */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px]">
              <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h18v18H3z" />
                  <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
                </svg>
                Matriz Comparativa de Datos
              </span>
              {onExportPdf && (
                <button
                  type="button"
                  onClick={() => {
                    const tableHtml = generateTableHtml(currentHeaders, currentRows);
                    onExportPdf('Informe Econométrico — Tarify OS', tableHtml);
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-[10px] font-medium transition"
                  title="Descargar esta tabla en PDF oficial"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  Exportar PDF
                </button>
              )}
            </div>

            {/* Tabla Responsive */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-slate-900/90 text-cyan-200 font-semibold border-b border-slate-800">
                  <tr>
                    {currentHeaders.map((h, i) => (
                      <th key={i} className="px-3 py-2 whitespace-nowrap text-[11px] tracking-wide">
                        {h.replace(/\*\*/g, '').trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {currentRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx % 2 === 0 ? 'bg-slate-950/40 hover:bg-cyan-950/20 transition' : 'bg-slate-900/30 hover:bg-cyan-950/20 transition'}
                    >
                      {row.map((cell, cIdx) => {
                        const cleanCell = cell.trim();
                        const isBold = cleanCell.startsWith('**') && cleanCell.endsWith('**');
                        const text = cleanCell.replace(/\*\*/g, '');
                        return (
                          <td key={cIdx} className={`px-3 py-2 text-[11px] whitespace-nowrap ${isBold ? 'font-bold text-white' : 'text-slate-300'}`}>
                            {text}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
        tableHeaders = [];
        tableRows = [];
        inTable = false;
      }
    };

    let idx = 0;
    while (idx < lines.length) {
      const line = lines[idx];
      const trimmed = line.trim();

      // Detección de Tabla Markdown (| Col 1 | Col 2 |)
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const cells = trimmed
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());

        // Si es la línea de separación (|---|---|)
        if (cells.every((c) => /^[-:]+$/.test(c))) {
          // Separador, no lo agregamos a las filas
          inTable = true;
        } else if (!inTable && tableHeaders.length === 0) {
          tableHeaders = cells;
        } else {
          tableRows.push(cells);
        }
        idx++;
        continue;
      } else if (inTable || tableHeaders.length > 0) {
        flushTable();
      }

      // Detección de Fórmulas Matemáticas ($$...$$)
      if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
        const mathContent = trimmed.slice(2, -2).trim();
        elements.push(
          <div key={`math-${idx}`} className="my-2.5 p-3 rounded-xl bg-slate-950/80 border border-indigo-500/30 shadow-inner">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-indigo-300 mb-1 flex items-center gap-1">
              <svg className="w-3 h-3 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="4 7 4 4 20 4 20 7" />
                <line x1="9" y1="20" x2="15" y2="20" />
                <line x1="12" y1="4" x2="12" y2="20" />
              </svg>
              Fórmula Regulatoria Homologada
            </div>
            <div className="font-mono text-xs text-amber-200 overflow-x-auto py-1">
              {mathContent}
            </div>
          </div>
        );
        idx++;
        continue;
      }

      // Encabezados Markdown
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={`h3-${idx}`} className="text-sm font-bold text-cyan-300 mt-3 mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-3.5 bg-cyan-400 rounded-sm" />
            {trimmed.replace('### ', '')}
          </h4>
        );
        idx++;
        continue;
      }

      if (trimmed.startsWith('#### ')) {
        elements.push(
          <h5 key={`h4-${idx}`} className="text-xs font-bold text-sky-200 mt-2 mb-1">
            {trimmed.replace('#### ', '')}
          </h5>
        );
        idx++;
        continue;
      }

      // Bloques de cita (avisos)
      if (trimmed.startsWith('> ')) {
        elements.push(
          <div key={`bq-${idx}`} className="my-2 px-3 py-2 rounded-lg border-l-2 border-amber-400 bg-amber-500/10 text-[11px] text-amber-200">
            {formatInlineText(trimmed.replace(/^> /, ''))}
          </div>
        );
        idx++;
        continue;
      }

      // Viñetas Markdown
      if (trimmed.startsWith('- ')) {
        const bulletText = trimmed.replace(/^- /, '');
        elements.push(
          <div key={`li-${idx}`} className="flex items-start gap-2 my-1 text-xs text-slate-300 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
            <div>{formatInlineText(bulletText)}</div>
          </div>
        );
        idx++;
        continue;
      }

      // Párrafos normales
      if (trimmed.length > 0) {
        elements.push(
          <p key={`p-${idx}`} className="my-1.5 text-xs text-slate-200 leading-relaxed">
            {formatInlineText(trimmed)}
          </p>
        );
      } else {
        elements.push(<div key={`sp-${idx}`} className="h-1" />);
      }

      idx++;
    }

    if (tableHeaders.length > 0 && tableRows.length > 0) {
      flushTable();
    }

    return elements;
  };

  // Helper para negritas inline (**texto**)
  const formatInlineText = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Generador de HTML limpio para impresión de reporte PDF oficial
  const generateTableHtml = (headers: string[], rows: string[][]) => {
    return `
      <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-family: sans-serif; font-size: 11px;">
        <thead>
          <tr style="background-color: #0f172a; color: #38bdf8; text-align: left;">
            ${headers.map((h) => `<th style="padding: 8px 12px; border: 1px solid #334155;">${h.replace(/\*\*/g, '').trim()}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r, idx) => `
            <tr style="background-color: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'}; color: #0f172a;">
              ${r.map((c) => `<td style="padding: 7px 12px; border: 1px solid #cbd5e1;">${c.replace(/\*\*/g, '').trim()}</td>`).join('')}
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  };

  return <div className="space-y-0.5">{renderContent()}</div>;
}
