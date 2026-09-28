export type Allergen =
  | 'gluten' | 'milk' | 'egg' | 'peanut' | 'soy'
  | 'fish' | 'shellfish' | 'nuts' | 'sesame';

export interface Addition { id: string; name: string; price: number; }

export interface Product {
  id: string; name: string; description: string; price: number;
  imageUrl: string; categoryId: string; available: boolean;
  ingredients?: string[]; additions?: Addition[];
  allergens?: Allergen[];
}

export interface CartItem {
  productId: string; product: Product; quantity: number;
  removedIngredients: string[]; additions: Addition[];
  notes?: string; unitPrice: number;
}
