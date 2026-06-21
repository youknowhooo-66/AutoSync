import { Request, Response } from 'express';
import { ListClientService } from '../services/ListClientService';

export class ListClientController {
  constructor(private listClientService: ListClientService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { companyId } = request.user;

    const clients = await this.listClientService.execute(companyId);

    return response.json(clients);
  }
}
