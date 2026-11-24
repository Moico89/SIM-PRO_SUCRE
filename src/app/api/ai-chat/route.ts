/**
 * API Route: Asistente IA Regulatorio Tarify OS
 * Endpoint: POST /api/ai-chat
 *
 * Flujo:
 *  1. Gemini (modelos disponibles para la API key) con Function Calling multi-paso
 *     grounded en el Motor de Cálculo Tarifario Universal.
 *  2. Reintento con backoff ante 503/429 y rotación de modelos.
 *  3. Fallback offline determinista (solo si Gemini no responde), marcado como tal.
 *
 * Decisión técnica: gemini-2.5-flash / 1.5-flash devuelven 404 para claves nuevas
 * (verificado vía ListModels el 2026-10-06), por eso se usan los IDs vigentes.
 */

import { NextResponse } from 'next/server';
import { AI_TOOLS_DECLARATIONS, executeAiTool } from '@/lib/ai/tools';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
];
const MAX_TOOL_ITERATIONS = 4;
const RETRYABLE_STATUS = new Set([429, 500, 503, 504]);

const SYSTEM_PROMPT = `Eres Tarify AI, asistente econométrico y regulatorio de Tarify OS (SaaS de gobernanza tarifaria de transporte urbano). Tenant activo: GAM Sucre (moneda Bs.).

Contexto del sistema:
- Flota 987 microbuses Nissan Civilian diésel (Bs. 20,57/litro según D.S. 5716 / ANH), 82.475 km/día, 265.569 pax/día, 26 días/mes.
- Costo regulatorio total: Bs. 19.951,22/mes por unidad. Tarifa técnica adulto: Bs. 3,66. Ponderada técnica: Bs. 2,8519.
- Escenarios de concertación: Social 1 (Bs. 3,80), Social 2 (Bs. 3,50), Social 3 (Bs. 4,00, ACCESIBLE), Técnica (Bs. 3,66), Vigente (Bs. 4,50), Estrés (demanda -10%, diésel +15%).

Reglas obligatorias:
1. Responde EXACTAMENTE a la pregunta del usuario. No cambies de tema ni repitas explicaciones no pedidas.
2. Si mencionan un escenario o una tarifa propuesta, invoca evaluar_escenario (puedes invocarlo varias veces para comparar escenarios) y argumenta con sus cifras: cobertura de costo, beneficio económico, caja libre, ingreso familiar, brecha vs técnica y veredicto.
3. Si piden comparar tecnologías o simular combustible/demanda/salario/flota, usa las herramientas correspondientes; nunca inventes números.
4. Si el usuario da una opinión (ej. "Social 1 es la aplicable"), evalúala críticamente con datos: indica fortalezas, riesgos y contrástala con al menos otro escenario.
5. Formato: markdown sobrio, encabezados ###, tablas markdown para cifras, sin emojis, sin LaTeX (escribe fórmulas en texto plano). Moneda con formato Bs. 1.234,56.
6. Cierra con una recomendación concreta en 1-2 líneas.`;

const logEvent = (step: string, data: Record<string, unknown>) =>
  console.log(JSON.stringify({ scope: 'ai-chat', step, ts: new Date().toISOString(), ...data }));

async function callGemini(
  model: string,
  apiKey: string,
  contents: GeminiContent[]
): Promise<{ ok: true; content: GeminiContent } | { ok: false; status: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout per call

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          tools: [
            {
              functionDeclarations: AI_TOOLS_DECLARATIONS.map((t) => ({
                name: t.name,
                description: t.description,
                parameters: t.parameters,
              })),
            },
          ],
          generationConfig: { temperature: 0.3 },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) return { ok: false, status: response.status };
    const data = (await response.json()) as { candidates?: Array<{ content?: GeminiContent }> };
    const content = data.candidates?.[0]?.content;
    if (!content?.parts) return { ok: false, status: 502 };
    return { ok: true, content: { role: 'model', parts: content.parts } };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if ((err as { name?: string }).name === 'AbortError') {
      return { ok: false, status: 504 }; // Gateway Timeout pseudo-status
    }
    return { ok: false, status: 500 };
  }
}

