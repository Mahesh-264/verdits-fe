import React from 'react';

const LOGO_PATH = '/verdicts-v-logo.png';
const DASHBOARD_LOGO_PATH = '/dashboard-logo.png';

const BrandLogo = ({ className = 'h-10', markOnly = false, light = false, variant = 'default' }) => {
  const logoPath = variant === 'dashboard' ? DASHBOARD_LOGO_PATH : LOGO_PATH;

  return (
    <img
      src={logoPath}
      alt="VERDITS"
      className={`${className} ${markOnly ? 'w-10' : ''} object-contain ${light ? 'drop-shadow-[0_1px_0_rgba(255,255,255,0.45)]' : ''}`}
    />
  );
};

export default BrandLogo;
