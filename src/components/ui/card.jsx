import React from "react";

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg transition-colors ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return (
    <div className={`p-6 pb-3 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }) {
  return (
    <h3 className={`text-base font-semibold text-gray-900 dark:text-gray-200 ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "" }) {
  return (
    <p className={`text-sm text-gray-500 dark:text-gray-400 mt-1 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = "" }) {
  return (
    <div className={`p-6 pt-3 ${className}`}>
      {children}
    </div>
  );
}
