/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ActiveShift,
  MonthlyCustomer,
  Operator,
  Ticket,
  VehicleType,
  YardCapacity,
} from '../types';
import { cleanPlate, validatePlate } from '../utils/plateValidator';
import {
  Car,
  Bike,
  Truck,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Printer,
  ShieldAlert,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';

interface GuaritaEntryProps {
  activeOperator: Operator;
  activeShift: ActiveShift;
  parkedTickets: Ticket[];
  monthlyCustomers: MonthlyCustomer[];
  capacity: YardCapacity;
  onRegisterEntry: (ticket: Ticket) => void;
  onOpenMonthlyModal: () => void;
}

export const GuaritaEntry: React.FC<GuaritaEntryProps> = ({
  activeOperator,
  activeShift,
  parkedTickets,
  monthlyCustomers,
  capacity,
  onRegisterEntry,
  onOpenMonthlyModal,
}) => {
  const [plateInput, setPlateInput] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('carro');
  const [modelDescription, setModelDescription] = useState('');
  const [lastCreatedTicket, setLastCreatedTicket] = useState<Ticket | null>(null);
  const [showGateOpenAnimation, setShowGateOpenAnimation] = useState(false);
  const [forceAsRotativo, setForceAsRotativo] = useState(false);

  const plateInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    plateInputRef.current?.focus();
  }, []);

  const plateValidation = validatePlate(plateInput);
  const normalizedPlate = cleanPlate(plateInput);

  // Check if plate is already parked in yard
  const alreadyInYard = parkedTickets.find(
    (t) => cleanPlate(t.plate) === normalizedPlate
  );

  // Check if plate belongs to a monthly customer
  const matchedMonthly = monthlyCustomers.find((m) =>
    m.plates.some((p) => cleanPlate(p) === normalizedPlate)
  );

  // Automatic classification when selecting a registered monthly customer
  useEffect(() => {
    if (matchedMonthly && !forceAsRotativo) {
      setVehicleType(matchedMonthly.vehicleType);
      if (!modelDescription) {
        setModelDescription(`Mensalista: ${matchedMonthly.name}`);
      }
    }
  }, [matchedMonthly, forceAsRotativo]);

  // Check category capacity
  const currentCount = parkedTickets.filter((t) => t.vehicleType === vehicleType).length;
  const maxCapacity = capacity[vehicleType];
  const isCategoryFull = currentCount >= maxCapacity;

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setPlateInput(val);
    setForceAsRotativo(false);
  };

  const handleRegister = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!plateValidation.isValid) return;
    if (alreadyInYard) return;

    // Check if blocked monthly and not overridden
    if (matchedMonthly && matchedMonthly.status !== 'ativo' && !forceAsRotativo) {
      return;
    }

    const ticketNumber = `WP-${Math.floor(1000 + Math.random() * 9000)}`;
    const isMonthlyAuthorized = matchedMonthly?.status === 'ativo' && !forceAsRotativo;

    const newTicket: Ticket = {
      id: `ticket-${Date.now()}`,
      ticketNumber,
      plate: plateValidation.formatted,
      vehicleType,
      modelDescription: modelDescription.trim() || undefined,
      entryTime: new Date().toISOString(),
      regularPrice: 0,
      administrativeFee: 0,
      totalPaid: 0,
      operatorId: activeOperator.id,
      operatorName: activeOperator.name,
      shiftType: activeShift.shiftType,
      status: 'patio',
      isMonthly: isMonthlyAuthorized,
      monthlyCustomerId: isMonthlyAuthorized ? matchedMonthly.id : undefined,
    };

    onRegisterEntry(newTicket);
    setLastCreatedTicket(newTicket);
    setShowGateOpenAnimation(true);

    // Reset Form
    setPlateInput('');
    setModelDescription('');
    setForceAsRotativo(false);
    setTimeout(() => {
      setShowGateOpenAnimation(false);
      plateInputRef.current?.focus();
    }, 2500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Form: Fast Vehicle Check-in */}
      <div className="lg:col-span-7 bg-white dark:bg-[#0a1c33] border-2 border-slate-300 dark:border-[#1a365d] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between transition-colors duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b-2 border-slate-200 dark:border-[#1a365d]">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 rounded-2xl border border-emerald-300 dark:border-emerald-700 shadow-xs">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  ENTRADA DE VEÍCULO NA GUARITA
                </h2>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Passo simples: digite a placa do veículo e clique em Registrar
                </p>
              </div>
            </div>

            <div className="hidden sm:block text-right">
              <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-[#0e223d] text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#1a365d]">
                Pressione [ENTER] para emitir
              </span>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            {/* Realistic High-Visibility Brazilian License Plate */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  1. Digite a Placa do Veículo:
                </label>
                {plateInput.length > 0 && (
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full ${
                      plateValidation.isValid
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-blue-50 text-blue-900 border border-blue-300'
                    }`}
                  >
                    {plateValidation.isValid
                      ? '✓ Placa Válida'
                      : 'Digite 7 caracteres (Ex: ABC1D23)'}
                  </span>
                )}
              </div>

              {/* Graphic License Plate */}
              <div className="mercosul-plate max-w-md w-full mx-auto sm:mx-0 p-0 border-4 border-slate-950">
                {/* Mercosul Blue Header */}
                <div className="mercosul-header py-1 bg-blue-700 text-white font-black text-[11px] sm:text-xs flex justify-between px-3 sm:px-4">
                  <span>BRASIL</span>
                  <span className="text-[9px] sm:text-[10px] tracking-widest text-blue-100">MERCOSUL</span>
                </div>

                {/* Input inside the plate */}
                <div className="relative bg-white py-2 sm:py-3 px-2 sm:px-4 flex items-center justify-center">
                  <input
                    ref={plateInputRef}
                    type="text"
                    maxLength={8}
                    value={plateInput}
                    onChange={handlePlateChange}
                    placeholder="ABC1D23"
                    className="w-full text-center font-mono font-black text-3xl sm:text-4xl md:text-5xl text-slate-950 uppercase tracking-[0.12em] sm:tracking-[0.2em] md:tracking-[0.25em] bg-transparent focus:outline-none placeholder:text-slate-300 placeholder:font-normal select-all"
                  />
                </div>
              </div>

              {/* Already in yard warning */}
              {alreadyInYard && (
                <div className="mt-3 p-3.5 rounded-2xl bg-blue-50 border-2 border-blue-400 text-blue-950 text-xs flex items-center gap-3 font-bold shadow-xs">
                  <ShieldAlert className="w-5 h-5 text-blue-700 shrink-0" />
                  <span>
                    Atenção: A placa <strong>{alreadyInYard.plate}</strong> já está registrada no estacionamento sob o Ticket #{alreadyInYard.ticketNumber}. Não é permitida entrada duplicada.
                  </span>
                </div>
              )}
            </div>

            {/* Monthly Customer Status Alert (Active vs Inadimplente) */}
            {matchedMonthly && (
              <div
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-xs ${
                  matchedMonthly.status === 'ativo'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                    : 'bg-red-50 border-red-500 text-red-950 ring-2 ring-red-400/40 animate-pulse'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
                    <div
                      className={`p-2.5 sm:p-3 rounded-2xl shrink-0 ${
                        matchedMonthly.status === 'ativo'
                          ? 'bg-emerald-200 text-emerald-900'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {matchedMonthly.status === 'ativo' ? (
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : (
                        <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-black text-sm sm:text-base text-slate-900 truncate">
                          {matchedMonthly.name}
                        </span>
                        <span
                          className={`text-[10px] sm:text-xs font-black px-2 sm:px-2.5 py-0.5 rounded-full shrink-0 ${
                            matchedMonthly.status === 'ativo'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-red-600 text-white uppercase'
                          }`}
                        >
                          {matchedMonthly.status === 'ativo'
                            ? 'MENSALISTA EM DIA'
                            : 'MENSALIDADE VENCIDA - BLOQUEADO'}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 mt-1">
                        Plano: <strong>{matchedMonthly.planName}</strong> • Vencimento: dia {matchedMonthly.dueDay}
                      </p>
                      {matchedMonthly.status !== 'ativo' && (
                        <div className="mt-2 text-xs text-red-900 font-bold bg-white/80 p-2.5 rounded-xl border border-red-300">
                          ⛔ AVISO DA GUARITA: Cancela bloqueada por atraso na mensalidade.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* If Delinquent: Actions for Operator */}
                {matchedMonthly.status !== 'ativo' && (
                  <div className="mt-4 pt-4 border-t-2 border-red-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={() => setForceAsRotativo(true)}
                      className="px-4 py-2.5 rounded-xl text-xs font-black bg-[#0f4c81] text-white hover:bg-blue-700 transition-colors shadow-sm text-center"
                    >
                      Cobrar Tarifa Rotativa Avulsa de Hoje
                    </button>
                    <button
                      type="button"
                      onClick={onOpenMonthlyModal}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-800 hover:bg-slate-100 border border-slate-400 transition-colors text-center"
                    >
                      Regularizar Mensalidade
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Vehicle Classification / Porte - Big & Touch-friendly */}
            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2">
                2. Selecione o Tipo do Veículo:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {[
                  {
                    type: 'carro' as VehicleType,
                    label: 'Carro de Passeio',
                    desc: '1ª hora R$ 12',
                    icon: Car,
                  },
                  {
                    type: 'moto' as VehicleType,
                    label: 'Motocicleta',
                    desc: '1ª hora R$ 7',
                    icon: Bike,
                  },
                  {
                    type: 'caminhao' as VehicleType,
                    label: 'Caminhão ou Van',
                    desc: '1ª hora R$ 20',
                    icon: Truck,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = vehicleType === item.type;
                  const count = parkedTickets.filter((t) => t.vehicleType === item.type).length;
                  const cap = capacity[item.type];
                  const free = cap - count;
                  const isFull = free <= 0;

                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setVehicleType(item.type)}
                      className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all flex flex-row sm:flex-col items-center sm:items-start justify-between cursor-pointer gap-2 ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                          : 'bg-slate-50 dark:bg-[#0e223d] border-slate-200 dark:border-[#1a365d] hover:border-slate-300 dark:hover:border-[#234876]'
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-0 sm:justify-between w-full sm:mb-3">
                        <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-[#0a1c33] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1a365d]'}`}>
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span
                          className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg shrink-0 ml-auto sm:ml-0 ${
                            isFull
                              ? 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300'
                              : 'bg-white dark:bg-[#0a1c33] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1a365d]'
                          }`}
                        >
                          {free} livres
                        </span>
                      </div>
                      <div className="sm:w-full">
                        <div className="text-sm font-black text-slate-900 dark:text-slate-100 leading-snug">
                          {item.label}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Model / Observation (Optional) */}
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                3. Modelo ou Cor (Opcional):
              </label>
              <input
                type="text"
                value={modelDescription}
                onChange={(e) => setModelDescription(e.target.value)}
                placeholder="Ex: Gol Prata, Corolla Branco, Honda Titan..."
                className="w-full bg-slate-50 dark:bg-[#0e223d] border-2 border-slate-300 dark:border-[#1a365d] focus:border-emerald-600 text-sm text-slate-900 dark:text-slate-100 px-4 py-2.5 rounded-xl placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            {/* Big Action Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={
                  !plateValidation.isValid ||
                  !!alreadyInYard ||
                  (matchedMonthly?.status !== 'ativo' && !!matchedMonthly && !forceAsRotativo)
                }
                className="w-full min-h-[56px] sm:h-16 rounded-2xl font-black text-sm sm:text-base md:text-lg uppercase tracking-wide flex items-center justify-center gap-2 sm:gap-3 px-4 py-3 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-[0.99] text-center"
              >
                <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                <span className="leading-tight">REGISTRAR ENTRADA E EMITIR TICKET</span>
                <span className="text-xs bg-emerald-800 px-2 py-1 rounded-md opacity-90 hidden md:inline shrink-0">
                  ENTER
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Quick Testing Shortcuts for Attendants */}
        <div className="mt-6 sm:mt-8 pt-4 border-t-2 border-slate-200">
          <span className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-2">
            Placas de Teste Rápido (Clique para preencher):
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setPlateInput('BRA2E19');
                setVehicleType('carro');
              }}
              className="text-xs bg-blue-50 border border-blue-300 hover:bg-blue-100 text-blue-900 px-3 py-1.5 rounded-xl font-mono font-bold transition-colors cursor-pointer"
            >
              BRA2E19 (Mensalista Em Dia)
            </button>
            <button
              type="button"
              onClick={() => {
                setPlateInput('RIO4A20');
                setVehicleType('carro');
              }}
              className="text-xs bg-red-50 border border-red-300 hover:bg-red-100 text-red-900 px-3 py-1.5 rounded-xl font-mono font-bold transition-colors cursor-pointer"
            >
              RIO4A20 (Inadimplente)
            </button>
            <button
              type="button"
              onClick={() => {
                const randomLetters = 'ABC';
                const randomNum = Math.floor(1000 + Math.random() * 9000);
                setPlateInput(`${randomLetters}${randomNum}`);
                setVehicleType('carro');
              }}
              className="text-xs bg-slate-100 dark:bg-[#0e223d] hover:bg-slate-200 dark:hover:bg-[#132c4e] text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl font-mono font-bold transition-colors border border-slate-300 dark:border-[#1a365d] cursor-pointer"
            >
              Gerar Nova Placa Avulsa
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Physical Gate Barrier & Last Ticket Card */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* Gate Barrier Simulation */}
        <div className="bg-white dark:bg-[#0a1c33] border-2 border-slate-300 dark:border-[#1a365d] rounded-3xl p-6 shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Cancela da Guarita
            </span>
            <span
              className={`text-xs font-black px-3 py-1 rounded-full border-2 ${
                showGateOpenAnimation
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border-emerald-500 animate-pulse'
                  : 'bg-slate-100 dark:bg-[#0e223d] text-slate-600 dark:text-slate-400 border-slate-300 dark:border-[#1a365d]'
              }`}
            >
              {showGateOpenAnimation ? 'CANCELA LEVANTADA' : 'CANCELA BAIXADA'}
            </span>
          </div>

          {/* Graphical Gate */}
          <div className="bg-slate-100 dark:bg-[#071324] rounded-2xl p-4 border-2 border-slate-200 dark:border-[#1a365d] relative overflow-hidden h-36 flex items-center justify-center">
            {/* Road lines */}
            <div className="absolute inset-x-0 bottom-3 h-1.5 bg-slate-300 dark:bg-[#1a365d] flex justify-around">
              <span className="w-8 h-1.5 bg-white/80" />
              <span className="w-8 h-1.5 bg-white/80" />
              <span className="w-8 h-1.5 bg-white/80" />
            </div>

            {/* Barrier Post */}
            <div className="absolute left-8 bottom-3 w-7 h-20 bg-slate-800 dark:bg-[#0f2744] rounded-t-md border-t-2 border-slate-600 dark:border-[#38bdf8] flex flex-col items-center pt-2 z-10">
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  showGateOpenAnimation ? 'bg-emerald-500 shadow-md shadow-emerald-500' : 'bg-red-500'
                }`}
              />
            </div>

            {/* Barrier Arm */}
            <div
              className={`absolute left-12 bottom-16 h-3 rounded-r-md transition-all duration-700 origin-left border-y border-white z-10 ${
                showGateOpenAnimation
                  ? '-rotate-45 w-44 bg-[repeating-linear-gradient(45deg,#dc2626,#dc2626_10px,#ffffff_10px,#ffffff_20px)] shadow-lg'
                  : 'rotate-0 w-48 bg-[repeating-linear-gradient(45deg,#dc2626,#dc2626_10px,#ffffff_10px,#ffffff_20px)]'
              }`}
            />

            {/* Gate feedback text */}
            {showGateOpenAnimation ? (
              <div className="text-center animate-in zoom-in-75 duration-300 z-20">
                <div className="p-3 rounded-full bg-emerald-600 text-white inline-block mb-1 shadow-md">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="text-sm font-black text-emerald-900 dark:text-emerald-300">ENTRADA LIBERADA!</div>
                <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">BEM-VINDO AO WEPARK</div>
              </div>
            ) : (
              <div className="text-center text-slate-500 dark:text-slate-400 text-xs font-bold">
                Aguardando registro para abrir a cancela...
              </div>
            )}
          </div>
        </div>

        {/* Last Issued Ticket Card */}
        <div className="bg-white dark:bg-[#0a1c33] border-2 border-slate-300 dark:border-[#1a365d] rounded-3xl p-6 shadow-sm flex-1 flex flex-col justify-between transition-colors duration-200">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-slate-200 dark:border-[#1a365d]">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Último Ticket Emitido
                </h3>
              </div>
              {lastCreatedTicket && (
                <span className="text-xs font-mono text-emerald-800 dark:text-emerald-300 font-black bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700">
                  {lastCreatedTicket.ticketNumber}
                </span>
              )}
            </div>

            {lastCreatedTicket ? (
              <div className="bg-slate-50 dark:bg-[#0e223d] p-4 rounded-2xl border-2 border-slate-200 dark:border-[#1a365d] text-xs space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-[#1a365d]">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">Placa do Carro:</span>
                  <span className="text-xl font-black text-slate-950 dark:text-white font-mono px-2.5 py-0.5 bg-white dark:bg-[#0a1c33] rounded-lg border border-slate-300 dark:border-[#1a365d] shadow-xs">
                    {lastCreatedTicket.plate}
                  </span>
                </div>
                <div className="flex justify-between text-slate-800 dark:text-slate-200 font-medium">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">Tipo:</span>
                  <span className="font-black uppercase">{lastCreatedTicket.vehicleType}</span>
                </div>
                <div className="flex justify-between text-slate-800 dark:text-slate-200 font-medium">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">Horário de Entrada:</span>
                  <span className="font-bold font-mono">
                    {new Date(lastCreatedTicket.entryTime).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-800 dark:text-slate-200 font-medium">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">Categoria:</span>
                  <span className="font-black text-emerald-700 dark:text-emerald-400">
                    {lastCreatedTicket.isMonthly ? 'Mensalista Autorizado' : 'Tarifa Rotativa'}
                  </span>
                </div>

                <div className="mt-3 p-3 bg-blue-50 dark:bg-[#0e223d] rounded-xl border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300 text-xs font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>
                    Tolerância de 15 minutos até <strong>{new Date(new Date(lastCreatedTicket.entryTime).getTime() + 15 * 60000).toLocaleTimeString('pt-BR')}</strong>.
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-[#0e223d] p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#1a365d] text-center text-slate-500 dark:text-slate-400 text-xs font-bold">
                Nenhum ticket registrado nesta sessão recente.
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t-2 border-slate-200 dark:border-[#1a365d] text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center justify-between">
            <span>Operador da Guarita: <strong className="text-slate-900 dark:text-slate-100">{activeOperator.name}</strong></span>
            <span>Turno: <strong className="text-slate-900 dark:text-slate-100">{activeShift.shiftType.toUpperCase()}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
