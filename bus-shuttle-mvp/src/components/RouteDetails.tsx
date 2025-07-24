import React from 'react';

interface Route {
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
}

interface RouteDetailsProps {
  route: Route;
  onBook: (route: Route) => void;
}

const RouteDetails: React.FC<RouteDetailsProps> = ({ route, onBook }) => (
  <div style={{ border: '1px solid #888', padding: 16, margin: 8 }}>
    <h2>{route.origin} → {route.destination}</h2>
    <p><strong>Departure:</strong> {new Date(route.departure).toLocaleString()}</p>
    <p><strong>Arrival:</strong> {new Date(route.arrival).toLocaleString()}</p>
    <p><strong>Stops:</strong> {Array.isArray(route.stops) ? route.stops.join(', ') : 'N/A'}</p>
    <p><strong>Provider:</strong> {route.provider}</p>
    <p><strong>Vehicle Type:</strong> {route.vehicleType}</p>
    <p><strong>Rating:</strong> {route.rating}</p>
    <p><strong>Cancellation Policy:</strong> {route.cancellationPolicy}</p>
    <p><strong>Price:</strong> €{route.price}</p>
    <button onClick={() => onBook(route)}>Book This Trip</button>
  </div>
);

export default RouteDetails;
