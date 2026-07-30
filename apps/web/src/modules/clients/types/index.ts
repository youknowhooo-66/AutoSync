export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDTO {
  name: string;
  email: string;
  phone?: string;
  document?: string;
}

export interface ClientListResponse {
  success: true;
  data: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
