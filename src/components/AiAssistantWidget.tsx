'use client';

import React, { useState, useRef, useEffect } from 'react';
import FormattedMessage from '@/components/FormattedMessage';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'Dame en pdf descargable toda la tabla con la justificación',
  'Comparar bus Diésel vs Eléctrico vs GNV',
  '¿Por qué la tarifa técnica de adulto es Bs. 3,44?',
  'Simular aumento del diésel a Bs. 20,00',
];

export default function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hola. Soy **Tarify AI**, el asistente econométrico y regulatorio de Tarify OS.\n\nPuedo calcular tarifas para cualquier modo de transporte y combustible (diésel, GNV, eléctrico, gasolina, hidrógeno), comparar tecnologías vehiculares o generar informes técnicos con tablas y justificación para descarga.\n\n¿Qué deseas analizar hoy?',
      timestamp: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isExpanded]);

  const handleSend = async (userText?: string) => {
    const textToSend = (userText || input).trim();
    if (!textToSend || isLoading) return;

    // Si la pregunta pide PDF o comparar, sugerimos automáticamente expandir la vista
    if (textToSend.toLowerCase().includes('pdf') || textToSend.toLowerCase().includes('comparar')) {
      setIsExpanded(true);
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          organizationSlug: 'sucre',
        }),
      });

      if (!res.ok) {
        throw new Error('Error al conectar con el asistente');
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Cálculo completado por el motor.',
        timestamp: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'No fue posible completar la simulación. Por favor verifica la conexión e intenta nuevamente.',
          timestamp: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Función de descarga e impresión de Dossier PDF Oficial
  const handleExportPdf = (title: string, tableHtml: string) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const printDoc = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @page { size: A4 portrait; margin: 18mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 11pt; line-height: 1.5; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
          .title { font-size: 16pt; font-weight: bold; color: #0369a1; margin: 0; }
          .subtitle { font-size: 10pt; color: #64748b; margin: 4px 0 0 0; }
          .meta { font-size: 9pt; color: #475569; text-align: right; }
          .callout { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 10px 14px; margin: 15px 0; font-size: 10pt; color: #166534; }
          .formula { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin: 15px 0; font-family: monospace; font-size: 10pt; color: #0f172a; }
          .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 8pt; color: #94a3b8; display: flex; justify-content: space-between; }
          .signatures { display: flex; justify-content: space-around; margin-top: 50px; }
          .sig-box { width: 200px; text-align: center; border-top: 1px solid #475569; padding-top: 5px; font-size: 9pt; }
          @media print {
            button { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">TARIFY OS — DOSSIER REGULATORIO OFICIAL</h1>
            <p class="subtitle">Gobierno Autónomo Municipal de Sucre & Ecotraffic Consultoría</p>
          </div>
          <div class="meta">
            <div><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-BO')}</div>
            <div><strong>Versión Motor:</strong> v4.0.0-universal</div>
            <div><strong>Estado:</strong> Certificado Oficial</div>
          </div>
        </div>

        <div class="callout">
          <strong>Dictamen Técnico:</strong> Este documento certifica la modelación econométrica oficial de costos de transporte urbano, homologando la tarifa técnica de adulto en <strong>Bs. 3,44</strong> para la flota tradicional Nissan Civilian y evaluando alternativas de transición energética (GNV y Eléctricos).
        </div>

        <h3>Matriz Económica y Estructura Tarifaria</h3>
        ${tableHtml}

        <div class="formula">
          <strong>FÓRMULA HOMOLOGADA:</strong><br>
          Tarifa Adulto = Tarifa Ponderada Técnica × (Tarifa Adulto Vigente / Tarifa Ponderada Vigente)<br>
          Tarifa Adulto = 2,681778 × (4,50 / 3,5050) = <strong>Bs. 3,44</strong>
        </div>

        <div class="signatures">
          <div class="sig-box">
            Ing. Rolando Párraga<br>
            <strong>Ecotraffic Consultoría</strong>
          </div>
          <div class="sig-box">
            Dirección de Transporte<br>
            <strong>GAM Sucre</strong>
          </div>
          <div class="sig-box">
            Delegado General<br>
            <strong>Sindicatos de Transporte</strong>
          </div>
        </div>

        <div class="footer">
          <span>Generado automáticamente por Tarify OS v4.0 SaaS</span>
          <span>Página 1 de 1</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printDoc);
    printWindow.document.close();
  };

  return (
    <>
      {/* Botón Flotante Launcher */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 text-white font-medium rounded-full shadow-2xl shadow-cyan-900/40 hover:shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all duration-300 border border-cyan-400/30"
            title="Abrir Asistente IA Tarify"
          >
            <span className="absolute -inset-0.5 rounded-full bg-cyan-400/30 blur opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse" />
            
            <svg
              className="w-5 h-5 relative z-10 text-cyan-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
              <path d="M18 14a6 6 0 0 1-12 0" />
              <path d="M12 20v2" />
              <path d="M8 22h8" />
              <circle cx="9" cy="6" r="1" fill="currentColor" />
              <circle cx="15" cy="6" r="1" fill="currentColor" />
            </svg>

            <span className="relative z-10 font-semibold text-sm tracking-wide">
              Tarify AI
            </span>
            <span className="relative z-10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur rounded-full text-cyan-100 border border-white/20">
              v4.0
            </span>
          </button>
        )}
      </div>

      {/* Ventana de Chat Flotante (Con soporte para vista Compacta o Expandida) */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700/70 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden transition-all duration-300 ${
            isExpanded
              ? 'w-[820px] max-w-[calc(100vw-2.5rem)] h-[720px] max-h-[calc(100vh-3.5rem)]'
              : 'w-[440px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[calc(100vh-4rem)]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
                <svg
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                  <path d="M18 14a6 6 0 0 1-12 0" />
                  <path d="M12 20v2" />
                  <path d="M8 22h8" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">Tarify AI</h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Motor Conectado
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Asistente Regulatorio & Multimodal</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Botón Maximizar / Modo Amplio para ver tablas perfectamente */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800 transition"
                title={isExpanded ? 'Reducir tamaño' : 'Maximizar para tablas anchas'}
              >
                {isExpanded ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 14h6m0 0v6m0-6L3 21M20 10h-6m0 0V4m0 6l7-7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Cerrar ventana"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto scrollbar-none flex gap-1.5">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-slate-800/70 hover:bg-cyan-900/40 hover:text-cyan-200 border border-slate-700/50 hover:border-cyan-500/40 rounded-full transition"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[96%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white font-medium shadow-md shadow-cyan-900/30 rounded-tr-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 shadow-md shadow-black/20 rounded-tl-none w-full'
                  }`}
                >
                  {m.role === 'user' ? (
                    <div className="whitespace-pre-wrap font-sans">{m.content}</div>
                  ) : (
                    <FormattedMessage content={m.content} onExportPdf={handleExportPdf} />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-slate-800/60 rounded-xl w-fit border border-slate-700/50">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse delay-75" />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-150" />
                <span className="text-xs text-slate-400 ml-1">Consultando motor econométrico universal...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-slate-950/80 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregunta o simula con Tarify AI (ej: diésel a 20, exportar pdf)..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-semibold rounded-xl shadow-md transition"
                title="Enviar mensaje"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
