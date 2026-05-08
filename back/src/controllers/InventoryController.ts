import { Response, Request } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createAuditLog } from './AuditController';
import * as XLSX from 'xlsx';

// Transfer stock between branches
export const transferStock = async (req: AuthRequest, res: Response) => {
  try {
    const { partId, fromBranchId, toBranchId, quantity, reason } = req.body;

    if (!partId || !fromBranchId || !toBranchId || !quantity) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios para a transferência.' });
    }

    if (fromBranchId === toBranchId) {
      return res.status(400).json({ message: 'A filial de origem e destino não podem ser as mesmas.' });
    }

    const qty = parseInt(String(quantity));
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Quantidade inválida. Informe um número maior que zero.' });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Verify both branches exist
        const branches = await tx.branch.findMany({
          where: { id: { in: [fromBranchId, toBranchId] } }
        });

        if (branches.length < 2) {
          throw new Error('Uma ou ambas as filiais informadas não existem.');
        }

        // 1. Check source stock
        const sourceStock = await tx.stock.findUnique({
          where: { partId_branchId: { partId, branchId: fromBranchId } }
        });

        if (!sourceStock || sourceStock.quantity < qty) {
          throw new Error(`Estoque insuficiente na filial de origem. Disponível: ${sourceStock?.quantity || 0}`);
        }

        // 2. Decrement from source
        await tx.stock.update({
          where: { id: sourceStock.id },
          data: { quantity: { decrement: qty } }
        });

        // 3. Increment/Create at target
        await tx.stock.upsert({
          where: { partId_branchId: { partId, branchId: toBranchId } },
          update: { quantity: { increment: qty } },
          create: { partId, branchId: toBranchId, quantity: qty }
        });

        // 4. Record movements
        const movementData = {
          partId,
          userId: req.user!.id,
          type: 'TRANSFER' as any,
          quantity: qty,
          sourceBranchId: fromBranchId,
          targetBranchId: toBranchId,
          reason: reason || 'Transferência entre filiais'
        };

        await tx.inventoryMovement.create({ data: { ...movementData, branchId: fromBranchId, reason: `SAÍDA: ${movementData.reason}` } });
        await tx.inventoryMovement.create({ data: { ...movementData, branchId: toBranchId, reason: `ENTRADA: ${movementData.reason}` } });

        return { partId, fromBranchId, toBranchId, qty };
      });

      if (req.user) {
        createAuditLog(req.user.id, 'TRANSFER', 'STOCK', partId, { branchId: fromBranchId, qty }, { branchId: toBranchId, qty }, req.ip);
      }

      res.json({ message: 'Transferência realizada com sucesso.', result });
    } catch (error: any) {
      console.error('Erro na transferência:', error);
      res.status(400).json({ message: error.message || 'Erro ao realizar transferência.' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Erro interno no servidor ao processar transferência.' });
  }
};

// Get parts with stock below minimum
export const getLowStock = async (req: Request, res: Response) => {
  try {
    const stocks = await prisma.stock.findMany({
      include: {
        part: true,
        branch: { select: { name: true } }
      }
    });

    const lowItems = stocks.filter(s => s.quantity <= s.part.minStock);

    res.json(lowItems.map(s => ({
      id: s.part.id,
      name: s.part.name,
      internalCode: s.part.internalCode,
      currentStock: s.quantity,
      minStock: s.part.minStock,
      branch: s.branch.name,
      branchId: s.branchId,
    })));
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar estoque crítico.' });
  }
};

// Get inventory movements (history)
export const getMovements = async (req: Request, res: Response) => {
  try {
    const { partId, branchId, limit } = req.query;
    const where: any = {};
    if (partId) where.partId = String(partId);
    if (branchId) where.branchId = String(branchId);

    const movements = await prisma.inventoryMovement.findMany({
      where,
      include: {
        part: { select: { name: true, internalCode: true } },
        branch: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(String(limit)) : 50,
    });

    res.json(movements);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar movimentações.' });
  }
};

// Get top parts by movement count (most used)
export const getTopParts = async (req: Request, res: Response) => {
  try {
    const movements = await prisma.inventoryMovement.groupBy({
      by: ['partId'],
      where: { type: 'OUT' },
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    const partIds = movements.map(m => m.partId);
    const parts = await prisma.part.findMany({
      where: { id: { in: partIds } },
      select: { id: true, name: true, internalCode: true, salePrice: true },
    });

    const result = movements.map(m => {
      const part = parts.find(p => p.id === m.partId);
      const totalOut = Number(m._sum.quantity || 0);
      const salePrice = Number(part?.salePrice || 0);
      return {
        partId: m.partId,
        name: part?.name || 'Desconhecida',
        internalCode: part?.internalCode || '',
        totalOut,
        salePrice,
        totalRevenue: totalOut * salePrice,
        movementCount: m._count.id,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar peças mais usadas.' });
  }
};

export const updatePart = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, internalCode, manufacturerCode, category, brand, supplierId, purchasePrice, salePrice, minStock, location, description } = req.body;

    const oldPart = await prisma.part.findUnique({ where: { id } });

    const part = await prisma.part.update({
      where: { id },
      data: {
        name,
        internalCode,
        manufacturerCode,
        category,
        brand,
        supplierId: supplierId === '' ? null : supplierId,
        purchasePrice: parseFloat(String(purchasePrice)) || 0,
        salePrice: parseFloat(String(salePrice)) || 0,
        minStock: parseInt(String(minStock)) || 0,
        location,
        description,
      }
    });

    if (req.user) {
      createAuditLog(req.user.id, 'UPDATE', 'PART', id, oldPart, part, req.ip);
    }

    res.json({ message: 'Peça atualizada com sucesso.', part });
  } catch (error: any) {
    console.error('Erro ao atualizar peça:', error);
    res.status(500).json({ message: error.message || 'Erro ao atualizar peça.' });
  }
};

export const listParts = async (req: AuthRequest, res: Response) => {
  try {
    const parts = await prisma.part.findMany({
      include: {
        stocks: {
          include: {
            branch: { select: { name: true } }
          }
        },
        supplier: true
      },
      orderBy: { name: 'asc' }
    });
    res.json(parts);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar peças.' });
  }
};

export const createPart = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      internalCode, manufacturerCode, name, description, 
      category, brand, supplierId, purchasePrice, salePrice, 
      minStock, location, initialStock, branchId 
    } = req.body;

    if (!internalCode || !name) {
      return res.status(400).json({ message: 'Código interno e nome são obrigatórios.' });
    }

    const supplierIdFixed = supplierId === '' ? null : supplierId;
    const branchIdFixed = branchId === '' ? null : branchId;

    const pPrice = parseFloat(String(purchasePrice)) || 0;
    const sPrice = parseFloat(String(salePrice)) || 0;
    const mStock = parseInt(String(minStock)) || 0;
    const iStock = parseInt(String(initialStock)) || 0;

    try {
      const part = await prisma.$transaction(async (tx) => {
        const newPart = await tx.part.create({
          data: {
            internalCode, 
            manufacturerCode, 
            name, 
            description,
            category, 
            brand, 
            supplierId: supplierIdFixed, 
            purchasePrice: pPrice, 
            salePrice: sPrice,
            minStock: mStock, 
            location
          }
        });

        if (branchIdFixed) {
          const branch = await tx.branch.findUnique({ where: { id: branchIdFixed } });
          if (!branch) throw new Error('Filial selecionada não encontrada.');

          await tx.stock.create({
            data: {
              partId: newPart.id,
              branchId: branchIdFixed,
              quantity: iStock
            }
          });

          if (iStock > 0) {
            await tx.inventoryMovement.create({
              data: {
                partId: newPart.id,
                branchId: branchIdFixed,
                userId: req.user!.id,
                type: 'IN',
                quantity: iStock,
                reason: 'Estoque inicial'
              }
            });
          }
        }

        return newPart;
      });

      if (req.user) {
        createAuditLog(req.user.id, 'CREATE', 'PART', part.id, null, part, req.ip);
      }

      res.status(201).json({ message: 'Peça cadastrada com sucesso.', part });
    } catch (error: any) {
      console.error('Erro ao salvar peça:', error);
      res.status(400).json({ message: error.message || 'Erro ao processar dados da peça.' });
    }
  } catch (error: any) {
    console.error('Erro ao criar peça:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Este código interno já está cadastrado.' });
    }
    res.status(500).json({ message: error.message || 'Erro ao criar peça.' });
  }
};

