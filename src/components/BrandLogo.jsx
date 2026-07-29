const DASHBOARD_LOGO_PATH = '/dashboard-logo.png';
const WORDMARK_PATH = '/verdicts-name-tag.png';

const BrandLogo = ({ className = 'h-10', markOnly = false, light = false, showWordmark = false }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 align-middle ${className} ${markOnly ? 'w-10' : ''} ${light ? 'drop-shadow-[0_1px_0_rgba(255,255,255,0.45)]' : ''}`}
    >
      <img
        src={DASHBOARD_LOGO_PATH}
        alt="VERDITS"
        className="h-full w-auto shrink-0 object-contain"
      />
      {showWordmark && !markOnly ? (
        <span className="flex h-full w-[150px] translate-y-3 items-center justify-center overflow-hidden">
          <img
            src={WORDMARK_PATH}
            alt="VERDITS Justice Simplified"
            className="h-[200%] w-auto max-w-none object-contain"
          />
        </span>
      ) : null}
    </span>
  );
};

export default BrandLogo;
