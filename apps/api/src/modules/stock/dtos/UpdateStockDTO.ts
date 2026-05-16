// apps/api/src/modules/stock/dtos/UpdateStockDTO.ts

export interface UpdateStockDTO {
  id: string;
  companyId: string;
  productId?: string;
  quantity?: number;
  location?: string;
  minimumStock?: number;
}
