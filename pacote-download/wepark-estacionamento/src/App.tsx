/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ActiveShift,
  Bleeding,
  MonthlyCustomer,
  Operator,
  PaymentMethod,
  PricingSettings,
  ShiftType,
  Supply,
  Ticket,
  YardCapacity,
} from './types';
import { StorageService } from './services/storage';
import { CloudDbService, testFirestoreConnection } from './services/firebase';
import { Header } from './components/Header';
import { OccupancyBar } from './components/OccupancyBar';
import { GuaritaEntry } from './components/GuaritaEntry';
import { ExitCheckout } from './components/ExitCheckout';
import { YardOverview } from './components/YardOverview';
import { MonthlyCustomers } from './components/MonthlyCustomers';
import { CashRegisterAudit } from './components/CashRegisterAudit';
import { TicketThermalModal } from './components/TicketThermalModal';
import { ExceptionsModal } from './components/ExceptionsModal';
import { OperatorAuthModal } from './components/OperatorAuthModal';
import { OperatorCrudModal } from './components/OperatorCrudModal';
import { TariffSettingsModal } from './components/TariffSettingsModal';
import { ShiftReportModal } from './components/ShiftReportModal';

export default function App() {
  // Main State
  const [activeOperator, setActiveOperator] = useState<Operator>(
    StorageService.getActiveOperator()
  );
  const [activeShift, setActiveShift] = useState<ActiveShift>(
    StorageService.getActiveShift()
  );
  const [tickets, setTickets] = useState<Ticket[]>(StorageService.getTickets());
  const [monthlyCustomers, setMonthlyCustomers] = useState<MonthlyCustomer[]>(
    StorageService.getMonthlyCustomers()
  );
  const [pricing, setPricing] = useState<PricingSettings>(
    StorageService.getPricing()
  );
  const [capacity, setCapacity] = useState<YardCapacity>(
    StorageService.getCapacity()
  );
  const [operatorsList, setOperatorsList] = useState<Operator[]>(
    StorageService.getOperators()
  );

  // UI Tabs & Modals
  const [currentTab, setCurrentTab] = useState<
    'guarita' | 'saida' | 'patio' | 'caixa' | 'mensalistas'
  >('guarita');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOperatorCrudModalOpen, setIsOperatorCrudModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isExceptionsModalOpen, setIsExceptionsModalOpen] = useState(false);
  const [exceptionsPlate, setExceptionsPlate] = useState<string | undefined>(
    undefined
  );
  const [preselectedExitTicket, setPreselectedExitTicket] = useState<Ticket | null>(null);

  // Thermal Receipt Modal
  const [thermalTicket, setThermalTicket] = useState<Ticket | null>(null);
  const [thermalMode, setThermalMode] = useState<'entry' | 'exit'>('entry');
  const [isThermalModalOpen, setIsThermalModalOpen] = useState(false);

  // Shift Report Modal
  const [isShiftReportModalOpen, setIsShiftReportModalOpen] = useState(false);

  // Theme State (Dark / Light Mode - matching WePark brand palette)
  // Requirement: "Ao abrir o site pelo link, traga-o na versão light"
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Check if the current browser session explicitly toggled dark/light mode
    const sessionTheme = sessionStorage.getItem('wepark_theme_session');
    if (sessionTheme === 'dark' || sessionTheme === 'light') {
      return sessionTheme;
    }
    // Always default to 'light' when accessing the link
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    sessionStorage.setItem('wepark_theme_session', theme);
    localStorage.setItem('wepark_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Cloud Database Real-time Synchronization
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  useEffect(() => {
    // Ensure document begins in light mode if not explicitly dark
    if (theme !== 'dark') {
      document.documentElement.classList.remove('dark');
    }

    // Test initial connection and seed default data if cloud database is empty
    testFirestoreConnection().then(setIsCloudConnected);
    CloudDbService.initializeDatabaseIfEmpty();

    // Subscribe to tickets in real time across all devices
    const unsubTickets = CloudDbService.subscribeTickets((cloudTickets) => {
      if (cloudTickets && cloudTickets.length > 0) {
        setTickets(cloudTickets);
        StorageService.saveTickets(cloudTickets);
      }
    });

    // Subscribe to monthly customers
    const unsubCustomers = CloudDbService.subscribeMonthlyCustomers((cloudCustomers) => {
      if (cloudCustomers && cloudCustomers.length > 0) {
        setMonthlyCustomers(cloudCustomers);
        StorageService.saveMonthlyCustomers(cloudCustomers);
      }
    });

    // Subscribe to operators list in real time across all clients
    const unsubOperators = CloudDbService.subscribeOperators((cloudOps) => {
      if (cloudOps && cloudOps.length > 0) {
        setOperatorsList(cloudOps);
        StorageService.saveOperators(cloudOps);

        // Keep activeOperator in sync if modified
        setActiveOperator((currActive) => {
          const match = cloudOps.find((op) => op.id === currActive.id);
          if (match) {
            if (
              match.name !== currActive.name ||
              match.matricula !== currActive.matricula ||
              match.avatarColor !== currActive.avatarColor ||
              match.role !== currActive.role ||
              match.phone !== currActive.phone ||
              match.cpf !== currActive.cpf
            ) {
              StorageService.setActiveOperator(match);
              return match;
            }
            return currActive;
          }
          // If active operator was deleted, fallback to the first operator in cloudOps
          StorageService.setActiveOperator(cloudOps[0]);
          return cloudOps[0];
        });

        // Keep activeShift.operator in sync if modified
        setActiveShift((currShift) => {
          const match = cloudOps.find((op) => op.id === currShift.operator.id);
          if (match) {
            if (
              match.name !== currShift.operator.name ||
              match.matricula !== currShift.operator.matricula ||
              match.avatarColor !== currShift.operator.avatarColor ||
              match.role !== currShift.operator.role ||
              match.phone !== currShift.operator.phone ||
              match.cpf !== currShift.operator.cpf
            ) {
              const updatedShift: ActiveShift = {
                ...currShift,
                operator: match,
              };
              StorageService.saveActiveShift(updatedShift);
              return updatedShift;
            }
            return currShift;
          }
          const updatedShift: ActiveShift = {
            ...currShift,
            operator: cloudOps[0],
          };
          StorageService.saveActiveShift(updatedShift);
          return updatedShift;
        });
      }
    });

    // Subscribe to active shift in real time so active operator is shared across devices
    const unsubShift = CloudDbService.subscribeCurrentShift((cloudShift) => {
      if (cloudShift && cloudShift.operator && !cloudShift.isClosed) {
        setActiveShift(cloudShift);
        setActiveOperator(cloudShift.operator);
        StorageService.saveActiveShift(cloudShift);
        StorageService.setActiveOperator(cloudShift.operator);
      }
    });

    // Subscribe to pricing
    const unsubPricing = CloudDbService.subscribePricing((cloudPricing) => {
      if (cloudPricing) {
        setPricing(cloudPricing);
        StorageService.savePricing(cloudPricing);
      }
    });

    // Subscribe to yard capacity
    const unsubCapacity = CloudDbService.subscribeCapacity((cloudCapacity) => {
      if (cloudCapacity) {
        setCapacity(cloudCapacity);
        StorageService.saveCapacity(cloudCapacity);
      }
    });

    return () => {
      unsubTickets();
      unsubCustomers();
      unsubOperators();
      unsubShift();
      unsubPricing();
      unsubCapacity();
    };
  }, []);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Vehicles currently parked in yard
  const parkedTickets = tickets.filter((t) => t.status === 'patio');

  // Register Entry
  const handleRegisterEntry = (newTicket: Ticket) => {
    const updated = [newTicket, ...tickets];
    setTickets(updated);
    StorageService.saveTickets(updated);
    CloudDbService.saveTicket(newTicket);

    // Open thermal print modal for new entry ticket
    setThermalTicket(newTicket);
    setThermalMode('entry');
    setIsThermalModalOpen(true);
    showToast(`Ticket ${newTicket.ticketNumber} emitido com sucesso!`);
  };

  // Process Exit & Payment
  const handleProcessExit = (
    updatedTicket: Ticket,
    paymentMethod: PaymentMethod,
    amountTendered?: number,
    changeGiven?: number
  ) => {
    const closedTicket: Ticket = {
      ...updatedTicket,
      status: 'pago_liberado',
      paymentMethod,
      amountTendered,
      changeGiven,
      operatorId: activeOperator.id,
      operatorName: activeOperator.name,
      shiftType: activeShift.shiftType,
    };

    const updated = tickets.map((t) =>
      t.id === closedTicket.id ? closedTicket : t
    );
    setTickets(updated);
    StorageService.saveTickets(updated);
    CloudDbService.saveTicket(closedTicket);

    // Open receipt modal
    setThermalTicket(closedTicket);
    setThermalMode('exit');
    setIsThermalModalOpen(true);
    showToast(`Cancela liberada para placa ${closedTicket.plate}!`);
  };

  // Resolve Exception (Lost Ticket)
  const handleResolveException = (
    resolvedTicket: Ticket,
    paymentMethod: PaymentMethod
  ) => {
    let updated: Ticket[];
    const exists = tickets.some((t) => t.id === resolvedTicket.id);

    if (exists) {
      updated = tickets.map((t) =>
        t.id === resolvedTicket.id ? resolvedTicket : t
      );
    } else {
      updated = [resolvedTicket, ...tickets];
    }

    setTickets(updated);
    StorageService.saveTickets(updated);
    CloudDbService.saveTicket(resolvedTicket);

    setThermalTicket(resolvedTicket);
    setThermalMode('exit');
    setIsThermalModalOpen(true);
    showToast('Extravio regularizado e cancela liberada!');
  };

  // Switch Operator / Handover Shift
  const handleSwitchOperator = (
    newOp: Operator,
    newShiftType: ShiftType,
    initialFund: number
  ) => {
    // Always resolve the freshest operator object by ID from latest storage & list
    const latestList = StorageService.getOperators();
    const freshOp =
      latestList.find((o) => o.id === newOp.id) ||
      operatorsList.find((o) => o.id === newOp.id) ||
      newOp;

    setActiveOperator(freshOp);
    StorageService.setActiveOperator(freshOp);

    const newShift: ActiveShift = {
      id: `shift-${Date.now()}`,
      operator: freshOp,
      shiftType: newShiftType,
      openedAt: new Date().toISOString(),
      initialFund,
      isClosed: false,
      bleedings: [],
      supplies: [],
    };

    setActiveShift(newShift);
    StorageService.saveActiveShift(newShift);
    // Persist only the shift change, do not overwrite the operator record
    CloudDbService.saveShift(newShift);
    showToast(`Turno assumido por ${freshOp.name} (${newShiftType.toUpperCase()})`);
  };

  // Add Operator (Create)
  const handleAddOperator = (newOpData: Omit<Operator, 'id'>) => {
    const newOp: Operator = {
      ...newOpData,
      id: `op-${Date.now()}`,
      cpf: newOpData.cpf?.trim() || 'Não informado',
      phone: newOpData.phone?.trim() || '',
    };
    setOperatorsList((prev) => {
      const updated = [...prev, newOp];
      StorageService.saveOperators(updated);
      return updated;
    });
    CloudDbService.saveOperator(newOp);
    showToast(`Operador ${newOp.name} cadastrado com sucesso!`);
  };

  // Update Operator (Update/Edit)
  const handleUpdateOperator = (updatedOp: Operator) => {
    const cleanOp: Operator = {
      ...updatedOp,
      cpf: updatedOp.cpf?.trim() || 'Não informado',
      phone: updatedOp.phone?.trim() || '',
      role: updatedOp.role || 'operador',
      avatarColor: updatedOp.avatarColor || '#0f4c81',
    };

    setOperatorsList((prev) => {
      const updated = prev.map((o) => (o.id === cleanOp.id ? cleanOp : o));
      StorageService.saveOperators(updated);
      return updated;
    });
    CloudDbService.saveOperator(cleanOp);

    // If updating the currently logged in operator in shift, keep session synced immediately
    setActiveOperator((currActive) => {
      if (currActive.id === cleanOp.id) {
        StorageService.setActiveOperator(cleanOp);
        return cleanOp;
      }
      return currActive;
    });

    setActiveShift((currShift) => {
      if (currShift.operator.id === cleanOp.id) {
        const updatedShift: ActiveShift = {
          ...currShift,
          operator: cleanOp,
        };
        StorageService.saveActiveShift(updatedShift);
        CloudDbService.saveShift(updatedShift);
        return updatedShift;
      }
      return currShift;
    });

    showToast(`Dados de ${cleanOp.name} atualizados com sucesso!`);
  };

  // Delete Operator (Delete)
  const handleDeleteOperator = (operatorId: string) => {
    if (activeOperator.id === operatorId) {
      showToast('Aviso: Não é permitido excluir o operador com turno aberto ativo!');
      return;
    }
    const target = operatorsList.find((o) => o.id === operatorId);
    setOperatorsList((prev) => {
      const updated = prev.filter((o) => o.id !== operatorId);
      StorageService.saveOperators(updated);
      return updated;
    });
    CloudDbService.deleteOperator(operatorId);
    showToast(`Operador ${target?.name || ''} excluído com sucesso!`);
  };

  // Quick switch from CRUD modal
  const handleSwitchToOperatorFromCrud = (targetOp: Operator) => {
    setIsOperatorCrudModalOpen(false);
    handleSwitchOperator(targetOp, activeShift.shiftType, activeShift.initialFund);
  };

  // Add Bleeding (Sangria)
  const handleAddBleeding = (bleeding: Bleeding) => {
    const updatedShift: ActiveShift = {
      ...activeShift,
      bleedings: [bleeding, ...activeShift.bleedings],
    };
    setActiveShift(updatedShift);
    StorageService.saveActiveShift(updatedShift);
    CloudDbService.saveShift(updatedShift);
    showToast(`Sangria de R$ ${bleeding.amount.toFixed(2)} registrada!`);
  };

  // Add Supply (Suprimento)
  const handleAddSupply = (supply: Supply) => {
    const updatedShift: ActiveShift = {
      ...activeShift,
      supplies: [supply, ...activeShift.supplies],
    };
    setActiveShift(updatedShift);
    StorageService.saveActiveShift(updatedShift);
    CloudDbService.saveShift(updatedShift);
    showToast(`Suprimento de R$ ${supply.amount.toFixed(2)} registrado!`);
  };

  // Finish Shift
  const handleFinishShift = (countedCash: number, notes: string) => {
    const updatedShift: ActiveShift = {
      ...activeShift,
      isClosed: true,
      closedAt: new Date().toISOString(),
    };
    setActiveShift(updatedShift);
    StorageService.saveActiveShift(updatedShift);
    CloudDbService.saveShift(updatedShift);
    showToast('Turno finalizado com sucesso! Relatório gerado.');
  };

  // Update Monthly Customers
  const handleUpdateMonthlyCustomers = (updated: MonthlyCustomer[]) => {
    setMonthlyCustomers(updated);
    StorageService.saveMonthlyCustomers(updated);
    updated.forEach((c) => CloudDbService.saveMonthlyCustomer(c));
  };

  // Update Settings
  const handleSaveSettings = (
    newPricing: PricingSettings,
    newCapacity: YardCapacity
  ) => {
    setPricing(newPricing);
    setCapacity(newCapacity);
    StorageService.savePricing(newPricing);
    StorageService.saveCapacity(newCapacity);
    CloudDbService.savePricing(newPricing);
    CloudDbService.saveCapacity(newCapacity);
    showToast('Tabelas de tarifas e vagas atualizadas!');
  };

  // Reset Demo Data
  const handleResetData = () => {
    if (
      window.confirm(
        'Deseja restaurar os dados de demonstração da guarita (veículos no pátio, mensalistas e caixa)?'
      )
    ) {
      StorageService.resetAllData();
      setActiveOperator(StorageService.getActiveOperator());
      setActiveShift(StorageService.getActiveShift());
      const initialT = StorageService.getTickets();
      setTickets(initialT);
      initialT.forEach((t) => CloudDbService.saveTicket(t));
      setMonthlyCustomers(StorageService.getMonthlyCustomers());
      setPricing(StorageService.getPricing());
      setCapacity(StorageService.getCapacity());
      showToast('Dados de demonstração restaurados com sucesso!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#071324] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 sm:top-24 right-3 left-3 sm:left-auto sm:right-6 z-50 bg-emerald-700 text-white font-black text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-2xl border-2 border-emerald-400 animate-in slide-in-from-top-3 text-center sm:text-left max-w-md ml-auto">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <Header
        activeOperator={activeOperator}
        activeShift={activeShift}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenOperatorCrudModal={() => setIsOperatorCrudModalOpen(true)}
        onOpenExceptionsModal={() => {
          setExceptionsPlate(undefined);
          setIsExceptionsModalOpen(true);
        }}
        onOpenMonthlyModal={() => setCurrentTab('mensalistas')}
        onResetData={handleResetData}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        parkedCount={parkedTickets.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Live Space Occupancy Bar */}
        <OccupancyBar parkedTickets={parkedTickets} capacity={capacity} />

        {/* Tab 1: Guarita / Entrada */}
        {currentTab === 'guarita' && (
          <GuaritaEntry
            activeOperator={activeOperator}
            activeShift={activeShift}
            parkedTickets={parkedTickets}
            monthlyCustomers={monthlyCustomers}
            capacity={capacity}
            onRegisterEntry={handleRegisterEntry}
            onOpenMonthlyModal={() => setCurrentTab('mensalistas')}
          />
        )}

        {/* Tab 2: Saída & Cobrança */}
        {currentTab === 'saida' && (
          <ExitCheckout
            activeOperator={activeOperator}
            activeShift={activeShift}
            pricing={pricing}
            parkedTickets={parkedTickets}
            initialSelectedTicket={preselectedExitTicket}
            onProcessExit={handleProcessExit}
            onOpenExceptionsModal={(plate) => {
              setExceptionsPlate(plate);
              setIsExceptionsModalOpen(true);
            }}
          />
        )}

        {/* Tab 3: Pátio / Veículos Presentes */}
        {currentTab === 'patio' && (
          <YardOverview
            parkedTickets={parkedTickets}
            pricing={pricing}
            onSelectForExit={(ticket) => {
              setPreselectedExitTicket(ticket);
              setCurrentTab('saida');
            }}
            onOpenExceptionsModal={(plate) => {
              setExceptionsPlate(plate);
              setIsExceptionsModalOpen(true);
            }}
          />
        )}

        {/* Tab 4: Mensalistas */}
        {currentTab === 'mensalistas' && (
          <MonthlyCustomers
            customers={monthlyCustomers}
            onUpdateCustomers={handleUpdateMonthlyCustomers}
          />
        )}

        {/* Tab 5: Caixa & Auditoria */}
        {currentTab === 'caixa' && (
          <CashRegisterAudit
            activeOperator={activeOperator}
            activeShift={activeShift}
            tickets={tickets}
            onAddBleeding={handleAddBleeding}
            onAddSupply={handleAddSupply}
            onOpenShiftReport={() => setIsShiftReportModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#0a1c33] border-t-2 border-slate-300 dark:border-[#1a365d] py-3 text-center text-xs text-slate-600 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-extrabold text-slate-900 dark:text-slate-100">WePark Estacionamento</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Nuvem Conectada (Tempo Real)
            </span>
          </div>
          <span className="font-mono text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 text-center sm:text-right">
            Atendente: <strong className="text-slate-900 dark:text-slate-100">{activeOperator.name}</strong> • Vagas: {parkedTickets.length}/{capacity.carro + capacity.moto + capacity.caminhao}
          </span>
        </div>
      </footer>

      {/* Modals */}
      <TicketThermalModal
        isOpen={isThermalModalOpen}
        ticket={thermalTicket}
        mode={thermalMode}
        onClose={() => {
          setIsThermalModalOpen(false);
          setThermalTicket(null);
        }}
      />

      <ExceptionsModal
        isOpen={isExceptionsModalOpen}
        onClose={() => setIsExceptionsModalOpen(false)}
        activeOperator={activeOperator}
        activeShift={activeShift}
        pricing={pricing}
        parkedTickets={parkedTickets}
        preselectedPlate={exceptionsPlate}
        onResolveException={handleResolveException}
      />

      <OperatorAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        operatorsList={operatorsList}
        activeOperator={activeOperator}
        activeShift={activeShift}
        onSwitchOperator={handleSwitchOperator}
        onOpenCrudModal={() => setIsOperatorCrudModalOpen(true)}
        onAddOperator={handleAddOperator}
      />

      <OperatorCrudModal
        isOpen={isOperatorCrudModalOpen}
        onClose={() => setIsOperatorCrudModalOpen(false)}
        operatorsList={operatorsList}
        activeOperator={activeOperator}
        onAddOperator={handleAddOperator}
        onUpdateOperator={handleUpdateOperator}
        onDeleteOperator={handleDeleteOperator}
        onSwitchToOperator={handleSwitchToOperatorFromCrud}
      />

      <TariffSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        pricing={pricing}
        capacity={capacity}
        onSave={handleSaveSettings}
      />

      <ShiftReportModal
        isOpen={isShiftReportModalOpen}
        onClose={() => setIsShiftReportModalOpen(false)}
        activeOperator={activeOperator}
        activeShift={activeShift}
        tickets={tickets}
        onFinishShift={handleFinishShift}
      />
    </div>
  );
}
