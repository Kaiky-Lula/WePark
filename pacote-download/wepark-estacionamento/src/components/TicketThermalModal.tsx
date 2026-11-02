/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Ticket, VehicleType } from '../types';
import { formatCurrency, formatDateTime, formatDuration } from '../utils/plateValidator';
import { Printer, X, CheckCircle, QrCode, AlertCircle, Download, Check } from 'lucide-react';
import { downloadTicketPdf } from '../utils/pdfGenerator';

interface TicketThermalModalProps {
  isOpen: boolean;
  ticket: Ticket | null;
  mode: 'entry' | 'exit';
  onClose: () => void;
}

const VEHICLE_LABELS: Record<VehicleType, string> = {
  carro: 'AUTOMÓVEL / PASSEIO',
  moto: 'MOTOCICLETA',
  caminhao: 'CAMINHÃO / UTILITÁRIO',
};

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: 'DINHEIRO EM ESPÉCIE',
  pix: 'PIX (INSTANTÂNEO)',
  cartao_debito: 'CARTÃO DE DÉBITO',
  cartao_credito: 'CARTÃO DE CRÉDITO',
  isento_tolerancia: 'ISENTO (TOLERÂNCIA 15 MIN)',
  mensalista: 'CONVÊNIO MENSALISTA',
};

