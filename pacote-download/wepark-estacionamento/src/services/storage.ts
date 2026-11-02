/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActiveShift,
  MonthlyCustomer,
  Operator,
  PricingSettings,
  Ticket,
  YardCapacity,
} from '../types';

const STORAGE_KEYS = {
  OPERATOR: 'wepark_active_operator',
  SHIFT: 'wepark_active_shift',
  TICKETS: 'wepark_tickets_list',
  MONTHLY: 'wepark_monthly_customers',
  PRICING: 'wepark_pricing_settings',
  CAPACITY: 'wepark_yard_capacity',
  OPERATORS_LIST: 'wepark_operators_list',
};

export const DEFAULT_OPERATORS: Operator[] = [
  {
    id: 'op-1',
    name: 'Carlos Alberto Silva',
    matricula: '1042',
    cpf: '123.456.789-00',
    avatarColor: '#0f4c81',
    role: 'operador',
    phone: '(11) 98765-4321',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'op-2',
    name: 'Mariana Souza Costa',
    matricula: '1055',
    cpf: '987.654.321-11',
    avatarColor: '#0f4c81',
    role: 'supervisor',
    phone: '(11) 97654-3210',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'op-3',
    name: 'Lucas Ferreira Lima',
    matricula: '1089',
    cpf: '456.789.123-22',
    avatarColor: '#10b981',
    role: 'operador',
    phone: '(11) 96543-2109',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const DEFAULT_PRICING: PricingSettings = {
  toleranceMinutes: 15,
  lostTicketFee: 30.0,
  rates: {
    carro: {
      firstHour: 12.0,
      fraction15m: 3.0,
      dailyMax: 60.0,
      overnight: 75.0,
    },
    moto: {
      firstHour: 7.0,
      fraction15m: 2.0,
      dailyMax: 35.0,
      overnight: 45.0,
    },
    caminhao: {
      firstHour: 20.0,
      fraction15m: 5.0,
      dailyMax: 100.0,
      overnight: 130.0,
    },
  },
};

export const DEFAULT_CAPACITY: YardCapacity = {
  carro: 60,
  moto: 25,
  caminhao: 8,
};

export const DEFAULT_MONTHLY_CUSTOMERS: MonthlyCustomer[] = [
  {
    id: 'm-1',
    name: 'Dra. Juliana Prado',
    cpf: '345.678.901-22',
    phone: '(11) 98765-4321',
    email: 'juliana.prado@email.com',
    plates: ['BRA2E19'],
    vehicleType: 'carro',
    planName: '24 Horas Integral',
    monthlyFee: 280.0,
    dueDay: 10,
    status: 'ativo',
    lastPaymentDate: new Date().toISOString().substring(0, 10),
    notes: 'Vaga prioritária próxima ao elevador',
  },
  {
    id: 'm-2',
    name: 'Roberto Martins',
    cpf: '789.012.345-66',
    phone: '(11) 97654-3210',
    email: 'roberto.martins@email.com',
    plates: ['RIO4A20'],
    vehicleType: 'carro',
    planName: 'Comercial (07h às 19h)',
    monthlyFee: 230.0,
    dueDay: 5,
    status: 'inadimplente', // Inadimplente propositalmente para demonstrar o bloqueio na guarita
    lastPaymentDate: new Date(Date.now() - 40 * 86400000).toISOString().substring(0, 10),
    notes: 'Atrasado há 12 dias. Sistema configurado para barrar acesso.',
  },
  {
    id: 'm-3',
    name: 'Marcos Vinicius Ribeiro',
    cpf: '234.567.890-44',
    phone: '(11) 99123-4567',
    email: 'marcos.v@email.com',
    plates: ['MOT7X89'],
    vehicleType: 'moto',
    planName: 'Mensal Moto Livre',
    monthlyFee: 140.0,
    dueDay: 15,
    status: 'ativo',
    lastPaymentDate: new Date().toISOString().substring(0, 10),
    notes: 'Mensalista moto área coberta',
  },
  {
    id: 'm-4',
    name: 'Transportes Ramos & Filhos',
    cpf: '567.890.123-88',
    phone: '(11) 98222-1133',
    email: 'contato@ramoslog.com.br',
    plates: ['TRU9K33'],
    vehicleType: 'caminhao',
    planName: 'Pernoite Logístico',
    monthlyFee: 450.0,
    dueDay: 20,
    status: 'ativo',
    lastPaymentDate: new Date().toISOString().substring(0, 10),
    notes: 'Carga pesada / baú',
  },
];

export function getInitialTickets(): Ticket[] {
  const now = Date.now();
  return [
    {
      id: 't-1001',
      ticketNumber: 'WP-8921',
      plate: 'ABC1D23',
      vehicleType: 'carro',
      modelDescription: 'Corolla Branco',
      entryTime: new Date(now - 8 * 60 * 1000).toISOString(), // 8 minutos atrás (Tolerância!)
      regularPrice: 0,
      administrativeFee: 0,
      totalPaid: 0,
      operatorId: 'op-1',
      operatorName: 'Carlos Alberto Silva',
      shiftType: 'tarde',
      status: 'patio',
    },
    {
      id: 't-1002',
      ticketNumber: 'WP-8922',
      plate: 'KMT3921',
      vehicleType: 'moto',
      modelDescription: 'Honda CG 160 Preta',
      entryTime: new Date(now - 52 * 60 * 1000).toISOString(), // 52 min atrás (1ª hora)
      regularPrice: 0,
      administrativeFee: 0,
      totalPaid: 0,
      operatorId: 'op-1',
      operatorName: 'Carlos Alberto Silva',
      shiftType: 'tarde',
      status: 'patio',
    },
    {
      id: 't-1003',
      ticketNumber: 'WP-8923',
      plate: 'XYZ9A88',
      vehicleType: 'carro',
      modelDescription: 'Jeep Compass Prata',
      entryTime: new Date(now - 145 * 60 * 1000).toISOString(), // 2h25m atrás
      regularPrice: 0,
      administrativeFee: 0,
      totalPaid: 0,
      operatorId: 'op-1',
      operatorName: 'Carlos Alberto Silva',
      shiftType: 'tarde',
      status: 'patio',
    },
    {
      id: 't-1004',
      ticketNumber: 'WP-8919',
      plate: 'ONL4B55',
      vehicleType: 'caminhao',
      modelDescription: 'Mercedes Sprinter Furgão',
      entryTime: new Date(now - 18 * 3600 * 1000).toISOString(), // Pernoite de ontem
      isOvernight: true,
      regularPrice: 0,
      administrativeFee: 0,
      totalPaid: 0,
      operatorId: 'op-1',
      operatorName: 'Carlos Alberto Silva',
      shiftType: 'manha',
      status: 'patio',
    },
    {
      id: 't-1005',
      ticketNumber: 'WP-8924',
      plate: 'BRA2E19',
      vehicleType: 'carro',
      modelDescription: 'BMW X1 Azul',
      entryTime: new Date(now - 45 * 60 * 1000).toISOString(),
      regularPrice: 0,
      administrativeFee: 0,
      totalPaid: 0,
      operatorId: 'op-1',
      operatorName: 'Carlos Alberto Silva',
      shiftType: 'tarde',
      status: 'patio',
      isMonthly: true,
      monthlyCustomerId: 'm-1',
    },
    {
      id: 't-1000',
      ticketNumber: 'WP-8915',
      plate: 'FGH7788',
      vehicleType: 'carro',
      modelDescription: 'VW Gol Prata',
      entryTime: new Date(now - 120 * 60 * 1000).toISOString(),
      exitTime: new Date(now - 30 * 60 * 1000).toISOString(),
      durationMinutes: 90,
      regularPrice: 18.0,
      administrativeFee: 0,
      totalPaid: 18.0,
      paymentMethod: 'pix',
      operatorId: 'op-1',
      operatorName: 'Carlos Alberto Silva',
      shiftType: 'tarde',
      status: 'pago_liberado',
    },
    {
      id: 't-0999',
      ticketNumber: 'WP-8914',
      plate: 'JKL5544',
      vehicleType: 'moto',
      entryTime: new Date(now - 180 * 60 * 1000).toISOString(),
      exitTime: new Date(now - 60 * 60 * 1000).toISOString(),
      durationMinutes: 120,
      regularPrice: 11.0,
      administrativeFee: 0,
      totalPaid: 11.0,
      paymentMethod: 'dinheiro',
      amountTendered: 20.0,
      changeGiven: 9.0,
      operatorId: 'op-1',
      operatorName: 'Carlos Alberto Silva',
      shiftType: 'tarde',
      status: 'pago_liberado',
    },
  ];
}

export function getInitialShift(): ActiveShift {
  return {
    id: `shift-${Date.now()}`,
    operator: DEFAULT_OPERATORS[0],
    shiftType: 'tarde',
    openedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // aberto há 3 horas
    initialFund: 150.0, // R$ 150,00 de fundo de troco
    isClosed: false,
    bleedings: [
      {
        id: 'b-1',
        timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
        amount: 100.0,
        reason: 'Sangria de segurança periódica para cofre',
        supervisorName: 'Roberto (Gerente)',
      },
    ],
    supplies: [],
  };
}

export const StorageService = {
  getOperators(): Operator[] {
    const raw = localStorage.getItem(STORAGE_KEYS.OPERATORS_LIST);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.OPERATORS_LIST, JSON.stringify(DEFAULT_OPERATORS));
      return DEFAULT_OPERATORS;
    }
    return JSON.parse(raw);
  },

  saveOperators(operators: Operator[]) {
    localStorage.setItem(STORAGE_KEYS.OPERATORS_LIST, JSON.stringify(operators));
  },

  deleteOperator(operatorId: string): Operator[] {
    const list = this.getOperators().filter((o) => o.id !== operatorId);
    this.saveOperators(list);
    return list;
  },

  getActiveOperator(): Operator {
    const raw = localStorage.getItem(STORAGE_KEYS.OPERATOR);
    if (!raw) {
      const def = DEFAULT_OPERATORS[0];
      localStorage.setItem(STORAGE_KEYS.OPERATOR, JSON.stringify(def));
      return def;
    }
    return JSON.parse(raw);
  },

  setActiveOperator(operator: Operator) {
    localStorage.setItem(STORAGE_KEYS.OPERATOR, JSON.stringify(operator));
  },

  getActiveShift(): ActiveShift {
    const raw = localStorage.getItem(STORAGE_KEYS.SHIFT);
    if (!raw) {
      const def = getInitialShift();
      localStorage.setItem(STORAGE_KEYS.SHIFT, JSON.stringify(def));
      return def;
    }
    return JSON.parse(raw);
  },

  saveActiveShift(shift: ActiveShift) {
    localStorage.setItem(STORAGE_KEYS.SHIFT, JSON.stringify(shift));
  },

  getTickets(): Ticket[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (!raw) {
      const def = getInitialTickets();
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(def));
      return def;
    }
    return JSON.parse(raw);
  },

  saveTickets(tickets: Ticket[]) {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  },

  getMonthlyCustomers(): MonthlyCustomer[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MONTHLY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MONTHLY, JSON.stringify(DEFAULT_MONTHLY_CUSTOMERS));
      return DEFAULT_MONTHLY_CUSTOMERS;
    }
    return JSON.parse(raw);
  },

  saveMonthlyCustomers(customers: MonthlyCustomer[]) {
    localStorage.setItem(STORAGE_KEYS.MONTHLY, JSON.stringify(customers));
  },

  getPricing(): PricingSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.PRICING);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRICING, JSON.stringify(DEFAULT_PRICING));
      return DEFAULT_PRICING;
    }
    return JSON.parse(raw);
  },

  savePricing(pricing: PricingSettings) {
    localStorage.setItem(STORAGE_KEYS.PRICING, JSON.stringify(pricing));
  },

  getCapacity(): YardCapacity {
    const raw = localStorage.getItem(STORAGE_KEYS.CAPACITY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CAPACITY, JSON.stringify(DEFAULT_CAPACITY));
      return DEFAULT_CAPACITY;
    }
    return JSON.parse(raw);
  },

  saveCapacity(capacity: YardCapacity) {
    localStorage.setItem(STORAGE_KEYS.CAPACITY, JSON.stringify(capacity));
  },

  resetAllData() {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(getInitialTickets()));
    localStorage.setItem(STORAGE_KEYS.SHIFT, JSON.stringify(getInitialShift()));
    localStorage.setItem(STORAGE_KEYS.MONTHLY, JSON.stringify(DEFAULT_MONTHLY_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.PRICING, JSON.stringify(DEFAULT_PRICING));
    localStorage.setItem(STORAGE_KEYS.CAPACITY, JSON.stringify(DEFAULT_CAPACITY));
  },
};
