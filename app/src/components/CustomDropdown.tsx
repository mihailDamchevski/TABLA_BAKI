import React, { useState, useRef, useEffect } from 'react';
import './CustomDropdown.css';

interface CustomDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ options, value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Highlight priority variants (Portes, Plakoto, Fevga)
  const priorityVariants = ['portes', 'plakoto', 'fevga'];
  const isPriority = (option: string) => priorityVariants.includes(option.toLowerCase());

  const displayValue = value.charAt(0).toUpperCase() + value.slice(1);

  return (
    <div className="custom-dropdown-container" ref={dropdownRef}>
      <label className="custom-dropdown-label">{label}</label>
      <div 
        className={`custom-dropdown ${isOpen ? 'open' : ''}`}
        onClick={handleOpen}
      >
        <span className="custom-dropdown-value">{displayValue}</span>
        <span className={`custom-dropdown-arrow ${isOpen ? 'open' : ''}`}>
          ▼
        </span>
      </div>
      {isOpen && (
        <div className="custom-dropdown-menu">
          <div className="custom-dropdown-search">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search variants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="custom-dropdown-search-input"
            />
          </div>
          <div className="custom-dropdown-options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  className={`custom-dropdown-option ${value === option ? 'selected' : ''} ${isPriority(option) ? 'priority' : ''}`}
                  onClick={() => handleSelect(option)}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                  {isPriority(option) && <span className="priority-badge">⭐</span>}
                </div>
              ))
            ) : (
              <div className="custom-dropdown-no-results">
                No variants found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;

