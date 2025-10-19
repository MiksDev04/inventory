import React from "react";

export function Progress({ value = 0, className = "" }) {
  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden transition-colors ${className}`}>
      <div
        className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-300 ease-in-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
