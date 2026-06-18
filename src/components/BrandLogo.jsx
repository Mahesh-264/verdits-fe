import React from 'react';

const LOGO_PATH = '/verdicts-logo.png';

const BrandLogo = ({ className = 'h-10', markOnly = false, light = false }) => {
  return (
    <img
      src={LOGO_PATH}
      alt="VERDITS"
      className={`${className} ${markOnly ? 'w-10 object-left object-cover' : 'object-contain'} ${light ? 'rounded bg-white px-2 py-1' : ''}`}
    />
  );
};

export default BrandLogo;
