/** Official SPP data model: owner → property → unit → tenant → contract → payments → maintenance → technician → documents → wallet */

export type PropertyType = 'residential' | 'commercial' | 'mixed' | 'land' | 'other';
export type UnitType = 'apartment' | 'shop' | 'office' | 'warehouse' | 'villa' | 'room' | 'other';
export type UnitStatus = 'occupied' | 'vacant' | 'reserved' | 'maintenance';
export type RentPeriod = 'monthly' | 'semi_annual' | 'annual';
export type PaymentMethod = 'transfer' | 'cash' | 'platform';
export type ServiceResponsibility = 'tenant' | 'owner' | 'included';
export type GasType = 'central' | 'independent';
export type MaintenanceResponsibility = 'owner' | 'tenant' | 'contract';

export type PropertyRecord = {
  id: string;
  name: string;
  type: PropertyType;
  city: string;
  district: string;
  buildingCount: number;
  unitCount: number;
  createdAt: string;
};

export type UnitRecord = {
  id: string;
  propertyId: string;
  number: string;
  type: UnitType;
  rooms?: number;
  livingRooms?: number;
  bathrooms?: number;
  kitchen?: boolean;
  balcony?: boolean;
  area?: number;
  floor?: number;
  parking?: boolean;
  elevator?: boolean;
  furnished?: boolean;
  status: UnitStatus;
  rentAmount: number;
  rentPeriod: RentPeriod;
  paymentMethod: PaymentMethod;
  paymentDueDay: number;
  electricity: ServiceResponsibility;
  electricityMeter?: string;
  water: ServiceResponsibility;
  waterMeter?: string;
  internet: 'tenant' | 'included';
  gas: GasType;
  maintenanceBy: MaintenanceResponsibility;
  hasInsurance: boolean;
  insuranceAmount?: number;
  notes?: string;
};

export type TenantRecord = {
  id: string;
  name: string;
  phone: string;
  email: string;
  nationalId?: string;
  unitId: string;
  moveInDate: string;
  portalToken: string;
  portalUrl: string;
  qrData: string;
  whatsAppMessage: string;
};

export type ContractRecord = {
  id: string;
  number: string;
  tenantId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  paymentType: RentPeriod;
  depositAmount: number;
  specialTerms?: string;
};

export type SetupPhaseId =
  | 'property'
  | 'units'
  | 'tenants'
  | 'contracts'
  | 'alerts'
  | 'smartEmployee';

export type PropertyOSState = {
  property: PropertyRecord | null;
  units: UnitRecord[];
  tenants: TenantRecord[];
  contracts: ContractRecord[];
  alertsEnabled: boolean;
  technicianPortalToken: string;
  dismissedProgress: boolean;
  startedAt?: string;
};

export type SetupPhaseProgress = {
  id: SetupPhaseId;
  percent: number;
  complete: boolean;
  current: boolean;
};
