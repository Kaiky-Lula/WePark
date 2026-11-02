/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ActiveShift,
  Operator,
  ShiftType,
} from '../types';
import {
  Car,
  Clock,
  ShieldCheck,
  User,
  LogOut,
  RotateCcw,
  Sliders,
  DollarSign,
  AlertTriangle,
  Receipt,
  Users,
  CheckCircle,
  Sun,
  Moon,
} from 'lucide-react';

interface HeaderProps {
  activeOperator: Operator;
  activeShift: ActiveShift;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenAuthModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenOperatorCrudModal: () => void;
  onOpenExceptionsModal: () => void;
  onOpenMonthlyModal: () => void;
  onResetData: () => void;
  currentTab: 'guarita' | 'saida' | 'patio' | 'caixa' | 'mensalistas';
  setCurrentTab: (tab: 'guarita' | 'saida' | 'patio' | 'caixa' | 'mensalistas') => void;
  parkedCount: number;
}

const SHIFT_NAMES: Record<ShiftType, string> = {
  manha: 'Manhã (06h às 14h)',
  tarde: 'Tarde (14h às 22h)',
  noite: 'Noite (22h às 02h)',
  madrugada: 'Madrugada (02h às 06h)',
};

export const Header: React.FC<HeaderProps> = ({
  activeOperator,
  activeShift,
  theme,
  onToggleTheme,
  onOpenAuthModal,
  onOpenSettingsModal,
  onOpenOperatorCrudModal,
  onOpenExceptionsModal,
  onOpenMonthlyModal,
  onResetData,
  currentTab,
  setCurrentTab,
  parkedCount,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white dark:bg-[#0a1c33] border-b-2 border-slate-200 dark:border-[#1a365d] sticky top-0 z-30 shadow-md transition-colors duration-200">
      {/* Top Bar with High Contrast & Clear Elements */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <img
              src="/assets/aistudio/Gemini_Generated_Image_5pb78c5pb78c5pb7_01f4a0ff.jpg"
              alt="WePark Estacionamento"
              className="h-10 sm:h-12 w-auto object-contain rounded-xl shadow-xs border border-slate-200/90 dark:border-[#1a365d] bg-white shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-xl sm:text-2xl tracking-tight text-[#0f4c81] dark:text-[#38bdf8] truncate">
                  WePark
                </span>
                <span className="hidden xs:inline-flex text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-extrabold border border-emerald-300 dark:border-emerald-700 shrink-0">
                  GUARITA
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold truncate hidden sm:block">
                Estacionamento Seguro • Tecnologia e Praticidade
              </p>
            </div>
          </div>

          {/* Center: Live Clock & Shift info (Desktop) */}
          <div className="hidden lg:flex items-center gap-6 bg-slate-100 dark:bg-[#0e223d] px-5 py-2.5 rounded-2xl border border-slate-300 dark:border-[#1a365d] shrink-0">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <div>
                <span className="font-mono text-base font-black text-slate-900 dark:text-slate-100 block leading-tight">
                  {currentTime.toLocaleTimeString('pt-BR')}
                </span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                  {currentTime.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                </span>
              </div>
            </div>

            <div className="h-7 w-px bg-slate-300 dark:bg-[#1a365d]" />

            <div className="text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium block">Turno Atual:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {SHIFT_NAMES[activeShift.shiftType]}
              </span>
            </div>
          </div>

          {/* Right: Operator Badge & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Operator Card */}
            <div
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 sm:gap-3 bg-slate-100 dark:bg-[#0e223d] hover:bg-slate-200 dark:hover:bg-[#132c4e] px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl border-2 border-slate-300 dark:border-[#1a365d] cursor-pointer transition-all hover:border-slate-400 dark:hover:border-slate-500 group max-w-[180px] sm:max-w-none"
              title="Clique para trocar o operador ou fechar o turno"
            >
              <div
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm text-white shadow-sm shrink-0"
                style={{ backgroundColor: activeOperator.avatarColor || '#2563EB' }}
              >
                {activeOperator.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span className="truncate max-w-[120px]">{activeOperator.name}</span>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-bold truncate">
                  #{activeOperator.matricula} • <span className="text-blue-600 dark:text-blue-400 underline">Trocar</span>
                </div>
              </div>
              <LogOut className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-red-600 transition-colors ml-0.5 sm:ml-1 shrink-0" />
            </div>

            {/* Dark / Light Mode Switcher */}
            <button
              type="button"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro (Noturno)'}
              className="p-2 sm:p-2.5 text-slate-600 dark:text-[#38bdf8] hover:bg-slate-100 dark:hover:bg-[#132c4e] rounded-xl transition-colors border border-slate-300 dark:border-[#1a365d] shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-[#38bdf8] animate-spin-once" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-[#0f4c81]" />
              )}
              <span className="hidden xl:inline text-xs font-black text-slate-700 dark:text-slate-200">
                {theme === 'dark' ? 'Claro' : 'Escuro'}
              </span>
            </button>

            {/* Manage Operators button */}
            <button
              type="button"
              onClick={onOpenOperatorCrudModal}
              title="Gerenciar Operadores (Adicionar, Alterar, Excluir)"
              className="p-2 sm:p-2.5 text-slate-600 dark:text-slate-300 hover:text-[#0f4c81] dark:hover:text-[#38bdf8] hover:bg-slate-100 dark:hover:bg-[#132c4e] rounded-xl transition-colors border border-slate-300 dark:border-[#1a365d] shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#0f4c81] dark:text-[#38bdf8]" />
              <span className="hidden xl:inline text-xs font-black text-slate-800 dark:text-slate-200">Operadores</span>
            </button>

            {/* Settings button */}
            <button
              type="button"
              onClick={onOpenSettingsModal}
              title="Configurar Preços e Vagas"
              className="p-2 sm:p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#132c4e] rounded-xl transition-colors border border-slate-300 dark:border-[#1a365d] shrink-0 cursor-pointer"
            >
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Operation Tabs - Ultra Accessible across Mobile, Tablet and Desktop */}
      <div className="bg-slate-50 dark:bg-[#071324] border-t border-slate-200 dark:border-[#1a365d] px-3 sm:px-6 lg:px-8 py-2 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
          {/* Scrollable Navigation Chips on Mobile/Tablet */}
          <nav
            aria-label="Abas de Operação"
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none -mx-1 px-1"
          >
            {/* 1. ENTRADA */}
            <button
              type="button"
              onClick={() => setCurrentTab('guarita')}
              className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-xs ${
                currentTab === 'guarita'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-500 ring-offset-1 sm:ring-offset-2 dark:ring-offset-[#071324] shadow-emerald-700/20'
                  : 'bg-white dark:bg-[#0e223d] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#15325b] border border-slate-300 dark:border-[#1a365d]'
              }`}
            >
              <Car className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>1. ENTRADA</span>
            </button>

            {/* 2. SAÍDA & COBRANÇA */}
            <button
              type="button"
              onClick={() => setCurrentTab('saida')}
              className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-xs ${
                currentTab === 'saida'
                  ? 'bg-[#0f4c81] text-white ring-2 ring-[#0f4c81] ring-offset-1 sm:ring-offset-2 dark:ring-offset-[#071324] shadow-[#0f4c81]/25'
                  : 'bg-white dark:bg-[#0e223d] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#15325b] border border-slate-300 dark:border-[#1a365d]'
              }`}
            >
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>2. SAÍDA & COBRANÇA</span>
            </button>

            {/* 3. PÁTIO */}
            <button
              type="button"
              onClick={() => setCurrentTab('patio')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                currentTab === 'patio'
                  ? 'bg-slate-800 dark:bg-[#1e3a5f] text-white ring-2 ring-slate-800 dark:ring-[#38bdf8] ring-offset-1 sm:ring-offset-2 dark:ring-offset-[#071324]'
                  : 'bg-white dark:bg-[#0e223d] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#15325b] border border-slate-300 dark:border-[#1a365d]'
              }`}
            >
              <span>3. Pátio</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-black font-mono ${
                currentTab === 'patio' ? 'bg-slate-700 dark:bg-[#0f2744] text-white' : 'bg-slate-200 dark:bg-[#1a365d] text-slate-900 dark:text-slate-100'
              }`}>
                {parkedCount}
              </span>
            </button>

            {/* 4. MENSALISTAS */}
            <button
              type="button"
              onClick={() => setCurrentTab('mensalistas')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                currentTab === 'mensalistas'
                  ? 'bg-blue-600 dark:bg-blue-700 text-white ring-2 ring-blue-600 dark:ring-blue-400 ring-offset-1 sm:ring-offset-2 dark:ring-offset-[#071324]'
                  : 'bg-white dark:bg-[#0e223d] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#15325b] border border-slate-300 dark:border-[#1a365d]'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>4. Mensalistas</span>
            </button>

            {/* 5. CAIXA & AUDITORIA */}
            <button
              type="button"
              onClick={() => setCurrentTab('caixa')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                currentTab === 'caixa'
                  ? 'bg-emerald-700 dark:bg-emerald-600 text-white ring-2 ring-emerald-700 dark:ring-emerald-400 ring-offset-1 sm:ring-offset-2 dark:ring-offset-[#071324]'
                  : 'bg-white dark:bg-[#0e223d] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#15325b] border border-slate-300 dark:border-[#1a365d]'
              }`}
            >
              <DollarSign className="w-4 h-4 shrink-0" />
              <span>5. Caixa</span>
            </button>
          </nav>

          {/* Quick Actions Row */}
          <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-[#1a365d] shrink-0">
            {/* Perda de Ticket Button */}
            <button
              type="button"
              onClick={onOpenExceptionsModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-blue-50 dark:bg-[#0e223d] text-[#0f4c81] dark:text-[#38bdf8] border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-[#132c4e] transition-colors shadow-xs cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#0f4c81] dark:text-[#38bdf8] shrink-0" />
              <span>Perdeu Ticket?</span>
            </button>

            {/* Demo Reset */}
            <button
              type="button"
              onClick={onResetData}
              title="Restaurar dados de exemplo"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#132c4e] rounded-xl transition-colors border border-slate-300 dark:border-[#1a365d] shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
