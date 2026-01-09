import React, { useState, useRef, useEffect } from 'react';
import './CustomDropdown.css';

interface CustomDropdownProps {
  options: string[] | Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  label: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ 
  options, 
  value, 
  onChange, 
  label,
  searchable = true,
  searchPlaceholder = "Search..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to always be array of {value, label}
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt.charAt(0).toUpperCase() + opt.slice(1) };
    }
    return opt as { value: string; label: string };
  });

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
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  const filteredOptions = normalizedOptions.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Highlight priority variants (Portes, Plakoto, Fevga)
  const priorityVariants = ['portes', 'plakoto', 'fevga'];
  const isPriority = (optionValue: string) => priorityVariants.includes(optionValue.toLowerCase());

  const selectedOption = normalizedOptions.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : value.charAt(0).toUpperCase() + value.slice(1);

  return (
    <div className={`custom-dropdown-container ${isOpen ? 'dropdown-open' : ''}`} ref={dropdownRef}>
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
          {searchable && (
            <div className="custom-dropdown-search">
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="custom-dropdown-search-input"
              />
            </div>
          )}
          <div className="custom-dropdown-options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`custom-dropdown-option ${value === option.value ? 'selected' : ''} ${isPriority(option.value) ? 'priority' : ''}`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                  {isPriority(option.value) && <span className="priority-badge">⭐</span>}
                </div>
              ))
            ) : (
              <div className="custom-dropdown-no-results">
                No options found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;

