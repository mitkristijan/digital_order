import { StockMovementType } from './index';
export interface InventoryItem {
    id: string;
    tenantId: string;
    name: string;
    unit: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    supplier: string | null;
    costPerUnit: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface RecipeItem {
    id: string;
    menuItemId: string;
    inventoryItemId: string;
    quantityRequired: number;
    inventoryItem?: InventoryItem;
}
export interface StockMovement {
    id: string;
    tenantId: string;
    inventoryItemId: string;
    type: StockMovementType;
    quantity: number;
    referenceId: string | null;
    notes: string | null;
    createdBy: string;
    createdAt: Date;
}
export interface CreateInventoryItemRequest {
    name: string;
    unit: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    supplier?: string;
    costPerUnit: number;
}
export interface CreateStockMovementRequest {
    inventoryItemId: string;
    type: StockMovementType;
    quantity: number;
    notes?: string;
}
export interface LowStockAlert {
    inventoryItem: InventoryItem;
    currentStock: number;
    minStock: number;
    percentageRemaining: number;
}