export const updateStock = async (req: AuthRequest, res: Response) => {
  try {
    const { partId, branchId, quantity, type, reason } = req.body;

    if (!req.user) return res.status(401).json({ message: 'Não autorizado.' });

    const movement = await prisma.$transaction(async (tx) => {
      const stock = await tx.stock.upsert({
        where: { partId_branchId: { partId, branchId } },
        update: {
          quantity: type === 'IN' ? { increment: quantity } : { decrement: quantity }
        },
        create: {
          partId,
          branchId,
          quantity: type === 'IN' ? quantity : -quantity
        }
      });

      return await tx.inventoryMovement.create({
        data: {
          partId,
          branchId,
          userId: req.user!.id,
          type,
          quantity,
          reason
        }
      });
    });

    createAuditLog(req.user.id, 'UPDATE_STOCK', 'STOCK', partId, { type, quantity }, movement, req.ip);

    res.json({ message: 'Estoque atualizado com sucesso.', movement });
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({ message: 'Erro ao atualizar estoque.' });
  }
};

export const importParts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    const partsToCreate: any[] = [];
    const stockToCreate: any[] = [];

    for (const row of data) {
      if (!row['Nome da Peça'] || !row['Código Interno']) continue;

      const internalCode = String(row['Código Interno']);
      const existingPart = await prisma.part.findUnique({ where: { internalCode } });
      if (existingPart) continue;

      let supplierId = undefined;
      if (row['Fornecedor']) {
        let supplier = await prisma.supplier.findFirst({ where: { name: String(row['Fornecedor']) } });
        if (!supplier) supplier = await prisma.supplier.create({ data: { name: String(row['Fornecedor']) } });
        supplierId = supplier.id;
      }

      let branchId = undefined;
      if (row['Filial']) {
        const branch = await prisma.branch.findFirst({ where: { name: String(row['Filial']) } });
        if (branch) branchId = branch.id;
      }

      partsToCreate.push({
        internalCode,
        name: String(row['Nome da Peça']),
        manufacturerCode: row['Código Fabricante'] ? String(row['Código Fabricante']) : null,
        description: row['Descrição'] ? String(row['Descrição']) : null,
        category: row['Categoria'] ? String(row['Categoria']) : null,
        brand: row['Marca'] ? String(row['Marca']) : null,
        supplierId: supplierId,
        purchasePrice: row['Preço Compra'] ? parseFloat(row['Preço Compra']) : 0,
        salePrice: row['Preço Venda'] ? parseFloat(row['Preço Venda']) : 0,
        minStock: row['Estoque Mínimo'] ? parseInt(String(row['Estoque Mínimo'])) : 0,
        location: row['Localização'] ? String(row['Localização']) : null,
      });

      if (branchId && row['Estoque Inicial'] !== undefined) {
        stockToCreate.push({
          internalCode: internalCode,
          branchId: branchId,
          quantity: parseInt(String(row['Estoque Inicial']))
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      const createdParts = [];
      for (const partData of partsToCreate) {
        const part = await tx.part.create({ data: partData });
        createdParts.push(part);
      }

      for (const stockData of stockToCreate) {
        const part = createdParts.find(p => p.internalCode === stockData.internalCode);
        if (part) {
          await tx.stock.create({
            data: {
              partId: part.id,
              branchId: stockData.branchId,
              quantity: stockData.quantity,
            },
          });
        }
      }
    });

    if (req.user) {
      createAuditLog(req.user.id, 'IMPORT', 'PART', 'MULTIPLE', null, { count: partsToCreate.length }, req.ip);
    }

    res.status(201).json({ message: 'Peças importadas com sucesso!', importedCount: partsToCreate.length });
  } catch (error: any) {
    console.error('Erro ao importar peças:', error);
    res.status(500).json({ message: error.message || 'Erro ao importar peças.' });
  }
};

export const deletePart = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const linkedOS = await prisma.oSPart.findFirst({ where: { partId: id } });
    if (linkedOS) return res.status(400).json({ message: 'Não é possível excluir esta peça pois ela já foi utilizada em Ordens de Serviço.' });

    const linkedMovements = await prisma.inventoryMovement.findFirst({ where: { partId: id } });
    if (linkedMovements) return res.status(400).json({ message: 'Não é possível excluir esta peça pois ela possui histórico de movimentação.' });

    const oldPart = await prisma.part.findUnique({ where: { id } });

    await prisma.$transaction(async (tx) => {
      await tx.stock.deleteMany({ where: { partId: id } });
      await tx.part.delete({ where: { id } });
    });

    if (req.user) {
      createAuditLog(req.user.id, 'DELETE', 'PART', id, oldPart, null, req.ip);
    }

    res.json({ message: 'Peça excluída com sucesso.' });
  } catch (error: any) {
    console.error('Erro ao excluir peça:', error);
    res.status(500).json({ message: 'Erro ao excluir peça. Verifique dependências.' });
  }
};