/** Ejecuta el bucle agéntico completo (modelo → herramientas → modelo) para un modelo dado */
async function runAgentLoop(model: string, apiKey: string, history: GeminiContent[]): Promise<string | null> {
  const contents = [...history];

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    let result = await callGemini(model, apiKey, contents);

    // Un reintento con backoff ante saturación transitoria
    if (!result.ok && RETRYABLE_STATUS.has(result.status)) {
      await new Promise((r) => setTimeout(r, 1200));
      result = await callGemini(model, apiKey, contents);
    }
    if (!result.ok) {
      logEvent('model_error', { model, iteration, status: result.status });
      return null;
    }

    const calls = result.content.parts.filter((p) => p.functionCall);
    if (calls.length === 0) {
      const text = result.content.parts.map((p) => p.text ?? '').join('').trim();
      return text || null;
    }

    contents.push(result.content);
    const responses: GeminiPart[] = [];
    for (const part of calls) {
      const { name, args } = part.functionCall!;
      try {
        const toolResult = await executeAiTool(name, args ?? {});
        logEvent('tool_ok', { model, tool: name, args });
        responses.push({ functionResponse: { name, response: { result: toolResult } } });
      } catch (toolErr) {
        const message = toolErr instanceof Error ? toolErr.message : 'error desconocido';
        logEvent('tool_error', { model, tool: name, args, message });
        responses.push({ functionResponse: { name, response: { error: message } } });
      }
    }
    contents.push({ role: 'user', parts: responses });
  }

  logEvent('max_iterations', { model });
  return null;
}

// ─── Fallback offline ─────────────────────────────────────────────────────────

const fmtBs = (n: unknown) =>
  `Bs. ${Number(n).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const SCENARIO_PATTERNS: Array<{ id: string; re: RegExp }> = [
  { id: 'social1', re: /social\s*1|social\s*uno|3[.,]80/ },
  { id: 'social2', re: /social\s*2|social\s*dos|3[.,]50/ },
  { id: 'social3', re: /social\s*3|social\s*tres|4[.,]00/ },
  { id: 'technical', re: /escenario\s*t[ée]cnic|tarifa\s*t[ée]cnica\s*como\s*escenario/ },
  { id: 'current', re: /vigente|4[.,]50/ },
  { id: 'stress', re: /estr[ée]s/ },
];

async function offlineScenarioAnswer(promptLower: string): Promise<string | null> {
  const ids = SCENARIO_PATTERNS.filter((p) => p.re.test(promptLower)).map((p) => p.id);
  if (ids.length === 0) return null;

  // Siempre contrastar con Social 2 (recomendado) y Técnica para dar contexto de decisión
  const compareIds = Array.from(new Set([...ids, 'social2', 'technical']));
  const evals = (await Promise.all(
    compareIds.map((id) => executeAiTool('evaluar_escenario', { scenario_id: id }))
  )) as Array<Record<string, unknown>>;
  const main = evals[0];

  const table = `| Escenario | Tarifa Adulto | Ponderada | Recaudación/mes | Cobertura Costo | Beneficio Económico | Ingreso Familiar |
|---|---|---|---|---|---|---|
${evals
  .map(
    (e) =>
      `| **${e.escenario}** | ${fmtBs(e.tarifa_adulto)} | ${fmtBs(e.tarifa_ponderada_escenario)} | ${fmtBs(e.recaudacion_mensual_unidad)} | ${e.cobertura_costo_regulatorio_pct}% | ${fmtBs(e.beneficio_economico_mensual)} | ${fmtBs(e.ingreso_familiar_operador)} |`
  )
  .join('\n')}`;

  return `### Evaluación del escenario ${main.escenario}

