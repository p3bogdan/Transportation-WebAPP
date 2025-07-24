"use client";

import React, { useEffect, useState } from 'react';

interface Booking {
  id: number;
  user: string;
  routeId: string;
  date: string;
  createdAt: string;
  pickupCity?: string;
  destination?: string;
  email?: string;
  phone?: string;
  company?: string;
  paymentStatus?: string;
}

interface Route {
  id: number;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  price: number;
  provider: string;
  companyId?: number;
}

const AdminPanel: React.FC = () => {
  const [tab, setTab] = useState<'bookings' | 'addCompany' | 'routes'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editBooking, setEditBooking] = useState<Partial<Booking>>({});
  const [companyName, setCompanyName] = useState('');
  const [companyMsg, setCompanyMsg] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [editCompanyIdx, setEditCompanyIdx] = useState<number | null>(null);
  const [editCompany, setEditCompany] = useState<any>({});
  // Route management state
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeLoading, setRouteLoading] = useState(true);
  const [editRouteIdx, setEditRouteIdx] = useState<number | null>(null);
  const [editRoute, setEditRoute] = useState<Partial<Route>>({});
  const [routeMsg, setRouteMsg] = useState('');
  const [csvMsg, setCsvMsg] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(routes.length / pageSize);
  const paginatedRoutes = routes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (tab === 'bookings') {
      setLoading(true);
      fetch('/api/bookings')
        .then(res => res.json())
        .then(data => {
          setBookings(data.map((b: any) => ({
            id: b.id,
            user: b.User?.name || '-',
            routeId: b.routeId,
            date: b.route?.departureTime || '-',
            createdAt: b.createdAt,
            pickupCity: b.route?.departure || '-',
            destination: b.route?.arrival || '-',
            email: b.User?.email || '-',
            phone: b.User?.phone || '-',
            company: b.route?.provider || '-',
            paymentStatus: b.paymentStatus || '-',
          })));
          setLoading(false);
        });
    } else if (tab === 'addCompany') {
      setCompanyLoading(true);
      fetch('/api/companies')
        .then(res => res.json())
        .then(data => {
          setCompanies(data);
          setCompanyLoading(false);
        });
    } else if (tab === 'routes') {
      setRouteLoading(true);
      fetch('/api/routes')
        .then(res => res.json())
        .then(data => {
          setRoutes(data);
          setRouteLoading(false);
        });
      fetch('/api/companies')
        .then(res => res.json())
        .then(data => setCompanies(data));
    }
  }, [tab]);

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditBooking(bookings[idx]);
  };
  const handleEditChange = (field: keyof Booking, value: string) => {
    setEditBooking(prev => ({ ...prev, [field]: value }));
  };
  const handleEditSave = async (id: number) => {
    // Save booking changes to the backend
    const res = await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editBooking, id }),
    });
    if (res.ok) {
      const updated = await res.json();
      setBookings(prev => prev.map((b, i) => (i === editIdx ? { ...b, ...updated } : b)));
      setEditIdx(null);
      setEditBooking({});
    } else {
      alert('Failed to update booking');
    }
  };
  const handleDeleteBooking = async (id: number) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    const res = await fetch('/api/bookings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setBookings(prev => prev.filter(b => b.id !== id));
    } else {
      alert('Failed to delete booking');
    }
  };
  const handleEditCompany = (idx: number) => {
    setEditCompanyIdx(idx);
    setEditCompany(companies[idx]);
  };
  const handleEditCompanyChange = (field: string, value: string) => {
    setEditCompany((prev: any) => ({ ...prev, [field]: value }));
  };
  const handleEditCompanySave = async (id: number) => {
    await fetch('/api/companies', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editCompany.name, phone: editCompany.phone }),
    });
    setCompanies(prev => prev.map((c, i) => (i === editCompanyIdx ? { ...c, ...editCompany } : c)));
    setEditCompanyIdx(null);
    setEditCompany({});
  };
  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyMsg('');
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: companyName }),
    });
    if (res.ok) {
      const newCompany = await res.json();
      setCompanies(prev => [...prev, newCompany]);
      setCompanyMsg('Company added!');
      setCompanyName('');
    } else {
      setCompanyMsg('Failed to add company');
    }
  };
  // Route CRUD handlers
  const handleEditRoute = (idx: number) => {
    setEditRouteIdx(idx);
    setEditRoute(routes[idx]);
  };
  const handleEditRouteChange = (field: keyof Route, value: any) => {
    setEditRoute(prev => ({ ...prev, [field]: value }));
  };
  const handleEditRouteSave = async (id: number) => {
    const res = await fetch('/api/routes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editRoute, id }),
    });
    if (res.ok) {
      setRoutes(prev => prev.map((r, i) => (i === editRouteIdx ? { ...r, ...editRoute } : r)));
      setEditRouteIdx(null);
      setEditRoute({});
      setRouteMsg('Route updated!');
    } else {
      setRouteMsg('Failed to update route');
    }
  };
  const handleDeleteRoute = async (id: number) => {
    if (!confirm('Are you sure you want to delete this route?')) return;
    const res = await fetch('/api/routes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setRoutes(prev => prev.filter(r => r.id !== id));
      setRouteMsg('Route deleted!');
    } else {
      setRouteMsg('Failed to delete route');
    }
  };
  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setRouteMsg('');
    // Map form fields to API fields
    const routeToSend = {
      departure: editRoute.origin || '',
      arrival: editRoute.destination || '',
      departureTime: editRoute.departure ? new Date(editRoute.departure).toISOString() : '',
      arrivalTime: editRoute.arrival ? new Date(editRoute.arrival).toISOString() : '',
      price: editRoute.price,
      provider: editRoute.provider,
      companyId: editRoute.companyId,
    };
    const res = await fetch('/api/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(routeToSend),
    });
    if (res.ok) {
      const newRoute = await res.json();
      setRoutes(prev => [...prev, newRoute]);
      setEditRoute({});
      setRouteMsg('Route added!');
    } else {
      setRouteMsg('Failed to add route');
    }
  };
  // CSV import handler
  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setCsvFile(e.target.files[0]);
  };
  const handleCsvImport = async () => {
    if (!csvFile) return;
    const formData = new FormData();
    formData.append('file', csvFile);
    const res = await fetch('/api/routes/import-csv', {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      setCsvMsg('CSV imported!');
      setTab('routes'); // reload
    } else {
      setCsvMsg('Failed to import CSV');
    }
  };

  return (
    <div>
      <h2>Admin Panel</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button onClick={() => setTab('bookings')} style={{ fontWeight: tab === 'bookings' ? 'bold' : 'normal' }}>Bookings</button>
        <button onClick={() => setTab('addCompany')} style={{ fontWeight: tab === 'addCompany' ? 'bold' : 'normal' }}>Add Company</button>
        <button onClick={() => setTab('routes')} style={{ fontWeight: tab === 'routes' ? 'bold' : 'normal' }}>Routes</button>
      </div>
      {tab === 'bookings' && (
        <div>
          <h3>Reservations</h3>
          {loading ? (
            <p>Loading reservations...</p>
          ) : bookings.length === 0 ? (
            <p>No reservations found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Pickup Address</th>
                  <th>Destination Address</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Date of Departure</th>
                  <th>Reservation Time</th>
                  <th>Company</th>
                  <th>Payment Status</th>
                  <th>Edit</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, idx) => (
                  <tr key={booking.id}>
                    {editIdx === idx ? (
                      <>
                        <td><input value={editBooking.user || ''} onChange={e => handleEditChange('user', e.target.value)} /></td>
                        <td><input value={editBooking.pickupCity || ''} onChange={e => handleEditChange('pickupCity', e.target.value)} /></td>
                        <td><input value={editBooking.destination || ''} onChange={e => handleEditChange('destination', e.target.value)} /></td>
                        <td><input value={editBooking.email || ''} onChange={e => handleEditChange('email', e.target.value)} /></td>
                        <td><input value={editBooking.phone || ''} onChange={e => handleEditChange('phone', e.target.value)} /></td>
                        <td>{booking.date ? new Date(booking.date).toLocaleString() : '-'}</td>
                        <td>{booking.createdAt ? new Date(booking.createdAt).toLocaleString() : '-'}</td>
                        <td><input value={editBooking.company || ''} onChange={e => handleEditChange('company', e.target.value)} /></td>
                        <td><input value={editBooking.paymentStatus || ''} onChange={e => handleEditChange('paymentStatus', e.target.value)} /></td>
                        <td>
                          <button onClick={() => handleEditSave(booking.id)}>Save</button>
                          <button onClick={() => setEditIdx(null)}>Cancel</button>
                        </td>
                        <td><button onClick={() => handleDeleteBooking(booking.id)}>Delete</button></td>
                      </>
                    ) : (
                      <>
                        <td>{booking.user}</td>
                        <td>{booking.pickupCity || '-'}</td>
                        <td>{booking.destination || '-'}</td>
                        <td>{booking.email || '-'}</td>
                        <td>{booking.phone || '-'}</td>
                        <td>{booking.date ? new Date(booking.date).toLocaleString() : '-'}</td>
                        <td>{booking.createdAt ? new Date(booking.createdAt).toLocaleString() : '-'}</td>
                        <td>{booking.company || '-'}</td>
                        <td>{booking.paymentStatus || '-'}</td>
                        <td><button onClick={() => handleEdit(idx)}>Edit</button></td>
                        <td><button onClick={() => handleDeleteBooking(booking.id)}>Delete</button></td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {tab === 'addCompany' && (
        <div>
          <h3>Add Company</h3>
          <form onSubmit={handleAddCompany} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Company Name"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              required
            />
            <button type="submit">Add</button>
          </form>
          {companyMsg && <div style={{ color: 'green', marginTop: 8 }}>{companyMsg}</div>}
          <h4 style={{ marginTop: 32 }}>All Companies</h4>
          {companyLoading ? (
            <p>Loading companies...</p>
          ) : companies.length === 0 ? (
            <p>No companies found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company, idx) => (
                  <tr key={company.id}>
                    {editCompanyIdx === idx ? (
                      <>
                        <td><input value={editCompany.name || ''} onChange={e => handleEditCompanyChange('name', e.target.value)} /></td>
                        <td><input value={editCompany.phone || ''} onChange={e => handleEditCompanyChange('phone', e.target.value)} /></td>
                        <td>
                          <button onClick={() => handleEditCompanySave(company.id)}>Save</button>
                          <button onClick={() => setEditCompanyIdx(null)}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{company.name}</td>
                        <td>{company.phone || '-'}</td>
                        <td><button onClick={() => handleEditCompany(idx)}>Edit</button></td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {tab === 'routes' && (
        <div>
          <h3>Routes</h3>
          {routeLoading ? (
            <p>Loading routes...</p>
          ) : routes.length === 0 ? (
            <p>No routes found.</p>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                <thead>
                  <tr>
                    <th>Origin</th>
                    <th>Destination</th>
                    <th>Departure</th>
                    <th>Arrival</th>
                    <th>Price</th>
                    <th>Provider</th>
                    <th>Company</th>
                    <th>Edit</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRoutes.map((route, idx) => (
                    <tr key={route.id}>
                      {editRouteIdx === idx ? (
                        <>
                          <td><input value={editRoute.origin || ''} onChange={e => handleEditRouteChange('origin', e.target.value)} /></td>
                          <td><input value={editRoute.destination || ''} onChange={e => handleEditRouteChange('destination', e.target.value)} /></td>
                          <td><input value={editRoute.departure || ''} onChange={e => handleEditRouteChange('departure', e.target.value)} /></td>
                          <td><input value={editRoute.arrival || ''} onChange={e => handleEditRouteChange('arrival', e.target.value)} /></td>
                          <td><input type="number" value={editRoute.price || ''} onChange={e => handleEditRouteChange('price', Number(e.target.value))} /></td>
                          <td><input value={editRoute.provider || ''} onChange={e => handleEditRouteChange('provider', e.target.value)} /></td>
                          <td>
                            <select value={editRoute.companyId || ''} onChange={e => handleEditRouteChange('companyId', Number(e.target.value))}>
                              <option value="">Select Company</option>
                              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </td>
                          <td><button onClick={() => handleEditRouteSave(route.id)}>Save</button><button onClick={() => setEditRouteIdx(null)}>Cancel</button></td>
                          <td></td>
                        </>
                      ) : (
                        <>
                          <td>{route.origin}</td>
                          <td>{route.destination}</td>
                          <td>{route.departure}</td>
                          <td>{route.arrival}</td>
                          <td>{route.price}</td>
                          <td>{route.provider}</td>
                          <td>{companies.find(c => c.id === route.companyId)?.name || '-'}</td>
                          <td><button onClick={() => handleEditRoute(idx)}>Edit</button></td>
                          <td><button onClick={() => handleDeleteRoute(route.id)}>Delete</button></td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, margin: '16px 0' }}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</button>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
              </div>
            </>
          )}
          <h4 style={{ marginTop: 32 }}>Add New Route</h4>
          <form onSubmit={handleAddRoute} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Origin" value={editRoute.origin || ''} onChange={e => handleEditRouteChange('origin', e.target.value)} required />
            <input type="text" placeholder="Destination" value={editRoute.destination || ''} onChange={e => handleEditRouteChange('destination', e.target.value)} required />
            <input type="datetime-local" placeholder="Departure" value={editRoute.departure || ''} onChange={e => handleEditRouteChange('departure', e.target.value)} required />
            <input type="datetime-local" placeholder="Arrival" value={editRoute.arrival || ''} onChange={e => handleEditRouteChange('arrival', e.target.value)} required />
            <input type="number" placeholder="Price" value={editRoute.price || ''} onChange={e => handleEditRouteChange('price', Number(e.target.value))} required />
            <input type="text" placeholder="Provider" value={editRoute.provider || ''} onChange={e => handleEditRouteChange('provider', e.target.value)} required />
            <select value={editRoute.companyId || ''} onChange={e => handleEditRouteChange('companyId', Number(e.target.value))} required>
              <option value="">Select Company</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button type="submit">Add</button>
          </form>
          {routeMsg && <div style={{ color: 'green', marginTop: 8 }}>{routeMsg}</div>}
          <h4 style={{ marginTop: 32 }}>Import Routes via CSV</h4>
          <input type="file" accept=".csv" onChange={handleCsvChange} />
          <button onClick={handleCsvImport} disabled={!csvFile}>Import CSV</button>
          {csvMsg && <div style={{ color: 'green', marginTop: 8 }}>{csvMsg}</div>}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
