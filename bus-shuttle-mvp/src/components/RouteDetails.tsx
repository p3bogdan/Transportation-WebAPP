import React from 'react';
import { Route } from '../utils/types';

interface RouteDetailsProps {
  route: Route;
  onBook: () => void;
}

const RouteDetails: React.FC<RouteDetailsProps> = ({ route, onBook }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = () => {
    const departure = new Date(route.departureTime || route.departure);
    const arrival = new Date(route.arrivalTime || route.arrival);
    const durationMs = arrival.getTime() - departure.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div style={{ 
      maxWidth: 600, 
      margin: '0 auto', 
      padding: 24, 
      border: '1px solid #e0e0e0', 
      borderRadius: 8,
      backgroundColor: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{ 
        borderBottom: '2px solid #1976d2', 
        paddingBottom: 16, 
        marginBottom: 24 
      }}>
        <h2 style={{ 
          color: '#1976d2', 
          margin: '0 0 8px 0', 
          fontSize: 24 
        }}>
          {route.departure} → {route.arrival}
        </h2>
        <p style={{ 
          color: '#666', 
          margin: 0, 
          fontSize: 16 
        }}>
          {route.provider} • {route.vehicleType}
        </p>
      </div>

      {/* Route Information */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: 20, 
        marginBottom: 24 
      }}>
        <div>
          <h3 style={{ color: '#333', margin: '0 0 12px 0', fontSize: 18 }}>
            Departure
          </h3>
          <p style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 'bold' }}>
            {route.departure}
          </p>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
            {route.departureTime ? formatDate(route.departureTime) : formatDate(route.departure)}
          </p>
        </div>

        <div>
          <h3 style={{ color: '#333', margin: '0 0 12px 0', fontSize: 18 }}>
            Arrival
          </h3>
          <p style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 'bold' }}>
            {route.arrival}
          </p>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
            {route.arrivalTime ? formatDate(route.arrivalTime) : 'TBD'}
          </p>
        </div>
      </div>

      {/* Trip Details */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: 16, 
        borderRadius: 6, 
        marginBottom: 24 
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: 16 
        }}>
          <div>
            <strong style={{ color: '#555' }}>Duration:</strong>
            <p style={{ margin: '4px 0 0 0' }}>{calculateDuration()}</p>
          </div>
          
          <div>
            <strong style={{ color: '#555' }}>Vehicle:</strong>
            <p style={{ margin: '4px 0 0 0' }}>{route.vehicleType}</p>
          </div>
          
          <div>
            <strong style={{ color: '#555' }}>Available Seats:</strong>
            <p style={{ margin: '4px 0 0 0' }}>{route.seats}</p>
          </div>
          
          <div>
            <strong style={{ color: '#555' }}>Provider:</strong>
            <p style={{ margin: '4px 0 0 0' }}>{route.provider}</p>
          </div>
        </div>
      </div>

      {/* Price and Booking */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderTop: '1px solid #e0e0e0',
        paddingTop: 20
      }}>
        <div>
          <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: 14 }}>
            Total Price
          </p>
          <p style={{ 
            margin: 0, 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: '#1976d2' 
          }}>
            €{route.price?.toFixed(2)}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => window.history.back()}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            Back to Results
          </button>
          
          <button 
            onClick={onBook}
            style={{ 
              padding: '12px 32px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 'bold'
            }}
          >
            Book This Trip
          </button>
        </div>
      </div>

      {/* Additional Information */}
      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        backgroundColor: '#e7f3ff', 
        borderRadius: 6,
        border: '1px solid #bee5eb'
      }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#0c5460' }}>
          Important Information
        </h4>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#0c5460' }}>
          <li>Please arrive at the departure point 15 minutes before scheduled time</li>
          <li>Valid ID required for international travel</li>
          <li>Luggage restrictions may apply - check with provider</li>
          <li>Free cancellation up to 24 hours before departure</li>
        </ul>
      </div>
    </div>
  );
};

export default RouteDetails;