| Indicador | Valor |
|---|---|
| **Tarifa adulto propuesta** | ${fmtBs(main.tarifa_adulto)} |
| **Brecha vs tarifa técnica** | ${Number(main.brecha_vs_tecnica_bs) >= 0 ? '+' : ''}${fmtBs(main.brecha_vs_tecnica_bs)} |
| **Tarifa ponderada del escenario** | ${fmtBs(main.tarifa_ponderada_escenario)} |
| **Recaudación mensual por unidad** | ${fmtBs(main.recaudacion_mensual_unidad)} |
| **Costo regulatorio mensual** | ${fmtBs(main.costo_regulatorio_mensual)} |
| **Beneficio económico (tras WACC)** | ${fmtBs(main.beneficio_economico_mensual)} |
| **Caja libre del operador** | ${fmtBs(main.caja_libre_mensual)} |
| **Ingreso familiar del operador** | ${fmtBs(main.ingreso_familiar_operador)} |

**Veredicto**: ${main.veredicto}

#### Contraste con escenarios de referencia
${table}`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: ChatMessage[]; organizationSlug?: string };
    const messages = body.messages;
    const organizationSlug = body.organizationSlug ?? 'sucre';

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Mensajes requeridos' }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content ?? '';
    const promptLower = lastUserMessage.toLowerCase();
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    // ── MODO 1: Gemini con Function Calling multi-paso ──
    if (apiKey && apiKey.length > 10) {
      // Se omite el saludo inicial del asistente: Gemini exige que el historial empiece con 'user'
      const history: GeminiContent[] = messages
        .filter((m, idx) => !(idx === 0 && m.role === 'assistant'))
        .filter((m) => m.role !== 'system')
        .slice(-12)
        .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

      for (const model of CANDIDATE_MODELS) {
        try {
          const reply = await runAgentLoop(model, apiKey, history);
          if (reply) {
            logEvent('reply_ok', { model, organizationSlug, chars: reply.length });
            return NextResponse.json({ reply, source: `gemini:${model}` });
          }
        } catch (modelErr) {
          logEvent('model_exception', {
            model,
            message: modelErr instanceof Error ? modelErr.message : 'desconocido',
          });
        }
      }
      logEvent('all_models_failed', { organizationSlug });
    } else {
      logEvent('missing_api_key', { organizationSlug });
    }

    // ── MODO 2: Fallback offline determinista ──
    const offlineNotice =
      '\n\n> Modo offline: el modelo generativo no está disponible en este momento (alta demanda en Gemini). Respuesta calculada directamente por el motor tarifario; reintenta en unos minutos para análisis conversacional completo.';

    const scenarioReply = await offlineScenarioAnswer(promptLower);
    if (scenarioReply) {
      return NextResponse.json({ reply: scenarioReply + offlineNotice, source: 'offline-engine' });
    }

    if (/compar|el[ée]ctric|gnv|tecnolog/.test(promptLower)) {
      const res = (await executeAiTool('comparar_tecnologias', {
        technologies: [
          { label: 'Microbús Diésel (Nissan Civilian)', fuel_type: 'diesel', fuel_price: 20.57, fuel_efficiency: 5.5 },
          { label: 'Bus GNV', fuel_type: 'gnv', fuel_price: 1.66, fuel_efficiency: 4.8 },
          { label: 'Bus Eléctrico (BYD K7)', fuel_type: 'electric', fuel_price: 0.85, fuel_efficiency: 1.1, vehicle_replacement_value: 350000, maintenance_monthly: 1400 },
        ],
      })) as { comparativa: Array<Record<string, unknown>> };
      const reply = `### Comparativa tecnológica

