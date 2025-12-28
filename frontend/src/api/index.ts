import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/login', { email, password }),
  logout: () => api.post('/logout'),
  me: () => api.get('/me'),
};

// Dashboard API
export const dashboardApi = {
  index: () => api.get('/dashboard'),
  stats: () => api.get('/dashboard'),
  charts: (days?: number) => api.get('/dashboard/charts', { params: { days } }),
};

// Customers API
export const customersApi = {
  list: (params?: Record<string, unknown>) => api.get('/customers', { params }),
  get: (id: number) => api.get(`/customers/${id}`),
  getById: (id: number) => api.get(`/customers/${id}`),
  create: (data: Record<string, unknown>) => api.post('/customers', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
  transactions: (id: number) => api.get(`/customers/${id}/transactions`),
};

// Suppliers API
export const suppliersApi = {
  list: (params?: Record<string, unknown>) => api.get('/suppliers', { params }),
  get: (id: number) => api.get(`/suppliers/${id}`),
  getById: (id: number) => api.get(`/suppliers/${id}`),
  create: (data: Record<string, unknown>) => api.post('/suppliers', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete(`/suppliers/${id}`),
  addPayment: (id: number, data: Record<string, unknown>) => api.post(`/suppliers/${id}/payments`, data),
  transactions: (id: number) => api.get(`/suppliers/${id}/transactions`),
};

// Products API
export const productsApi = {
  list: (params?: Record<string, unknown>) => api.get('/products', { params }),
  get: (id: number) => api.get(`/products/${id}`),
  create: (data: Record<string, unknown>) => api.post('/products', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

// Categories API
export const categoriesApi = {
  list: (params?: Record<string, unknown>) => api.get('/categories', { params }),
  create: (data: Record<string, unknown>) => api.post('/categories', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

// Invoices API
export const invoicesApi = {
  list: (params?: Record<string, unknown>) => api.get('/invoices', { params }),
  get: (id: number) => api.get(`/invoices/${id}`),
  getById: (id: number) => api.get(`/invoices/${id}`),
  create: (data: Record<string, unknown>) => api.post('/invoices', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/invoices/${id}`, data),
  delete: (id: number) => api.delete(`/invoices/${id}`),
  updateStatus: (id: number, status: string) => api.patch(`/invoices/${id}/status`, { status }),
  addPayment: (id: number, data: Record<string, unknown>) => api.post(`/invoices/${id}/payments`, data),
  statistics: (params?: Record<string, unknown>) => api.get('/invoices-statistics', { params }),
};

// Expenses API
export const expensesApi = {
  list: (params?: Record<string, unknown>) => api.get('/expenses', { params }),
  create: (data: Record<string, unknown>) => api.post('/expenses', data),
  delete: (id: number) => api.delete(`/expenses/${id}`),
  types: () => api.get('/expense-types'),
  createType: (data: Record<string, unknown>) => api.post('/expense-types', data),
  updateType: (id: number, data: Record<string, unknown>) => api.put(`/expense-types/${id}`, data),
  deleteType: (id: number) => api.delete(`/expense-types/${id}`),
};

// Withdrawals API
export const withdrawalsApi = {
  list: (params?: Record<string, unknown>) => api.get('/withdrawals', { params }),
  create: (data: Record<string, unknown>) => api.post('/withdrawals', data),
  delete: (id: number) => api.delete(`/withdrawals/${id}`),
};

// Cash API
export const cashApi = {
  balance: () => api.get('/cash/balance'),
  movements: (params?: Record<string, unknown>) => api.get('/cash/movements', { params }),
  transfer: (data: Record<string, unknown>) => api.post('/cash/transfer', data),
  setInitial: (data: Record<string, unknown>) => api.post('/cash/set-initial', data),
  adjust: (data: Record<string, unknown>) => api.post('/cash/adjust', data),
};

// Inventory API
export const inventoryApi = {
  list: (params?: Record<string, unknown>) => api.get('/inventory', { params }),
  get: (id: number) => api.get(`/inventory/${id}`),
  create: (data: Record<string, unknown>) => api.post('/inventory', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/inventory/${id}`, data),
  delete: (id: number) => api.delete(`/inventory/${id}`),
  addStock: (id: number, data: Record<string, unknown>) => api.post(`/inventory/${id}/add-stock`, data),
  removeStock: (id: number, data: Record<string, unknown>) => api.post(`/inventory/${id}/remove-stock`, data),
  movements: (params?: Record<string, unknown>) => api.get('/inventory-movements', { params }),
  addMovement: (data: Record<string, unknown>) => api.post('/inventory-movements', data),
};

// Debts API
export const debtsApi = {
  list: (params?: Record<string, unknown>) => api.get('/debts', { params }),
  get: (id: number) => api.get(`/debts/${id}`),
  create: (data: Record<string, unknown>) => api.post('/debts', data),
  delete: (id: number) => api.delete(`/debts/${id}`),
  repay: (id: number, data: Record<string, unknown>) => api.post(`/debts/${id}/repay`, data),
};

// Debt Accounts API
export const debtAccountsApi = {
  list: (params?: Record<string, unknown>) => api.get('/debt-accounts', { params }),
  all: () => api.get('/debt-accounts-all'),
  get: (id: number) => api.get(`/debt-accounts/${id}`),
  create: (data: Record<string, unknown>) => api.post('/debt-accounts', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/debt-accounts/${id}`, data),
  delete: (id: number) => api.delete(`/debt-accounts/${id}`),
};

// Activity Log API
export const activityApi = {
  list: (params?: Record<string, unknown>) => api.get('/activity-logs', { params }),
  get: (id: number) => api.get(`/activity-logs/${id}`),
};

// Reports API
export const reportsApi = {
  incomeStatement: (params?: Record<string, unknown>) => api.get('/reports/income-statement', { params }),
  balanceSheet: () => api.get('/reports/balance-sheet'),
  cashFlow: (params?: Record<string, unknown>) => api.get('/reports/cash-flow', { params }),
  salesByCustomer: (params?: Record<string, unknown>) => api.get('/reports/sales-by-customer', { params }),
  salesByProduct: (params?: Record<string, unknown>) => api.get('/reports/sales-by-product', { params }),
  getStats: (params?: Record<string, unknown>) => api.get('/reports/stats', { params }),
  getSalesChart: (params?: Record<string, unknown>) => api.get('/reports/sales-chart', { params }),
  getTopProducts: (params?: Record<string, unknown>) => api.get('/reports/top-products', { params }),
  getExpensesChart: (params?: Record<string, unknown>) => api.get('/reports/expenses-chart', { params }),
};

// Accountant API
export const accountantApi = {
  getDashboardStats: (params?: Record<string, unknown>) => api.get('/accountant/dashboard', { params }),
  getRevenueChart: (params?: Record<string, unknown>) => api.get('/accountant/revenue-chart', { params }),
  getExpenseChart: (params?: Record<string, unknown>) => api.get('/accountant/expense-chart', { params }),
  getIncomeStatement: (params?: Record<string, unknown>) => api.get('/accountant/income-statement', { params }),
  getBalanceSheet: (params?: Record<string, unknown>) => api.get('/accountant/balance-sheet', { params }),
};

// تصدير APIs التقارير
export * from './reports';
