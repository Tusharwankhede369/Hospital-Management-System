import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const DEBOUNCE_MS = 300;

const MedicineAutocomplete = ({ value, onChange, onSelect, placeholder = 'Type to search medicines...', id, required }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!value || value.length < 1) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      axios.get('/api/medicines', { params: { search: value } })
        .then(res => {
          setSuggestions(res.data || []);
          setShowDropdown(true);
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (medicine) => {
    onChange(medicine.name);
    if (onSelect) onSelect(medicine);
    setShowDropdown(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        id={id}
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value && suggestions.length > 0 && setShowDropdown(true)}
        autoComplete="off"
        style={{ width: '100%' }}
        required={required}
      />
      {loading && (
        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#999' }}>
          Searching...
        </span>
      )}
      {showDropdown && suggestions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '100%',
            margin: 0,
            padding: 0,
            listStyle: 'none',
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxHeight: '220px',
            overflowY: 'auto',
            zIndex: 1000
          }}
        >
          {suggestions.map((med) => (
            <li
              key={med._id}
              onClick={() => handleSelect(med)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f7ff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
            >
              <strong>{med.name}</strong>
              {med.type && <span style={{ color: '#666', marginLeft: '8px' }}>({med.type})</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MedicineAutocomplete;
