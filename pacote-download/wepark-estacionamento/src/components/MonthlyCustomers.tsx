/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MonthlyCustomer, MonthlyStatus, VehicleType } from '../types';
import { cleanPlate, formatCurrency, formatDateOnly } from '../utils/plateValidator';
import {
  Users,
  Search,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Car,
  Bike,
  Truck,
  Receipt,
  Phone,
  Calendar,
  X,
  CreditCard,
} from 'lucide-react';

interface MonthlyCustomersProps {
  customers: MonthlyCustomer[];
  onUpdateCustomers: (updated: MonthlyCustomer[]) => void;
}

export const MonthlyCustomers: React.FC<MonthlyCustomersProps> = ({
  customers,
  onUpdateCustomers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | MonthlyStatus>('todos');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New Customer Form State
  const [newName, setNewName] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPlates, setNewPlates] = useState('');
  const [newVehicleType, setNewVehicleType] = useState<VehicleType>('carro');
  const [newPlanName, setNewPlanName] = useState('24 Horas Integral');
  const [newMonthlyFee, setNewMonthlyFee] = useState('250.00');
  const [newDueDay, setNewDueDay] = useState('10');

  // ESC key listener to close new customer modal
  React.useEffect(() => {
    if (!isAddModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddModalOpen]);

  const filteredCustomers = customers.filter((cust) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      cust.name.toLowerCase().includes(query) ||
      cust.cpf.includes(query) ||
      cust.plates.some((p) => cleanPlate(p).includes(cleanPlate(query)));

    if (!matchesQuery) return false;
    if (statusFilter === 'todos') return true;
    return cust.status === statusFilter;
  });

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleToggleStatus = (id: string) => {
    const updated = customers.map((c) => {
      if (c.id === id) {
        const nextStatus: MonthlyStatus =
          c.status === 'ativo' ? 'inadimplente' : 'ativo';
        return { ...c, status: nextStatus };
      }
      return c;
    });
    onUpdateCustomers(updated);
    showNotification('Status do mensalista alterado!');
  };

  const handleRegisterPayment = (id: string) => {
    const updated = customers.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          status: 'ativo' as MonthlyStatus,
          lastPaymentDate: new Date().toISOString().substring(0, 10),
        };
      }
      return c;
    });
    onUpdateCustomers(updated);
    showNotification('Mensalidade quitada! Acesso na cancela liberado imediatamente.');
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPlates.trim()) return;

    const platesArray = newPlates
      .split(',')
      .map((p) => cleanPlate(p.trim()))
      .filter((p) => p.length > 0);

    const newCustomer: MonthlyCustomer = {
      id: `m-${Date.now()}`,
      name: newName.trim(),
      cpf: newCpf.trim() || 'Não informado',
      phone: newPhone.trim() || 'Não informado',
      plates: platesArray,
      vehicleType: newVehicleType,
      planName: newPlanName,
      monthlyFee: parseFloat(newMonthlyFee) || 200,
      dueDay: parseInt(newDueDay) || 10,
      status: 'ativo',
      lastPaymentDate: new Date().toISOString().substring(0, 10),
      notes: 'Cadastro criado via guarita',
    };

    onUpdateCustomers([newCustomer, ...customers]);
    setIsAddModalOpen(false);

    // Reset Form
    setNewName('');
    setNewCpf('');
    setNewPhone('');
    setNewPlates('');
    showNotification('Novo mensalista cadastrado com sucesso!');
  };

  const delinquentCount = customers.filter((c) => c.status === 'inadimplente').length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-24 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-black animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="p-3 sm:p-3.5 bg-blue-100 text-[#0f4c81] rounded-2xl border border-blue-200 shadow-xs shrink-0">
            <Users className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                CLIENTES MENSALISTAS
              </h2>
              {delinquentCount > 0 && (
                <span className="text-[11px] sm:text-xs bg-red-100 text-red-800 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full font-black border border-red-300 flex items-center gap-1.5 shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                  {delinquentCount} com cancela bloqueada
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Controle de mensalistas com bloqueio automático na entrada da guarita
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-[#0f4c81] hover:bg-[#164e7e] text-white rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer text-center"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>CADASTRAR NOVO MENSALISTA</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-3xl border-2 border-slate-300 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, placa ou CPF..."
            className="w-full bg-slate-50 border-2 border-slate-300 text-sm font-bold text-slate-900 pl-11 pr-4 py-2.5 rounded-2xl focus:border-[#0f4c81] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'todos', label: `Todos (${customers.length})` },
            { id: 'ativo', label: 'Em Dia' },
            { id: 'inadimplente', label: `Atrasados (${delinquentCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-[#0f4c81] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customers List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-slate-500 text-xs font-bold bg-white rounded-3xl border-2 border-dashed border-slate-300">
            Nenhum mensalista encontrado com essa busca.
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const isDelinquent = cust.status === 'inadimplente';
            const Icon =
              cust.vehicleType === 'moto'
                ? Bike
                : cust.vehicleType === 'caminhao'
                ? Truck
                : Car;

            return (
              <div
                key={cust.id}
                className={`p-6 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                  isDelinquent
                    ? 'bg-red-50/70 border-red-300 shadow-sm'
                    : 'bg-white border-slate-300 hover:border-slate-400 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`p-2.5 sm:p-3 rounded-2xl shrink-0 ${
                          isDelinquent
                            ? 'bg-red-200 text-red-900 border border-red-300'
                            : 'bg-blue-100 text-[#0f4c81] border border-blue-200'
                        }`}
                      >
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <h3 className="font-black text-sm sm:text-base text-slate-900 truncate">{cust.name}</h3>
                          <span
                            className={`text-[10px] sm:text-xs font-black px-2 sm:px-2.5 py-0.5 rounded-full shrink-0 ${
                              isDelinquent
                                ? 'bg-red-600 text-white uppercase'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            {isDelinquent ? 'BLOQUEADO' : 'EM DIA'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 mt-0.5 truncate">
                          CPF: <span className="font-mono">{cust.cpf}</span> • Tel: {cust.phone}
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0 bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-xl sm:rounded-none">
                      <span className="text-base sm:text-lg font-black text-slate-950 font-mono block">
                        {formatCurrency(cust.monthlyFee)}
                      </span>
                      <span className="text-[11px] sm:text-xs text-slate-500 font-bold">/mês (Dia {cust.dueDay})</span>
                    </div>
                  </div>

                  {/* Plates Badges */}
                  <div className="flex items-center gap-2 mb-3 bg-slate-100 p-3 rounded-2xl border border-slate-200">
                    <span className="text-xs font-black text-slate-700 uppercase">
                      Placas:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {cust.plates.map((placa) => (
                        <span
                          key={placa}
                          className="font-mono font-black text-sm px-2.5 py-1 bg-white text-slate-950 rounded-xl border border-slate-300 shadow-xs"
                        >
                          {placa}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Plan Info and Warning */}
                  <div className="text-xs text-slate-600 space-y-1 mb-4 font-semibold">
                    <div className="flex justify-between">
                      <span>Plano Contratado:</span>
                      <span className="font-bold text-slate-900">{cust.planName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Último Pagamento Registrado:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {cust.lastPaymentDate ? formatDateOnly(cust.lastPaymentDate) : 'Nunca'}
                      </span>
                    </div>
                    {isDelinquent && (
                      <div className="p-3 bg-red-100 rounded-2xl border border-red-300 text-red-900 font-black text-xs flex items-center gap-2 mt-2">
                        <Lock className="w-4 h-4 shrink-0 text-red-700" />
                        <span>A cancela da guarita está bloqueada para as placas deste cliente.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t-2 border-slate-200 gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(cust.id)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    {isDelinquent ? 'Liberar Manualmente' : 'Marcar Atraso'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRegisterPayment(cust.id)}
                    className="flex items-center gap-2 text-xs font-black px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Dar Baixa no Pagamento</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b-2 border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#0f4c81]" />
                <h3 className="font-black text-slate-900 text-sm sm:text-base">Novo Cadastro de Mensalista</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  Nome Completo do Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full bg-slate-50 border-2 border-slate-300 text-sm font-bold text-slate-900 px-3.5 py-2.5 rounded-xl focus:border-[#0f4c81] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">CPF *</label>
                  <input
                    type="text"
                    required
                    value={newCpf}
                    onChange={(e) => setNewCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-50 border-2 border-slate-300 text-sm font-mono font-bold text-slate-900 px-3.5 py-2.5 rounded-xl focus:border-[#0f4c81] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Telefone WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="(11) 90000-0000"
                    className="w-full bg-slate-50 border-2 border-slate-300 text-sm font-mono font-bold text-slate-900 px-3.5 py-2.5 rounded-xl focus:border-[#0f4c81] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  Placas Autorizadas (separe por vírgula se houver mais de uma) *
                </label>
                <input
                  type="text"
                  required
                  value={newPlates}
                  onChange={(e) => setNewPlates(e.target.value.toUpperCase())}
                  placeholder="Ex: ABC1D23, XYZ9A88"
                  className="w-full bg-slate-50 border-2 border-slate-300 text-sm font-mono font-black text-slate-900 px-3.5 py-2.5 rounded-xl focus:border-[#0f4c81] focus:outline-none uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    Tipo do Veículo
                  </label>
                  <select
                    value={newVehicleType}
                    onChange={(e) => setNewVehicleType(e.target.value as VehicleType)}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-sm font-bold text-slate-900 px-3.5 py-2.5 rounded-xl focus:border-[#0f4c81] focus:outline-none cursor-pointer"
                  >
                    <option value="carro">Carro de Passeio</option>
                    <option value="moto">Motocicleta</option>
                    <option value="caminhao">Caminhão ou Van</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    Plano de Acesso
                  </label>
                  <input
                    type="text"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    placeholder="24 Horas Integral"
                    className="w-full bg-slate-50 border-2 border-slate-300 text-sm font-bold text-slate-900 px-3.5 py-2.5 rounded-xl focus:border-[#0f4c81] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    Valor Mensal (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMonthlyFee}
                    onChange={(e) => setNewMonthlyFee(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-sm font-mono font-bold text-slate-900 px-3.5 py-2.5 rounded-xl focus:border-[#0f4c81] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    Dia do Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newDueDay}
                    onChange={(e) => setNewDueDay(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-sm font-mono font-bold text-slate-900 px-3.5 py-2.5 rounded-xl focus:border-[#0f4c81] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-end gap-2.5 sm:gap-3 border-t-2 border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black text-white bg-[#0f4c81] hover:bg-[#164e7e] shadow-md cursor-pointer text-center"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
