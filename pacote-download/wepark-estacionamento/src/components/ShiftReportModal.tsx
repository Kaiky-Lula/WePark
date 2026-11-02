/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ActiveShift, Operator, Ticket } from '../types';
import { formatCurrency, formatDateTime } from '../utils/plateValidator';
import { downloadShiftReportPdf } from '../utils/pdfGenerator';
import { Printer, X, Download, FileSpreadsheet, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ShiftReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeOperator: Operator;
  activeShift: ActiveShift;
  tickets: Ticket[];
  onFinishShift: (countedCash: number, notes: string) => void;
}

export const ShiftReportModal: React.FC<ShiftReportModalProps> = ({
  isOpen,
  onClose,
  activeOperator,
  activeShift,
  tickets,
  onFinishShift,
}) => {
  const [countedCashInput, setCountedCashInput] = useState('');
  const [closureNotes, setClosureNotes] = useState('');

  // ESC key listener to quickly close modal
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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

  const countedCash = parseFloat(countedCashInput.replace(',', '.')) || 0;
  const divergence = countedCash - expectedPhysicalCash;

  const parkedVehicles = tickets.filter((t) => t.status === 'patio');
  const overnightVehicles = parkedVehicles.filter((t) => t.isOvernight);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    downloadShiftReportPdf(
      activeOperator,
      activeShift,
      tickets,
      countedCash,
      closureNotes
    );
  };

  const handleConfirmFinish = () => {
    onFinishShift(countedCash, closureNotes);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white border-2 border-slate-300 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f4c81] flex items-center justify-center text-white font-bold">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide uppercase">
                Fechamento de Caixa e Turno
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Conferência de valores, censo de veículos e emissão de relatório oficial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar (ESC)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Paper Content */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 flex-1">
          <div className="w-full bg-white text-slate-900 border-2 border-slate-300 p-5 sm:p-7 rounded-xl shadow-md">
            {/* Header Document */}
            <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
              <img
                src="/assets/aistudio/Gemini_Generated_Image_5pb78c5pb78c5pb7_01f4a0ff.jpg"
                alt="WePark Logo"
                className="h-14 sm:h-16 mx-auto mb-2 object-contain rounded-lg"
              />
              <h1 className="text-xl font-black tracking-wider text-[#0f4c81] uppercase">
                WePark Estacionamento
              </h1>
              <p className="text-xs font-bold text-slate-700">
                ESTACIONAMENTO SEGURO • TECNOLOGIA E PRATICIDADE
              </p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                AUDITORIA DE TURNO E CONCILIAÇÃO FINANCEIRA • Fechamento em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>

            {/* Operator and Shift Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 mb-4 border-b-2 border-slate-200 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-bold uppercase text-[10px]">Operador do Turno</span>
                <span className="font-black text-slate-900 text-base">{activeOperator.name}</span>
                <span className="text-slate-600 block font-mono text-xs">
                  Matrícula #{activeOperator.matricula} • CPF: {activeOperator.cpf}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-bold uppercase text-[10px]">Turno e Abertura</span>
                <span className="font-black text-slate-900 uppercase text-base">
                  Turno {activeShift.shiftType}
                </span>
                <span className="text-slate-600 block text-xs font-semibold">
                  Aberto em: {formatDateTime(activeShift.openedAt)}
                </span>
              </div>
            </div>

            {/* Inflow Summary */}
            <div className="mb-4">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 border-b-2 border-slate-200 pb-1">
                1. Movimentação Financeira do Caixa
              </h2>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 px-2 bg-slate-50 rounded">
                  <span className="font-bold text-slate-700">(+) Fundo de Troco Inicial (Abertura):</span>
                  <span className="font-mono font-black text-slate-900">{formatCurrency(activeShift.initialFund)}</span>
                </div>
                <div className="flex justify-between py-1 px-2">
                  <span className="font-semibold text-slate-700">(+) Entradas em Dinheiro (Espécie):</span>
                  <span className="font-mono font-black text-emerald-700">{formatCurrency(cashIn)}</span>
                </div>
                <div className="flex justify-between py-1 px-2">
                  <span className="font-semibold text-slate-700">(+) Recebimentos via Pix:</span>
                  <span className="font-mono font-black text-emerald-700">{formatCurrency(pixIn)}</span>
                </div>
                <div className="flex justify-between py-1 px-2">
                  <span className="font-semibold text-slate-700">(+) Cartão de Débito:</span>
                  <span className="font-mono font-bold text-slate-800">{formatCurrency(debitIn)}</span>
                </div>
                <div className="flex justify-between py-1 px-2">
                  <span className="font-semibold text-slate-700">(+) Cartão de Crédito:</span>
                  <span className="font-mono font-bold text-slate-800">{formatCurrency(creditIn)}</span>
                </div>
                <div className="flex justify-between py-2 px-3 border-2 border-emerald-300 font-black text-sm bg-emerald-50 rounded-lg text-emerald-900">
                  <span>FATURAMENTO BRUTO TOTAL DO TURNO:</span>
                  <span className="font-mono text-emerald-800">{formatCurrency(totalGrossRevenue)}</span>
                </div>
              </div>
            </div>

            {/* Outflow: Bleedings and Supplies */}
            <div className="mb-4">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 border-b-2 border-slate-200 pb-1">
                2. Sangrias e Reforços de Troco
              </h2>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between py-1 px-2">
                  <span className="font-semibold text-slate-700">(+) Reforços de Troco (Suprimentos):</span>
                  <span className="font-mono font-bold text-slate-800">{formatCurrency(totalSupplies)}</span>
                </div>
                <div className="flex justify-between py-1 px-2 text-blue-900 font-semibold">
                  <span>(-) Sangrias Transferidas para o Cofre:</span>
                  <span className="font-mono font-bold">-{formatCurrency(totalBleedings)}</span>
                </div>
                <div className="flex justify-between py-2 px-3 border-2 border-slate-900 font-black text-sm bg-slate-900 text-white rounded-lg mt-2">
                  <span>SALDO ESPERADO NA GAVETA (DINHEIRO EM ESPÉCIE):</span>
                  <span className="font-mono text-emerald-400 text-base">{formatCurrency(expectedPhysicalCash)}</span>
                </div>
              </div>
            </div>

            {/* Yard Status Census */}
            <div className="mb-4">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 border-b-2 border-slate-200 pb-1">
                3. Censo de Veículos do Pátio
              </h2>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 border-2 border-slate-200 rounded-lg bg-slate-50">
                  <span className="text-[11px] text-slate-600 block font-bold">Quitados no Turno</span>
                  <span className="font-black text-base text-slate-900">{shiftTickets.length}</span>
                </div>
                <div className="p-2 border-2 border-blue-200 rounded-lg bg-blue-50">
                  <span className="text-[11px] text-blue-800 block font-bold">Ainda no Pátio</span>
                  <span className="font-black text-base text-blue-900">{parkedVehicles.length}</span>
                </div>
                <div className="p-2 border-2 border-blue-200 rounded-lg bg-blue-50">
                  <span className="text-[11px] text-blue-800 block font-bold">Pernoites em Aberto</span>
                  <span className="font-black text-base text-blue-900">{overnightVehicles.length}</span>
                </div>
              </div>
            </div>

            {/* Physical Cash Counting Input */}
            <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div>
                  <label className="text-xs font-black text-slate-900 uppercase block">
                    Conferência Física da Gaveta (Dinheiro Contado):
                  </label>
                  <span className="text-xs text-slate-600 font-medium">
                    Conte as cédulas e moedas físicas e digite o valor aqui:
                  </span>
                </div>
                <div className="w-full sm:w-44">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-bold text-slate-500 text-sm">R$</span>
                    <input
                      type="text"
                      value={countedCashInput}
                      onChange={(e) => setCountedCashInput(e.target.value)}
                      placeholder={expectedPhysicalCash.toFixed(2)}
                      className="w-full font-mono font-black text-base bg-white border-2 border-slate-400 pl-10 pr-3 py-2 rounded-xl text-right focus:outline-none focus:border-[#0f4c81]"
                    />
                  </div>
                </div>
              </div>

              {countedCashInput && (
                <div
                  className={`mt-2 p-2.5 rounded-lg text-xs font-black flex items-center justify-between ${
                    Math.abs(divergence) < 0.05
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : divergence < 0
                      ? 'bg-red-100 text-red-900 border border-red-300'
                      : 'bg-blue-100 text-blue-900 border border-blue-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {Math.abs(divergence) < 0.05 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        Caixa Perfeito (Sem divergência)
                      </>
                    ) : divergence < 0 ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-700" />
                        Atenção: Falta de Caixa ({formatCurrency(Math.abs(divergence))})
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-blue-700" />
                        Atenção: Sobra de Caixa ({formatCurrency(divergence)})
                      </>
                    )}
                  </span>
                  <span className="font-mono text-sm">{formatCurrency(divergence)}</span>
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 pt-6 border-t-2 border-slate-200 text-center text-xs">
              <div>
                <div className="border-b-2 border-slate-400 mb-1 h-8" />
                <span className="font-black text-slate-900 block">{activeOperator.name}</span>
                <span className="text-slate-500 text-[11px] font-semibold">Operador da Guarita</span>
              </div>
              <div>
                <div className="border-b-2 border-slate-400 mb-1 h-8" />
                <span className="font-black text-slate-900 block">Supervisor Responsável</span>
                <span className="text-slate-500 text-[11px] font-semibold">Auditoria e Conferência</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3 sm:p-4 border-t-2 border-slate-200 bg-slate-50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 bg-white border-2 border-slate-300 hover:bg-slate-100 transition-colors text-center cursor-pointer"
          >
            Voltar
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-95 text-center cursor-pointer"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>BAIXAR RELATÓRIO EM PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border-2 border-slate-300 hover:bg-slate-100 transition-colors text-center cursor-pointer"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleConfirmFinish}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg transition-all active:scale-95 text-center cursor-pointer"
            >
              Finalizar Turno
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

