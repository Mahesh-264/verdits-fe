import { useState } from 'react';
const logoMark = '/dashboard-logo.png';
const logoText = '/verdicts-name-tag.png';

export default function BrandLogo({ className = 'h-10', compact = false }) {
  const [missing, setMissing] = useState(false);

  if (missing) {
    return (
      <span className="inline-flex items-center gap-3 font-extrabold tracking-[0.2em] text-verdits-navy">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-verdits-navy text-sm text-verdits-gold">
          V
        </span>
        {!compact && (
          <span className="leading-none">
            VERDITS
            <span className="mt-1 block text-[0.55rem] font-bold tracking-[0.36em] text-verdits-teal">
              JUSTICE
            </span>
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src={logoMark}
        alt="VERDITS Logo Mark"
        className="h-full w-auto shrink-0 object-contain"
        onError={() => setMissing(true)}
      />
      {!compact && (
        <img
          src={logoText}
          alt="VERDITS Justice Simplified"
          className="h-[165%] w-auto shrink-0 object-contain translate-y-1.5"
          onError={() => setMissing(true)}
        />
      )}
    </span>
  );
}