export const TicketThermalModal: React.FC<TicketThermalModalProps> = ({
  isOpen,
  ticket,
  mode,
  onClose,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

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

  if (!isOpen || !ticket) return null;

  const handleDownload = () => {
    downloadTicketPdf(ticket, mode);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wide">
                {mode === 'entry' ? 'Ticket de Entrada Emitido' : 'Comprovante de Quitação'}
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">
                {mode === 'entry' ? 'Entregue o ticket ao motorista' : 'Pagamento confirmado e cancela aberta'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Fechar (ESC)"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="text-[10px] font-mono font-bold text-slate-400 mr-1 hidden sm:inline">ESC</span>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Realistic Thermal Receipt Body */}
        <div className="p-5 sm:p-6 overflow-y-auto bg-slate-100 flex items-center justify-center">
          <div className="w-full max-w-[340px] bg-white text-slate-900 font-mono text-xs p-5 rounded-md shadow-xl border border-slate-300 relative print:p-0 print:border-none print:shadow-none print:bg-white">
            {/* Top Sawtooth design */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-repeat-x bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-850 via-slate-850 to-transparent" />

            {/* Header info */}
            <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
              <img
                src="/assets/aistudio/Gemini_Generated_Image_5pb78c5pb78c5pb7_01f4a0ff.jpg"
                alt="WePark Logo"
                className="h-10 mx-auto mb-2 object-contain rounded"
              />
              <h2 className="font-black text-base tracking-tight text-slate-900">WEPARK ESTACIONAMENTO</h2>
              <p className="text-[9px] text-slate-700 font-sans font-bold uppercase tracking-wider">
                ESTACIONAMENTO SEGURO • TECNOLOGIA E PRATICIDADE
              </p>
              <p className="text-[9px] text-slate-500 mt-0.5">CNPJ: 42.189.923/0001-44</p>
              <p className="text-[9px] text-slate-500">Av. Paulista, 1000 - São Paulo, SP</p>
              <div className="mt-2 inline-block px-2.5 py-0.5 bg-[#0f4c81] text-white font-bold text-[11px] rounded tracking-widest">
                {mode === 'entry' ? '*** TICKET DE ENTRADA ***' : '*** COMPROVANTE DE PAGAMENTO ***'}
              </div>
            </div>

            {/* Ticket details */}
            <div className="space-y-1.5 border-b border-dashed border-slate-400 pb-3 mb-3">
              <div className="flex justify-between font-bold text-sm">
                <span>Nº TICKET:</span>
                <span className="text-slate-950 font-black">{ticket.ticketNumber}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>PLACA DO VEÍCULO:</span>
                <span className="font-black text-sm px-1.5 py-0.5 bg-slate-200 rounded border border-slate-400 text-slate-950 tracking-wider">
                  {ticket.plate}
                </span>
              </div>
              <div className="flex justify-between">
                <span>PORTE:</span>
                <span className="font-semibold">{VEHICLE_LABELS[ticket.vehicleType]}</span>
              </div>
              {ticket.modelDescription && (
                <div className="flex justify-between">
                  <span>DESCRIÇÃO:</span>
                  <span className="font-semibold">{ticket.modelDescription}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>ENTRADA:</span>
                <span className="font-bold">{formatDateTime(ticket.entryTime)}</span>
              </div>
              {mode === 'exit' && ticket.exitTime && (
                <>
                  <div className="flex justify-between">
                    <span>SAÍDA:</span>
                    <span className="font-bold">{formatDateTime(ticket.exitTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PERMANÊNCIA:</span>
                    <span className="font-black text-blue-700">
                      {formatDuration(ticket.durationMinutes || 0)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Pricing breakdown for exit */}
            {mode === 'exit' ? (
              <div className="space-y-1.5 border-b border-dashed border-slate-400 pb-3 mb-3">
                <div className="flex justify-between text-[11px]">
                  <span>TARIFA ROTATIVA:</span>
                  <span>{formatCurrency(ticket.regularPrice)}</span>
                </div>
                {ticket.administrativeFee > 0 && (
                  <div className="flex justify-between text-[11px] text-blue-900 font-bold">
                    <span>TAXA PERDA TICKET:</span>
                    <span>+{formatCurrency(ticket.administrativeFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300">
                  <span>TOTAL PAGO:</span>
                  <span className="text-base text-emerald-800 font-black">
                    {formatCurrency(ticket.totalPaid)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>FORMA PAGTO:</span>
                  <span className="font-bold text-slate-800">
                    {ticket.paymentMethod ? PAYMENT_LABELS[ticket.paymentMethod] : 'NÃO INFORMADO'}
                  </span>
                </div>
                {ticket.amountTendered && ticket.amountTendered > 0 && (
                  <>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>VALOR RECEBIDO:</span>
                      <span>{formatCurrency(ticket.amountTendered)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>TROCO DEVOLVIDO:</span>
                      <span>{formatCurrency(ticket.changeGiven || 0)}</span>
                    </div>
                  </>
                )}
                <div className="mt-2 p-1.5 bg-emerald-100 border border-emerald-300 rounded text-center text-[10px] font-bold text-emerald-900">
                  ✓ CANCELA LIBERADA - QUITAÇÃO CONFIRMADA
                </div>
              </div>
            ) : (
              <div className="border-b border-dashed border-slate-400 pb-3 mb-3 text-[10px] space-y-1">
                <div className="p-1.5 bg-blue-50 rounded border border-blue-200 text-blue-900 font-sans">
                  <strong>IMPORTANTE:</strong> Tolerância de 15 minutos gratuita. Após este período, cobrança conforme tabela vigente fixada na guarita.
                </div>
                {ticket.isMonthly && (
                  <div className="p-1 bg-blue-100 rounded text-[#0f4c81] font-bold text-center">
                    ★ CLIENTE MENSALISTA AUTORIZADO ★
                  </div>
                )}
              </div>
            )}

            {/* Operator and Footer */}
            <div className="text-[10px] space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>OPERADOR:</span>
                <span className="font-semibold text-slate-800">{ticket.operatorName}</span>
              </div>
              <div className="flex justify-between">
                <span>TURNO:</span>
                <span className="font-semibold uppercase">{ticket.shiftType}</span>
              </div>
            </div>

            {/* Simulated Barcode / QR Code */}
            <div className="mt-4 pt-3 border-t border-dashed border-slate-400 text-center flex flex-col items-center">
              <div className="font-mono text-xl tracking-[0.25em] font-black scale-y-150 py-1 select-none">
                |||| | ||||| || |||||| | |||
              </div>
              <span className="text-[9px] text-slate-500 font-mono tracking-widest mt-1">
                *{ticket.ticketNumber}-{ticket.plate}*
              </span>
              <p className="text-[8px] text-slate-400 mt-2 font-sans">
                A perda do ticket sujeita o condutor a identificação e cobrança de taxa administrativa.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3 sm:p-4 border-t-2 border-slate-200 bg-slate-50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 transition-colors cursor-pointer border-2 border-slate-300 flex items-center justify-center gap-1.5 text-center"
          >
            <X className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Fechar (ESC)</span>
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePrint}
              title="Opcional: Imprimir em bobina física 80mm"
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 border-2 border-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-center"
            >
              <Printer className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all cursor-pointer active:scale-95 text-center"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-5 h-5 text-white shrink-0" />
                  <span>PDF BAIXADO COM SUCESSO!</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 text-white shrink-0" />
                  <span>BAIXAR TICKET EM PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
