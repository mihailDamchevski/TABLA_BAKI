import React, { useState, useRef, useEffect } from 'react';

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
    <div className={`flex flex-col gap-2.5 items-center relative w-full ${isOpen ? 'z-[10002]' : 'z-10'}`} ref={dropdownRef}>
      <label className="text-white text-base font-bold drop-shadow-[2px_2px_4px_rgba(0,0,0,0.3)] font-['Righteous','Bebas_Neue',cursive] tracking-[0.5px]">{label}</label>
      <div 
        className={`py-2.5 px-[18px] text-sm rounded-[10px] border-2 border-white bg-white cursor-pointer font-bold text-gray-800 min-w-[200px] w-full transition-all shadow-[0_4px_15px_rgba(0,0,0,0.2)] flex justify-between items-center relative select-none box-border ${isOpen ? 'border-white rounded-b-none shadow-[0_6px_20px_rgba(0,0,0,0.3)]' : 'hover:bg-gray-50 hover:scale-105 hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)]'}`}
        onClick={handleOpen}
      >
        <span className="flex-1 text-left">{displayValue}</span>
        <span className={`transition-transform text-sm text-gray-600 ml-2.5 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-2 border-white border-t-0 rounded-b-xl shadow-[0_8px_25px_rgba(0,0,0,0.3)] z-[10001] animate-[slideDown_0.3s_ease-out] -mt-0.5 flex flex-col max-h-[300px] box-border">
          {searchable && (
            <div className="p-2.5 border-b border-gray-200 bg-white">
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm outline-none transition-all bg-white text-gray-800 focus:border-green-500 focus:shadow-[0_0_0_2px_rgba(76,175,80,0.2)] placeholder:text-gray-400"
              />
            </div>
          )}
          <div className="max-h-[200px] overflow-y-auto bg-white [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-green-500 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-green-600">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`py-2.5 px-[18px] cursor-pointer transition-all text-gray-800 font-medium text-sm border-b border-gray-200 flex items-center gap-2 bg-white ${value === option.value ? 'bg-green-100 text-green-700 font-bold before:content-["✓"] before:text-green-500 before:inline-block before:flex-shrink-0 before:w-[18px] before:text-left before:mr-0' : ''} ${isPriority(option.value) ? 'bg-green-50 border-l-[3px] border-l-green-500 font-semibold' : ''} ${value !== option.value ? 'hover:bg-gray-100 hover:pl-5' : ''} last:border-b-0`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                  {isPriority(option.value) && <span className="ml-auto text-xs">⭐</span>}
                </div>
              ))
            ) : (
              <div className="py-5 text-center text-gray-400 italic text-sm bg-white">
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
