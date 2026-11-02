/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { ActiveShift, Operator, Ticket, VehicleType } from '../types';
import {
  cleanPlate,
  formatCurrency,
  formatDateTime,
  formatDuration,
} from './plateValidator';

const VEHICLE_LABELS: Record<VehicleType, string> = {
  carro: 'AUTOMOVEL / PASSEIO',
  moto: 'MOTOCICLETA',
  caminhao: 'CAMINHAO / UTILITARIO',
};

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: 'DINHEIRO EM ESPECIE',
  pix: 'PIX (INSTANTANEO)',
  cartao_debito: 'CARTAO DE DEBITO',
  cartao_credito: 'CARTAO DE CREDITO',
  isento_tolerancia: 'ISENTO (TOLERANCIA 15 MIN)',
  mensalista: 'CONVENIO MENSALISTA',
};

/**
 * Generates and triggers the direct download of a Ticket or Payment Receipt PDF.
 */
export function downloadTicketPdf(ticket: Ticket, mode: 'entry' | 'exit') {
  // 80mm width ticket format, height 160mm for entry, 190mm for exit
  const height = mode === 'entry' ? 165 : 200;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, height],
  });

  const pageWidth = 80;

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 80, height, 'F');

  // Header
  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('WEPARK ESTACIONAMENTO', pageWidth / 2, 10, { align: 'center' });

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('ESTACIONAMENTO SEGURO | TECNOLOGIA E PRATICIDADE', pageWidth / 2, 14, { align: 'center' });
  doc.text('CNPJ: 42.189.923/0001-44', pageWidth / 2, 18, { align: 'center' });
  doc.text('Av. Paulista, 1000 - Sao Paulo, SP', pageWidth / 2, 22, { align: 'center' });

  // Title Box
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(8, 26, 64, 7, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  const title = mode === 'entry' ? '*** TICKET DE ENTRADA ***' : '*** COMPROVANTE DE PAGTO ***';
  doc.text(title, pageWidth / 2, 30.5, { align: 'center' });

  // Dashed line
  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([1.5, 1], 0);
  doc.line(6, 36, 74, 36);

  // Details
  let y = 42;
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  // Ticket Number
  doc.text('NO TICKET:', 8, y);
  doc.setFont('courier', 'bold');
  doc.text(ticket.ticketNumber, 72, y, { align: 'right' });

  // Plate Box
  y += 7;
  doc.setFont('courier', 'normal');
  doc.text('PLACA VEICULO:', 8, y + 1);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(15, 23, 42);
  doc.roundedRect(42, y - 4, 30, 8, 1, 1, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text(ticket.plate, 57, y + 1.5, { align: 'center' });

  // Porte
  y += 9;
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.text('PORTE:', 8, y);
  doc.setFont('courier', 'bold');
  doc.text(VEHICLE_LABELS[ticket.vehicleType] || ticket.vehicleType.toUpperCase(), 72, y, { align: 'right' });

  // Description
  if (ticket.modelDescription) {
    y += 5.5;
    doc.setFont('courier', 'normal');
    doc.text('DESCRICAO:', 8, y);
    doc.setFont('courier', 'bold');
    const desc = ticket.modelDescription.substring(0, 18);
    doc.text(desc, 72, y, { align: 'right' });
  }

  // Entry Time
  y += 5.5;
  doc.setFont('courier', 'normal');
  doc.text('ENTRADA:', 8, y);
  doc.setFont('courier', 'bold');
  doc.text(formatDateTime(ticket.entryTime), 72, y, { align: 'right' });

  // Exit details if exit mode
  if (mode === 'exit' && ticket.exitTime) {
    y += 5.5;
    doc.setFont('courier', 'normal');
    doc.text('SAIDA:', 8, y);
    doc.setFont('courier', 'bold');
    doc.text(formatDateTime(ticket.exitTime), 72, y, { align: 'right' });

    y += 5.5;
    doc.setFont('courier', 'normal');
    doc.text('PERMANENCIA:', 8, y);
    doc.setFont('courier', 'bold');
    doc.text(formatDuration(ticket.durationMinutes || 0), 72, y, { align: 'right' });
  }

  // Dashed separator
  y += 4;
  doc.line(6, y, 74, y);
  y += 5;

  if (mode === 'exit') {
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    doc.text('TARIFA ROTATIVA:', 8, y);
    doc.text(formatCurrency(ticket.regularPrice), 72, y, { align: 'right' });

    if (ticket.administrativeFee > 0) {
      y += 5;
      doc.text('TAXA PERDA TICKET:', 8, y);
      doc.text(`+${formatCurrency(ticket.administrativeFee)}`, 72, y, { align: 'right' });
    }

    y += 6;
    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(5, 150, 105);
    doc.text('TOTAL PAGO:', 8, y);
    doc.text(formatCurrency(ticket.totalPaid), 72, y, { align: 'right' });

    y += 5;
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('FORMA PAGTO:', 8, y);
    doc.setFont('courier', 'bold');
    doc.text(ticket.paymentMethod ? PAYMENT_LABELS[ticket.paymentMethod] : 'QUITADO', 72, y, { align: 'right' });

    if (ticket.amountTendered && ticket.amountTendered > 0) {
      y += 4.5;
      doc.setFont('courier', 'normal');
      doc.text('VALOR RECEBIDO:', 8, y);
      doc.text(formatCurrency(ticket.amountTendered), 72, y, { align: 'right' });

      y += 4.5;
      doc.text('TROCO DEVOLVIDO:', 8, y);
      doc.text(formatCurrency(ticket.changeGiven || 0), 72, y, { align: 'right' });
    }

    y += 6;
    doc.setFillColor(209, 250, 229);
    doc.roundedRect(6, y - 3.5, 68, 6.5, 1, 1, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(6, 95, 70);
    doc.text('CANCELA LIBERADA - QUITACAO REGISTRADA', pageWidth / 2, y + 0.5, { align: 'center' });
  } else {
    // Notice for entry
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(6, y - 2, 68, 12, 1, 1, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(146, 64, 14);
    doc.text('TOLERANCIA GRATUITA: 15 MINUTOS', pageWidth / 2, y + 2, { align: 'center' });
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.text('Apos 15 min, cobranca conforme tabela.', pageWidth / 2, y + 6, { align: 'center' });

    y += 13;
    if (ticket.isMonthly) {
      doc.setFillColor(224, 231, 255);
      doc.roundedRect(6, y - 2, 68, 6, 1, 1, 'F');
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(49, 46, 129);
      doc.text('* CLIENTE MENSALISTA AUTORIZADO *', pageWidth / 2, y + 2, { align: 'center' });
      y += 7;
    }
  }

  // Operator footer
  y += 6;
  doc.line(6, y, 74, y);
  y += 5;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`OPERADOR: ${ticket.operatorName}`, 8, y);
  y += 4;
  doc.text(`TURNO: ${ticket.shiftType.toUpperCase()}`, 8, y);

  // Barcode representation
  y += 6;
  doc.setFont('courier', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('|||| | ||||| || |||||| | |||', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setFontSize(8);
  doc.text(`*${ticket.ticketNumber}-${cleanPlate(ticket.plate)}*`, pageWidth / 2, y, { align: 'center' });

  // Save PDF
  const prefix = mode === 'entry' ? 'Ticket_Entrada' : 'Recibo_Saida';
  const fileName = `${prefix}_${ticket.ticketNumber}_${cleanPlate(ticket.plate)}.pdf`;
  doc.save(fileName);
}

/**
 * Generates and triggers download of the Shift Closure Report as PDF.
 */
export function downloadShiftReportPdf(
  activeOperator: Operator,
  activeShift: ActiveShift,
  tickets: Ticket[],
  countedCash: number,
  notes: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('WEPARK ESTACIONAMENTO', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('RELATORIO FORMAL DE FECHAMENTO DE CAIXA E TURNO', pageWidth / 2, 26, { align: 'center' });
  doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, 31, { align: 'center' });

  doc.setDrawColor(203, 213, 225);
  doc.line(15, 36, 195, 36);

  // Operator Info
  let y = 44;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO OPERADOR E TURNO', 15, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Operador: ${activeOperator.name} (Matricula #${activeOperator.matricula} - CPF: ${activeOperator.cpf})`, 15, y);
  y += 5;
  doc.text(`Turno: ${activeShift.shiftType.toUpperCase()} • Abertura: ${formatDateTime(activeShift.openedAt)}`, 15, y);

  // Financial Summary
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('1. MOVIMENTACAO FINANCEIRA', 15, y);
  y += 6;
  doc.setFont('helvetica', 'normal');

  const shiftTickets = tickets.filter(
    (t) =>
      (t.status === 'pago_liberado' || t.status === 'perda_regularizada') &&
      t.operatorId === activeOperator.id &&
      t.shiftType === activeShift.shiftType
  );

  const cashIn = shiftTickets
    .filter((t) => t.paymentMethod === 'dinheiro')
    .reduce((acc, t) => acc + (t.totalPaid || 0), 0);

  const pixIn = shiftTickets
    .filter((t) => t.paymentMethod === 'pix')
    .reduce((acc, t) => acc + (t.totalPaid || 0), 0);

  const debitIn = shiftTickets
    .filter((t) => t.paymentMethod === 'cartao_debito')
    .reduce((acc, t) => acc + (t.totalPaid || 0), 0);

  const creditIn = shiftTickets
    .filter((t) => t.paymentMethod === 'cartao_credito')
    .reduce((acc, t) => acc + (t.totalPaid || 0), 0);

  const totalGrossRevenue = cashIn + pixIn + debitIn + creditIn;
  const totalBleedings = activeShift.bleedings.reduce((acc, b) => acc + b.amount, 0);
  const totalSupplies = activeShift.supplies.reduce((acc, s) => acc + s.amount, 0);
  const expectedPhysicalCash =
    activeShift.initialFund + cashIn + totalSupplies - totalBleedings;

  doc.text(`(+) Fundo Inicial de Troco: ${formatCurrency(activeShift.initialFund)}`, 15, y);
  y += 5;
  doc.text(`(+) Dinheiro em Especie Recebido: ${formatCurrency(cashIn)}`, 15, y);
  y += 5;
  doc.text(`(+) Pix Recebido: ${formatCurrency(pixIn)}`, 15, y);
  y += 5;
  doc.text(`(+) Cartao de Debito: ${formatCurrency(debitIn)}`, 15, y);
  y += 5;
  doc.text(`(+) Cartao de Credito: ${formatCurrency(creditIn)}`, 15, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`FATURAMENTO BRUTO TOTAL DO TURNO: ${formatCurrency(totalGrossRevenue)}`, 15, y);

  y += 10;
  doc.text('2. SANGRIA E REFORCOS', 15, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`(+) Suprimentos (Reforco de Troco): ${formatCurrency(totalSupplies)}`, 15, y);
  y += 5;
  doc.text(`(-) Sangrias Transferidas para o Cofre: -${formatCurrency(totalBleedings)}`, 15, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`SALDO ESPERADO NA GAVETA (DINHEIRO): ${formatCurrency(expectedPhysicalCash)}`, 15, y);

  // Divergence
  if (countedCash > 0) {
    const diff = countedCash - expectedPhysicalCash;
    y += 6;
    doc.text(`Dinheiro Contado pelo Operador: ${formatCurrency(countedCash)}`, 15, y);
    y += 5;
    doc.text(`Divergencia (Sobra/Falta): ${formatCurrency(diff)}`, 15, y);
  }

  // Signatures
  y += 30;
  doc.line(20, y, 90, y);
  doc.line(120, y, 190, y);
  y += 5;
  doc.setFontSize(9);
  doc.text(activeOperator.name, 55, y, { align: 'center' });
  doc.text('Supervisor Responsavel', 155, y, { align: 'center' });
  y += 4;
  doc.setFontSize(8);
  doc.text('Operador da Guarita', 55, y, { align: 'center' });
  doc.text('Conferencia e Auditoria WePark', 155, y, { align: 'center' });

  const fileName = `Fechamento_Caixa_${activeShift.shiftType}_${new Date().toISOString().substring(0, 10)}.pdf`;
  doc.save(fileName);
}
