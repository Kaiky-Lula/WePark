/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VehicleType = 'carro' | 'moto' | 'caminhao';

export type ShiftType = 'manha' | 'tarde' | 'noite' | 'madrugada';

export type PaymentMethod =
  | 'dinheiro'
  | 'pix'
  | 'cartao_debito'
  | 'cartao_credito'
  | 'isento_tolerancia'
  | 'mensalista';

export type TicketStatus =
  | 'patio'
  | 'pago_liberado'
  | 'cancelado'
  | 'perda_regularizada';

export type OperatorRole = 'operador' | 'supervisor' | 'gerente';

export interface Operator {
  id: string;
  name: string;
  matricula: string;
  cpf: string;
  avatarColor: string;
  role?: OperatorRole;
  phone?: string;
  createdAt?: string;
}

export interface ActiveShift {
  id: string;
  operator: Operator;
  shiftType: ShiftType;
  openedAt: string; // ISO string
  initialFund: number; // Fundo de troco inicial
  isClosed: boolean;
  closedAt?: string;
  bleedings: Bleeding[];
  supplies: Supply[];
}

export interface Bleeding {
  id: string;
  timestamp: string;
  amount: number;
  reason: string;
  supervisorName: string;
}

export interface Supply {
  id: string;
  timestamp: string;
  amount: number;
  reason: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  plate: string;
  vehicleType: VehicleType;
  modelDescription?: string;
  color?: string;
  entryTime: string; // ISO string
  exitTime?: string;
  durationMinutes?: number;
  isOvernight?: boolean;
  regularPrice: number;
  administrativeFee: number;
  totalPaid: number;
  paymentMethod?: PaymentMethod;
  amountTendered?: number;
  changeGiven?: number;
  operatorId: string;
  operatorName: string;
  shiftType: ShiftType;
  status: TicketStatus;
  isMonthly?: boolean;
  monthlyCustomerId?: string;
  isLostTicketException?: boolean;
  driverDoc?: string;
  driverName?: string;
  exceptionNotes?: string;
}

export type MonthlyStatus = 'ativo' | 'inadimplente' | 'bloqueado';

export interface MonthlyCustomer {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email?: string;
  plates: string[]; // Plates linked to this subscription
  vehicleType: VehicleType;
  planName: string; // Ex: '24 Horas Integral', 'Comercial 07h-19h'
  monthlyFee: number;
  dueDay: number; // Dia do vencimento (1 a 31)
  status: MonthlyStatus;
  lastPaymentDate: string;
  notes?: string;
}

export interface VehicleRate {
  firstHour: number;
  fraction15m: number;
  dailyMax: number;
  overnight: number;
}

export interface PricingSettings {
  toleranceMinutes: number; // Padrão 15 min
  lostTicketFee: number; // Taxa administrativa padrão por perda de ticket (ex: R$ 30,00)
  rates: {
    carro: VehicleRate;
    moto: VehicleRate;
    caminhao: VehicleRate;
  };
}

export interface YardCapacity {
  carro: number;
  moto: number;
  caminhao: number;
}
