import React from "react";
import { cn } from "./utils";

export function Button({ 
  children, 
  onClick, 
  variant = "default", 
  size = "default", 
  className = "",
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    default: "bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600",
    outline: "border border-gray-300 dark:border-gray-700 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100",
  };
  
  const sizes = {
    default: "h-10 py-2 px-4 text-sm",
    sm: "h-9 px-3 text-xs",
    lg: "h-11 px-8 text-base",
  };
  
  return (
    <button
      onClick={onClick}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
