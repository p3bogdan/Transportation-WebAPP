import React from 'react';
import { Route } from '../utils/types';

interface RouteListProps {
  routes: Route[];
  onSelect: (route: Route) => void;
}

const RouteList: React.FC<RouteListProps> = ({ routes, onSelect }) => (
  <div>
    {routes.length === 0 ? (
      <p>No routes found.</p>
    ) : (
      routes.map(route => (
        <div key={route.id} className="route-card">
          <h3>{route.origin} → {route.destination}</h3>
          <p><strong>Departure:</strong> {new Date(route.departure).toLocaleString()}</p>
          <p><strong>Arrival:</strong> {new Date(route.arrival).toLocaleString()}</p>
          <p><strong>Price:</strong> <span style={{ color: '#1976d2', fontWeight: 700 }}>€{route.price}</span></p>
          <p><strong>Provider:</strong> {route.provider} <span style={{ color: '#607d8b', fontSize: '0.95em' }}>({route.vehicleType})</span></p>
          <p><strong>Rating:</strong> <span style={{ color: '#ffb300' }}>★</span> {route.rating}</p>
          <button onClick={() => onSelect(route)}>
            View Details & Book
          </button>
        </div>
      ))
    )}
  </div>
);

export default RouteList;
