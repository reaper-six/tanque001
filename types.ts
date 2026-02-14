
export enum TankStatus {
  NORMAL = 'Normal',
  LOW = 'Baixo',
  CRITICAL = 'Crítico',
  REFILLING = 'Reabastecendo'
}

export interface Reading {
  timestamp: string;
  level: number;
  temperature: number;
}

export interface TankDimensions {
  radius: number;
  length: number;
  offset?: number;
}

export interface AutoOrderConfig {
  enabled: boolean;
  supplierName: string;
  supplierPhone: string;
  supplierEmail: string;
  targetVolume: number;
}

export interface PendingOrder {
  id: string;
  supplier: string;
  volume: number;
  timestamp: string;
}

export interface RefillEvent {
  id: string;
  firebaseId?: string; // ID do banco de dados para atualizações
  timestamp: string;
  volumeBefore: number;
  volumeAfter: number;
  amount: number;
  confirmedSupplier: boolean | null; // null = aguardando, true = empresa cadastrada, false = outro
  supplierName?: string;
}

export interface Tank {
  id: string;
  name: string;
  location: string;
  capacity: number;
  nominalCapacity?: number; // Volume Nominal declarado manualmente
  currentLevel: number;
  currentHeight: number;
  dimensions: TankDimensions;
  minThreshold: number;
  enableRefillAlerts: boolean;
  lastRefill: string;
  status: TankStatus;
  notificationEmails: string[];
  enableEmailAlerts?: boolean;
  history: Reading[]; 
  autoOrder?: AutoOrderConfig;
  pendingOrder?: PendingOrder | null;
  lastRefillEvent?: RefillEvent | null;
}

export interface AppNotification {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  message: string;
  read: boolean;
  emailTargets?: string[] | null;
  details?: {
    level: number;
    capacity: number;
    temperature: number;
    previousLevel?: number;
  };
}

export interface User {
  username: string;
  name: string;
  status: '01' | '02' | '03'; 
}

export interface AiReport {
  id: string;
  timestamp: string;
  content: string;
  tankId: string;
}

export type ViewState = 'dashboard' | 'analytics' | 'reports' | 'settings' | 'admin';
