export interface Category {
    id: string;
    tenantId: string;
    name: string;
    description: string | null;
    sortOrder: number;
    imageUrl: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface MenuItem {
    id: string;
    tenantId: string;
    categoryId: string;
    name: string;
    description: string | null;
    basePrice: number;
    prepTime: number;
    availability: boolean;
    allergens: string[];
    dietaryTags: string[];
    imageUrl: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    variants?: MenuItemVariant[];
    modifierGroups?: ModifierGroup[];
}
export interface MenuItemVariant {
    id: string;
    menuItemId: string;
    name: string;
    priceModifier: number;
    stockQuantity: number | null;
    active: boolean;
}
export interface ModifierGroup {
    id: string;
    tenantId: string;
    name: string;
    minSelection: number;
    maxSelection: number;
    required: boolean;
    modifiers: Modifier[];
}
export interface Modifier {
    id: string;
    modifierGroupId: string;
    name: string;
    price: number;
    active: boolean;
}
export interface CreateCategoryRequest {
    name: string;
    description?: string;
    sortOrder?: number;
    imageUrl?: string;
}
export interface CreateMenuItemRequest {
    categoryId: string;
    name: string;
    description?: string;
    basePrice: number;
    prepTime?: number;
    allergens?: string[];
    dietaryTags?: string[];
    imageUrl?: string;
    variants?: Omit<MenuItemVariant, 'id' | 'menuItemId'>[];
}
