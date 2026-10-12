export interface Plan {
  id: string; name: string; description: string;
  priceMonthly: number; priceYearly: number;
  features: string[]; maxTotems: number; maxProducts: number;
  highlighted: boolean; active: boolean; sortOrder: number;
}
