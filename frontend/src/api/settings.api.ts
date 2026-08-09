import api from './index';

export interface SettingsData {
  company_name?: string;
  company_phone?: string;
  company_address?: string;
  company_stamp?: string;
  company_logo?: string;
  primary_color?: string;
  [key: string]: string | undefined;
}

export const settingsApi = {
  getSettings: () => api.get<{ status: string; data: SettingsData }>('/settings'),
  updateSettings: (data: FormData) => api.post<{ status: string; message: string; data: SettingsData }>('/settings', data, {
    headers: {
      'Content-Type': undefined,
    },
  }),
};
