import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
});

// Usage API
export const usageAPI = {
  getRealtime: () => api.get('/usage/realtime'),
  getByPeriod: (period, filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/usage/${period}?${params}`);
  },
  getTrends: (ip, hours = 24) => api.get(`/usage/trends/${ip}?hours=${hours}`),
  addUsage: (data) => api.post('/usage', data),
  seedData: () => api.get('/usage/seed')
};

// Department API
export const departmentAPI = {
  getAll: () => api.get('/departments'),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`)
};

// Downtime API
export const downtimeAPI = {
  getLogs: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/downtime?${params}`);
  },
  startDowntime: (data) => api.post('/downtime/start', data),
  endDowntime: (id) => api.put(`/downtime/end/${id}`)
};

// Config API
export const configAPI = {
  getAll: () => api.get('/config'),
  update: (key, value) => api.post('/config', { key, value }),
  initDefaults: () => api.post('/config/init')
};

export default api;
