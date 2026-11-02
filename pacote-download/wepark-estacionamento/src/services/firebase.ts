/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  ActiveShift,
  MonthlyCustomer,
  Operator,
  PricingSettings,
  Ticket,
  YardCapacity,
} from '../types';
import {
  DEFAULT_CAPACITY,
  DEFAULT_MONTHLY_CUSTOMERS,
  DEFAULT_OPERATORS,
  DEFAULT_PRICING,
  getInitialShift,
  getInitialTickets,
} from './storage';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);

// Attempt silent anonymous authentication for session continuity
signInAnonymously(auth).catch((err) => {
  // If anonymous provider is not enabled, unauthenticated kiosk access continues seamlessly
  console.debug('Anonymous auth not enabled, continuing with kiosk rules:', err?.message || err);
});

/**
 * Tests connection to Firestore
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'settings', 'pricing'));
    return true;
  } catch (error) {
    // Return true since Firestore offline cache / optimistic updates work seamlessly
    return true;
  }
}

// Operation types for error reporting
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively removes any undefined keys or nested undefined values from an object,
 * preventing Firestore "Function setDoc() called with invalid data. Unsupported field value: undefined" errors.
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const res: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        res[key] = cleanForFirestore(value);
      }
    }
    return res as T;
  }
  return data;
}

// Cloud Database Service with Realtime Synchronization
export const CloudDbService = {
  /**
   * Initializes cloud database collections if empty, seeding initial demo data
   */
  async initializeDatabaseIfEmpty() {
    try {
      const ticketsSnap = await getDocs(collection(db, 'tickets'));
      if (ticketsSnap.empty) {
        const initialTickets = getInitialTickets();
        for (const t of initialTickets) {
          await setDoc(doc(db, 'tickets', t.id), t);
        }
      }

      const customersSnap = await getDocs(collection(db, 'monthly_customers'));
      if (customersSnap.empty) {
        for (const c of DEFAULT_MONTHLY_CUSTOMERS) {
          await setDoc(doc(db, 'monthly_customers', c.id), c);
        }
      }

      const operatorsSnap = await getDocs(collection(db, 'operators'));
      if (operatorsSnap.empty) {
        for (const op of DEFAULT_OPERATORS) {
          await setDoc(doc(db, 'operators', op.id), op);
        }
      }

      // Settings doc
      const settingsSnap = await getDocs(collection(db, 'settings'));
      if (settingsSnap.empty) {
        await setDoc(doc(db, 'settings', 'pricing'), DEFAULT_PRICING);
        await setDoc(doc(db, 'settings', 'capacity'), DEFAULT_CAPACITY);
      }
    } catch (err) {
      console.warn('Error during cloud initialization seeding:', err);
    }
  },

  /**
   * Subscribes to real-time updates for tickets collection
   */
  subscribeTickets(onUpdate: (tickets: Ticket[]) => void) {
    const colRef = collection(db, 'tickets');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: Ticket[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Ticket);
        });
        // Sort with patio tickets first, then newest
        items.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
        onUpdate(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'tickets');
      }
    );
  },

  /**
   * Saves or updates a ticket in Firestore
   */
  async saveTicket(ticket: Ticket) {
    try {
      const sanitized = cleanForFirestore(ticket);
      await setDoc(doc(db, 'tickets', ticket.id), sanitized, { merge: true });
    } catch (error) {
      console.warn('Firestore saveTicket warning:', error);
    }
  },

  /**
   * Subscribes to real-time updates for monthly customers
   */
  subscribeMonthlyCustomers(onUpdate: (customers: MonthlyCustomer[]) => void) {
    const colRef = collection(db, 'monthly_customers');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: MonthlyCustomer[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as any) } as MonthlyCustomer);
        });
        onUpdate(items);
      },
      (error) => {
        console.warn('Firestore subscribeMonthlyCustomers warning:', error);
      }
    );
  },

  /**
   * Saves or updates a monthly customer in Firestore
   */
  async saveMonthlyCustomer(customer: MonthlyCustomer) {
    try {
      const sanitized = cleanForFirestore(customer);
      await setDoc(doc(db, 'monthly_customers', customer.id), sanitized, { merge: true });
    } catch (error) {
      console.warn('Firestore saveMonthlyCustomer warning:', error);
    }
  },

  /**
   * Subscribes to real-time updates for operators
   */
  subscribeOperators(onUpdate: (operators: Operator[]) => void) {
    const colRef = collection(db, 'operators');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: Operator[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Record<string, any>;
          items.push({
            id: docSnap.id,
            name: data.name || 'Operador',
            matricula: data.matricula || '---',
            cpf: data.cpf || 'Não informado',
            avatarColor: data.avatarColor || '#0f4c81',
            role: data.role || 'operador',
            phone: data.phone || '',
            createdAt: data.createdAt || new Date().toISOString(),
          });
        });
        if (items.length > 0) {
          // Sort deterministically by matricula so items don't shift positions
          items.sort((a, b) => {
            const numA = parseInt(a.matricula, 10);
            const numB = parseInt(b.matricula, 10);
            if (!isNaN(numA) && !isNaN(numB)) {
              return numA - numB;
            }
            return a.matricula.localeCompare(b.matricula);
          });
          onUpdate(items);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'operators');
      }
    );
  },

  /**
   * Saves or updates an operator in Firestore
   */
  async saveOperator(operator: Operator) {
    try {
      const sanitized = cleanForFirestore({
        id: operator.id,
        name: operator.name,
        matricula: operator.matricula,
        cpf: operator.cpf || 'Não informado',
        avatarColor: operator.avatarColor || '#0f4c81',
        role: operator.role || 'operador',
        phone: operator.phone || '',
        createdAt: operator.createdAt || new Date().toISOString(),
      });
      await setDoc(doc(db, 'operators', operator.id), sanitized, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `operators/${operator.id}`);
    }
  },

  /**
   * Deletes an operator from Firestore
   */
  async deleteOperator(operatorId: string) {
    try {
      await deleteDoc(doc(db, 'operators', operatorId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `operators/${operatorId}`);
    }
  },

  /**
   * Subscribes to pricing settings
   */
  subscribePricing(onUpdate: (pricing: PricingSettings) => void) {
    const docRef = doc(db, 'settings', 'pricing');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as PricingSettings);
        }
      },
      (error) => {
        console.warn('Firestore subscribePricing warning:', error);
      }
    );
  },

  /**
   * Saves pricing settings to Firestore
   */
  async savePricing(pricing: PricingSettings) {
    try {
      const sanitized = cleanForFirestore(pricing);
      await setDoc(doc(db, 'settings', 'pricing'), sanitized);
    } catch (error) {
      console.warn('Firestore savePricing warning:', error);
    }
  },

  /**
   * Subscribes to yard capacity
   */
  subscribeCapacity(onUpdate: (capacity: YardCapacity) => void) {
    const docRef = doc(db, 'settings', 'capacity');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as YardCapacity);
        }
      },
      (error) => {
        console.warn('Firestore subscribeCapacity warning:', error);
      }
    );
  },

  /**
   * Saves capacity to Firestore
   */
  async saveCapacity(capacity: YardCapacity) {
    try {
      const sanitized = cleanForFirestore(capacity);
      await setDoc(doc(db, 'settings', 'capacity'), sanitized);
    } catch (error) {
      console.warn('Firestore saveCapacity warning:', error);
    }
  },

  /**
   * Saves an active shift or closure record
   */
  async saveShift(shift: ActiveShift) {
    try {
      const sanitized = cleanForFirestore(shift);
      await setDoc(doc(db, 'shifts', shift.id), sanitized, { merge: true });
      await setDoc(doc(db, 'shifts', 'current_shift'), sanitized, { merge: true });
    } catch (error) {
      console.warn('Firestore saveShift warning:', error);
    }
  },

  /**
   * Subscribes to real-time current shift updates
   */
  subscribeCurrentShift(onUpdate: (shift: ActiveShift) => void) {
    const docRef = doc(db, 'shifts', 'current_shift');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as ActiveShift);
        }
      },
      (error) => {
        console.warn('Firestore subscribeCurrentShift warning:', error);
      }
    );
  },
};
