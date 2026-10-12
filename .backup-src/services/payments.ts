import { api } from './api';
import type { PixCharge } from '@/types';
import { ENV } from '@/config/env';
export const paymentsService = {
  async createPixCharge(orderId: string, amount: number): Promise<PixCharge> {
    if (ENV.useMocks) {
      await new Promise((r) => setTimeout(r, 400));
      return {
        orderId,
        qrCodeImage: 'data:image/svg+xml;utf8,' + encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#FFF"/><g fill="#1C1917"><rect x="10" y="10" width="50" height="50"/><rect x="20" y="20" width="30" height="30" fill="#FFF"/><rect x="27" y="27" width="16" height="16"/><rect x="140" y="10" width="50" height="50"/><rect x="150" y="20" width="30" height="30" fill="#FFF"/><rect x="157" y="27" width="16" height="16"/><rect x="10" y="140" width="50" height="50"/><rect x="20" y="150" width="30" height="30" fill="#FFF"/><rect x="27" y="157" width="16" height="16"/><rect x="75" y="75" width="50" height="50"/><rect x="85" y="85" width="30" height="30" fill="#FFF"/><rect x="140" y="140" width="10" height="10"/><rect x="160" y="160" width="10" height="10"/></g></svg>'
        ),
        copyPaste: '00020126330014BR.GOV.BCB.PIX0114+5561999999999' + orderId.slice(-8),
        amount,
      };
    }
    const { data } = await api.post<PixCharge>('/payments/pix', { orderId, amount });
    return data;
  },
};
