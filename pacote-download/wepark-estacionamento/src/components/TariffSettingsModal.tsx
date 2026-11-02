/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PricingSettings, VehicleType, YardCapacity } from '../types';
import { Sliders, X, RotateCcw, CheckCircle2, Car, Bike, Truck } from 'lucide-react';
import { DEFAULT_CAPACITY, DEFAULT_PRICING } from '../services/storage';

interface TariffSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pricing: PricingSettings;
  capacity: YardCapacity;
  onSave: (pricing: PricingSettings, capacity: YardCapacity) => void;
}

export const TariffSettingsModal: React.FC<TariffSettingsModalProps> = ({
  isOpen,
  onClose,
  pricing,
  capacity,
  onSave,
}) => {
  const [formPricing, setFormPricing] = useState<PricingSettings>(pricing);
  const [formCapacity, setFormCapacity] = useState<YardCapacity>(capacity);

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

  const handleRateChange = (
    type: VehicleType,
    field: 'firstHour' | 'fraction15m' | 'dailyMax' | 'overnight',
    val: string
  ) => {
    const num = parseFloat(val) || 0;
    setFormPricing({
      ...formPricing,
      rates: {
        ...formPricing.rates,
        [type]: {
          ...formPricing.rates[type],
          [field]: num,
        },
      },
    });
  };

  const handleCapacityChange = (type: VehicleType, val: string) => {
    const num = parseInt(val) || 1;
    setFormCapacity({
      ...formCapacity,
      [type]: num,
    });
  };

  const handleResetDefaults = () => {
    setFormPricing(DEFAULT_PRICING);
    setFormCapacity(DEFAULT_CAPACITY);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formPricing, formCapacity);
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
        <div className="flex items-center justify-between p-5 border-b-2 border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-200 text-slate-900 rounded-2xl border border-slate-300 shadow-xs">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">
                Tabela de Preços e Vagas do Estacionamento
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Ajuste os valores da primeira hora, frações e quantidade de vagas
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

        {/* Content */}
        <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Global Rules: Tolerance & Lost Ticket Fee */}
          <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Regras Gerais
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tolerância Gratuita (Minutos):
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={formPricing.toleranceMinutes}
                  onChange={(e) =>
                    setFormPricing({
                      ...formPricing,
                      toleranceMinutes: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-white border-2 border-slate-300 font-mono text-base font-black text-slate-900 px-3.5 py-2 rounded-xl focus:border-emerald-600 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                  Tempo que o motorista pode sair sem pagar (Padrão 15 min).
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Taxa por Perda de Ticket (R$):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formPricing.lostTicketFee}
                  onChange={(e) =>
                    setFormPricing({
                      ...formPricing,
                      lostTicketFee: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-white border-2 border-slate-300 font-mono text-base font-black text-slate-900 px-3.5 py-2 rounded-xl focus:border-emerald-600 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                  Cobrada administrativamente quando o condutor perde o comprovante.
                </span>
              </div>
            </div>
          </div>

          {/* Rates Table per Vehicle Type */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Tabela de Preços por Tipo de Veículo
            </h4>

            {[
              { type: 'carro' as VehicleType, label: 'Carro de Passeio', icon: Car },
              { type: 'moto' as VehicleType, label: 'Motocicleta', icon: Bike },
              { type: 'caminhao' as VehicleType, label: 'Caminhão ou Van', icon: Truck },
            ].map((v) => {
              const Icon = v.icon;
              const rate = formPricing.rates[v.type];
              return (
                <div
                  key={v.type}
                  className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-slate-800" />
                    <span className="text-sm font-black text-slate-900 uppercase">{v.label}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">1ª Hora (R$)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={rate.firstHour}
                        onChange={(e) => handleRateChange(v.type, 'firstHour', e.target.value)}
                        className="w-full bg-white border-2 border-slate-300 font-mono text-sm font-black text-slate-900 px-3 py-1.5 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Cada 15 min (R$)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={rate.fraction15m}
                        onChange={(e) => handleRateChange(v.type, 'fraction15m', e.target.value)}
                        className="w-full bg-white border-2 border-slate-300 font-mono text-sm font-black text-slate-900 px-3 py-1.5 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Diária Máxima (R$)</label>
                      <input
                        type="number"
                        step="1"
                        value={rate.dailyMax}
                        onChange={(e) => handleRateChange(v.type, 'dailyMax', e.target.value)}
                        className="w-full bg-white border-2 border-slate-300 font-mono text-sm font-black text-slate-900 px-3 py-1.5 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Pernoite (R$)</label>
                      <input
                        type="number"
                        step="1"
                        value={rate.overnight}
                        onChange={(e) => handleRateChange(v.type, 'overnight', e.target.value)}
                        className="w-full bg-white border-2 border-slate-300 font-mono text-sm font-black text-slate-900 px-3 py-1.5 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Yard Capacity */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Total de Vagas Físicas no Estacionamento
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Vagas de Carros</label>
                <input
                  type="number"
                  min="1"
                  value={formCapacity.carro}
                  onChange={(e) => handleCapacityChange('carro', e.target.value)}
                  className="w-full bg-white border-2 border-slate-300 font-mono text-sm font-black text-slate-900 px-3 py-2 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Vagas de Motos</label>
                <input
                  type="number"
                  min="1"
                  value={formCapacity.moto}
                  onChange={(e) => handleCapacityChange('moto', e.target.value)}
                  className="w-full bg-white border-2 border-slate-300 font-mono text-sm font-black text-slate-900 px-3 py-2 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Vagas de Caminhões</label>
                <input
                  type="number"
                  min="1"
                  value={formCapacity.caminhao}
                  onChange={(e) => handleCapacityChange('caminhao', e.target.value)}
                  className="w-full bg-white border-2 border-slate-300 font-mono text-sm font-black text-slate-900 px-3 py-2 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t-2 border-slate-200">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 cursor-pointer py-1"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restaurar Valores Padrão</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-md cursor-pointer text-center"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
