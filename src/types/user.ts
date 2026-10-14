export type UserRole = 'gerente' | 'funcionario' | 'totem' | 'superadmin';
export interface User { id: string; name: string; email: string; role: UserRole; }
