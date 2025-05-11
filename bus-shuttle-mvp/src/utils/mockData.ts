// Mock data for routes, bookings, and providers
export const routes = [
  {
    id: '1',
    origin: 'Bucharest',
    destination: 'Vienna',
    stops: ['Sibiu', 'Budapest'],
    departure: '2025-05-10T08:00:00Z',
    arrival: '2025-05-10T20:00:00Z',
    price: 60,
    provider: 'TransEuro',
    vehicleType: 'Bus',
    rating: 4.5,
    cancellationPolicy: 'Free cancellation up to 24h before departure',
  },
  {
    id: '2',
    origin: 'Cluj-Napoca',
    destination: 'Munich',
    stops: ['Oradea', 'Vienna'],
    departure: '2025-05-11T09:00:00Z',
    arrival: '2025-05-11T21:00:00Z',
    price: 75,
    provider: 'EuroShuttle',
    vehicleType: 'Shuttle',
    rating: 4.2,
    cancellationPolicy: 'Non-refundable',
  },
];

export const bookings = [
  // Example booking objects can be added here
];

export const providers = [
  { id: 'p1', name: 'TransEuro', rating: 4.5 },
  { id: 'p2', name: 'EuroShuttle', rating: 4.2 },
];
