'use server';

import { createClient } from '@/lib/supabase/server';
import type { ScenarioConfig } from '@/types/scenario';
import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const SCENARIOS_FILE = path.join(process.cwd(), 'data', 'scenarios.json');

import { OFFICIAL_SCENARIOS } from '@/data/officialScenarios';


function readServerFileScenarios(): ScenarioConfig[] {
  try {
    if (!fs.existsSync(SCENARIOS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(SCENARIOS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeServerFileScenarios(scenarios: ScenarioConfig[]) {
  try {
    const dir = path.dirname(SCENARIOS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SCENARIOS_FILE, JSON.stringify(scenarios, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error escribiendo escenarios en servidor:', err);
  }
}

export async function getSharedScenarios(): Promise<ScenarioConfig[]> {
  const customFromFile = readServerFileScenarios();
  
  // Intentar leer también de Supabase si está disponible
  let customFromDb: ScenarioConfig[] = [];
  try {
    const supabase = createClient();
    const { data } = await supabase.from('negotiation_scenarios').select('*');
    if (data && data.length > 0) {
      customFromDb = data.map((d: any) => ({
        id: d.id,
        label: d.label,
        badge: d.badge,
        adultFare: Number(d.adult_fare),
        socialFares: d.social_fares || {
          adultos: Number(d.adult_fare),
          adultosMayores: 3.0,
          universitarios: 2.0,
          colegiales: 1.0,
          escolares: 1.0,
          discapacidad: 0
        },
        demandFactor: Number(d.demand_factor || 1.0),
        fuelPriceFactor: Number(d.fuel_price_factor || 1.0),
        color: d.color || 'text-slate-800',
        isCustom: true
      }));
    }
  } catch {
    // Modo offline / sin tabla
  }

  // Mezclar: Oficiales + CustomFromFile + CustomFromDb sin duplicados
  const map = new Map<string, ScenarioConfig>();
  OFFICIAL_SCENARIOS.forEach(sc => map.set(sc.id, sc));
  customFromFile.forEach(sc => map.set(sc.id, sc));
  customFromDb.forEach(sc => map.set(sc.id, sc));

  return Array.from(map.values());
}

export async function saveSharedScenario(scenario: ScenarioConfig, userEmail: string = 'usuario'): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = readServerFileScenarios();
    const idx = existing.findIndex(s => s.id === scenario.id);
    const updatedScenario: ScenarioConfig = {
      ...scenario,
      isCustom: true
    };

    if (idx >= 0) {
      existing[idx] = updatedScenario;
    } else {
      existing.push(updatedScenario);
    }

    writeServerFileScenarios(existing);

    // Intentar replicar en Supabase
    try {
      const supabase = createClient();
      await supabase.from('negotiation_scenarios').upsert({
        id: scenario.id,
        label: scenario.label,
        badge: scenario.badge,
        adult_fare: scenario.adultFare,
        social_fares: scenario.socialFares,
        demand_factor: scenario.demandFactor,
        fuel_price_factor: scenario.fuelPriceFactor,
        created_by: userEmail,
        updated_at: new Date().toISOString()
      });
    } catch {}

    try {
      revalidatePath('/');
    } catch {}

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al guardar escenario compartido.';
    return { success: false, error: msg };
  }
}

export async function deleteSharedScenario(scenarioId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = readServerFileScenarios();
    const filtered = existing.filter(s => s.id !== scenarioId);
    writeServerFileScenarios(filtered);

    try {
      const supabase = createClient();
      await supabase.from('negotiation_scenarios').delete().eq('id', scenarioId);
    } catch {}

    try {
      revalidatePath('/');
    } catch {}

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar escenario.';
    return { success: false, error: msg };
  }
}
