export type Screen = 'welcome' | 'explore' | 'line-details' | 'louage' | 'tickets' | 'driver-dashboard' | 'create-trip';

export interface Stop {
  id: string;
  name: string;
  time: string;
  description: string;
  status?: 'departed' | 'current' | 'upcoming';
  isNow?: boolean;
}

export interface Driver {
  id: string;
  name: string;
  avatar: string;
  vehicle: string;
  departs: string;
  price: string;
  availability: number;
  maxSeats: number;
  rating?: string;
  reviews?: string;
  isPro?: boolean;
}

export interface Booking {
  id: string;
  passengerName: string;
  passengerAvatar: string;
  seat: string;
  trip: string;
  time: string;
  status: 'confirmed' | 'pending';
}
