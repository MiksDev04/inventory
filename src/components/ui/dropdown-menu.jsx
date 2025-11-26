import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { cn } from "./utils";

const DropdownMenuContext = createContext();

export function DropdownMenu({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerRef, setTriggerRef] = useState(null);

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen, triggerRef, setTriggerRef }}>
      <div className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ children, asChild, className = "" }) {
  const { setIsOpen, setTriggerRef } = useContext(DropdownMenuContext);
  const ref = useRef(null);

  useEffect(() => {
    setTriggerRef(ref.current);
  }, [setTriggerRef]);

  const handleClick = (e) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  if (asChild) {
    return React.cloneElement(children, {
      ref,
      onClick: handleClick
    });
  }

  return (
    <button
      ref={ref}
      onClick={handleClick}
      className={cn("outline-none", className)}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, align = "start", className = "" }) {
  const { isOpen, setIsOpen } = useContext(DropdownMenuContext);
  const contentRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  const alignmentClasses = {
    start: "left-0",
    end: "right-0",
    center: "left-1/2 -translate-x-1/2"
  };

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 top-0 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg",
        alignmentClasses[align],
        className
      )}
    >
      <div className="p-1">
        {children}
      </div>
    </div>
  );
}

export function DropdownMenuProduct({ children, onClick, className = "" }) {
  const { setIsOpen } = useContext(DropdownMenuContext);

  const handleClick = (e) => {
    onClick?.(e);
    setIsOpen(false);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800",
        className
      )}
    >
      {children}
    </div>
  );
}
