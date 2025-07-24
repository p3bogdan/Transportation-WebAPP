// Mock data for routes, bookings, and providers
// Exporting an array of route objects, each representing a transportation route
export const routes = [
  {
    id: '1', // Unique identifier for the route
    origin: 'Bucharest', // Starting city
    destination: 'Vienna', // Ending city
    stops: ['Sibiu', 'Budapest'], // Intermediate stops
    departure: '2025-05-10T08:00:00Z', // Departure time (ISO format)
    arrival: '2025-05-10T20:00:00Z', // Arrival time (ISO format)
    price: 60, // Ticket price in EUR
    provider: 'TransEuro', // Transportation provider name
    vehicleType: 'Bus', // Type of vehicle
    rating: 4.5, // Provider or route rating
    cancellationPolicy: 'Free cancellation up to 24h before departure', // Cancellation policy description
  },
  {
    id: '2', // Unique identifier for the route
    origin: 'Cluj-Napoca', // Starting city
    destination: 'Munich', // Ending city
    stops: ['Oradea', 'Vienna'], // Intermediate stops
    departure: '2025-05-11T09:00:00Z', // Departure time (ISO format)
    arrival: '2025-05-11T21:00:00Z', // Arrival time (ISO format)
    price: 75, // Ticket price in EUR
    provider: 'EuroShuttle', // Transportation provider name
    vehicleType: 'Shuttle', // Type of vehicle
    rating: 4.2, // Provider or route rating
    cancellationPolicy: 'Non-refundable', // Cancellation policy description
  },
];

// Exporting an array for bookings (currently empty, can be populated with booking objects)
export const bookings = [
  // Example booking objects can be added here
];

// Exporting an array of provider objects, each representing a transportation provider
export const providers = [
  { id: 'p1', name: 'TransEuro', rating: 4.5 }, // Provider 1
  { id: 'p2', name: 'EuroShuttle', rating: 4.2 }, // Provider 2
];
