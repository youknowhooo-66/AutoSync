// apps/api/src/modules/financial/routes/financial.routes.ts

import { Router } from 'express';
import {
  createFinancialController,
  updateFinancialController,
  deleteFinancialController,
  listFinancialController,
} from '../index';
import { prismaClient } from '../../../shared/database/prismaClient';
import { createAuditLog } from '../../../controllers/AuditController';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const financialRoutes = Router();

// Base routes
financialRoutes.post('/', (req, res) => createFinancialController.handle(req, res));
financialRoutes.get('/', (req, res) => listFinancialController.handle(req, res));
financialRoutes.put('/:id', (req, res) => updateFinancialController.handle(req, res));
financialRoutes.delete('/:id', (req, res) => deleteFinancialController.handle(req, res));

// Aliases for frontend list/create
financialRoutes.post('/invoices', (req, res) => createFinancialController.handle(req, res));
financialRoutes.get('/invoices', (req, res) => listFinancialController.handle(req, res));
financialRoutes.put('/invoices/:id', (req, res) => updateFinancialController.handle(req, res));
financialRoutes.delete('/invoices/:id', (req, res) => deleteFinancialController.handle(req, res));

// Invoice Detail
financialRoutes.get('/invoices/:id', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const record = await prismaClient.financialRecord.findFirst({
      where: { id, companyId }
    });

    if (!record) {
      return res.status(404).json({ message: 'Registro financeiro não encontrado.' });
    }

    const invoiceNumber = `FT-${record.id.substring(0, 8).toUpperCase()}`;
    
    let client = null;
    let vehicle = null;
    let serviceOrderId = null;

    const osMatch = record.description?.match(/OS #(\d+)/);
    if (osMatch) {
      const osNumber = parseInt(osMatch[1], 10);
      const os = await prismaClient.serviceOrder.findFirst({
        where: { number: osNumber, companyId },
        include: {
          client: true,
          vehicle: true
        }
      });
      if (os) {
        serviceOrderId = os.id;
        client = {
          name: os.client.name,
          document: os.client.document,
          email: os.client.email || undefined
        };
        vehicle = {
          model: os.vehicle.model,
          plate: os.vehicle.plate
        };
      }
    }

    const payments = [];
    if (record.status === 'PAID') {
      payments.push({
        method: 'PIX',
        amount: Number(record.amount),
        createdAt: record.paymentDate || record.createdAt
      });
    }

    const responseData = {
      id: record.id,
      invoiceNumber,
      serviceOrderId,
      client,
      vehicle,
      subtotal: Number(record.amount),
      discount: 0,
      taxes: 0,
      totalAmount: Number(record.amount),
      amountPaid: record.status === 'PAID' ? Number(record.amount) : 0,
      status: record.status === 'CANCELLED' ? 'CANCELED' : record.status,
      dueDate: record.dueDate.toISOString(),
      createdAt: record.createdAt.toISOString(),
      payments
    };

    return res.json(responseData);
  } catch (error) {
    next(error);
  }
});

// Update Status
financialRoutes.patch('/invoices/:id/status', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const companyId = req.user.companyId;

    const record = await prismaClient.financialRecord.findFirst({
      where: { id, companyId }
    });

    if (!record) {
      return res.status(404).json({ message: 'Registro financeiro não encontrado.' });
    }

    let dbStatus: 'PENDING' | 'PAID' | 'CANCELLED' = 'PENDING';
    if (status === 'PAID') dbStatus = 'PAID';
    if (status === 'CANCELED' || status === 'CANCELLED') dbStatus = 'CANCELLED';

    const updated = await prismaClient.financialRecord.update({
      where: { id },
      data: {
        status: dbStatus,
        paymentDate: dbStatus === 'PAID' ? new Date() : null
      }
    });

    createAuditLog(
      req.user.id,
      'UPDATE_STATUS',
      'FINANCIAL',
      id,
      { status: record.status },
      { status: dbStatus },
      req.ip
    );

    return res.json({ message: 'Status atualizado com sucesso.', record: updated });
  } catch (error) {
    next(error);
  }
});

// Add Payment
financialRoutes.post('/invoices/:id/payments', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const { amount, method } = req.body;
    const companyId = req.user.companyId;

    const record = await prismaClient.financialRecord.findFirst({
      where: { id, companyId }
    });

    if (!record) {
      return res.status(404).json({ message: 'Registro financeiro não encontrado.' });
    }

    const updated = await prismaClient.financialRecord.update({
      where: { id },
      data: {
        status: 'PAID',
        paymentDate: new Date()
      }
    });

    createAuditLog(
      req.user.id,
      'ADD_PAYMENT',
      'FINANCIAL',
      id,
      { status: record.status },
      { status: 'PAID', payment: { amount, method } },
      req.ip
    );

    return res.status(201).json({ message: 'Pagamento registrado com sucesso.', record: updated });
  } catch (error) {
    next(error);
  }
});

