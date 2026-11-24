import React from 'react';

interface AxiomLogoProps {
  className?: string;
}

/**
 * AXIOM Core Prism Mark — Isometric hexagonal geometry with 120° internal axes
 * and a stark white central focal node, strictly monochrome per AXIOM Brand Guidelines v1.0.
 */
export const AxiomLogo: React.FC<AxiomLogoProps> = ({ className = 'w-6 h-6' }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Subtle outer calibration ring */}
      <circle
        cx="32"
        cy="32"
        r="28"
        stroke="#26292E"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      {/* Isometric hexagonal prism perimeter */}
      <polygon
        points="32,8 53,20 53,44 32,56 11,44 11,20"
        stroke="#FFFFFF"
        strokeWidth="1.75"
        strokeLinejoin="miter"
        fill="#0E1012"
      />
      {/* 120-degree internal telemetry axes */}
      <line x1="32" y1="32" x2="32" y2="56" stroke="#FFFFFF" strokeWidth="1.5" />
      <line x1="32" y1="32" x2="11" y2="20" stroke="#FFFFFF" strokeWidth="1.5" />
      <line x1="32" y1="32" x2="53" y2="20" stroke="#FFFFFF" strokeWidth="1.5" />
      {/* Secondary faint structural planes */}
      <line x1="32" y1="8" x2="32" y2="24" stroke="#3F444D" strokeWidth="1" />
      {/* Central Focal Node (Ground Truth) */}
      <circle cx="32" cy="32" r="3.5" fill="#FFFFFF" />
    </svg>
  );
};
