import api from './index';

// Pricing Configuration API
export const pricingConfigApi = {
  getConfig: () => api.get('/pricing/config'),
  updateConfig: (data: Record<string, unknown>) => api.put('/pricing/config', data),
};

// Paper Types API
export const paperTypesApi = {
  list: (params?: Record<string, unknown>) => api.get('/pricing/paper-types', { params }),
  create: (data: Record<string, unknown>) => api.post('/pricing/paper-types', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/pricing/paper-types/${id}`, data),
  delete: (id: number) => api.delete(`/pricing/paper-types/${id}`),
};

// Sheet Sizes API
export const sheetSizesApi = {
  list: (params?: Record<string, unknown>) => api.get('/pricing/sheet-sizes', { params }),
  create: (data: Record<string, unknown>) => api.post('/pricing/sheet-sizes', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/pricing/sheet-sizes/${id}`, data),
  delete: (id: number) => api.delete(`/pricing/sheet-sizes/${id}`),
};

// Finishing Operations API
export const finishingOpsApi = {
  list: (params?: Record<string, unknown>) => api.get('/pricing/finishing-operations', { params }),
  create: (data: Record<string, unknown>) => api.post('/pricing/finishing-operations', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/pricing/finishing-operations/${id}`, data),
  delete: (id: number) => api.delete(`/pricing/finishing-operations/${id}`),
};

// Price Calculations API
export const priceCalculationsApi = {
  calculate: (data: Record<string, unknown>) => api.post('/pricing/calculate', data),
  calculateAndSave: (data: Record<string, unknown>) => api.post('/pricing/calculate-and-save', data),
  list: (params?: Record<string, unknown>) => api.get('/pricing/calculations', { params }),
  get: (id: number) => api.get(`/pricing/calculations/${id}`),
  updateStatus: (id: number, data: Record<string, unknown>) => api.patch(`/pricing/calculations/${id}/status`, data),
  delete: (id: number) => api.delete(`/pricing/calculations/${id}`),
  recalculate: (id: number) => api.post(`/pricing/calculations/${id}/recalculate`),
};
