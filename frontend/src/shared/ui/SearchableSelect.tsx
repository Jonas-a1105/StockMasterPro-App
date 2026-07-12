import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './SearchableSelect.module.css';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  emptyLabel?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  emptyLabel = 'Sin resultados',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find the label for the current value
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Update input text when value changes or when dropdown opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearch(selectedOption ? selectedOption.label : '');
    }
  }, [selectedOption, isOpen]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!isOpen) return options;
    const query = search.toLowerCase().trim();
    if (!query) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(query));
  }, [options, search, isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputFocus = () => {
    setIsOpen(true);
    // Clear display text on focus to allow typing fresh searches
    setSearch('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setIsOpen(true);
  };

  const handleSelectOption = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      inputRef.current?.focus();
      setIsOpen(true);
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          className={styles.inputField}
          placeholder={selectedOption ? selectedOption.label : placeholder}
          value={search}
          onFocus={handleInputFocus}
          onChange={handleInputChange}
        />
        <button
          type="button"
          className={styles.chevronBtn}
          onClick={handleToggle}
          aria-label="Abrir selección"
        >
          <ChevronDown
            size={16}
            className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ''}`}
          />
        </button>
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.optionsList}>
            {filteredOptions.length === 0 ? (
              <div className={styles.emptyOption}>{emptyLabel}</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.optionItem} ${opt.value === value ? styles.optionActive : ''}`}
                  onClick={() => handleSelectOption(opt.value)}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
