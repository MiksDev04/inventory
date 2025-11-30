import React from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import { cn } from "./utils";

export function AlertDialog({ open, onOpenChange, children }) {
  if (!open) return null;

  // Render the dialog into document.body so it escapes any parent stacking/context
  // issues (transforms, z-index, etc.). This guarantees the modal overlays all
  // app content regardless of where AlertDialog is used.
  if (typeof document !== "undefined") {
    return ReactDOM.createPortal(
      // Use very high z-index values so the alert dialog always appears above other app layers.
      <div className="fixed inset-0 z-[99999] flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity z-[99998]"
          onClick={() => onOpenChange?.(false)}
        />
        {/* Dialog */}
        <div className="relative">
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, { onOpenChange });
            }
            return child;
          })}
        </div>
      </div>,
      document.body
    );
  }

  return null;
}

export function AlertDialogContent({ children, className = "", onOpenChange }) {
  return (
    <div
      className={cn(
        // ensure the content itself is above the backdrop and other UI. Using a very large z-index
        // prevents other components with high z-index from overlapping the modal.
        "relative z-[100000] w-full max-w-lg rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161b22] p-6 shadow-lg",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { onOpenChange });
        }
        return child;
      })}
    </div>
  );
}

export function AlertDialogHeader({ children, className = "", onOpenChange }) {
  return (
    <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { onOpenChange });
        }
        return child;
      })}
    </div>
  );
}

export function AlertDialogTitle({ children, className = "" }) {
  return (
    <h2 className={cn("text-lg font-semibold text-gray-900 dark:text-white", className)}>
      {children}
    </h2>
  );
}

export function AlertDialogDescription({ children, className = "" }) {
  return (
    <p className={cn("text-sm text-gray-600 dark:text-gray-400", className)}>
      {children}
    </p>
  );
}

export function AlertDialogFooter({ children, className = "", onOpenChange }) {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { onOpenChange });
        }
        return child;
      })}
    </div>
  );
}

export function AlertDialogAction({ children, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-red-600 dark:bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

export function AlertDialogCancel({ children, onClick, className = "", onOpenChange }) {
  const handleClick = (e) => {
    onClick?.(e);
    onOpenChange?.(false);
  };
  
  return (
    <button
      onClick={handleClick}
      className={cn(
        "mt-2 sm:mt-0 inline-flex h-10 items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500",
        className
      )}
    >
      {children}
    </button>
  );
}
