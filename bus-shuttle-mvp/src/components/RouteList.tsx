import React from 'react';
import { Route } from '../utils/types';

// RouteList component displays a list of available transportation routes
// Props: 
// - routes: array of route objects to display
// - onSelect: callback function to handle route selection
interface RouteListProps {
  routes: Route[];
  onSelect: (route: Route) => void;
}

const RouteList: React.FC<RouteListProps> = ({ routes, onSelect }) => (
  <div>
    {/* Check if there are no routes to display */}
    {routes.length === 0 ? (
      <p>No routes found.</p>
    ) : (
      /* Iterate over the routes array and render details for each route */
      routes.map(route => (
        <div key={route.id} className="route-card">
          <h3>{route.departure} → {route.arrival}</h3>
          <p><strong>Departure City:</strong> {route.departure || '-'}</p>
          <p><strong>Arrival City:</strong> {route.arrival || '-'}</p>
          <p><strong>Departure Time:</strong> {route.departureTime ? new Date(route.departureTime).toLocaleString() : '-'}</p>
          <p><strong>Arrival Time:</strong> {route.arrivalTime ? new Date(route.arrivalTime).toLocaleString() : '-'}</p>
          <p><strong>Provider:</strong> {route.provider || '-'}</p>
          <p><strong>Vehicle Type:</strong> {route.vehicleType || '-'}</p>
          <p><strong>Available Seats:</strong> {route.seats || '-'}</p>
          <p><strong>Price:</strong> <span style={{ color: '#1976d2', fontWeight: 700 }}>€{route.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
          <button onClick={() => onSelect(route)}>
            View Details & Book
          </button>
        </div>
      ))
    )}
  </div>
);

export default RouteList;
