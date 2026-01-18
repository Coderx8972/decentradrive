// client/src/components/FilterPanel.js
import React from 'react';
import './FilterPanel.css';

const FilterPanel = ({ filters, onFilterChange }) => {
    return (
        <div className="filter-panel glassmorphism">
            <span className="filter-icon">🔧</span>
            <select
                value={filters.fileType}
                onChange={(e) => onFilterChange({ ...filters, fileType: e.target.value })}
                className="filter-select"
            >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="pdf">PDFs</option>
                <option value="document">Documents</option>
                <option value="code">Code</option>
                <option value="archive">Archives</option>
            </select>

            <select
                value={filters.privacy}
                onChange={(e) => onFilterChange({ ...filters, privacy: e.target.value })}
                className="filter-select"
            >
                <option value="all">All Privacy</option>
                <option value="private">Private Only</option>
                <option value="public">Public Only</option>
            </select>

            <select
                value={filters.sortBy}
                onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
                className="filter-select"
            >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="size-desc">Largest First</option>
                <option value="size-asc">Smallest First</option>
            </select>
        </div>
    );
};

export default FilterPanel;
