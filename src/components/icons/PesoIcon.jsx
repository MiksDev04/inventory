import React from "react";

export function PesoIcon({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 7V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2" />
      <path d="M6 7h12" />
      <path d="M6 11h12" />
      <path d="M10 7v12" />
      <path d="M10 15h4a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-4" />
    </svg>
  );
}
