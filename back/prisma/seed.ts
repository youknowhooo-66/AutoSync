import { PrismaClient, Role, OSStatus, FinancialType, FinancialStatus, MovementType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Populando banco com dados automotivos reais (versão corrigida)...');
  
  // Limpar dados
  await prisma.auditLog.deleteMany({});
  await prisma.financialRecord.deleteMany({});
  await prisma.oSPart.deleteMany({});
  await prisma.oSService.deleteMany({});
  await prisma.serviceOrder.deleteMany({});
  await prisma.inventoryMovement.deleteMany({});
  await prisma.stock.deleteMany({});
  await prisma.part.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.branch.deleteMany({});

  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 1. FILIAIS
  const branch1 = await prisma.branch.create({
    data: {
      name: 'AutoSync Matriz - São Paulo',
      cnpj: '10.222.333/0001-01',
      address: 'Av. das Nações Unidas, 12901 - Brooklin Paulista, São Paulo - SP',
      phone: '(11) 5500-1010',
      email: 'contato@autosync.com.br'
    }
  });

  const branch2 = await prisma.branch.create({
    data: {
      name: 'AutoSync Unidade II - Curitiba',
      cnpj: '10.222.333/0002-02',
      address: 'Rua XV de Novembro, 800 - Centro, Curitiba - PR',
      phone: '(41) 3300-2020',
      email: 'curitiba@autosync.com.br'
    }
  });

  // 2. USUÁRIOS
  const admin = await prisma.user.create({
    data: {
      name: 'Ricardo Oliveira',
      email: 'admin@autosync.com',
      password: hashedPassword,
      role: Role.ADMIN,
      branchId: branch1.id
    }
  });

  const mechanic = await prisma.user.create({
    data: {
      name: 'Jorge Santos',
      email: 'jorge@autosync.com',
      password: hashedPassword,
      role: Role.MECHANIC,
      branchId: branch1.id
    }
  });

  // 3. FORNECEDORES
  const suppliers = [
    await prisma.supplier.create({ data: { name: 'Pellegrino Distribuidora', cnpj: '61.123.456/0001-01', phone: '(11) 4004-1010', email: 'vendas@pellegrino.com.br' } }),
    await prisma.supplier.create({ data: { name: 'DPaschoal Logística', cnpj: '45.987.654/0001-99', phone: '(19) 3728-1000', email: 'atendimento@dpaschoal.com.br' } })
  ];

  // 4. PEÇAS REAIS (MODELO ATUAL)
  const partsData = [
    { name: 'Kit Correia Dentada + Tensionador', internalCode: 'KCT-GATES-01', manufacturerCode: 'KS101', brand: 'Gates', category: 'Motor', purchasePrice: 180.50, salePrice: 345.00, minStock: 5 },
    { name: 'Bateria Moura 60Ah M60GD', internalCode: 'BAT-MOURA-60', manufacturerCode: 'M60GD', brand: 'Moura', category: 'Elétrica', purchasePrice: 320.00, salePrice: 580.00, minStock: 8 },
    { name: 'Jogo de Pastilhas de Freio Dianteira', internalCode: 'PAS-COBREQ-D', manufacturerCode: 'N-201', brand: 'Cobreq', category: 'Freios', purchasePrice: 75.00, salePrice: 165.00, minStock: 12 },
    { name: 'Amortecedor Dianteiro Direito', internalCode: 'AMT-COFAP-DD', manufacturerCode: 'GP32488', brand: 'Cofap', category: 'Suspensão', purchasePrice: 245.00, salePrice: 495.00, minStock: 4 },
    { name: 'Óleo Selènia K Pure Energy 5W30', internalCode: 'OIL-SELENIA-5W30', manufacturerCode: '70213E', brand: 'Selènia', category: 'Lubrificantes', purchasePrice: 38.00, salePrice: 72.00, minStock: 40 }
  ];

  const parts = [];
  for (const p of partsData) {
    const part = await prisma.part.create({
      data: { ...p, supplierId: suppliers[Math.floor(Math.random() * suppliers.length)].id }
    });
    parts.push(part);
    await prisma.stock.create({ data: { partId: part.id, branchId: branch1.id, quantity: 20 } });
    await prisma.stock.create({ data: { partId: part.id, branchId: branch2.id, quantity: 15 } });
  }

  // 5. CLIENTES E VEÍCULOS
  const client1 = await prisma.client.create({ data: { name: 'Carlos Souza', document: '222.333.444-55', email: 'carlos@gmail.com', phone: '(11) 98888-1111' } });
  const vehicle1 = await prisma.vehicle.create({ data: { model: 'Volkswagen Jetta', brand: 'VW', plate: 'JET-2023', year: 2023, clientId: client1.id } });

  const client2 = await prisma.client.create({ data: { name: 'Mariana Lima', document: '111.222.333-44', email: 'mari@outlook.com', phone: '(11) 97777-2222' } });
  const vehicle2 = await prisma.vehicle.create({ data: { model: 'Honda HR-V', brand: 'Honda', plate: 'HRV-4400', year: 2021, clientId: client2.id } });

  // 6. ORDENS DE SERVIÇO
  const today = new Date();
  for (let i = 0; i < 20; i++) {
    const date = new Date();
    date.setDate(today.getDate() - (i % 8));

    const os = await prisma.serviceOrder.create({
      data: {
        clientId: i % 2 === 0 ? client1.id : client2.id,
        vehicleId: i % 2 === 0 ? vehicle1.id : vehicle2.id,
        branchId: i % 2 === 0 ? branch1.id : branch2.id,
        mechanicId: mechanic.id,
        status: i < 15 ? OSStatus.FINISHED : OSStatus.OPEN,
        createdAt: date
      }
    });

    const p = parts[i % parts.length];
    await prisma.oSPart.create({ data: { serviceOrderId: os.id, partId: p.id, quantity: 1, unitPrice: p.salePrice } });
    await prisma.oSService.create({ data: { serviceOrderId: os.id, name: 'Manutenção Preventiva', price: 200 } });

    const total = Number(p.salePrice) + 200;
    await prisma.serviceOrder.update({ where: { id: os.id }, data: { totalParts: p.salePrice, totalServices: 200, finalValue: total } });

    if (os.status === OSStatus.FINISHED) {
      await prisma.financialRecord.create({
        data: {
          description: `Serviço OS #${os.number}`,
          amount: total,
          type: FinancialType.RECEIVABLE,
          status: FinancialStatus.PAID,
          category: 'Serviços',
          dueDate: date,
          paymentDate: date,
          branchId: os.branchId,
          createdAt: date
        }
      });
    }
  }

  console.log('✅ Banco de dados populado com sucesso!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
