import React, { createContext, useContext, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "./utils";

const SelectContext = createContext();

export function Select({ children, value, onValueChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || "");

  // Keep internal selectedValue in sync when parent changes the `value` prop
  React.useEffect(() => {
    setSelectedValue(value || "");
  }, [value]);

  const handleValueChange = (newValue) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  return (
    <SelectContext.Provider value={{ isOpen, setIsOpen, selectedValue, handleValueChange }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className = "" }) {
  const { isOpen, setIsOpen } = useContext(SelectContext);

  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
        className
      )}
    >
      {children}
      <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "transform rotate-180")} />
    </button>
  );
}

export function SelectValue({ placeholder = "Select..." }) {
  const { selectedValue } = useContext(SelectContext);
  return <span>{selectedValue || placeholder}</span>;
}

export function SelectContent({ children, className = "" }) {
  const { isOpen } = useContext(SelectContext);

  if (!isOpen) return null;

  return (
    <div className={cn(
      "absolute z-40 mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg",
      className
    )}>
      <div className="p-1">
        {children}
      </div>
    </div>
  );
}

export function SelectProduct({ value, children, className = "" }) {
  const { selectedValue, handleValueChange } = useContext(SelectContext);
  const isSelected = selectedValue === value;

  return (
    <div
      onClick={() => handleValueChange(value)}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
        isSelected && "bg-gray-100 dark:bg-gray-800",
        className
      )}
    >
      <span className="flex-1">{children}</span>
      {isSelected && <Check className="h-4 w-4" />}
    </div>
  );
}
