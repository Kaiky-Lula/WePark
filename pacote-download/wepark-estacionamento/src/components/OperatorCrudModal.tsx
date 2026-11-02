/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Operator, OperatorRole, ShiftType } from '../types';
import {
  Users,
  UserPlus,
  Edit3,
  Trash2,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Phone,
  CreditCard,
  Hash,
  LogIn,
  Save,
  Palette,
  Sparkles,
} from 'lucide-react';

interface OperatorCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  operatorsList: Operator[];
  activeOperator: Operator;
  onAddOperator: (operator: Omit<Operator, 'id'>) => void;
  onUpdateOperator: (operator: Operator) => void;
  onDeleteOperator: (operatorId: string) => void;
  onSwitchToOperator?: (operator: Operator) => void;
}

const AVATAR_COLORS = [
  { label: 'Azul WePark', hex: '#0f4c81' },
  { label: 'Verde WePark', hex: '#10b981' },
  { label: 'Azul Cobalto', hex: '#1d4ed8' },
  { label: 'Verde Floresta', hex: '#059669' },
  { label: 'Azul Petróleo', hex: '#0369a1' },
  { label: 'Verde Musgo', hex: '#15803d' },
  { label: 'Azul Marinho', hex: '#1e3a8a' },
  { label: 'Azul Céu', hex: '#0284c7' },
];

