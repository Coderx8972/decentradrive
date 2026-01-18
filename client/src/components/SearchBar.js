// client/src/components/SearchBar.js
import React from 'react';
import './SearchBar.css';

const SearchBar = ({ value, onChange }) => {
    return (
        <div className="search-bar glassmorphism">
            <span className="search-icon">🔍</span>
            <input
                type="text"
                placeholder="Search files..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="search-input"
            />
        </div>
    );
};

export default SearchBar;
