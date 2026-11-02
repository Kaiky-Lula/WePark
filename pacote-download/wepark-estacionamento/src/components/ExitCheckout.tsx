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
  TariffCalculationResult,
} from '../utils/plateValidator';
import {
  Search,
  CheckCircle2,
  Lock,
  Unlock,
  CreditCard,
  Banknote,
  QrCode,
  Clock,
  Printer,
  Car,
  Bike,
  Truck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  RotateCw,
  Copy,
  Check,
  CheckCircle,
} from 'lucide-react';

interface ExitCheckoutProps {
  activeOperator: Operator;
  activeShift: ActiveShift;
  pricing: PricingSettings;
  parkedTickets: Ticket[];
  initialSelectedTicket?: Ticket | null;
  onProcessExit: (
    ticket: Ticket,
    paymentMethod: PaymentMethod,
    amountTendered?: number,
    changeGiven?: number
  ) => void;
  onOpenExceptionsModal: (preselectedPlate?: string) => void;
}

export const ExitCheckout: React.FC<ExitCheckoutProps> = ({
  activeOperator,
  activeShift,
  pricing,
  parkedTickets,
  initialSelectedTicket,
  onProcessExit,
  onOpenExceptionsModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(
    initialSelectedTicket || null
  );
  const [simulatedMinutesOffset, setSimulatedMinutesOffset] = useState<number>(0);

  // Sync when initialSelectedTicket prop changes (e.g. clicked from Patio)
  useEffect(() => {
    if (initialSelectedTicket) {
      setSelectedTicket(initialSelectedTicket);
      setSimulatedMinutesOffset(0);
      setCashTendered('');
    }
  }, [initialSelectedTicket]);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [isCopiedPix, setIsCopiedPix] = useState(false);
  const [isReleasedAnimation, setIsReleasedAnimation] = useState(false);

  // Auto-select if clicked from quick list
  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setSimulatedMinutesOffset(0);
    setCashTendered('');
  };

  // Search logic: by plate or ticket number
  const filteredTickets = parkedTickets.filter((t) => {
    const term = searchTerm.trim().toUpperCase();
    if (!term) return true;
    return (
      cleanPlate(t.plate).includes(cleanPlate(term)) ||
      t.ticketNumber.toUpperCase().includes(term) ||
      (t.modelDescription && t.modelDescription.toUpperCase().includes(term))
    );
  });

  // Calculate current exit time
  const simulatedExitDate = new Date(Date.now() + simulatedMinutesOffset * 60 * 1000);

  // Calculation result for selected ticket
  let calculation: TariffCalculationResult | null = null;
  if (selectedTicket) {
    calculation = calculateTariff(
      selectedTicket.entryTime,
      simulatedExitDate.toISOString(),
      selectedTicket.vehicleType,
      pricing,
      selectedTicket.isLostTicketException,
      selectedTicket.administrativeFee
    );
  }

  // Monthly customer is exempt from rotative payment
  const isMonthlyExempt = selectedTicket?.isMonthly;
  const finalPrice = isMonthlyExempt ? 0 : calculation ? calculation.totalPrice : 0;
  const isToleranceFree = !isMonthlyExempt && calculation?.isWithinTolerance;

  // Cash change calculation
  const cashGivenNumber = parseFloat(cashTendered.replace(',', '.')) || 0;
  const changeAmount = Math.max(0, cashGivenNumber - finalPrice);
  const isCashInsufficient =
    paymentMethod === 'dinheiro' && finalPrice > 0 && cashGivenNumber < finalPrice;

  // Quick cash bill helper
  const handleQuickBill = (amount: number) => {
    setCashTendered(amount.toString());
  };

  const handleConfirmExit = () => {
    if (!selectedTicket || !calculation) return;

    if (paymentMethod === 'dinheiro' && finalPrice > 0 && cashGivenNumber < finalPrice) {
      return;
    }

    const actualPaymentMethod: PaymentMethod = isMonthlyExempt
      ? 'mensalista'
      : isToleranceFree
      ? 'isento_tolerancia'
      : paymentMethod;

    setIsReleasedAnimation(true);

    setTimeout(() => {
      onProcessExit(
        {
          ...selectedTicket,
          durationMinutes: calculation!.durationMinutes,
          isOvernight: calculation!.isOvernight,
          regularPrice: calculation!.regularPrice,
          administrativeFee: calculation!.administrativeFee,
          totalPaid: finalPrice,
          exitTime: simulatedExitDate.toISOString(),
        },
        actualPaymentMethod,
        paymentMethod === 'dinheiro' ? cashGivenNumber : undefined,
        paymentMethod === 'dinheiro' ? changeAmount : undefined
      );

      setIsReleasedAnimation(false);
      setSelectedTicket(null);
      setSearchTerm('');
      setCashTendered('');
      setSimulatedMinutesOffset(0);
    }, 1200);
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(
      `00020126580014br.gov.bcb.pix0136wepark-estacionamento@pix.com.br520400005303986540${finalPrice.toFixed(
        2
      )}5802BR5920WEPARK ESTACIONAMENTO6009SAO PAULO62070503***6304E8A2`
    );
    setIsCopiedPix(true);
    setTimeout(() => setIsCopiedPix(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Search & Parked Vehicles List */}
      <div className="lg:col-span-5 bg-white dark:bg-[#0a1c33] border-2 border-slate-300 dark:border-[#1a365d] rounded-3xl p-6 shadow-sm flex flex-col h-full max-h-[780px] transition-colors duration-200">
        <div className="pb-4 mb-4 border-b-2 border-slate-200 dark:border-[#1a365d]">
          <h2 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
            1. Localizar Veículo que está Saindo
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Digite a placa ou escolha diretamente na lista abaixo:
          </p>
        </div>

        {/* Big Search Input */}
        <div className="relative mb-4">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por placa (ex: ABC1D23)..."
            className="w-full bg-slate-50 dark:bg-[#0e223d] border-2 border-slate-300 dark:border-[#1a365d] focus:border-blue-600 dark:focus:border-[#38bdf8] rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 uppercase font-mono font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        {/* Scrollable Vehicle List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs font-bold bg-slate-50 dark:bg-[#0e223d] rounded-2xl border-2 border-dashed border-slate-200 dark:border-[#1a365d]">
              Nenhum veículo encontrado com essa placa.
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const isSelected = selectedTicket?.id === ticket.id;
              const entryDate = new Date(ticket.entryTime);
              const elapsedMinutes = Math.floor((Date.now() - entryDate.getTime()) / 60000);
              const isTolerance = elapsedMinutes <= pricing.toleranceMinutes;

              return (
                <div
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className={`p-3 sm:p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-[#0f3460] border-blue-600 dark:border-[#38bdf8] ring-2 ring-blue-500/20 shadow-sm'
                      : 'bg-slate-50 dark:bg-[#0e223d] border-slate-200 dark:border-[#1a365d] hover:border-slate-300 dark:hover:border-[#234876] hover:bg-slate-100 dark:hover:bg-[#122b4d]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className="font-mono font-black text-sm sm:text-base text-slate-950 dark:text-white px-2 sm:px-2.5 py-1 bg-white dark:bg-[#0a1c33] rounded-xl border border-slate-300 dark:border-[#1a365d] shadow-xs shrink-0">
                      {ticket.plate}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block truncate">
                        {ticket.modelDescription || `Porte: ${ticket.vehicleType.toUpperCase()}`}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono block truncate">
                        Entrou às {entryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 ml-1">
                    {ticket.isMonthly ? (
                      <span className="text-[10px] sm:text-[11px] bg-blue-100 text-[#0f4c81] px-2 sm:px-2.5 py-1 rounded-full font-black border border-blue-300 whitespace-nowrap">
                        MENSALISTA
                      </span>
                    ) : isTolerance ? (
                      <span className="text-[10px] sm:text-[11px] bg-emerald-100 text-emerald-900 px-2 sm:px-2.5 py-1 rounded-full font-black border border-emerald-300 whitespace-nowrap">
                        TOLERÂNCIA ({elapsedMinutes}m)
                      </span>
                    ) : (
                      <span className="text-xs bg-blue-100 text-blue-900 px-2 sm:px-2.5 py-1 rounded-full font-mono font-black border border-blue-200 whitespace-nowrap">
                        {formatDuration(elapsedMinutes)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Lost Ticket Shortcut */}
        <div className="mt-4 pt-3 border-t-2 border-slate-200 dark:border-[#1a365d] text-center">
          <button
            type="button"
            onClick={() => onOpenExceptionsModal(searchTerm)}
            className="text-xs text-[#0f4c81] dark:text-[#38bdf8] hover:text-blue-900 dark:hover:text-white font-black flex items-center justify-center gap-2 w-full py-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-[#0f4c81] dark:text-[#38bdf8]" />
            <span>Condutor perdeu o ticket de entrada? Clique aqui</span>
          </button>
        </div>
      </div>

      {/* Right Column: Checkout Calculation, Payment & Gate Release */}
      <div className="lg:col-span-7 bg-white dark:bg-[#0a1c33] border-2 border-slate-300 dark:border-[#1a365d] rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm flex flex-col justify-between transition-colors duration-200">
        {selectedTicket && calculation ? (
          <div>
            {/* Header info with plate and simulated time */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b-2 border-slate-200 dark:border-[#1a365d] gap-3">
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="p-2.5 sm:p-3 bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 rounded-2xl border border-blue-300 dark:border-blue-700 shadow-xs shrink-0">
                  <CreditCard className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-xl sm:text-2xl text-slate-950 dark:text-white px-2.5 sm:px-3 py-0.5 bg-slate-100 dark:bg-[#0e223d] rounded-xl border border-slate-300 dark:border-[#1a365d] shrink-0">
                      {selectedTicket.plate}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold shrink-0">
                      #{selectedTicket.ticketNumber}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1 truncate">
                    Entrada: {formatDateTime(selectedTicket.entryTime)}
                  </p>
                </div>
              </div>

              {/* Time Simulation */}
              <div className="flex flex-col items-start sm:items-end gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-[#1a365d]">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase">
                  Simular Horário:
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSimulatedMinutesOffset(0)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      simulatedMinutesOffset === 0
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-[#0e223d] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#132c4e]'
                    }`}
                  >
                    Agora
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatedMinutesOffset(10)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      simulatedMinutesOffset === 10
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-[#0e223d] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#132c4e]'
                    }`}
                  >
                    +10 min
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatedMinutesOffset(75)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      simulatedMinutesOffset === 75
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-[#0e223d] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#132c4e]'
                    }`}
                  >
                    +1h 15m
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatedMinutesOffset(720)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      simulatedMinutesOffset === 720
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-100 dark:bg-[#0e223d] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#132c4e]'
                    }`}
                  >
                    +Pernoite
                  </button>
                </div>
              </div>
            </div>

            {/* Special Banner: Tolerance or Monthly */}
            {isMonthlyExempt && (
              <div className="mb-5 p-4 rounded-2xl bg-blue-50 dark:bg-[#0e223d] border-2 border-blue-300 dark:border-[#1a365d] text-blue-950 dark:text-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#0f4c81] dark:text-[#38bdf8]" />
                  <div>
                    <span className="font-black text-sm block">CLIENTE MENSALISTA AUTORIZADO</span>
                    <span className="text-xs text-blue-800 dark:text-blue-300">
                      Mensalidade em dia. Acesso liberado sem cobrança avulsa.
                    </span>
                  </div>
                </div>
                <span className="text-xl font-black font-mono text-emerald-800 dark:text-emerald-400">R$ 0,00</span>
              </div>
            )}

            {isToleranceFree && (
              <div className="mb-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-200 flex items-center justify-between animate-in zoom-in-95">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
                  <div>
                    <span className="font-black text-sm block">
                      TOLERÂNCIA DE 15 MINUTOS APLICADA (ISENTO)!
                    </span>
                    <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                      Ficou apenas {formatDuration(calculation.durationMinutes)} (abaixo dos 15 minutos).
                    </span>
                  </div>
                </div>
                <span className="text-xl font-black font-mono text-emerald-800 dark:text-emerald-400">R$ 0,00</span>
              </div>
            )}

            {/* Duration and Pricing Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="p-4 bg-slate-50 dark:bg-[#0e223d] rounded-2xl border-2 border-slate-200 dark:border-[#1a365d]">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider block">
                  Tempo no Estacionamento:
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1 block">
                  {formatDuration(calculation.durationMinutes)}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium font-mono">
                  {calculation.durationMinutes} minutos apurados
                </span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-[#0e223d] rounded-2xl border-2 border-slate-200 dark:border-[#1a365d]">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider block">
                  Regra Aplicada:
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1 block uppercase">
                  {calculation.breakdown.appliedRateType === 'pernoite'
                    ? 'Pernoite / Noite'
                    : calculation.breakdown.appliedRateType === 'diaria'
                    ? 'Teto Diária'
                    : calculation.breakdown.appliedRateType === 'tolerancia'
                    ? 'Tolerância (Grátis)'
                    : `1ª hora + ${calculation.breakdown.fractionsCount} frações`}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Porte: {selectedTicket.vehicleType.toUpperCase()}
                </span>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border-2 border-emerald-400 dark:border-emerald-600">
                <span className="text-[11px] text-emerald-900 dark:text-emerald-300 font-black uppercase tracking-wider block">
                  VALOR TOTAL A COBRAR:
                </span>
                <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-0.5 block">
                  {formatCurrency(finalPrice)}
                </span>
                {calculation.administrativeFee > 0 && (
                  <span className="text-[11px] text-blue-800 dark:text-blue-300 font-bold block">
                    Inclui taxa perda: {formatCurrency(calculation.administrativeFee)}
                  </span>
                )}
              </div>
            </div>

            {/* Payment Method Selector (Only if price > 0) */}
            {finalPrice > 0 && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-2">
                    Como o cliente vai pagar?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'dinheiro' as PaymentMethod, label: 'Dinheiro', icon: Banknote },
                      { id: 'pix' as PaymentMethod, label: 'Pix', icon: QrCode },
                      { id: 'cartao_debito' as PaymentMethod, label: 'Cartão Débito', icon: CreditCard },
                      { id: 'cartao_credito' as PaymentMethod, label: 'Cartão Crédito', icon: CreditCard },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = paymentMethod === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPaymentMethod(item.id)}
                          className={`p-3.5 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-[#0f4c81] text-white border-blue-700 dark:border-[#38bdf8] shadow-md font-black'
                              : 'bg-slate-50 dark:bg-[#0e223d] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-[#1a365d] hover:bg-slate-100 dark:hover:bg-[#122b4d]'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-xs">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sub-form for Cash with Quick Bills for laymen */}
                {paymentMethod === 'dinheiro' && (
                  <div className="p-5 bg-slate-50 dark:bg-[#0e223d] rounded-2xl border-2 border-slate-300 dark:border-[#1a365d] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">
                        Calculadora Automática de Troco
                      </span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        Total a pagar: <strong className="text-slate-900 dark:text-slate-100">{formatCurrency(finalPrice)}</strong>
                      </span>
                    </div>

                    {/* Quick Bill Buttons */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                        Clique na nota que o cliente entregou:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickBill(finalPrice)}
                          className="px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-200 dark:bg-[#0a1c33] hover:bg-slate-300 dark:hover:bg-[#122b4d] text-slate-800 dark:text-slate-200 border border-slate-400 dark:border-[#1a365d] cursor-pointer"
                        >
                          Valor Exato ({formatCurrency(finalPrice)})
                        </button>
                        {[10, 20, 50, 100].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleQuickBill(val)}
                            className="px-3.5 py-1.5 rounded-xl font-black text-xs bg-white dark:bg-[#0a1c33] hover:bg-slate-100 dark:hover:bg-[#122b4d] text-slate-900 dark:text-slate-100 border border-slate-400 dark:border-[#1a365d] shadow-xs cursor-pointer"
                          >
                            R$ {val},00
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Valor que o cliente deu (R$):
                        </label>
                        <input
                          type="text"
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          placeholder={finalPrice.toFixed(2)}
                          className="w-full bg-white dark:bg-[#071324] border-2 border-slate-400 dark:border-[#1a365d] focus:border-blue-600 dark:focus:border-[#38bdf8] text-xl font-mono font-black text-slate-900 dark:text-white px-3.5 py-2 rounded-xl focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Troco que você deve devolver:
                        </label>
                        <div
                          className={`w-full px-4 py-2 rounded-xl font-mono font-black text-xl sm:text-2xl border-2 flex items-center justify-between ${
                            cashGivenNumber >= finalPrice
                              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border-emerald-400 dark:border-emerald-600'
                              : 'bg-white dark:bg-[#071324] text-slate-400 dark:text-slate-500 border-slate-300 dark:border-[#1a365d]'
                          }`}
                        >
                          <span>{formatCurrency(changeAmount)}</span>
                        </div>
                      </div>
                    </div>

                    {isCashInsufficient && (
                      <div className="text-xs text-red-700 dark:text-red-300 font-black flex items-center gap-2 bg-red-100 dark:bg-red-950/50 p-2.5 rounded-xl border border-red-300 dark:border-red-800">
                        <Lock className="w-4 h-4 shrink-0" />
                        <span>Atenção: O valor entregue pelo cliente é menor que o total a pagar.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-form for Pix */}
                {paymentMethod === 'pix' && (
                  <div className="p-5 bg-slate-50 dark:bg-[#0e223d] rounded-2xl border-2 border-slate-300 dark:border-[#1a365d] flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-24 h-24 bg-white p-2 rounded-2xl flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-100 shadow-xs">
                      <QrCode className="w-20 h-20 text-slate-950" />
                    </div>
                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="text-sm font-black text-slate-900 dark:text-slate-100">QR Code Pix Pronto para Leitura</div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        O cliente aponta a câmera do celular para pagar <strong className="text-slate-900 dark:text-white">{formatCurrency(finalPrice)}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={copyPixCode}
                        className="flex items-center gap-2 text-xs bg-white dark:bg-[#0a1c33] hover:bg-slate-100 dark:hover:bg-[#122b4d] text-slate-900 dark:text-slate-200 border border-slate-400 dark:border-[#1a365d] px-3.5 py-2 rounded-xl font-bold transition-colors mx-auto sm:mx-0 cursor-pointer shadow-xs"
                      >
                        {isCopiedPix ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{isCopiedPix ? 'Chave Copiada!' : 'Copiar Código Copia e Cola'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub-form for Cards */}
                {(paymentMethod === 'cartao_debito' || paymentMethod === 'cartao_credito') && (
                  <div className="p-5 bg-slate-50 dark:bg-[#0e223d] rounded-2xl border-2 border-slate-300 dark:border-[#1a365d] flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 rounded-2xl border border-blue-200 dark:border-blue-800">
                      <CreditCard className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                        Insira ou aproxime o cartão na maquininha
                      </div>
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                        Cobrar valor de <strong className="text-slate-900 dark:text-white">{formatCurrency(finalPrice)}</strong> na função {paymentMethod === 'cartao_debito' ? 'DÉBITO' : 'CRÉDITO'}.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-[#0e223d] flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 border-2 border-slate-200 dark:border-[#1a365d]">
              <Car className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-1">Nenhum Veículo Selecionado</h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 max-w-sm">
              Clique em um veículo na lista à esquerda ou digite a placa no campo de busca para ver o tempo de permanência e cobrar.
            </p>
          </div>
        )}

        {/* Big Action Gate Release Button */}
        {selectedTicket && (
          <div className="pt-4 border-t-2 border-slate-200 dark:border-[#1a365d]">
            <button
              type="button"
              onClick={handleConfirmExit}
              disabled={isCashInsufficient || isReleasedAnimation}
              className={`w-full min-h-[56px] sm:h-16 rounded-2xl font-black text-sm sm:text-base md:text-lg uppercase tracking-wide flex items-center justify-center gap-2 sm:gap-3 px-4 py-3 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99] text-center ${
                isReleasedAnimation
                  ? 'bg-emerald-600 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isReleasedAnimation ? (
                <>
                  <Unlock className="w-5 h-5 sm:w-6 sm:h-6 text-white shrink-0" />
                  <span className="leading-tight">CANCELA LIBERADA! BOA VIAGEM!</span>
                </>
              ) : (
                <>
                  <Unlock className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                  <span className="leading-tight">
                    {finalPrice === 0
                      ? 'LIBERAR CANCELA (ISENTO)'
                      : `CONFIRMAR PAGAMENTO (${formatCurrency(finalPrice)}) E ABRIR CANCELA`}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