| Tecnología | Tarifa Adulto | OPEX Mes | Costo Regulatorio | CO₂ |
|---|---|---|---|---|
${res.comparativa
  .map((c) => `| **${c.tecnologia}** | ${fmtBs(c.tarifa_adulto_tecnica)} | ${fmtBs(c.opex_total_mes)} | ${fmtBs(c.costo_regulatorio_mes)} | ${c.co2_kg_mes} kg/mes |`)
  .join('\n')}`;
      return NextResponse.json({ reply: reply + offlineNotice, source: 'offline-engine' });
    }

    const priceMatch = promptLower.match(/(?:di[ée]sel|combustible)[^\d]*(\d+(?:[.,]\d+)?)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(',', '.'));
      const [base, sim] = (await Promise.all([
        executeAiTool('calcular_tarifa', { fuel_type: 'diesel', fuel_price: 20.57 }),
        executeAiTool('calcular_tarifa', { fuel_type: 'diesel', fuel_price: price }),
      ])) as [Record<string, unknown>, Record<string, unknown>];
      const reply = `### Simulación: diésel a ${fmtBs(price)}/litro

| Indicador | Base (Bs. 20,57) | Simulado |
|---|---|---|
| **OPEX efectivo** | ${fmtBs(base.opex_efectivo_mensual)} | ${fmtBs(sim.opex_efectivo_mensual)} |
| **Costo regulatorio** | ${fmtBs(base.costo_regulatorio_total_mensual)} | ${fmtBs(sim.costo_regulatorio_total_mensual)} |
| **Tarifa ponderada técnica** | Bs. ${Number(base.tarifa_tecnica_ponderada).toFixed(4).replace('.', ',')} | Bs. ${Number(sim.tarifa_tecnica_ponderada).toFixed(4).replace('.', ',')} |
| **Tarifa adulto técnica** | ${fmtBs(base.tarifa_adulto_tecnica)} | **${fmtBs(sim.tarifa_adulto_tecnica)}** |`;
      return NextResponse.json({ reply: reply + offlineNotice, source: 'offline-engine' });
    }

    if (/escenario|cu[áa]nto|cu[áa]le|lista/.test(promptLower) && !/social\s*\d/.test(promptLower)) {
      const reply = `### Escenarios Disponibles
El modelo maneja actualmente los siguientes escenarios tarifarios:

| Escenario | Descripción | Tarifa Adulto |
|---|---|---|
| **Social 1** | Propuesta accesible | Bs. 4,00 |
| **Social 2** | Propuesta de consenso (Recomendado) | Bs. 3,50 |
| **Técnica** | Tarifa de equilibrio matemático puro (Diésel Bs. 20,57) | Bs. 3,66 |
| **Vigente** | Tarifa actual en operación | Bs. 4,50 |
| **Estrés** | Análisis de sensibilidad ante shocks (-10% / +15%) | Variado |

*Puedes pedirme evaluar escenarios específicos, por ejemplo: "¿Es viable Social 1?" o "Compara Social 1 con Social 2".*`;
      return NextResponse.json({ reply: reply + offlineNotice, source: 'offline-engine' });
    }

    if (/f[óo]rmula|3[.,]44|3[.,]66|desglose|c[óo]mo se calcula/.test(promptLower)) {
      const reply = `### Tarifa técnica de adulto: Bs. 3,66

Tarifa Adulto = Tarifa Ponderada Técnica × (Tarifa Adulto Vigente / Tarifa Ponderada Vigente)
= 2,8519 × (4,50 / 3,5050) = **Bs. 3,6615 → Bs. 3,66**

Tarifa Ponderada Técnica = Costo Regulatorio (Bs. 19.951,22) / Pasajeros por unidad-mes (6.995,74).`;
      return NextResponse.json({ reply: reply + offlineNotice, source: 'offline-engine' });
    }

    const reply = `No pude procesar esa consulta en modo offline. Puedo responder sin conexión a:
- Evaluación de escenarios: *"¿Es viable Social 1?"*, *"Compara Social 2 con Social 3"*
- Simulaciones: *"diésel a 22"*
- Comparativas: *"diésel vs eléctrico vs GNV"*
- Fórmula de la tarifa técnica${offlineNotice}`;
    return NextResponse.json({ reply, source: 'offline-engine' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    logEvent('handler_error', { message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