const ROLE_LABELS: Record<OperatorRole, { label: string; badgeClass: string }> = {
  operador: {
    label: 'Operador de Guarita',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  supervisor: {
    label: 'Supervisor de Pátio',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  gerente: {
    label: 'Gerente Geral',
    badgeClass: 'bg-blue-100 text-[#0f4c81] border-blue-300',
  },
};

export const OperatorCrudModal: React.FC<OperatorCrudModalProps> = ({
  isOpen,
  onClose,
  operatorsList,
  activeOperator,
  onAddOperator,
  onUpdateOperator,
  onDeleteOperator,
  onSwitchToOperator,
}) => {
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | OperatorRole>('all');

  // Form Mode: null = viewing list, 'create' = new, 'edit' = editing
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    matricula: '',
    cpf: '',
    role: 'operador' as OperatorRole,
    phone: '',
    avatarColor: '#0f4c81',
  });

  // Delete Confirmation State
  const [operatorToDelete, setOperatorToDelete] = useState<Operator | null>(null);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (operatorToDelete) {
          setOperatorToDelete(null);
        } else if (formMode) {
          setFormMode(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, formMode, operatorToDelete, onClose]);

  if (!isOpen) return null;

  // Mask CPF: 000.000.000-00
  const formatCpf = (val: string) => {
    const raw = val.replace(/\D/g, '').substring(0, 11);
    if (raw.length <= 3) return raw;
    if (raw.length <= 6) return `${raw.substring(0, 3)}.${raw.substring(3)}`;
    if (raw.length <= 9) return `${raw.substring(0, 3)}.${raw.substring(3, 6)}.${raw.substring(6)}`;
    return `${raw.substring(0, 3)}.${raw.substring(3, 6)}.${raw.substring(6, 9)}-${raw.substring(9, 11)}`;
  };

  // Mask Phone: (00) 00000-0000
  const formatPhone = (val: string) => {
    const raw = val.replace(/\D/g, '').substring(0, 11);
    if (raw.length <= 2) return raw ? `(${raw}` : '';
    if (raw.length <= 7) return `(${raw.substring(0, 2)}) ${raw.substring(2)}`;
    return `(${raw.substring(0, 2)}) ${raw.substring(2, 7)}-${raw.substring(7, 11)}`;
  };

  const handleOpenCreate = () => {
    // Generate an automatic suggestion for matricula
    const highestMatricula = operatorsList.reduce((max, op) => {
      const num = parseInt(op.matricula, 10);
      return !isNaN(num) && num > max ? num : max;
    }, 1040);

    setFormData({
      name: '',
      matricula: String(highestMatricula + 1),
      cpf: '',
      role: 'operador',
      phone: '',
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)].hex,
    });
    setEditingOperator(null);
    setFormMode('create');
  };

  const handleOpenEdit = (op: Operator) => {
    setEditingOperator(op);
    setFormData({
      name: op.name,
      matricula: op.matricula,
      cpf: op.cpf || '',
      role: op.role || 'operador',
      phone: op.phone || '',
      avatarColor: op.avatarColor || '#0f4c81',
    });
    setFormMode('edit');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.matricula.trim()) return;

    if (formMode === 'create') {
      onAddOperator({
        name: formData.name.trim(),
        matricula: formData.matricula.trim(),
        cpf: formData.cpf.trim() || 'Não informado',
        role: formData.role,
        phone: formData.phone.trim() || '',
        avatarColor: formData.avatarColor,
        createdAt: new Date().toISOString(),
      });
    } else if (formMode === 'edit' && editingOperator) {
      onUpdateOperator({
        ...editingOperator,
        name: formData.name.trim(),
        matricula: formData.matricula.trim(),
        cpf: formData.cpf.trim() || 'Não informado',
        role: formData.role,
        phone: formData.phone.trim() || '',
        avatarColor: formData.avatarColor,
      });
    }

    setFormMode(null);
    setEditingOperator(null);
  };

  const handleConfirmDelete = () => {
    if (!operatorToDelete) return;
    onDeleteOperator(operatorToDelete.id);
    setOperatorToDelete(null);
  };

  // Filtered operators
  const filteredOperators = operatorsList.filter((op) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      op.name.toLowerCase().includes(term) ||
      op.matricula.toLowerCase().includes(term) ||
      (op.cpf && op.cpf.replace(/\D/g, '').includes(term.replace(/\D/g, '')));

    if (!matchesSearch) return false;
    if (roleFilter === 'all') return true;
    return (op.role || 'operador') === roleFilter;
  });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !formMode && !operatorToDelete) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b-2 border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <img
              src="/assets/aistudio/Gemini_Generated_Image_5pb78c5pb78c5pb7_01f4a0ff.jpg"
              alt="WePark Logo"
              className="h-10 sm:h-11 w-auto object-contain rounded-xl border border-slate-200 bg-white shrink-0 shadow-xs"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base sm:text-lg truncate">
                  Gestão de Operadores & Atendentes
                </h3>
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0f4c81] border border-blue-200 shrink-0">
                  {operatorsList.length} cadastrados
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 truncate">
                Adicione, altere dados ou remova operadores com sincronização em nuvem
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 cursor-pointer shrink-0 ml-2 transition-colors"
            title="Fechar (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="p-4 sm:p-5 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, matrícula ou CPF..."
              className="w-full bg-white border border-slate-300 text-xs font-bold text-slate-900 pl-9 pr-3 py-2.5 rounded-xl focus:border-[#0f4c81] focus:outline-none"
            />
          </div>

          {/* Role Filter & Add Button */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-white border border-slate-300 text-xs font-bold text-slate-700 px-3 py-2.5 rounded-xl focus:border-[#0f4c81] focus:outline-none cursor-pointer"
            >
              <option value="all">Todos os Cargos</option>
              <option value="operador">Operadores</option>
              <option value="supervisor">Supervisores</option>
              <option value="gerente">Gerentes</option>
            </select>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>+ Novo Operador</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {filteredOperators.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl">
              <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Nenhum operador encontrado com os filtros aplicados.</p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Cadastrar Primeiro Operador</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {filteredOperators.map((op) => {
                const isActive = activeOperator.id === op.id;
                const roleInfo = ROLE_LABELS[op.role || 'operador'] || ROLE_LABELS.operador;

                return (
                  <div
                    key={op.id}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 bg-white ${
                      isActive
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Top Row: Avatar & Details */}
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base text-white shadow-sm shrink-0"
                          style={{ backgroundColor: op.avatarColor || '#0f4c81' }}
                        >
                          {op.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-sm text-slate-900 truncate">
                              {op.name}
                            </span>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                EM TURNO
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="font-mono font-bold text-slate-700">#{op.matricula}</span>
                            <span>•</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${roleInfo.badgeClass}`}>
                              {roleInfo.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata details */}
                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">CPF</span>
                        <span className="font-mono font-bold text-slate-800 truncate block">
                          {op.cpf || 'Não informado'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Contato</span>
                        <span className="font-mono text-slate-800 truncate block">
                          {op.phone || 'Sem telefone'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      {/* Left: Switch shift button if not active */}
                      {onSwitchToOperator && !isActive ? (
                        <button
                          type="button"
                          onClick={() => onSwitchToOperator(op)}
                          className="flex items-center gap-1 text-xs font-black text-[#0f4c81] hover:underline cursor-pointer"
                          title="Assumir guarita com este operador"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Assumir Turno</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-bold">
                          {isActive ? 'Atendente em atividade' : ''}
                        </span>
                      )}

                      {/* Right: Edit & Delete buttons */}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(op)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                          title="Alterar dados do operador"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          disabled={isActive}
                          onClick={() => setOperatorToDelete(op)}
                          className={`p-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                            isActive
                              ? 'text-slate-300 cursor-not-allowed border border-transparent'
                              : 'text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200'
                          }`}
                          title={
                            isActive
                              ? 'Não é permitido excluir o operador com turno aberto ativo'
                              : 'Excluir operador'
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t-2 border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            As alterações são salvas automaticamente na nuvem Firestore e no dispositivo local.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* CREATE / EDIT FORM MODAL */}
      {formMode && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Sub-Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b-2 border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0f4c81] text-white flex items-center justify-center font-bold">
                  {formMode === 'create' ? <UserPlus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">
                    {formMode === 'create' ? 'Cadastrar Novo Operador' : 'Alterar Dados do Operador'}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {formMode === 'create'
                      ? 'Preencha os dados do novo membro da guarita'
                      : `Atualizando cadastro de ${editingOperator?.name}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormMode(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Modal Form */}
            <form onSubmit={handleSaveForm} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {/* Nome Completo */}
              <div>
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: João da Silva Santos"
                  className="w-full bg-slate-50 border-2 border-slate-300 text-sm font-bold text-slate-900 px-3.5 py-2.5 rounded-xl focus:border-[#0f4c81] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Matrícula e Cargo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-1">
                    Matrícula / ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                    placeholder="Ex: 1042"
                    className="w-full bg-slate-50 border-2 border-slate-300 text-sm font-mono font-bold text-slate-900 px-3.5 py-2.5 rounded-xl focus:border-[#0f4c81] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-1">
                    Cargo / Função *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as OperatorRole })}
                    className="w-full bg-slate-50 border-2 border-slate-300 text-sm font-bold text-slate-900 px-3.5 py-2.5 rounded-xl focus:border-[#0f4c81] focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="operador">Operador de Guarita</option>
                    <option value="supervisor">Supervisor de Pátio</option>
                    <option value="gerente">Gerente Geral</option>
                  </select>
                </div>
              </div>

              {/* CPF e Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCpf(e.target.value) })}
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-50 border-2 border-slate-300 text-sm font-mono font-bold text-slate-900 px-3.5 py-2.5 rounded-xl focus:border-[#0f4c81] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-1">
                    Telefone / Celular
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    placeholder="(11) 98765-4321"
                    className="w-full bg-slate-50 border-2 border-slate-300 text-sm font-mono font-bold text-slate-900 px-3.5 py-2.5 rounded-xl focus:border-[#0f4c81] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cor de Identificação do Atendente</span>
                </label>
                <div className="flex items-center gap-2.5 flex-wrap pt-1">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatarColor: c.hex })}
                      className={`w-8 h-8 rounded-full cursor-pointer transition-transform flex items-center justify-center ${
                        formData.avatarColor === c.hex
                          ? 'ring-3 ring-offset-2 ring-slate-900 scale-110'
                          : 'hover:scale-105 opacity-90'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    >
                      {formData.avatarColor === c.hex && (
                        <CheckCircle2 className="w-4 h-4 text-white drop-shadow-xs" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-xs shrink-0"
                  style={{ backgroundColor: formData.avatarColor }}
                >
                  {(formData.name.trim() || 'WP').substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-900 truncate block">
                    {formData.name.trim() || 'Nome do Atendente'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Matrícula #{formData.matricula || '---'} • {ROLE_LABELS[formData.role]?.label}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setFormMode(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-[#0f4c81] hover:bg-[#164e7e] shadow-md cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{formMode === 'create' ? 'Salvar Operador' : 'Atualizar Dados'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {operatorToDelete && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border-2 border-red-300 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-base">
                  Confirmar Exclusão de Operador
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Esta ação é irreversível e removerá o atendente do sistema.
                </p>
              </div>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1">
              <p>
                Você está prestes a excluir: <strong className="font-bold">{operatorToDelete.name}</strong>
              </p>
              <p className="font-mono text-[11px] text-red-700">
                Matrícula: #{operatorToDelete.matricula} • CPF: {operatorToDelete.cpf}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setOperatorToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
