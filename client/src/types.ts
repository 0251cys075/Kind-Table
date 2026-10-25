export type FoodCategory =
  | 'Cooked meal'
  | 'Bakery'
  | 'Fruit and vegetables'
  | 'Packaged food'
  | 'Dairy';

export type BatchStatus = 'Available' | 'Claimed' | 'Expired';

export interface FoodBatch {
  id: string;
  donor: string;
  category: FoodCategory;
  quantity: number;
  location: string;
  expiryTime: string;
  status: BatchStatus;
  claimedBy: string | null;
  claimedAt: string | null;
  createdAt: string;
  isDemo?: boolean;
  latitude?: number;
  longitude?: number;
  distanceKm?: number | null;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'donor' | 'ngo' | 'admin';
  phone?: string;
  organization?: string;
  defaultLocation?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  action: 'DONATED' | 'CLAIMED' | 'EXPIRED' | 'RESTORED' | 'CLEARED';
  batch_id?: string;
  batchId?: string;
  actor: string;
  details: string;
  raw_line?: string;
  rawLine?: string;
}

export interface SystemStats {
  availableBatches: number;
  availablePortions: number;
  claimedBatches: number;
  portionsRescued: number;
  expiredBatches: number;
  totalBatches: number;
}

export interface SystemGuarantee {
  healthy: boolean;
  title: string;
  status: string;
  description: string;
}

export interface HealthResponse {
  status: string;
  guarantees: {
    safeClaims: SystemGuarantee;
    permanentRecord: SystemGuarantee;
    instantAlerts: SystemGuarantee;
    expiryJob: SystemGuarantee;
  };
}
