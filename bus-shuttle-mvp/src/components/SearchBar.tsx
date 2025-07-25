import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (params: { origin: string; destination: string; date: string }) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ origin, destination, date });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <input
        type="text"
        placeholder="Pickup city"
        value={origin}
        onChange={e => setOrigin(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Drop-off city"
        value={destination}
        onChange={e => setDestination(e.target.value)}
        required
      />
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        required
      />
      <button type="submit">Search</button>
    </form>
  );
};

export default SearchBar;
