// This file re-exports types that were previously in the shared folder
// These are temporary placeholder types to fix build errors

export interface Provider {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: string;
  active: boolean;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  providerId: string;
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
}

export interface Appointment {
  id: string;
  date: string;
  clientId: string;
  serviceId: string;
  providerId: string;
  status: string;
  paymentStatus?: string;
  cancellationReason?: string;
}

export interface EnrichedAppointment extends Appointment {
  client?: Client;
  service?: Service;
  provider?: Provider;
  date: string;
  status: string;
  id: string;
}

export interface TimeExclusion {
  id: string;
  providerId: string;
  startDate: string;
  endDate: string;
  title: string;
  allDay: boolean;
  recurring: boolean;
  recurringPattern?: string;
}
