import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { prismaClient } from '../../src/shared/database/prismaClient';
import { normalizeInternalCode } from '../../src/shared/utils/normalizeInternalCode';

export class FactoryEngine {
  /**
   * Generates a unique CNPJ for testing purposes.
   */
  private static generateCNPJ(): string {
    return faker.helpers.fromRegExp(/[0-9]{2}\.[0-9]{3}\.[0-9]{3}\/0001-[0-9]{2}/);
  }

  /**
   * Generates a unique Plate for testing purposes.
   */
  private static generatePlate(): string {
    return faker.helpers.fromRegExp(/[A-Z]{3}[0-9][A-Z][0-9]{2}/);
  }

  /**
   * Creates a random Company entity.
   */
  static async createCompany(overrides = {}) {
    const data = {
      name: faker.company.name(),
      document: FactoryEngine.generateCNPJ(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode('#####-###'),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      isActive: true,
      ...overrides,
    };

    return await prismaClient.company.create({ data });
  }

  /**
   * Creates a random Branch entity linked to a Company.
   */
  static async createBranch(companyId: string, overrides = {}) {
    const data = {
      companyId,
      name: faker.company.name() + ' Branch',
      cnpj: FactoryEngine.generateCNPJ(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode('#####-###'),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      active: true,
      ...overrides,
    };

    return await prismaClient.branch.create({ data });
  }

  /**
   * Creates a random User entity.
   */
  static async createUser(companyId: string, overrides: any = {}) {
    const plainPassword = overrides.password || 'password123';
    const hashedPassword = await bcrypt.hash(plainPassword, 8);

    const data = {
      companyId,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: overrides.role || 'ATTENDANT',
      branchId: overrides.branchId || null,
      active: overrides.active !== undefined ? overrides.active : true,
      ...overrides,
      password: hashedPassword,
    };

    // Remove plain password if it was overwritten
    delete data.passwordOverride;

    return await prismaClient.user.create({ data });
  }

  /**
   * Creates a random Client entity.
   */
  static async createClient(companyId: string, overrides = {}) {
    const data = {
      companyId,
      name: faker.person.fullName(),
      document: faker.helpers.fromRegExp(/[0-9]{11}/), // CPF
      phone: faker.phone.number(),
      whatsapp: faker.phone.number(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode('#####-###'),
      email: faker.internet.email(),
      ...overrides,
    };

    return await prismaClient.client.create({ data });
  }

  /**
   * Creates a random Vehicle entity.
   */
  static async createVehicle(companyId: string, clientId: string, overrides = {}) {
    const data = {
      companyId,
      clientId,
      plate: FactoryEngine.generatePlate(),
      model: faker.vehicle.model(),
      brand: faker.vehicle.manufacturer(),
      year: faker.date.past({ years: 10 }).getFullYear(),
      chassis: faker.helpers.fromRegExp(/[A-Z0-9]{17}/),
      mileage: faker.number.int({ min: 1000, max: 200000 }),
      engine: '1.6 Flex',
      ...overrides,
    };

    return await prismaClient.vehicle.create({ data });
  }

  /**
   * Creates a random Part entity.
   */
  static async createPart(companyId: string, overrides: Record<string, any> = {}) {
    const internalCode = overrides.internalCode ?? faker.helpers.fromRegExp(/PRT-[0-9]{6}/);
    const data = {
      companyId,
      name: faker.commerce.productName(),
      internalCode,
      manufacturerCode: faker.helpers.fromRegExp(/MFG-[0-9]{8}/),
      description: faker.commerce.productDescription(),
      category: faker.commerce.department(),
      brand: faker.company.name(),
      purchasePrice: parseFloat(faker.commerce.price({ min: 10, max: 200 })),
      salePrice: parseFloat(faker.commerce.price({ min: 25, max: 500 })),
      minStock: faker.number.int({ min: 2, max: 10 }),
      location: faker.location.streetAddress(),
      active: true,
      ...overrides,
    };

    // Always compute normalizedInternalCode from the final internalCode value
    // (handles both default and overridden internalCode)
    data.normalizedInternalCode = normalizeInternalCode(data.internalCode);

    return await prismaClient.part.create({ data });
  }


  /**
   * Creates a random Stock record.
   */
  static async createStock(companyId: string, partId: string, branchId: string, quantity = 10) {
    return await prismaClient.stock.create({
      data: {
        companyId,
        partId,
        branchId,
        quantity,
      },
    });
  }

  /**
   * Creates a random Supplier entity.
   */
  static async createSupplier(companyId: string, overrides = {}) {
    const data = {
      companyId,
      name: faker.company.name(),
      cnpj: FactoryEngine.generateCNPJ(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode('#####-###'),
      email: faker.internet.email(),
      ...overrides,
    };

    return await prismaClient.supplier.create({ data });
  }

  /**
   * Creates a random Financial Record.
   */
  static async createFinancialRecord(companyId: string, branchId: string, overrides = {}) {
    const data = {
      companyId,
      branchId,
      type: faker.helpers.arrayElement(['PAYABLE', 'RECEIVABLE']) as 'PAYABLE' | 'RECEIVABLE',
      category: faker.helpers.arrayElement(['Stock', 'Rent', 'Salaries', 'ServiceOrder']),
      description: faker.commerce.productDescription(),
      amount: parseFloat(faker.commerce.price({ min: 100, max: 5000 })),
      dueDate: faker.date.future(),
      status: faker.helpers.arrayElement(['PENDING', 'PAID']) as 'PENDING' | 'PAID',
      ...overrides,
    };

    return await prismaClient.financialRecord.create({ data });
  }

  /**
   * Creates a random Service Order.
   */
  static async createServiceOrder(companyId: string, clientId: string, vehicleId: string, branchId: string, overrides = {}) {
    const data = {
      companyId,
      clientId,
      vehicleId,
      branchId,
      notes: faker.lorem.paragraph(),
      status: 'OPEN' as 'OPEN',
      totalParts: 0,
      totalServices: 0,
      discount: 0,
      finalValue: 0,
      ...overrides,
    };

    return await prismaClient.serviceOrder.create({ data });
  }
}
