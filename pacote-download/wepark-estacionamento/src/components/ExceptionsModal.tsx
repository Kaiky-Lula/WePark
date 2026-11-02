/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ActiveShift,
  Operator,
  PaymentMethod,
  PricingSettings,
  Ticket,
  VehicleType,
} from '../types';
import {
  calculateTariff,
  cleanPlate,
  formatCurrency,
  formatDateTime,
  formatDuration,
  validatePlate,
} from '../utils/plateValidator';
import {
  AlertTriangle,
  X,
  Search,
  CheckCircle2,
  FileText,
  DollarSign,
  ShieldCheck,
  CreditCard,
  Banknote,
  QrCode,
  Lock,
} from 'lucide-react';

interface ExceptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeOperator: Operator;
  activeShift: ActiveShift;
  pricing: PricingSettings;
  parkedTickets: Ticket[];
  preselectedPlate?: string;
  onResolveException: (ticket: Ticket, paymentMethod: PaymentMethod) => void;
}

export const ExceptionsModal: React.FC<ExceptionsModalProps> = ({
  isOpen,
  onClose,
  activeOperator,
  activeShift,
  pricing,
  parkedTickets,
  preselectedPlate = '',
  onResolveException,
}) => {
  const [plateQuery, setPlateQuery] = useState(preselectedPlate);
  const [driverName, setDriverName] = useState('');
  const [driverDoc, setDriverDoc] = useState('');
  const [reasonNotes, setReasonNotes] = useState('Condutor declarou perda do ticket.');
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>('carro');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [customAdminFee, setCustomAdminFee] = useState<number>(pricing.lostTicketFee);

  // ESC key listener to quickly close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (preselectedPlate) {
      setPlateQuery(preselectedPlate);
    }
  }, [preselectedPlate]);

  if (!isOpen) return null;

  const normalizedQuery = cleanPlate(plateQuery);
  const plateCheck = validatePlate(plateQuery);

  // Search if vehicle exists in yard
  const matchedTicket = parkedTickets.find(
    (t) => cleanPlate(t.plate) === normalizedQuery
  );

  // Calculate pricing
  const exitTimeIso = new Date().toISOString();
  let durationMinutes = 0;
  let regularRate = 0;
  let isFoundInYard = false;

  if (matchedTicket) {
    isFoundInYard = true;
    const calc = calculateTariff(
      matchedTicket.entryTime,
      exitTimeIso,
      matchedTicket.vehicleType,
      pricing,
      true, // lost ticket
      customAdminFee
    );
    durationMinutes = calc.durationMinutes;
    regularRate = calc.regularPrice;
  } else {
    // If plate wasn't logged in yard: Charge full daily rate as standard protocol
    regularRate = pricing.rates[selectedVehicleType].dailyMax;
  }

  const totalAmountDue = regularRate + customAdminFee;

  const handleConfirmRegularization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateCheck.isValid) return;
    if (!driverName.trim() || !driverDoc.trim()) return;

    let baseTicket: Ticket;

    if (matchedTicket) {
      baseTicket = {
        ...matchedTicket,
        exitTime: exitTimeIso,
        durationMinutes,
        regularPrice: regularRate,
        administrativeFee: customAdminFee,
        totalPaid: totalAmountDue,
        paymentMethod,
        isLostTicketException: true,
        driverName: driverName.trim(),
        driverDoc: driverDoc.trim(),
        exceptionNotes: reasonNotes.trim(),
        status: 'perda_regularizada',
      };
    } else {
      baseTicket = {
        id: `ticket-exc-${Date.now()}`,
        ticketNumber: `EXC-${Math.floor(1000 + Math.random() * 9000)}`,
        plate: plateCheck.formatted,
        vehicleType: selectedVehicleType,
        entryTime: new Date(Date.now() - 360 * 60000).toISOString(),
        exitTime: exitTimeIso,
        durationMinutes: 360,
        regularPrice: regularRate,
        administrativeFee: customAdminFee,
        totalPaid: totalAmountDue,
        paymentMethod,
        operatorId: activeOperator.id,
        operatorName: activeOperator.name,
        shiftType: activeShift.shiftType,
        isLostTicketException: true,
        driverName: driverName.trim(),
        driverDoc: driverDoc.trim(),
        exceptionNotes: reasonNotes.trim(),
        status: 'perda_regularizada',
      };
    }

    onResolveException(baseTicket, paymentMethod);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-2 border-slate-200 bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-[#0f4c81] rounded-2xl border border-blue-200 shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">
                Perda de Ticket de Entrada
              </h3>
              <p className="text-xs font-semibold text-slate-600">
                Procedimento rápido: localize a placa, anote os dados do motorista e libere a cancela
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleConfirmRegularization} className="p-6 overflow-y-auto space-y-5">
          {/* Step 1: Plate Search */}
          <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                1. Digite a Placa do Veículo *
              </label>
              <span className="text-xs font-semibold text-slate-500">
                O sistema busca o horário exato em que ele entrou
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                maxLength={8}
                value={plateQuery}
                onChange={(e) => setPlateQuery(e.target.value.toUpperCase())}
                placeholder="Ex: ABC1D23"
                className="w-full bg-white border-2 border-slate-400 focus:border-[#0f4c81] text-slate-950 font-mono font-black text-2xl px-4 py-2.5 rounded-xl uppercase tracking-widest placeholder:text-slate-300 focus:outline-none"
              />
            </div>

            {/* Found or Not Found State */}
            {normalizedQuery.length >= 3 && (
              <div>
                {isFoundInYard && matchedTicket ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 text-xs flex items-center justify-between font-bold">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                      <div>
                        <span className="font-black text-sm text-emerald-950 block">
                          Carro Localizado no Pátio!
                        </span>
                        <span>
                          Ticket #{matchedTicket.ticketNumber} • Entrou às {formatDateTime(matchedTicket.entryTime)} (Tempo: {formatDuration(durationMinutes)})
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-blue-50 border-2 border-blue-200 text-blue-950 text-xs font-bold">
                    <span className="font-black block mb-0.5">
                      Carro não encontrado na lista do pátio
                    </span>
                    <span>
                      Será aplicada a tarifa da diária + taxa administrativa de perda de ticket.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Driver Identification */}
          <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              2. Dados do Motorista (Obrigatório para Segurança) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nome Completo do Condutor:
                </label>
                <input
                  type="text"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Nome do motorista"
                  className="w-full bg-white border-2 border-slate-300 text-sm font-bold text-slate-900 px-3.5 py-2 rounded-xl focus:border-[#0f4c81] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Documento (CPF ou CNH):
                </label>
                <input
                  type="text"
                  required
                  value={driverDoc}
                  onChange={(e) => setDriverDoc(e.target.value)}
                  placeholder="000.000.000-00 ou CNH"
                  className="w-full bg-white border-2 border-slate-300 text-sm font-mono font-bold text-slate-900 px-3.5 py-2 rounded-xl focus:border-[#0f4c81] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Motivo Declarado pelo Motorista:
              </label>
              <input
                type="text"
                value={reasonNotes}
                onChange={(e) => setReasonNotes(e.target.value)}
                placeholder="Ex: Perdeu o papel no bolso, extraviou..."
                className="w-full bg-white border-2 border-slate-300 text-xs text-slate-800 px-3.5 py-2 rounded-xl focus:border-[#0f4c81] focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Step 3: Financial Summary & Fees */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              3. Valores a Cobrar
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-300">
                <span className="text-[11px] font-bold text-slate-500 block">Tarifa do Tempo</span>
                <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                  {formatCurrency(regularRate)}
                </span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-[11px] font-black text-blue-900 block">
                  Taxa de Perda
                </span>
                <span className="text-base font-black text-blue-900 font-mono mt-0.5 block">
                  +{formatCurrency(customAdminFee)}
                </span>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl border border-emerald-300">
                <span className="text-[11px] font-black text-emerald-950 block">
                  Total a Cobrar
                </span>
                <span className="text-lg sm:text-xl font-black text-emerald-800 font-mono mt-0.5 block">
                  {formatCurrency(totalAmountDue)}
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="pt-2">
              <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase">
                Forma de Pagamento:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'dinheiro' as PaymentMethod, label: 'Dinheiro' },
                  { id: 'pix' as PaymentMethod, label: 'Pix' },
                  { id: 'cartao_debito' as PaymentMethod, label: 'Débito' },
                  { id: 'cartao_credito' as PaymentMethod, label: 'Crédito' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPaymentMethod(item.id)}
                    className={`py-2 text-xs font-black rounded-xl border-2 transition-all cursor-pointer text-center ${
                      paymentMethod === item.id
                        ? 'bg-[#0f4c81] text-white border-blue-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 sm:gap-3 border-t-2 border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!plateCheck.isValid || !driverName.trim() || !driverDoc.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-[#0f4c81] hover:bg-[#164e7e] shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span className="leading-tight">REGULARIZAR, COBRAR E ABRIR CANCELA</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
