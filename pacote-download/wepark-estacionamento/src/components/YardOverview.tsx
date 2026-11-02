/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PricingSettings, Ticket, VehicleType } from '../types';
import {
  calculateTariff,
  cleanPlate,
  formatCurrency,
  formatDateTime,
  formatDuration,
} from '../utils/plateValidator';
import {
  Car,
  Bike,
  Truck,
  Search,
  Clock,
  ArrowRight,
  Moon,
  AlertTriangle,
  Receipt,
  Download,
} from 'lucide-react';
import { downloadTicketPdf } from '../utils/pdfGenerator';

interface YardOverviewProps {
  parkedTickets: Ticket[];
  pricing: PricingSettings;
  onSelectForExit: (ticket: Ticket) => void;
  onOpenExceptionsModal: (plate?: string) => void;
}

export const YardOverview: React.FC<YardOverviewProps> = ({
  parkedTickets,
  pricing,
  onSelectForExit,
  onOpenExceptionsModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | VehicleType | 'monthly' | 'overnight'>('all');

  const filteredTickets = parkedTickets.filter((ticket) => {
    const term = searchTerm.trim().toUpperCase();
    const matchesSearch =
      !term ||
      cleanPlate(ticket.plate).includes(cleanPlate(term)) ||
      ticket.ticketNumber.toUpperCase().includes(term) ||
      (ticket.modelDescription && ticket.modelDescription.toUpperCase().includes(term));

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'monthly') return !!ticket.isMonthly;
    if (filterType === 'overnight') return !!ticket.isOvernight;
    return ticket.vehicleType === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar placa ou modelo..."
            className="w-full bg-slate-50 border-2 border-slate-300 text-sm font-bold text-slate-900 pl-11 pr-4 py-2.5 rounded-2xl focus:border-blue-600 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: `Todos (${parkedTickets.length})` },
            { id: 'carro', label: 'Carros' },
            { id: 'moto', label: 'Motos' },
            { id: 'caminhao', label: 'Caminhões' },
            { id: 'monthly', label: 'Mensalistas' },
            { id: 'overnight', label: 'Pernoites' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-colors whitespace-nowrap cursor-pointer ${
                filterType === f.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Parked Vehicles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTickets.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 text-xs font-bold bg-white rounded-3xl border-2 border-dashed border-slate-300">
            Nenhum veículo encontrado com esse filtro.
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const entryDate = new Date(ticket.entryTime);
            const elapsedMinutes = Math.floor((Date.now() - entryDate.getTime()) / 60000);
            const isTolerance = elapsedMinutes <= pricing.toleranceMinutes && !ticket.isLostTicketException;

            // Live preview tariff calculation
            const calc = calculateTariff(
              ticket.entryTime,
              new Date().toISOString(),
              ticket.vehicleType,
              pricing,
              ticket.isLostTicketException,
              ticket.administrativeFee
            );

            const Icon =
              ticket.vehicleType === 'moto'
                ? Bike
                : ticket.vehicleType === 'caminhao'
                ? Truck
                : Car;

            return (
              <div
                key={ticket.id}
                className="bg-white border-2 border-slate-300 hover:border-slate-400 rounded-3xl p-5 shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800">
                        <Icon className="w-6 h-6 text-slate-800" />
                      </div>
                      <div>
                        <span className="font-mono font-black text-xl text-slate-950 block">
                          {ticket.plate}
                        </span>
                        <span className="text-xs font-bold text-slate-500 font-mono">
                          Ticket #{ticket.ticketNumber}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {ticket.isMonthly ? (
                        <span className="text-[11px] bg-blue-100 text-[#0f4c81] px-2.5 py-1 rounded-full font-black border border-blue-300 block">
                          MENSALISTA
                        </span>
                      ) : ticket.isOvernight ? (
                        <span className="text-[11px] bg-blue-50 text-blue-900 px-2.5 py-1 rounded-full font-black border border-blue-200 flex items-center gap-1">
                          <Moon className="w-3.5 h-3.5 text-blue-700" />
                          PERNOITE
                        </span>
                      ) : isTolerance ? (
                        <span className="text-[11px] bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-full font-black border border-emerald-300 block">
                          TOLERÂNCIA
                        </span>
                      ) : (
                        <span className="text-[11px] bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full font-mono font-bold block border border-slate-300">
                          ROTATIVO
                        </span>
                      )}
                    </div>
                  </div>

                  {ticket.modelDescription && (
                    <p className="text-xs text-slate-700 font-medium mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      {ticket.modelDescription}
                    </p>
                  )}

                  <div className="space-y-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex justify-between">
                      <span className="font-bold">Horário de Entrada:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatDateTime(ticket.entryTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">Tempo no Estacionamento:</span>
                      <span className="text-blue-700 font-black font-mono">
                        {formatDuration(elapsedMinutes)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="font-bold">Valor Acumulado:</span>
                      <span className="font-black text-emerald-700 font-mono text-sm">
                        {ticket.isMonthly ? 'Isento' : formatCurrency(calc.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t-2 border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => downloadTicketPdf(ticket, 'entry')}
                      title="Baixar 2ª via do Ticket em PDF"
                      className="px-2.5 py-1.5 rounded-xl border-2 border-slate-300 hover:bg-slate-100 text-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-[11px]">PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenExceptionsModal(ticket.plate)}
                      className="text-[11px] font-bold text-blue-800 hover:text-blue-950 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      Perdeu ticket
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectForExit(ticket)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95 text-center whitespace-nowrap"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Cobrar Saída</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
