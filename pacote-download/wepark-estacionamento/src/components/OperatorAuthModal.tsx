/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ActiveShift, Operator, ShiftType } from '../types';
import { ShieldCheck, User, X, LogIn, Lock, CheckCircle2 } from 'lucide-react';

interface OperatorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  operatorsList: Operator[];
  activeOperator: Operator;
  activeShift: ActiveShift;
  onSwitchOperator: (
    operator: Operator,
    shiftType: ShiftType,
    initialFund: number
  ) => void;
  onOpenCrudModal?: () => void;
  onAddOperator?: (operator: Omit<Operator, 'id'>) => void;
}

export const OperatorAuthModal: React.FC<OperatorAuthModalProps> = ({
  isOpen,
  onClose,
  operatorsList,
  activeOperator,
  activeShift,
  onSwitchOperator,
  onOpenCrudModal,
  onAddOperator,
}) => {
  const [selectedOpId, setSelectedOpId] = useState(activeOperator.id);
  const [selectedShift, setSelectedShift] = useState<ShiftType>(activeShift.shiftType);
  const [initialFund, setInitialFund] = useState(activeShift.initialFund.toString());

  // Or create new operator mode
  const [isNewOperator, setIsNewOperator] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMatricula, setCustomMatricula] = useState('');
  const [customCpf, setCustomCpf] = useState('');

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

  // Keep selection synchronized whenever modal opens or operators/activeShift update
  React.useEffect(() => {
    if (isOpen) {
      setSelectedOpId(activeOperator.id);
      setSelectedShift(activeShift.shiftType);
      setInitialFund(activeShift.initialFund.toString());
      setIsNewOperator(false);
    }
  }, [isOpen, activeOperator, activeShift]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fundNum = parseFloat(initialFund.replace(',', '.')) || 100;

    let targetOp: Operator;
    if (isNewOperator) {
      if (!customName.trim() || !customMatricula.trim()) return;
      targetOp = {
        id: `op-${Date.now()}`,
        name: customName.trim(),
        matricula: customMatricula.trim(),
        cpf: customCpf.trim() || '123.456.789-99',
        avatarColor: '#2563EB',
        role: 'operador',
        createdAt: new Date().toISOString(),
      };
      if (onAddOperator) {
        onAddOperator(targetOp);
      }
    } else {
      const found = operatorsList.find((o) => o.id === selectedOpId);
      targetOp = found || activeOperator;
    }

    onSwitchOperator(targetOp, selectedShift, fundNum);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b-2 border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <img
              src="/assets/aistudio/Gemini_Generated_Image_5pb78c5pb78c5pb7_01f4a0ff.jpg"
              alt="WePark Logo"
              className="h-10 sm:h-11 w-auto object-contain rounded-xl border border-slate-200 bg-white shrink-0 shadow-xs"
            />
            <div className="min-w-0">
              <h3 className="font-black text-slate-900 text-sm sm:text-base truncate">
                Identificação do Atendente
              </h3>
              <p className="text-xs font-semibold text-slate-600 truncate">
                WePark • Guarita & Pátio
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
          {!isNewOperator ? (
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-2">
                1. Quem está operando a guarita agora? *
              </label>
              <div className="space-y-2">
                {operatorsList.map((op) => {
                  const isSelected = selectedOpId === op.id;
                  return (
                    <div
                      key={op.id}
                      onClick={() => setSelectedOpId(op.id)}
                      className={`p-3 sm:p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm text-white shadow-xs shrink-0"
                          style={{ backgroundColor: op.avatarColor }}
                        >
                          {op.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-black text-slate-900 truncate">{op.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 capitalize">
                              {op.role || 'operador'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 font-mono font-bold truncate">
                            Matrícula #{op.matricula} {op.phone ? `• ${op.phone}` : ''}
                          </div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200">
                {onOpenCrudModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCrudModal();
                    }}
                    className="text-xs font-black text-[#0f4c81] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>⚙️ Gerenciar Operadores (CRUD)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsNewOperator(true)}
                  className="text-xs font-black text-emerald-700 hover:underline block cursor-pointer ml-auto"
                >
                  + Cadastrar outro operador
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-3.5 sm:p-4 bg-slate-50 rounded-2xl border-2 border-slate-200">
              <span className="text-sm font-black text-slate-900 block">Novo Atendente</span>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-0.5">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Nome do operador"
                  className="w-full bg-white border-2 border-slate-300 text-sm font-bold text-slate-900 px-3 py-2 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-0.5">Matrícula</label>
                  <input
                    type="text"
                    required
                    value={customMatricula}
                    onChange={(e) => setCustomMatricula(e.target.value)}
                    placeholder="Ex: 1099"
                    className="w-full bg-white border-2 border-slate-300 text-sm font-mono font-bold text-slate-900 px-3 py-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-0.5">CPF</label>
                  <input
                    type="text"
                    value={customCpf}
                    onChange={(e) => setCustomCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-white border-2 border-slate-300 text-sm font-mono font-bold text-slate-900 px-3 py-2 rounded-xl"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewOperator(false)}
                className="text-xs font-bold text-slate-600 hover:underline block cursor-pointer pt-1"
              >
                Voltar para lista existente
              </button>
            </div>
          )}

          {/* Shift Selection */}
          <div>
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-2">
              2. Selecione seu Turno *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'manha' as ShiftType, label: 'Manhã (06h às 14h)' },
                { id: 'tarde' as ShiftType, label: 'Tarde (14h às 22h)' },
                { id: 'noite' as ShiftType, label: 'Noite (22h às 02h)' },
                { id: 'madrugada' as ShiftType, label: 'Madrugada (02h às 06h)' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedShift(s.id)}
                  className={`p-3 rounded-2xl border-2 text-left text-xs font-black transition-all cursor-pointer ${
                    selectedShift === s.id
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fundo de Troco */}
          <div>
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-1">
              3. Troco Inicial na Gaveta (R$) *
            </label>
            <input
              type="text"
              required
              value={initialFund}
              onChange={(e) => setInitialFund(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-300 text-xl font-mono font-black text-slate-900 px-4 py-2.5 rounded-2xl focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 flex flex-col sm:flex-row justify-end gap-2.5 sm:gap-3 border-t-2 border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-md flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              <LogIn className="w-5 h-5 shrink-0" />
              <span>CONFIRMAR ENTRADA NO TURNO</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
