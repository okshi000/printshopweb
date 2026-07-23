// API تقارير الذكاء الاصطناعي

import api from '../index';

export interface AiInsight {
  type: 'positive' | 'warning' | 'info' | 'danger';
  title: string;
  description: string;
}

export interface AiRecommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
}

export interface AiAnalysis {
  summary: string;
  health_score: number;
  health_label: string;
  insights: AiInsight[];
  recommendations: AiRecommendation[];
  trends: {
    revenue_trend: 'up' | 'down' | 'stable';
    profit_trend: 'up' | 'down' | 'stable';
    expenses_trend: 'up' | 'down' | 'stable';
  };
}

export interface QuickInsightsResponse {
  success: boolean;
  parsed: boolean;
  analysis?: AiAnalysis;
  ai_response?: string;
  data: Record<string, unknown>;
  error?: string;
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  error?: string;
}

export interface AnalyzeResponse {
  success: boolean;
  analysis?: string;
  data?: Record<string, unknown>;
  error?: string;
}

const BASE_URL = '/reports/ai';

export const aiReportApi = {
  /**
   * الحصول على رؤى سريعة - عند فتح الصفحة
   */
  getQuickInsights: (params?: { date_from?: string; date_to?: string }) =>
    api.get<QuickInsightsResponse>(`${BASE_URL}/quick-insights`, { params }),

  /**
   * تحليل مالي شامل
   */
  analyze: (params?: { date_from?: string; date_to?: string }) =>
    api.post<AnalyzeResponse>(`${BASE_URL}/analyze`, params),

  /**
   * دردشة تفاعلية
   */
  chat: (message: string, params?: { date_from?: string; date_to?: string }) =>
    api.post<ChatResponse>(`${BASE_URL}/chat`, { message, ...params }),
};

export default aiReportApi;
