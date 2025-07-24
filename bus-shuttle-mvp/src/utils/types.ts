// Shared Route type for use across components
export interface Route {
  id: string;
  origin: string;
  destination: string;
  stops: string[];
  departure: string;
  arrival: string;
  price: number;
  provider: string;
  vehicleType: string;
  rating: number;
  cancellationPolicy: string;
  company?: { id: number; name: string };
}