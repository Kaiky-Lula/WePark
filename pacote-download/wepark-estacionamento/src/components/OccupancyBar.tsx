/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Ticket, VehicleType, YardCapacity } from '../types';
import { Car, Bike, Truck, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface OccupancyBarProps {
  parkedTickets: Ticket[];
  capacity: YardCapacity;
}

export const OccupancyBar: React.FC<OccupancyBarProps> = ({
  parkedTickets,
  capacity,
}) => {
  const countByType: Record<VehicleType, number> = {
    carro: parkedTickets.filter((t) => t.vehicleType === 'carro').length,
    moto: parkedTickets.filter((t) => t.vehicleType === 'moto').length,
    caminhao: parkedTickets.filter((t) => t.vehicleType === 'caminhao').length,
  };

  const totalOccupied = parkedTickets.length;
  const totalCapacity = capacity.carro + capacity.moto + capacity.caminhao;
  const totalFree = Math.max(0, totalCapacity - totalOccupied);
  const totalPercent = Math.round((totalOccupied / totalCapacity) * 100) || 0;
  const isFull = totalFree <= 0;

  const categories = [
    {
      type: 'carro' as VehicleType,
      name: 'Carros',
      icon: Car,
      occupied: countByType.carro,
      total: capacity.carro,
      free: Math.max(0, capacity.carro - countByType.carro),
      color: 'bg-blue-600',
      badgeBg: 'bg-blue-50 text-blue-900 border-blue-200',
    },
    {
      type: 'moto' as VehicleType,
      name: 'Motos',
      icon: Bike,
      occupied: countByType.moto,
      total: capacity.moto,
      free: Math.max(0, capacity.moto - countByType.moto),
      color: 'bg-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    },
    {
      type: 'caminhao' as VehicleType,
      name: 'Caminhões e Vans',
      icon: Truck,
      occupied: countByType.caminhao,
      total: capacity.caminhao,
      free: Math.max(0, capacity.caminhao - countByType.caminhao),
      color: 'bg-blue-700',
      badgeBg: 'bg-blue-50 text-blue-900 border-blue-200',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#0a1c33] border-2 border-slate-300 dark:border-[#1a365d] rounded-3xl p-4 sm:p-5 shadow-sm mb-6 transition-colors duration-200">
      {/* Top Banner: Huge Free spots display */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-slate-200 dark:border-[#1a365d]">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl shadow-sm shrink-0 ${
              isFull
                ? 'bg-red-600 text-white'
                : totalFree <= 5
                ? 'bg-blue-600 text-white'
                : 'bg-emerald-600 text-white shadow-emerald-700/20'
            }`}
          >
            {totalFree}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                {isFull ? 'PÁTIO LOTADO' : `${totalFree} VAGAS LIVRES`}
              </span>
              {totalPercent >= 90 && (
                <span className="text-[10px] sm:text-xs bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300 px-2 sm:px-2.5 py-0.5 rounded-full font-black border border-red-300 dark:border-red-700 shrink-0">
                  {totalPercent >= 100 ? 'LOTADO' : 'QUASE CHEIO'}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5 truncate sm:whitespace-normal">
              {totalOccupied} veículos no pátio ({totalCapacity} vagas totais)
            </p>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full md:w-72">
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>Ocupação Total</span>
            <span className="font-black text-sm text-slate-900 dark:text-slate-100">{totalPercent}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-[#071324] h-3 rounded-full overflow-hidden border border-slate-300 dark:border-[#1a365d]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalPercent >= 90 ? 'bg-red-600' : totalPercent >= 75 ? 'bg-blue-600' : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, totalPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Categories Grid - Super simple to read */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-3 sm:pt-4">
        {categories.map((cat) => {
          const isCategoryFull = cat.free <= 0;
          const Icon = cat.icon;

          return (
            <div
              key={cat.type}
              className={`p-3 sm:p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all ${
                isCategoryFull
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800'
                  : 'bg-slate-50 dark:bg-[#0e223d] border-slate-200 dark:border-[#1a365d] hover:border-slate-300 dark:hover:border-[#234876]'
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-white dark:bg-[#0a1c33] border border-slate-200 dark:border-[#1a365d] shadow-xs text-slate-800 dark:text-[#38bdf8] shrink-0">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800 dark:text-[#38bdf8]" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 block truncate">{cat.name}</span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate">
                    {cat.occupied} de {cat.total} ocupadas
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0 ml-2">
                <span
                  className={`text-xs sm:text-sm font-black px-2.5 sm:px-3 py-1 rounded-xl block font-mono border whitespace-nowrap ${
                    isCategoryFull
                      ? 'bg-red-600 text-white border-red-700'
                      : 'bg-white dark:bg-[#0a1c33] text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                  }`}
                >
                  {isCategoryFull ? 'LOTADO' : `${cat.free} livres`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
