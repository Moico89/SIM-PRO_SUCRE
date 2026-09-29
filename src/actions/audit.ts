'use server';

import { createClient } from '@/lib/supabase/server';
import type { AuditLog } from '@/types/database';

export async function getSessionAuditLogs(sessionId: string, limit: number = 25): Promise<{ success: boolean; data?: AuditLog[]; error?: string }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data as AuditLog[] };
}
