import React from "react";
import { cn } from "./utils";

export function Table({ children, className = "" }) {
  return (
    <div className="w-full overflow-auto">
      <table className={cn("w-full caption-bottom text-sm", className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = "" }) {
  return (
    <thead className={cn("[&_tr]:border-b", className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "" }) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = "", onClick }) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-b border-gray-200 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50 data-[state=selected]:bg-gray-100 dark:data-[state=selected]:bg-gray-800",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = "" }) {
  return (
    <th
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-gray-400 [&:has([role=checkbox])]:pr-0",
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className = "", colSpan }) {
  return (
    <td
      colSpan={colSpan}
      className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0 text-gray-900 dark:text-gray-200", className)}
    >
      {children}
    </td>
  );
}
