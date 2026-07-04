import { GoogleLogin } from '@react-oauth/google';

export default function GoogleAuthButton({ onSuccess, onError, disabled = false }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        title="Google sign-in is not configured"
        className="w-full rounded-xl border border-[#d7e9ef] bg-[#f7fbfc] px-4 py-3 font-semibold text-[#8a95ab] opacity-70"
      >
        Continue with Google
      </button>
    );
  }

  return (
    <div className={`flex w-full justify-center ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        width="360"
        text="continue_with"
        shape="rectangular"
        theme="outline"
      />
    </div>
  );
}
