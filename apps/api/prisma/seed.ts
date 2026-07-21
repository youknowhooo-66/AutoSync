import { PrismaClient, Role, OSStatus, FinancialType, FinancialStatus, MovementType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting complete database seeding for presentation...');

  console.log('🧹 Cleaning database...');
  await prisma.auditLog.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.oSPart.deleteMany();
  await prisma.oSService.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.part.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.company.deleteMany();

  const company = await prisma.company.create({
    data: {
      name: 'AutoSync Premium Group',
      document: '12.345.678/0001-00',
      email: 'contato@autosync.com.br',
      phone: '(11) 99999-9999',
      address: 'Centro Empresarial Norte, Sala 405, São Paulo - SP'
    }
  });

  const branchMatriz = await prisma.branch.create({ data: { companyId: company.id, name: 'AutoSync - Matriz São Paulo', cnpj: '12.345.678/0001-01', address: 'Av. Paulista, 1500, Bela Vista, SP', phone: '(11) 3333-4444' } });
  const branchSul = await prisma.branch.create({ data: { companyId: company.id, name: 'AutoSync - Filial Curitiba', cnpj: '12.345.678/0001-02', address: 'Av. das Nações, 500, Água Verde, PR', phone: '(41) 3333-5555' } });
  const branchNorte = await prisma.branch.create({ data: { companyId: company.id, name: 'AutoSync - Filial Salvador', cnpj: '12.345.678/0001-03', address: 'Av. Oceânica, 80, Barra, BA', phone: '(71) 3333-6666' } });
  const branchRio = await prisma.branch.create({ data: { companyId: company.id, name: 'AutoSync - Filial Rio', cnpj: '12.345.678/0001-04', address: 'Av. das Américas, 3000, Barra da Tijuca, RJ', phone: '(21) 3333-7777' } });
  const branches = [branchMatriz, branchSul, branchNorte, branchRio];

  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.create({ data: { companyId: company.id, branchId: branchMatriz.id, name: 'Ricardo Oliveira (CEO)', email: 'admin@autosync.com', password: hashedPassword, role: Role.ADMIN } });
  await prisma.user.create({ data: { companyId: company.id, branchId: branchMatriz.id, name: 'João Silva (Gerente)', email: 'joao.gerente@autosync.com', password: hashedPassword, role: Role.ADMIN } });
  
  const users = [
    { name: 'Carlos Mecânico Chefe', email: 'carlos@autosync.com', role: Role.MECHANIC, branchId: branchMatriz.id },
    { name: 'Ana Silva (Financeiro)', email: 'ana@autosync.com', role: Role.FINANCIAL, branchId: branchMatriz.id },
    { name: 'Marcos Gerente', email: 'marcos@autosync.com', role: Role.MANAGER, branchId: branchSul.id },
    { name: 'Julio Mecânico', email: 'julio@autosync.com', role: Role.MECHANIC, branchId: branchSul.id },
    { name: 'Roberto Mecânico', email: 'roberto@autosync.com', role: Role.MECHANIC, branchId: branchRio.id },
    { name: 'Fernanda Estoque', email: 'fernanda@autosync.com', role: Role.STOCKIST, branchId: branchNorte.id },
    { name: 'Pedro Mecânico', email: 'pedro@autosync.com', role: Role.MECHANIC, branchId: branchNorte.id },
  ];

  const createdUsers = [];
  for (const u of users) {
    const user = await prisma.user.create({
      data: { companyId: company.id, name: u.name, email: u.email, password: hashedPassword, role: u.role, branchId: u.branchId }
    });
    createdUsers.push(user);
  }

  const suppliersData = [
    { name: 'Distribuidora Auto Peças Brasil', cnpj: '44.555.666/0001-99', email: 'vendas@autopeçasbrasil.com' },
    { name: 'Lubrificantes & Cia', cnpj: '11.222.333/0001-44', email: 'contato@lubcia.com' },
    { name: 'Pneus Fast', cnpj: '77.888.999/0001-11', email: 'pedidos@pneusfast.com' },
    { name: 'Bosch Service Center', cnpj: '99.000.111/0001-22', email: 'atendimento@bosch.com' },
    { name: 'Imports Peças Premium', cnpj: '22.333.444/0001-55', email: 'importadas@premium.com' },
    { name: 'Tintas e Fórmulas Automotivas', cnpj: '88.999.000/0001-66', email: 'tintas@formulas.com' }
  ];

  const createdSuppliers = [];
  for (const s of suppliersData) {
    const supplier = await prisma.supplier.create({ data: { ...s, companyId: company.id } });
    createdSuppliers.push(supplier);
  }

  const partsData = [
    { name: 'Óleo Motor 5W30 Sintético', code: 'LUB-001', cat: 'Fluidos', price: 45, sale: 85, brand: 'Mobil' },
    { name: 'Óleo Motor 10W40 Semissintético', code: 'LUB-002', cat: 'Fluidos', price: 35, sale: 65, brand: 'Castrol' },
    { name: 'Pastilha de Freio Dianteira', code: 'BRK-010', cat: 'Freios', price: 110, sale: 220, brand: 'Fras-le' },
    { name: 'Pastilha de Freio Traseira', code: 'BRK-011', cat: 'Freios', price: 90, sale: 180, brand: 'Cobreq' },
    { name: 'Disco de Freio Ventilado', code: 'BRK-020', cat: 'Freios', price: 180, sale: 350, brand: 'Fremax' },
    { name: 'Amortecedor Dianteiro', code: 'SUS-100', cat: 'Suspensão', price: 250, sale: 480, brand: 'Monroe' },
    { name: 'Amortecedor Traseiro', code: 'SUS-101', cat: 'Suspensão', price: 210, sale: 400, brand: 'Nakata' },
    { name: 'Mola Esportiva (Kit)', code: 'SUS-200', cat: 'Suspensão', price: 400, sale: 800, brand: 'Eibach' },
    { name: 'Filtro de Óleo', code: 'FIL-001', cat: 'Filtros', price: 25, sale: 60, brand: 'Mann' },
    { name: 'Filtro de Ar Motor', code: 'FIL-002', cat: 'Filtros', price: 30, sale: 75, brand: 'Fram' },
    { name: 'Filtro de Ar Condicionado', code: 'FIL-003', cat: 'Filtros', price: 40, sale: 90, brand: 'Bosch' },
    { name: 'Filtro de Combustível', code: 'FIL-004', cat: 'Filtros', price: 20, sale: 50, brand: 'Tecfil' },
    { name: 'Bateria 60Ah', code: 'ELE-050', cat: 'Elétrica', price: 320, sale: 550, brand: 'Moura' },
    { name: 'Bateria 70Ah Start-Stop', code: 'ELE-051', cat: 'Elétrica', price: 700, sale: 1100, brand: 'Heliar' },
    { name: 'Vela de Ignição Iridium', code: 'ENG-300', cat: 'Motor', price: 40, sale: 95, brand: 'NGK' },
    { name: 'Cabo de Vela', code: 'ENG-301', cat: 'Motor', price: 90, sale: 180, brand: 'Bosch' },
    { name: 'Correia Dentada', code: 'ENG-400', cat: 'Motor', price: 85, sale: 180, brand: 'Gates' },
    { name: 'Tensor da Correia Dentada', code: 'ENG-401', cat: 'Motor', price: 120, sale: 250, brand: 'SKF' },
    { name: 'Aditivo para Radiador', code: 'LUB-050', cat: 'Fluidos', price: 18, sale: 45, brand: 'Paraflu' },
    { name: 'Fluido de Freio DOT4', code: 'LUB-060', cat: 'Fluidos', price: 25, sale: 60, brand: 'Varga' },
    { name: 'Palheta Limpador Parabrisa', code: 'ACE-001', cat: 'Acessórios', price: 40, sale: 80, brand: 'Dyna' },
    { name: 'Lâmpada Super Branca H4', code: 'ELE-100', cat: 'Elétrica', price: 50, sale: 120, brand: 'Philips' },
    { name: 'Pneu 175/70 R14', code: 'PNE-014', cat: 'Pneus', price: 250, sale: 400, brand: 'Pirelli' },
    { name: 'Pneu 205/55 R16', code: 'PNE-016', cat: 'Pneus', price: 380, sale: 600, brand: 'Michelin' }
  ];

  const createdParts = [];
  for (const p of partsData) {
    const part = await prisma.part.create({
      data: {
        companyId: company.id,
        name: p.name,
        internalCode: p.code,
        category: p.cat,
        brand: p.brand,
        purchasePrice: p.price,
        salePrice: p.sale,
        minStock: 10,
        supplierId: createdSuppliers[Math.floor(Math.random() * createdSuppliers.length)].id,
        stocks: {
          create: branches.map(b => ({
            companyId: company.id,
            branchId: b.id,
            quantity: Math.floor(Math.random() * 50) + 15
          }))
        }
      }
    });
    createdParts.push(part);
  }

  const clientsData = [
    { name: 'João Silva', doc: '111.222.333-44', vehicle: { model: 'Civic', brand: 'Honda', plate: 'ABC1D23', year: 2022 } },
    { name: 'Maria Souza', doc: '555.666.777-88', vehicle: { model: 'Corolla', brand: 'Toyota', plate: 'XYZ9A87', year: 2021 } },
    { name: 'Pedro Santos', doc: '999.000.111-22', vehicle: { model: 'Onix', brand: 'Chevrolet', plate: 'KJH5G43', year: 2020 } },
    { name: 'Fernanda Lima', doc: '333.444.555-66', vehicle: { model: 'Golf', brand: 'Volkswagen', plate: 'MNO2B11', year: 2019 } },
    { name: 'Roberto J.', doc: '777.888.999-00', vehicle: { model: 'Hilux', brand: 'Toyota', plate: 'PRT3F22', year: 2023 } },
    { name: 'Aline P.', doc: '222.333.444-55', vehicle: { model: 'HB20', brand: 'Hyundai', plate: 'HGB6E44', year: 2022 } },
    { name: 'Transportes Rápidos Ltda', doc: '10.200.300/0001-44', vehicle: { model: 'Daily', brand: 'Iveco', plate: 'LOG1A00', year: 2021 } },
    { name: 'Carlos Eduardo', doc: '123.456.789-00', vehicle: { model: 'Compass', brand: 'Jeep', plate: 'JEE3P00', year: 2022 } },
    { name: 'Beatriz Almeida', doc: '987.654.321-11', vehicle: { model: 'Renegade', brand: 'Jeep', plate: 'REN4G99', year: 2021 } },
    { name: 'Marcos Costa', doc: '456.123.789-22', vehicle: { model: 'Creta', brand: 'Hyundai', plate: 'CRE5T88', year: 2023 } },
    { name: 'Luciana Mendes', doc: '321.654.987-33', vehicle: { model: 'Nivus', brand: 'Volkswagen', plate: 'NIV6V77', year: 2022 } },
    { name: 'Locadora Viagem', doc: '20.300.400/0001-55', vehicle: { model: 'Argo', brand: 'Fiat', plate: 'LOC7A66', year: 2023 } }
  ];

  for (let i = 0; i < clientsData.length; i++) {
    const c = clientsData[i];
    const client = await prisma.client.create({
      data: {
        companyId: company.id,
        name: c.name,
        document: c.doc,
        phone: `(11) 98888-${7000 + i}`,
        vehicles: {
          create: { companyId: company.id, ...c.vehicle }
        }
      },
      include: { vehicles: true }
    });

    // Create 1 to 3 OS per client to populate history
    const numOs = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < numOs; j++) {
      const branch = branches[Math.floor(Math.random() * branches.length)];
      const mechanic = createdUsers.filter(u => u.name.toLowerCase().includes('mecânico'))[Math.floor(Math.random() * 3)];
      
      const statuses = [OSStatus.OPEN, OSStatus.IN_PROGRESS, OSStatus.AWAITING_PARTS, OSStatus.FINISHED, OSStatus.CANCELLED];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Random past dates for some OS to show history
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 60));
      
      const servicesOpt = [
        { name: 'Revisão Básica 10.000km', price: 300 },
        { name: 'Troca de Óleo e Filtros', price: 150 },
        { name: 'Alinhamento e Balanceamento', price: 180 },
        { name: 'Troca de Pastilhas e Discos', price: 250 },
        { name: 'Manutenção Preventiva Completa', price: 800 },
        { name: 'Higienização de Ar Condicionado', price: 120 },
      ];

      const numServices = Math.floor(Math.random() * 2) + 1;
      const selectedServices = [];
      let totalServices = 0;
      for (let s = 0; s < numServices; s++) {
        const serv = servicesOpt[Math.floor(Math.random() * servicesOpt.length)];
        selectedServices.push(serv);
        totalServices += serv.price;
      }

      const os = await prisma.serviceOrder.create({
        data: {
          companyId: company.id,
          branchId: branch.id,
          clientId: client.id,
          vehicleId: client.vehicles[0].id,
          mechanicId: mechanic?.id,
          status: status,
          totalParts: 0,
          totalServices: totalServices,
          finalValue: totalServices,
          notes: 'Cliente relatou barulho na suspensão. Efetuar testes e orçamento detalhado.',
          createdAt: createdDate,
          services: {
            create: selectedServices.map(s => ({ name: s.name, price: s.price }))
          }
        }
      });

      const numParts = Math.floor(Math.random() * 4);
      let totalPartsValue = 0;
      
      for (let k = 0; k < numParts; k++) {
        const randomPart = createdParts[Math.floor(Math.random() * createdParts.length)];
        const qty = Math.floor(Math.random() * 2) + 1;
        
        await prisma.oSPart.create({
          data: {
            serviceOrderId: os.id,
            partId: randomPart.id,
            quantity: qty,
            unitPrice: randomPart.salePrice ? Number(randomPart.salePrice) : 0
          }
        });
        
        totalPartsValue += Number(randomPart.salePrice) * qty;
      }

      const finalTotal = totalServices + totalPartsValue;
      
      const updatedOs = await prisma.serviceOrder.update({
        where: { id: os.id },
        data: { totalParts: totalPartsValue, finalValue: finalTotal }
      });

      if (status === OSStatus.FINISHED) {
        // Create financial record
        const paymentDate = new Date(createdDate);
        paymentDate.setDate(paymentDate.getDate() + 1); // paid 1 day later
        
        await prisma.financialRecord.create({
          data: {
            companyId: company.id,
            branchId: branch.id,
            type: FinancialType.RECEIVABLE,
            category: 'Serviços e Peças',
            description: `OS #${updatedOs.number} - ${client.name}`,
            amount: finalTotal,
            dueDate: paymentDate,
            status: FinancialStatus.PAID,
            paymentDate: paymentDate,
            createdAt: createdDate
          }
        });
      }
    }
  }

  // Create additional financial records for reports
  console.log('💰 Generating financial history...');
  
  const expenseCategories = ['Aluguel', 'Energia Elétrica', 'Água', 'Internet', 'Salários', 'Fornecedores Peças', 'Impostos', 'Marketing'];
  
  for (let i = 0; i < 30; i++) {
    const branch = branches[Math.floor(Math.random() * branches.length)];
    const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
    const amount = Math.floor(Math.random() * 5000) + 100;
    
    // Distribute in the last 60 days
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    
    const isPaid = Math.random() > 0.3; // 70% paid
    
    await prisma.financialRecord.create({
      data: {
        companyId: company.id,
        branchId: branch.id,
        type: FinancialType.PAYABLE,
        category: category,
        description: `Despesa com ${category} - ref. operação`,
        amount: amount,
        dueDate: date,
        status: isPaid ? FinancialStatus.PAID : FinancialStatus.PENDING,
        paymentDate: isPaid ? date : null,
        createdAt: date
      }
    });
  }

  console.log('✅ Full database seeding completed successfully!');
  console.log('--------------------------------------------------');
  console.log('Login credentials for presentation:');
  console.log('Email: admin@autosync.com');
  console.log('Password: admin123');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
