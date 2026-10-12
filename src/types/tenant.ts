export type TenantStatus = 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled';
export type SubscriptionCycle = 'monthly' | 'yearly';
export interface TenantAddress {
  cep: string; street: string; number: string; complement?: string;
  city: string; state: string;
}
export interface Tenant {
  id: string; slug: string; name: string; cnpj: string; logoEmoji: string;
  ownerName: string; ownerEmail: string; ownerPhone?: string;
  address?: TenantAddress; planId: string; cycle: SubscriptionCycle;
  status: TenantStatus; totemCount: number;
  createdAt: string; contractEndsAt: string; lastLoginAt?: string;
}
