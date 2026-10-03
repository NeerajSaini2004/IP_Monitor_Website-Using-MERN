require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const si = require('systeminformation');

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
}

// This key bypasses RLS. Keep it on the monitored machine; never put it in frontend env vars.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
let cachedThreshold = null;
let thresholdCachedAt = 0;
let running = false;

async function getThreshold() {
  if (cachedThreshold !== null && Date.now() - thresholdCachedAt < 30000) return cachedThreshold;
  const { data, error } = await supabase.from('config').select('value').eq('key', 'threshold').maybeSingle();
  if (error) throw error;
  cachedThreshold = data ? parseFloat(data.value) : 0.1;
  thresholdCachedAt = Date.now();
  return cachedThreshold;
}

async function monitor() {
  if (running) return;
  running = true;
  try {
    const [{ data: departments, error: deptError }, stats, threshold] = await Promise.all([
      supabase.from('departments').select('dept,ip'),
      si.networkStats(),
      getThreshold()
    ]);
    if (deptError) throw deptError;
    if (!departments?.length || !stats?.length) return;

    const sent = Math.max(0, stats[0].tx_sec || 0);
    const recv = Math.max(0, stats[0].rx_sec || 0);
    const mbUsed = (sent + recv) / (1024 * 1024);
    const now = new Date().toISOString();

    for (const department of departments) {
      const { error: usageError } = await supabase.from('usage_logs').insert({ ip: department.ip, bytes_sent: sent, bytes_recv: recv, timestamp: now });
      if (usageError) throw usageError;

      const { data: active, error: activeError } = await supabase.from('downtime_logs').select('id,start_time').eq('dept', department.dept).is('end_time', null).maybeSingle();
      if (activeError) throw activeError;
      if (mbUsed < threshold && !active) {
        const { error } = await supabase.from('downtime_logs').insert({ dept: department.dept, start_time: now });
        if (error) throw error;
        console.log(`Downtime started: ${department.dept}`);
      } else if (mbUsed >= threshold && active) {
        const { error } = await supabase.from('downtime_logs').update({ end_time: now }).eq('id', active.id);
        if (error) throw error;
        console.log(`Downtime ended: ${department.dept}`);
      }
    }
  } catch (error) {
    console.error('Monitor error:', error.message);
  } finally {
    running = false;
  }
}

console.log('Supabase network monitor started (5 second interval).');
monitor();
setInterval(monitor, 5000);
