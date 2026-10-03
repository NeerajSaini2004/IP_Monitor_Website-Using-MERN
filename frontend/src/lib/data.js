import { requireSupabase } from './supabase';

function resultOrThrow({ data, error }) {
  if (error) throw error;
  return data;
}

export async function fetchDepartments() {
  return resultOrThrow(await requireSupabase().from('departments').select('*').order('dept'));
}

export async function fetchConfig() {
  const rows = resultOrThrow(await requireSupabase().from('config').select('key,value'));
  const config = Object.fromEntries(rows.map(({ key, value }) => [key, value]));
  return { threshold: parseFloat(config.threshold || 5), bandwidth: parseInt(config.bandwidth || 50, 10) };
}

export async function fetchDowntime() {
  const rows = resultOrThrow(await requireSupabase().from('downtime_logs').select('*').not('end_time', 'is', null).order('start_time', { ascending: false }));
  return rows.map((row) => {
    const seconds = Math.round((new Date(row.end_time) - new Date(row.start_time)) / 1000);
    return { dept: row.dept, start: new Date(row.start_time).toLocaleTimeString(), end: new Date(row.end_time).toLocaleTimeString(), minutes: +(seconds / 60).toFixed(2), seconds };
  });
}

export async function fetchNetworkSpeed() {
  const row = resultOrThrow(await requireSupabase().from('usage_logs').select('bytes_sent,bytes_recv').order('timestamp', { ascending: false }).limit(1).maybeSingle());
  return row ? (row.bytes_sent + row.bytes_recv) / (1024 * 1024) : 0;
}

export async function saveDepartment(dept, ip) {
  resultOrThrow(await requireSupabase().from('departments').upsert({ dept, ip }, { onConflict: 'dept' }));
}

export async function removeDepartment(dept) {
  resultOrThrow(await requireSupabase().from('departments').delete().eq('dept', dept));
}

export async function saveConfig(key, value) {
  resultOrThrow(await requireSupabase().from('config').upsert({ key, value: String(value) }, { onConflict: 'key' }));
}

export async function logAudit(action, detail) {
  const { error } = await requireSupabase().from('audit_logs').insert({ action, detail });
  if (error) console.error('Could not write audit log:', error.message);
}

export async function fetchHistory(period) {
  const days = { daily: 1, weekly: 7, monthly: 30 }[period];
  if (!days) throw new Error('Invalid period');
  return resultOrThrow(await requireSupabase().rpc('usage_by_period', { p_days: days }));
}
