import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../shared/middlewares/authMiddleware';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logger } from "../shared/logger";

export const generateOSPDF = async (req: AuthRequest, res: Response) => {
  try {
    const id = (req.params.id as string) as string;

    const os = await prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        client: true,
        vehicle: true,
        branch: true,
        mechanic: true,
        parts: { include: { part: true } },
        services: true,
      }
    });

    if (!os) {
      return res.status(404).json({ message: 'Ordem de Serviço não encontrada.' });
    }

    const doc = new PDFDocument({ margin: 50 });

    // Stream the PDF directly to the response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=OS_${os.number}.pdf`);
    doc.pipe(res);

    // --- Header ---
    doc.fontSize(20).text('AUTOSYNC ERP', { align: 'center' });
    doc.fontSize(10).text('Sistema de Gestão Automotiva', { align: 'center' });
    doc.moveDown();

    // --- Branch Info & OS Number ---
    const top = doc.y;
    doc.fontSize(12).text(os.branch.name, 50, top);
    doc.fontSize(10).text(`CNPJ: ${os.branch.cnpj}`);
    doc.text(`${os.branch.address}`);
    doc.text(`Fone: ${os.branch.phone}`);

    doc.fontSize(14).text(`ORDEM DE SERVIÇO #${os.number}`, 350, top, { align: 'right' });
    doc.fontSize(10).text(`Data: ${format(os.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 350, doc.y, { align: 'right' });
    doc.text(`Status: ${os.status}`, 350, doc.y, { align: 'right' });

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // --- Client & Vehicle Info ---
    const infoY = doc.y;
    doc.fontSize(12).text('CLIENTE', 50, infoY, { underline: true });
    doc.fontSize(10).text(`Nome: ${os.client.name}`);
    doc.text(`CPF/CNPJ: ${os.client.document}`);
    doc.text(`Telefone: ${os.client.phone}`);

    doc.fontSize(12).text('VEÍCULO', 300, infoY, { underline: true });
    doc.fontSize(10).text(`Modelo: ${os.vehicle.brand} ${os.vehicle.model}`);
    doc.text(`Placa: ${os.vehicle.plate}`);
    doc.text(`Ano: ${os.vehicle.year}`);
    doc.text(`KM: ${os.vehicle.mileage}`);

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // --- Services ---
    if (os.services.length > 0) {
      doc.fontSize(12).text('SERVIÇOS', { underline: true });
      doc.moveDown(0.5);
      
      const tableTop = doc.y;
      doc.fontSize(10);
      doc.text('Descrição', 50, tableTop);
      doc.text('Valor', 450, tableTop, { align: 'right', width: 100 });
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#E0E0E0');
      doc.moveDown(0.5);

      os.services.forEach(s => {
        const currentY = doc.y;
        doc.text(s.name, 50, currentY);
        doc.text(`R$ ${Number(s.price).toFixed(2)}`, 450, currentY, { align: 'right', width: 100 });
        doc.moveDown();
      });
      doc.moveDown();
    }

    // --- Parts ---
    if (os.parts.length > 0) {
      doc.fontSize(12).text('PEÇAS', { underline: true });
      doc.moveDown(0.5);

      const tableTop = doc.y;
      doc.fontSize(10);
      doc.text('Item', 50, tableTop);
      doc.text('Qtd', 300, tableTop);
      doc.text('Unit.', 380, tableTop);
      doc.text('Subtotal', 450, tableTop, { align: 'right', width: 100 });
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#E0E0E0');
      doc.moveDown(0.5);

      os.parts.forEach(p => {
        const currentY = doc.y;
        doc.text(p.part?.name || p.description || '', 50, currentY, { width: 240 });
        doc.text(p.quantity.toString(), 300, currentY);
        doc.text(`R$ ${Number(p.unitPrice).toFixed(2)}`, 380, currentY);
        doc.text(`R$ ${(Number(p.quantity) * Number(p.unitPrice)).toFixed(2)}`, 450, currentY, { align: 'right', width: 100 });
        doc.moveDown();
      });
      doc.moveDown();
    }

    // --- Totals ---
    doc.moveTo(350, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(10).text('Total Serviços:', 350, doc.y);
    doc.text(`R$ ${Number(os.totalServices).toFixed(2)}`, 450, doc.y - 12, { align: 'right', width: 100 });
    
    doc.text('Total Peças:', 350, doc.y);
    doc.text(`R$ ${Number(os.totalParts).toFixed(2)}`, 450, doc.y - 12, { align: 'right', width: 100 });

    doc.fontSize(14).text('TOTAL GERAL:', 350, doc.y + 5);
    doc.text(`R$ ${Number(os.finalValue).toFixed(2)}`, 450, doc.y - 15, { align: 'right', width: 100 });

    // --- Footer / Observations ---
    if (os.notes) {
      doc.moveDown(2);
      doc.fontSize(10).text('OBSERVAÇÕES:', { underline: true });
      doc.text(os.notes);
    }

    // --- Signatures ---
    const footerY = 700;
    doc.moveTo(50, footerY).lineTo(250, footerY).stroke();
    doc.text('Assinatura do Cliente', 50, footerY + 5, { align: 'center', width: 200 });

    doc.moveTo(350, footerY).lineTo(550, footerY).stroke();
    doc.text('Responsável Técnico', 350, footerY + 5, { align: 'center', width: 200 });

    doc.end();

  } catch (error: unknown) {
  if (error instanceof Error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).json({ message: 'Erro ao gerar o documento PDF.' });
  } else {
    logger.error({ err: error }, "An unknown error occurred");
      return res.status(500).json({ message: 'An unknown error occurred' });  }
}
};
