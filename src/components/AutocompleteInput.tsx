"use client";
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface AutocompleteInputProps {
  options: string[];
  placeholder?: string;
  className?: string;
  name?: string;
  defaultValue?: string;
}

export default function AutocompleteInput({ options, placeholder, className, name, defaultValue = "" }: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(defaultValue);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const removeAccents = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
  };

  const filteredOptions = options.filter(option =>
    removeAccents(option.toLowerCase()).includes(removeAccents(search.toLowerCase()))
  );

  return (
    <div ref={wrapperRef} className={`relative w-full ${isOpen ? 'z-50' : ''}`}>
      <input
        type="text"
        className={className}
        placeholder={placeholder}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
      />
      {name && <input type="hidden" name={name} value={search} />}
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      
      {isOpen && (
        <ul className="absolute left-0 top-full w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                key={index}
                className="px-3 py-2 text-[13px] text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent input blur
                  setSearch(option);
                  setIsOpen(false);
                }}
              >
                {option}
              </li>
            ))
          ) : (
            <li className="px-3 py-3 text-[13px] text-slate-500 text-center">
              Không tìm thấy kết quả
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
