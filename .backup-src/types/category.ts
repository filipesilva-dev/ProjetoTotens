export type CategoryIcon = 'burger' | 'combo' | 'drink' | 'fries' | 'dessert' | 'all';
export interface Category { id: string; name: string; icon: CategoryIcon; order: number; }
