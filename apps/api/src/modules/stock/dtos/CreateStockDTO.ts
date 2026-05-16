// apps/api/src/modules/stock/dtos/CreateStockDTO.ts

export interface CreateStockDTO {
  companyId: string;
  productId: string;
  quantity: number;
  location?: string;
  minimumStock?: number;
}
