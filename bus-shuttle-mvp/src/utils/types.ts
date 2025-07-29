// Shared Route type for use across components
export interface Route {
  id: string;
  origin: string;
  destination: string;
  stops: string[];
  departure: string; // departure location
  arrival: string;   // arrival location
  departureTime: string; // departure date/time
  arrivalTime: string;   // arrival date/time
  price: number;
  provider: string;
  vehicleType: string;
  seats: number;
  rating: number;
  cancellationPolicy: string;
  company?: { id: number; name: string };
}