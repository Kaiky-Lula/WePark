/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ActiveShift,
  Bleeding,
  Operator,
  Supply,
  Ticket,
} from '../types';
import { formatCurrency, formatDateTime } from '../utils/plateValidator';
import {
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Printer,
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  Banknote,
  QrCode,
  Moon,
  Car,
  CheckCircle2,
  Lock,
  Plus,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface CashRegisterAuditProps {
  activeOperator: Operator;
  activeShift: ActiveShift;
  tickets: Ticket[];
  onAddBleeding: (bleeding: Bleeding) => void;
  onAddSupply: (supply: Supply) => void;
  onOpenShiftReport: () => void;
}

export const CashRegisterAudit: React.FC<CashRegisterAuditProps> = ({
  activeOperator,
  activeShift,
  tickets,
  onAddBleeding,
  onAddSupply,
  onOpenShiftReport,
}) => {
  const [isBleedingModalOpen, setIsBleedingModalOpen] = useState(false);
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);

  // Form states for Sangria
  const [bleedingAmount, setBleedingAmount] = useState('');
  const [bleedingReason, setBleedingReason] = useState('Sangria para cofre da administração');
  const [bleedingSupervisor, setBleedingSupervisor] = useState('Gerente de Operação');

  // Form states for Suprimento
  const [supplyAmount, setSupplyAmount] = useState('');
  const [supplyReason, setSupplyReason] = useState('Reforço de moedas e notas para troco');

  // ESC key listener to close bleeding / supply modals
  React.useEffect(() => {
    if (!isBleedingModalOpen && !isSupplyModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsBleedingModalOpen(false);
        setIsSupplyModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBleedingModalOpen, isSupplyModalOpen]);

  // Filter completed tickets during this shift
  const shiftTickets = tickets.filter(
    (t) =>
      (t.status === 'pago_liberado' || t.status === 'perda_regularizada') &&
      t.operatorId === activeOperator.id &&
      t.shiftType === activeShift.shiftType
  );

  // Arrecadação por meio de pagamento
  const cashTotal = shiftTickets
    .filter((t) => t.paymentMethod === 'dinheiro')
    .reduce((acc, t) => acc + (t.totalPaid || 0), 0);

  const pixTotal = shiftTickets
    .filter((t) => t.paymentMethod === 'pix')
    .reduce((acc, t) => acc + (t.totalPaid || 0), 0);

  const debitTotal = shiftTickets
    .filter((t) => t.paymentMethod === 'cartao_debito')
    .reduce((acc, t) => acc + (t.totalPaid || 0), 0);

  const creditTotal = shiftTickets
    .filter((t) => t.paymentMethod === 'cartao_credito')
    .reduce((acc, t) => acc + (t.totalPaid || 0), 0);

  const totalGrossRevenue = cashTotal + pixTotal + debitTotal + creditTotal;

  // Sangrias e Suprimentos
  const totalBleedings = activeShift.bleedings.reduce((acc, b) => acc + b.amount, 0);
  const totalSupplies = activeShift.supplies.reduce((acc, s) => acc + s.amount, 0);

  // Saldo Físico Esperado na Gaveta
  const expectedPhysicalCash =
    activeShift.initialFund + cashTotal + totalSupplies - totalBleedings;

  // Censo do Pátio
  const parkedVehicles = tickets.filter((t) => t.status === 'patio');
  const overnightVehicles = parkedVehicles.filter((t) => t.isOvernight);

  const handleCreateBleeding = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(bleedingAmount.replace(',', '.')) || 0;
    if (amountNum <= 0) return;

    const newBleeding: Bleeding = {
      id: `b-${Date.now()}`,
      timestamp: new Date().toISOString(),
      amount: amountNum,
      reason: bleedingReason.trim(),
      supervisorName: bleedingSupervisor.trim(),
    };

    onAddBleeding(newBleeding);
    setIsBleedingModalOpen(false);
    setBleedingAmount('');
  };

  const handleCreateSupply = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(supplyAmount.replace(',', '.')) || 0;
    if (amountNum <= 0) return;

    const newSupply: Supply = {
      id: `s-${Date.now()}`,
      timestamp: new Date().toISOString(),
      amount: amountNum,
      reason: supplyReason.trim(),
    };

    onAddSupply(newSupply);
    setIsSupplyModalOpen(false);
    setSupplyAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="p-3 sm:p-3.5 bg-blue-100 text-[#0f4c81] rounded-2xl border border-blue-200 shadow-xs shrink-0">
            <DollarSign className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                CAIXA & FECHAMENTO
              </h2>
              <span className="text-[10px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-100 text-emerald-900 font-black border border-emerald-300 shrink-0">
                TURNO ABERTO
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">
              Operador: <strong>{activeOperator.name}</strong> (#{activeOperator.matricula})
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsBleedingModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-black text-blue-900 bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer shadow-xs text-center"
          >
            <ArrowDownCircle className="w-4 h-4 text-blue-700 shrink-0" />
            <span>Retirar (Sangria)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSupplyModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-black text-blue-900 bg-blue-100 border-2 border-blue-300 hover:bg-blue-200 transition-colors cursor-pointer shadow-xs text-center"
          >
            <ArrowUpCircle className="w-4 h-4 text-blue-700 shrink-0" />
            <span>Reforço (Troco)</span>
          </button>

          <button
            type="button"
            onClick={onOpenShiftReport}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all cursor-pointer text-center"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Fechar Turno</span>
          </button>
        </div>
      </div>

      {/* KPI Cards - Very clear numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fundo Inicial */}
        <div className="p-5 bg-white border-2 border-slate-300 rounded-3xl shadow-xs">
          <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">
            Troco Inicial de Abertura
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(activeShift.initialFund)}
          </div>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
            Valor deixado para início do turno
          </span>
        </div>

        {/* Faturamento Bruto do Turno */}
        <div className="p-5 bg-white border-2 border-slate-300 rounded-3xl shadow-xs">
          <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">
            Total Arrecadado no Turno
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {formatCurrency(totalGrossRevenue)}
          </div>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
            {shiftTickets.length} veículos quitados
          </span>
        </div>

        {/* Total de Sangrias Realizadas */}
        <div className="p-5 bg-white border-2 border-slate-300 rounded-3xl shadow-xs">
          <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">
            Sangrias Enviadas ao Cofre
          </div>
          <div className="text-2xl font-black text-blue-700 font-mono">
            {formatCurrency(totalBleedings)}
          </div>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
            {activeShift.bleedings.length} retirada(s) autorizada(s)
          </span>
        </div>

        {/* Dinheiro Esperado na Gaveta */}
        <div className="p-5 bg-emerald-50 border-2 border-emerald-400 rounded-3xl shadow-sm">
          <div className="text-xs font-black text-emerald-950 uppercase tracking-wider mb-1">
            Dinheiro que deve estar na Gaveta:
          </div>
          <div className="text-3xl font-black text-emerald-800 font-mono">
            {formatCurrency(expectedPhysicalCash)}
          </div>
          <span className="text-xs font-bold text-emerald-900 mt-1 block">
            Troco Inicial + Dinheiro Recebido - Sangrias
          </span>
        </div>
      </div>

      {/* Grid: Payment Method Breakdown & Patio Census */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Payment Method Breakdown */}
        <div className="lg:col-span-7 bg-white border-2 border-slate-300 rounded-3xl p-6 shadow-xs">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b-2 border-slate-200">
            Quanto entrou por cada forma de pagamento:
          </h3>

          <div className="space-y-3">
            {[
              {
                label: 'Dinheiro em Espécie (Gaveta)',
                amount: cashTotal,
                icon: Banknote,
                color: 'text-emerald-800',
                bgColor: 'bg-emerald-100 border-emerald-300',
                count: shiftTickets.filter((t) => t.paymentMethod === 'dinheiro').length,
              },
              {
                label: 'Pix Instantâneo (Conta do Estacionamento)',
                amount: pixTotal,
                icon: QrCode,
                color: 'text-emerald-800',
                bgColor: 'bg-emerald-100 border-emerald-300',
                count: shiftTickets.filter((t) => t.paymentMethod === 'pix').length,
              },
              {
                label: 'Cartão de Débito (Maquininha)',
                amount: debitTotal,
                icon: CreditCard,
                color: 'text-blue-800',
                bgColor: 'bg-blue-100 border-blue-300',
                count: shiftTickets.filter((t) => t.paymentMethod === 'cartao_debito').length,
              },
              {
                label: 'Cartão de Crédito (Maquininha)',
                amount: creditTotal,
                icon: CreditCard,
                color: 'text-blue-900',
                bgColor: 'bg-blue-100 border-blue-300',
                count: shiftTickets.filter((t) => t.paymentMethod === 'cartao_credito').length,
              },
            ].map((method) => {
              const Icon = method.icon;
              const percent = totalGrossRevenue > 0 ? Math.round((method.amount / totalGrossRevenue) * 100) : 0;
              return (
                <div
                  key={method.label}
                  className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className={`p-2 sm:p-2.5 rounded-xl border shrink-0 ${method.bgColor} ${method.color}`}>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-black text-slate-900 block truncate">{method.label}</span>
                      <span className="text-[11px] sm:text-xs text-slate-500 font-bold font-mono block truncate">
                        {method.count} recebidos ({percent}%)
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-1">
                    <span className="font-mono font-black text-sm sm:text-base text-slate-950 block">
                      {formatCurrency(method.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sangrias Log */}
          <div className="mt-6 pt-4 border-t-2 border-slate-200">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              Retiradas de Dinheiro (Sangrias) neste Turno ({activeShift.bleedings.length})
            </h4>
            {activeShift.bleedings.length === 0 ? (
              <p className="text-xs text-slate-500 font-medium">Nenhuma sangria feita até o momento.</p>
            ) : (
              <div className="space-y-2">
                {activeShift.bleedings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 bg-slate-50 rounded-2xl border-2 border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-black text-blue-800 font-mono text-sm block">
                        -{formatCurrency(b.amount)}
                      </span>
                      <span className="text-slate-600 font-semibold">
                        {b.reason} • Entregue para: <strong>{b.supervisorName}</strong>
                      </span>
                    </div>
                    <span className="text-slate-500 font-mono font-bold">
                      {new Date(b.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Patio Census & Overnight Count */}
        <div className="lg:col-span-5 bg-white border-2 border-slate-300 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b-2 border-slate-200">
              Contagem de Veículos no Pátio
            </h3>

            {/* Pernoite Highlight */}
            <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-200 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Moon className="w-5 h-5 text-blue-700" />
                  <span className="text-xs font-black text-blue-950 uppercase">
                    Carros que Pernoitaram (Ficaram a Noite)
                  </span>
                </div>
                <span className="text-lg font-black font-mono text-blue-900 px-3 py-0.5 rounded-xl bg-white border border-blue-300">
                  {overnightVehicles.length}
                </span>
              </div>
              <p className="text-xs font-medium text-blue-900">
                Veículos de dias anteriores que continuam sob guarda da guarita.
              </p>

              {overnightVehicles.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-blue-200 pt-2">
                  {overnightVehicles.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between text-xs font-mono text-slate-800 bg-white px-3 py-1.5 rounded-xl border border-blue-200"
                    >
                      <span className="font-black text-slate-950">{v.plate}</span>
                      <span className="text-slate-600">{v.modelDescription || v.vehicleType}</span>
                      <span className="text-blue-800 font-bold">Desde: {new Date(v.entryTime).toLocaleDateString('pt-BR')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Still Parked */}
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-700" />
                  <span className="text-xs font-black text-slate-900 uppercase">
                    Veículos Estacionados Agora
                  </span>
                </div>
                <span className="text-lg font-black font-mono text-blue-900 px-3 py-0.5 rounded-xl bg-white border border-slate-300">
                  {parkedVehicles.length}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-600">
                Inventário físico atual no estacionamento.
              </p>
            </div>
          </div>

          {/* Shift Report Footer Action */}
          <div className="mt-6 pt-4 border-t-2 border-slate-200">
            <button
              type="button"
              onClick={onOpenShiftReport}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>Conferir Dinheiro e Fechar Turno</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sangria Modal */}
      {isBleedingModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBleedingModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b-2 border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
                <h3 className="font-black text-slate-900 text-sm sm:text-base">Retirar Dinheiro (Sangria para Cofre)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBleedingModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBleeding} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  Valor que está sendo retirado (R$) *
                </label>
                <input
                  type="text"
                  required
                  value={bleedingAmount}
                  onChange={(e) => setBleedingAmount(e.target.value)}
                  placeholder="Ex: 200,00"
                  className="w-full bg-slate-50 border-2 border-slate-300 text-lg sm:text-xl font-bold text-slate-900 px-3.5 py-2.5 rounded-xl focus:border-blue-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  Quem está recolhendo o dinheiro? *
                </label>
                <input
                  type="text"
                  required
                  value={bleedingSupervisor}
                  onChange={(e) => setBleedingSupervisor(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-300 text-sm font-bold text-slate-900 px-3.5 py-2.5 rounded-xl focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  Motivo da Retirada
                </label>
                <input
                  type="text"
                  value={bleedingReason}
                  onChange={(e) => setBleedingReason(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-300 text-sm text-slate-900 px-3.5 py-2.5 rounded-xl focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-end gap-2.5 sm:gap-3 border-t-2 border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBleedingModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black text-white bg-[#0f4c81] hover:bg-[#164e7e] cursor-pointer shadow-sm text-center"
                >
                  Confirmar Retirada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suprimento Modal */}
      {isSupplyModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSupplyModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b-2 border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
                <h3 className="font-black text-slate-900 text-sm sm:text-base">Colocar Troco (Reforço de Caixa)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSupplyModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupply} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  Valor Injetado no Troco (R$) *
                </label>
                <input
                  type="text"
                  required
                  value={supplyAmount}
                  onChange={(e) => setSupplyAmount(e.target.value)}
                  placeholder="Ex: 100,00"
                  className="w-full bg-slate-50 border-2 border-slate-300 text-lg sm:text-xl font-bold text-slate-900 px-3.5 py-2.5 rounded-xl focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  Motivo / Observação
                </label>
                <input
                  type="text"
                  value={supplyReason}
                  onChange={(e) => setSupplyReason(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-300 text-sm text-slate-900 px-3.5 py-2.5 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-end gap-2.5 sm:gap-3 border-t-2 border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSupplyModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-500 cursor-pointer shadow-sm text-center"
                >
                  Confirmar Reforço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