// Download PDF
financialRoutes.get('/invoices/:id/pdf', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const record = await prismaClient.financialRecord.findFirst({
      where: { id, companyId },
      include: {
        branch: true
      }
    });

    if (!record) {
      return res.status(404).json({ message: 'Registro financeiro não encontrado.' });
    }

    let clientName = 'N/A';
    let clientDoc = 'N/A';
    let vehicleInfo = 'N/A';
    let osNumber = 'N/A';

    const osMatch = record.description?.match(/OS #(\d+)/);
    if (osMatch) {
      const num = parseInt(osMatch[1], 10);
      const os = await prismaClient.serviceOrder.findFirst({
        where: { number: num, companyId },
        include: {
          client: true,
          vehicle: true
        }
      });
      if (os) {
        osNumber = os.number.toString();
        clientName = os.client.name;
        clientDoc = os.client.document;
        vehicleInfo = `${os.vehicle.brand} ${os.vehicle.model} (${os.vehicle.plate})`;
      }
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Fatura_${id.substring(0, 8)}.pdf`);
    doc.pipe(res);

    // --- Header ---
    doc.fontSize(20).text('AUTOSYNC ERP', { align: 'center' });
    doc.fontSize(10).text('Controle Financeiro & Faturamento', { align: 'center' });
    doc.moveDown();

    // --- Branch Info ---
    const top = doc.y;
    doc.fontSize(12).text(record.branch.name, 50, top);
    doc.fontSize(10).text(`CNPJ: ${record.branch.cnpj}`);
    if (record.branch.address) doc.text(`${record.branch.address}`);
    if (record.branch.phone) doc.text(`Fone: ${record.branch.phone}`);

    const invoiceNum = `FT-${record.id.substring(0, 8).toUpperCase()}`;
    doc.fontSize(14).text(`FATURA / RECIBO`, 350, top, { align: 'right' });
    doc.fontSize(10).text(`Código: ${invoiceNum}`, 350, doc.y, { align: 'right' });
    doc.text(`Emissão: ${format(record.createdAt, "dd/MM/yyyy", { locale: ptBR })}`, 350, doc.y, { align: 'right' });
    doc.text(`Vencimento: ${format(record.dueDate, "dd/MM/yyyy", { locale: ptBR })}`, 350, doc.y, { align: 'right' });

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // --- Details ---
    const infoY = doc.y;
    doc.fontSize(12).text('DADOS DO CLIENTE / OS', 50, infoY, { underline: true });
    doc.fontSize(10).text(`Cliente: ${clientName}`);
    doc.text(`Documento: ${clientDoc}`);
    doc.text(`Veículo: ${vehicleInfo}`);
    doc.text(`Ref. Ordem de Serviço: ${osNumber}`);

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // --- Financial Values ---
    doc.fontSize(12).text('DETALHAMENTO DOS VALORES', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(10);
    doc.text('Descrição / Categoria', 50, doc.y);
    doc.text('Valor', 450, doc.y - 12, { align: 'right', width: 100 });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#E0E0E0');
    doc.moveDown(0.5);

    doc.text(record.description || record.category || 'Serviço Prestado', 50, doc.y);
    doc.text(`R$ ${Number(record.amount).toFixed(2)}`, 450, doc.y - 12, { align: 'right', width: 100 });
    doc.moveDown(2);

    doc.moveTo(350, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(12).text('TOTAL:', 350, doc.y);
    doc.text(`R$ ${Number(record.amount).toFixed(2)}`, 450, doc.y - 14, { align: 'right', width: 100 });

    doc.moveDown();
    doc.fontSize(10).text(`Status da Fatura: ${record.status === 'PAID' ? 'PAGA' : record.status === 'CANCELLED' ? 'CANCELADA' : 'PENDENTE'}`, 50, doc.y);

    // --- Signatures ---
    const footerY = 700;
    doc.moveTo(350, footerY).lineTo(550, footerY).stroke();
    doc.text('Assinatura do Responsável', 350, footerY + 5, { align: 'center', width: 200 });

    doc.end();
  } catch (error) {
    next(error);
  }
});

export { financialRoutes };

