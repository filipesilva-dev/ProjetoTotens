import { api } from './api';

export interface ConsoleSettings {
  sendInvoiceEmail: boolean;
  autoSuspend: boolean;
  autoSuspendDays: string;
  welcomeMessage: string;
  supportEmail: string;
  maintenanceMode: boolean;
}

export const settingsService = {
  get: async () => (await api.get<ConsoleSettings>('/admin/settings')).data,
  save: async (settings: ConsoleSettings) => (await api.put<ConsoleSettings>('/admin/settings', settings)).data,
};
