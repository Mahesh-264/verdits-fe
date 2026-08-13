import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios.jsx';
import {
    authenticateWithGoogle,
    checkRegistrationEmail,
    checkRegistrationPhone,
    registerAccount,
    sendRegistrationEmailOtp,
    sendRegistrationPhoneOtp,
    verifyRegistrationEmailOtp,
    verifyRegistrationPhoneOtp,
} from '../api/authApi.js';
import { FaGavel, FaMapMarkerAlt, FaSpinner, FaUser, FaUserGraduate } from 'react-icons/fa';
import BrandLogo from '../components/BrandLogo.jsx';
import GoogleAuthButton from '../components/auth/GoogleAuthButton.jsx';
import { setAuth } from '../redux/authSlice.jsx';
import { storeAuthSession } from '../utils/authStorage.js';
import { getDashboardPath } from '../utils/authRedirect.js';
import socket from '../utils/socket.jsx';

const LOCATION_HINT_DEFAULT = 'Enter a 6-digit pincode to auto-fill city, district, and state, use current location to fill those fields automatically, or enter city, district, and state manually to generate coordinates automatically.';

const normalizePincode = (value) => String(value || '').replace(/\D/g, '').slice(0, 6);

const normalizeAddressPayload = (address = {}) => ({
    pincode: normalizePincode(address.pincode),
    city: String(address.city || '').trim(),
    district: String(address.district || '').trim(),
    state: String(address.state || '').trim(),
    country: String(address.country || 'India').trim() || 'India',
    latitude: address.latitude === null || address.latitude === undefined || address.latitude === ''
        ? null
        : Number(address.latitude),
    longitude: address.longitude === null || address.longitude === undefined || address.longitude === ''
        ? null
        : Number(address.longitude),
});

const buildAddressSignature = (address = {}) => {
    const normalized = normalizeAddressPayload(address);
    return [
        normalized.pincode,
        normalized.city.toLowerCase(),
        normalized.district.toLowerCase(),
        normalized.state.toLowerCase(),
        normalized.country.toLowerCase(),
    ].join('|');
};

const hasManualLocationInput = (address = {}) => {
    const normalized = normalizeAddressPayload(address);
    return Boolean(
        normalized.pincode
        || normalized.city
        || normalized.district
        || normalized.state
        || normalized.latitude !== null
        || normalized.longitude !== null
    );
};

const hasGeocodingInput = (address = {}) => {
    const normalized = normalizeAddressPayload(address);
    return Boolean(normalized.state && (normalized.city || normalized.district));
};

const hasValidCoordinates = (address = {}) => {
    const normalized = normalizeAddressPayload(address);
    return Number.isFinite(normalized.latitude) && Number.isFinite(normalized.longitude);
};

const readGoogleSignup = () => {
    try {
        return JSON.parse(window.sessionStorage.getItem('googleSignup') || 'null');
    } catch {
        return null;
    }
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
const normalizePhoneInput = (value) => String(value || '').replace(/[\s-]/g, '');
const isValidMobile = (value) => /^\+?[0-9]{10,15}$/.test(normalizePhoneInput(value));
const isValidPassword = (value) => /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(String(value || ''));
const PASSWORD_REQUIREMENTS_MESSAGE = 'Password must include at least 1 capital letter, 1 special character, and 1 number.';

export default function Register() {
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role') || 'user';
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const pincodeLookupTimerRef = useRef(null);
    const geocodeTimerRef = useRef(null);
    const lastResolvedPincodeRef = useRef('');
    const lastGeocodedSignatureRef = useRef('');
    const pincodeLookupRequestRef = useRef(0);
    const geocodeRequestRef = useRef(0);

    const [loadingAddr, setLoadingAddr] = useState(false);
    const [locationHint, setLocationHint] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [emailOtp, setEmailOtp] = useState('');
    const [emailOtpSent, setEmailOtpSent] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [emailBusy, setEmailBusy] = useState(false);
    const [emailResendSeconds, setEmailResendSeconds] = useState(0);
    const [phoneOtp, setPhoneOtp] = useState('');
    const [phoneOtpSent, setPhoneOtpSent] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [phoneBusy, setPhoneBusy] = useState(false);
    const [phoneResendSeconds, setPhoneResendSeconds] = useState(0);
    const [googleSignup, setGoogleSignup] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        barId: '',
        specialization: '',
        experienceYears: '',
        languages: '',
        collegeName: '',
        collegeEmail: '',
        address: {
            latitude: null,
            longitude: null,
            pincode: '',
            state: '',
            district: '',
            city: '',
            country: 'India',
        },
    });

    const isGoogleCompletion = Boolean(googleSignup?.completionToken);

    useEffect(() => {
        const saved = location.state?.googleSignup || readGoogleSignup();

        if (!saved?.completionToken || saved.role !== role) {
            setGoogleSignup(null);
            return;
        }

        setGoogleSignup(saved);
        setEmailVerified(true);
        setEmailOtpSent(false);
        setFormData((current) => ({
            ...current,
            firstName: saved.googleProfile?.firstName || current.firstName,
            lastName: saved.googleProfile?.lastName || current.lastName,
            email: saved.googleProfile?.email || current.email,
            password: '',
            confirmPassword: '',
        }));
    }, [location.state, role]);

    useEffect(() => {
        if (emailResendSeconds <= 0) return undefined;
        const timer = window.setTimeout(() => setEmailResendSeconds((seconds) => Math.max(seconds - 1, 0)), 1000);
        return () => window.clearTimeout(timer);
    }, [emailResendSeconds]);

    useEffect(() => {
        if (phoneResendSeconds <= 0) return undefined;
        const timer = window.setTimeout(() => setPhoneResendSeconds((seconds) => Math.max(seconds - 1, 0)), 1000);
        return () => window.clearTimeout(timer);
    }, [phoneResendSeconds]);

    const syncResolvedAddress = useCallback((resolvedAddress, hint = '') => {
        const normalizedAddress = normalizeAddressPayload(resolvedAddress);

        setFormData((prev) => ({
            ...prev,
            address: {
                ...prev.address,
                ...normalizedAddress,
            },
        }));

        if (normalizedAddress.pincode.length === 6) {
            lastResolvedPincodeRef.current = normalizedAddress.pincode;
        }

        if (hasValidCoordinates(normalizedAddress)) {
            lastGeocodedSignatureRef.current = buildAddressSignature(normalizedAddress);
        }

        if (hint) {
            setLocationHint(hint);
        }

        return normalizedAddress;
    }, []);

    const updateAddressField = (field, value) => {
        const nextValue = field === 'pincode' ? normalizePincode(value) : value;

        if (field === 'pincode' && nextValue.length < 6) {
            lastResolvedPincodeRef.current = '';
        }

        if (['pincode', 'city', 'district', 'state'].includes(field)) {
            lastGeocodedSignatureRef.current = '';
        }

        setFormData((prev) => ({
            ...prev,
            address: {
                ...prev.address,
                [field]: nextValue,
                ...(['pincode', 'city', 'district', 'state'].includes(field)
                    ? { latitude: null, longitude: null }
                    : {}),
            },
        }));
    };

    const geocodeAddress = useCallback(async (addressInput, options = {}) => {
        const address = normalizeAddressPayload(addressInput);
        if (!hasGeocodingInput(address)) {
            return address;
        }

        const requestId = ++geocodeRequestRef.current;
        setLoadingAddr(true);

        if (options.loadingMessage) {
            setLocationHint(options.loadingMessage);
        }

        try {
            const { data } = await api.post('/auth/location/geocode', { address });

            if (requestId !== geocodeRequestRef.current) {
                return address;
            }

            syncResolvedAddress(data.address, options.successHint || 'Coordinates generated automatically from the resolved location.');
            return normalizeAddressPayload(data.address);
        } catch (error) {
            if (requestId !== geocodeRequestRef.current) {
                return address;
            }

            const responseData = error.response?.data;

            if (responseData?.address) {
                syncResolvedAddress(responseData.address);
            }

            const nextMessage = responseData?.message || options.failureHint || 'Unable to generate coordinates automatically from the entered location.';
            setLocationHint(nextMessage);

            if (options.throwOnError) {
                throw new Error(nextMessage);
            }

            return address;
        } finally {
            if (requestId === geocodeRequestRef.current) {
                setLoadingAddr(false);
            }
        }
    }, [syncResolvedAddress]);

    const lookupPincode = useCallback(async (rawPincode) => {
        const pincode = normalizePincode(rawPincode);
        if (pincode.length !== 6 || lastResolvedPincodeRef.current === pincode) {
            return null;
        }

        const requestId = ++pincodeLookupRequestRef.current;
        setLoadingAddr(true);
        setLocationHint('Looking up city, district, and state from pincode...');

        try {
            const { data } = await api.get(`/auth/location/pincode/${pincode}`);

            if (requestId !== pincodeLookupRequestRef.current) {
                return null;
            }

            syncResolvedAddress({
                ...data.address,
                latitude: null,
                longitude: null,
            }, 'City, district, and state populated from pincode. Generating coordinates next...');

            return data.address;
        } catch (error) {
            if (requestId !== pincodeLookupRequestRef.current) {
                return null;
            }

            lastResolvedPincodeRef.current = '';
            setLocationHint(error.response?.data?.message || 'Pincode lookup failed. Enter city, district, and state manually and coordinates will still be generated automatically.');
            return null;
        } finally {
            if (requestId === pincodeLookupRequestRef.current) {
                setLoadingAddr(false);
            }
        }
    }, [syncResolvedAddress]);

    const detectCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationHint('Location access is not supported. Enter pincode manually.');
            return;
        }

        setLoadingAddr(true);
        setLocationHint('Detecting your current location...');

        navigator.geolocation.getCurrentPosition(async (position) => {
            const latitude = Number(position.coords.latitude.toFixed(6));
            const longitude = Number(position.coords.longitude.toFixed(6));

            try {
                const { data } = await api.get('/auth/location/reverse-geocode', {
                    params: { latitude, longitude },
                });

                syncResolvedAddress({
                    city: data.address?.city || '',
                    district: data.address?.district || '',
                    state: data.address?.state || '',
                    country: data.address?.country || 'India',
                    pincode: '',
                    latitude,
                    longitude,
                }, 'City, district, and state were filled from your current location.');
            } catch (error) {
                syncResolvedAddress({
                    city: '',
                    district: '',
                    state: '',
                    country: 'India',
                    pincode: '',
                    latitude,
                    longitude,
                }, 'Current coordinates captured, but city, district, and state could not be resolved.');
                console.error('Reverse geocode error', error);
            } finally {
                setLoadingAddr(false);
            }
        }, () => {
            setLoadingAddr(false);
            setLocationHint('Allow location access or enter a pincode manually.');
        });
    }, [syncResolvedAddress]);

    useEffect(() => {
        if (role !== 'lawyer') {
            return undefined;
        }

        const pincode = normalizePincode(formData.address.pincode);
        if (pincode.length !== 6 || lastResolvedPincodeRef.current === pincode) {
            return undefined;
        }

        pincodeLookupTimerRef.current = window.setTimeout(() => {
            lookupPincode(pincode);
        }, 400);

        return () => {
            if (pincodeLookupTimerRef.current) {
                window.clearTimeout(pincodeLookupTimerRef.current);
            }
        };
    }, [formData.address.pincode, lookupPincode, role]);

    useEffect(() => {
        if (role !== 'lawyer') {
            return undefined;
        }

        const currentAddress = {
            pincode: formData.address.pincode,
            city: formData.address.city,
            district: formData.address.district,
            state: formData.address.state,
            country: formData.address.country,
            latitude: formData.address.latitude,
            longitude: formData.address.longitude,
        };

        const signature = buildAddressSignature(currentAddress);
        if (!hasGeocodingInput(currentAddress) || signature === lastGeocodedSignatureRef.current) {
            return undefined;
        }

        geocodeTimerRef.current = window.setTimeout(() => {
            geocodeAddress(currentAddress, {
                loadingMessage: 'Generating coordinates from the resolved location...',
                successHint: 'Coordinates generated automatically.',
            });
        }, 700);

        return () => {
            if (geocodeTimerRef.current) {
                window.clearTimeout(geocodeTimerRef.current);
            }
        };
    }, [
        formData.address.city,
        formData.address.country,
        formData.address.district,
        formData.address.latitude,
        formData.address.longitude,
        formData.address.pincode,
        formData.address.state,
        geocodeAddress,
        role,
    ]);

    const finishAuth = (session) => {
        if (session.verificationToken && session.user?.role === 'lawyer') {
            // This opaque, time-limited token only authorizes checking this
            // application's status; it is not a dashboard login session.
            window.sessionStorage.setItem('lawyerVerificationToken', session.verificationToken);
            navigate('/pending-approval', { replace: true });
            return;
        }
        storeAuthSession(session, false);
        dispatch(setAuth(session.user));
        socket.auth.token = session.accessToken;
        if (!socket.connected) socket.connect();
        navigate(getDashboardPath(session.user.role), { replace: true });
    };

    const handleGoogleSuccess = async ({ credential }) => {
        setSubmitting(true);
        setErrorMessage('');
        try {
            const result = await authenticateWithGoogle({ credential, role });
            if (result.requiresProfile) {
                const nextGoogleSignup = {
                    completionToken: result.completionToken,
                    googleProfile: result.googleProfile,
                    role,
                    remember: false,
                };
                window.sessionStorage.setItem('googleSignup', JSON.stringify(nextGoogleSignup));
                setGoogleSignup(nextGoogleSignup);
                setEmailVerified(true);
                setEmailOtpSent(false);
                setFormData((current) => ({
                    ...current,
                    firstName: result.googleProfile?.firstName || current.firstName,
                    lastName: result.googleProfile?.lastName || current.lastName,
                    email: result.googleProfile?.email || current.email,
                    password: '',
                    confirmPassword: '',
                }));
                navigate(`/register?role=${role}`, {
                    replace: true,
                    state: { googleSignup: nextGoogleSignup },
                });
                return;
            }
            finishAuth(result);
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Google sign-up failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendEmailOtp = async () => {
        const email = formData.email.trim();
        if (!isValidEmail(email)) {
            setErrorMessage('Invalid email');
            return;
        }

        setEmailBusy(true);
        setErrorMessage('');
        setSuccessMessage('');
        try {
            await checkRegistrationEmail({ email, role });
            const result = await sendRegistrationEmailOtp({
                email,
                role,
                firstName: formData.firstName,
            });
            setEmailOtpSent(true);
            setEmailVerified(false);
            setEmailOtp('');
            setEmailResendSeconds(result.resendAfter || 30);
            setSuccessMessage('OTP sent to your email.');
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Unable to send email verification code.');
        } finally {
            setEmailBusy(false);
        }
    };

    const handleVerifyEmailOtp = async () => {
        setEmailBusy(true);
        setErrorMessage('');
        setSuccessMessage('');
        try {
            const result = await verifyRegistrationEmailOtp({
                email: formData.email.trim(),
                role,
                otp: emailOtp,
            });
            setEmailVerified(true);
            setEmailOtpSent(false);
            setEmailResendSeconds(0);
            setSuccessMessage(result.message || 'Verification successful');
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Incorrect OTP');
        } finally {
            setEmailBusy(false);
        }
    };

    const handleSendPhoneOtp = async () => {
        const phone = normalizePhoneInput(formData.phone);
        if (!isValidMobile(phone)) {
            setErrorMessage('Invalid mobile number');
            return;
        }

        setPhoneBusy(true);
        setErrorMessage('');
        setSuccessMessage('');
        try {
            await checkRegistrationPhone({ phone, role });
            const result = await sendRegistrationPhoneOtp({ phone, role });
            setPhoneOtpSent(true);
            setPhoneVerified(false);
            setPhoneOtp('');
            setPhoneResendSeconds(result.resendAfter || 30);
            setSuccessMessage('OTP sent to your mobile number.');
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Unable to send mobile verification code.');
        } finally {
            setPhoneBusy(false);
        }
    };

    const handleVerifyPhoneOtp = async () => {
        setPhoneBusy(true);
        setErrorMessage('');
        setSuccessMessage('');
        try {
            const result = await verifyRegistrationPhoneOtp({
                phone: normalizePhoneInput(formData.phone),
                role,
                otp: phoneOtp,
            });
            setPhoneVerified(true);
            setPhoneOtpSent(false);
            setPhoneResendSeconds(0);
            setSuccessMessage(result.message || 'Verification successful');
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Incorrect OTP');
        } finally {
            setPhoneBusy(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setErrorMessage('');

        try {
            if (!isValidEmail(formData.email)) {
                throw new Error('Enter a valid email address.');
            }

            if (!isValidPassword(formData.password)) {
                throw new Error(PASSWORD_REQUIREMENTS_MESSAGE);
            }

            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: normalizePhoneInput(formData.phone),
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                role,
                emailVerified,
                phoneVerified,
            };

            if (!emailVerified) {
                throw new Error('Email must be verified before creating an account');
            }

            if (!phoneVerified) {
                throw new Error('Mobile number must be verified before creating an account');
            }

            if (role === 'lawyer') {
                let resolvedAddress = normalizeAddressPayload(formData.address);

                if (hasManualLocationInput(resolvedAddress) && !hasValidCoordinates(resolvedAddress)) {
                    resolvedAddress = await geocodeAddress(resolvedAddress, {
                        loadingMessage: 'Finalizing location details before registration...',
                        successHint: 'Location details are ready for registration.',
                        failureHint: 'Unable to generate coordinates from the provided location. Please verify city, district, and state.',
                        throwOnError: true,
                    });
                }

                payload.experienceYears = Number(formData.experienceYears);
                payload.languages = formData.languages.split(',').map((language) => language.trim()).filter(Boolean);
                payload.barId = formData.barId;
                payload.specialization = formData.specialization;
                payload.address = resolvedAddress;
            }

            if (role === 'student') {
                payload.collegeName = formData.collegeName;
                payload.collegeEmail = formData.collegeEmail;
            }

            if (isGoogleCompletion) {
                const result = await authenticateWithGoogle({
                    ...payload,
                    completionToken: googleSignup.completionToken,
                });
                window.sessionStorage.removeItem('googleSignup');
                finishAuth(result);
                return;
            }

            const result = await registerAccount(payload);
            finishAuth(result);
        } catch (error) {
            setErrorMessage(error.response?.data?.message || error.message || 'Signup failed');
        } finally {
            setSubmitting(false);
        }
    };

    const getIcon = () => {
        if (role === 'lawyer') return <FaGavel className="text-[#062552] text-3xl" />;
        if (role === 'student') return <FaUserGraduate className="text-emerald-500 text-3xl" />;
        return <FaUser className="text-[#15a276] text-3xl" />;
    };

    const baseFieldsComplete = Boolean(
        formData.firstName.trim()
        && formData.lastName.trim()
        && isValidEmail(formData.email)
        && isValidMobile(formData.phone)
        && isValidPassword(formData.password)
        && isValidPassword(formData.confirmPassword)
        && formData.password === formData.confirmPassword
    );
    const roleFieldsComplete = role === 'lawyer'
        ? Boolean(
            formData.barId.trim()
            && formData.specialization.trim()
            && formData.languages.trim()
            && String(formData.experienceYears).trim()
        )
        : role === 'student'
            ? Boolean(formData.collegeName.trim() && isValidEmail(formData.collegeEmail))
            : true;
    const canCreateAccount = baseFieldsComplete && roleFieldsComplete && emailVerified && phoneVerified && !submitting;

    return (
        <div className="min-h-screen bg-[#f3f8fb] flex items-center justify-center p-4 font-sans text-[#062552] py-12">
            <div className="w-full max-w-3xl bg-white border border-[#d7e9ef] rounded-2xl p-8 shadow-2xl shadow-[#062552]/10">
                <div className="flex justify-center mb-6">
                    <Link to="/role-selection" aria-label="Go to role selection">
                        <BrandLogo className="h-16 max-w-[240px]" />
                    </Link>
                </div>
                <div className="flex items-center justify-center gap-3 mb-8">
                    {getIcon()}
                    <h2 className="text-3xl font-bold capitalize">
                        {isGoogleCompletion ? 'Complete Your Registration' : `${role} Registration`}
                    </h2>
                </div>
                <Link to="/role-selection" className="mb-6 inline-flex text-sm font-semibold text-[#15a276] hover:underline">
                    &larr; Back to Role Selection
                </Link>

                {isGoogleCompletion ? (
                    <p className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        Your Google account has been verified. Please complete the remaining required information to finish creating your account.
                    </p>
                ) : (
                    <>
                        <GoogleAuthButton
                            onSuccess={handleGoogleSuccess}
                            onError={() => setErrorMessage('Google sign-up was cancelled or failed.')}
                            disabled={submitting}
                        />
                        <div className="my-6 flex items-center gap-3 text-xs uppercase text-[#8a95ab]">
                            <span className="h-px flex-1 bg-[#d7e9ef]" />
                            <span>or register with email</span>
                            <span className="h-px flex-1 bg-[#d7e9ef]" />
                        </div>
                    </>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input
                        type="text"
                        placeholder="First Name"
                        required
                        value={formData.firstName}
                        className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none w-full"
                        onChange={(event) => setFormData({ ...formData, firstName: event.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Last Name"
                        required
                        value={formData.lastName}
                        className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none w-full"
                        onChange={(event) => setFormData({ ...formData, lastName: event.target.value })}
                    />
                    <div className="md:col-span-2 space-y-3">
                        <div className="flex flex-col gap-3 md:flex-row">
                            <input
                                type="email"
                                placeholder="Personal Email ID"
                                required
                                readOnly={emailVerified}
                                value={formData.email}
                                className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none flex-1"
                                onChange={(event) => {
                                    setFormData({ ...formData, email: event.target.value });
                                    setEmailVerified(false);
                                    setEmailOtpSent(false);
                                    setEmailOtp('');
                                    setSuccessMessage('');
                                }}
                            />
                            {emailVerified ? (
                                <div className="flex items-center gap-3">
                                    <span className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                                        &#10003; Verified
                                    </span>
                                    {!isGoogleCompletion && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEmailVerified(false);
                                                setEmailOtpSent(false);
                                            }}
                                            className="rounded-xl border border-[#d7e9ef] px-4 py-3 text-sm font-bold text-[#5f7488]"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSendEmailOtp}
                                    disabled={emailBusy || !isValidEmail(formData.email) || emailResendSeconds > 0}
                                    className="px-6 py-3 bg-[#e8f7f2] text-[#15a276] rounded-xl font-bold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {emailBusy ? 'Sending...' : emailOtpSent && emailResendSeconds > 0 ? `Resend in ${emailResendSeconds}s` : emailOtpSent ? 'Resend OTP' : 'Verify Email'}
                                </button>
                            )}
                        </div>
                        {emailOtpSent && !emailVerified && (
                            <div className="flex flex-col gap-3 md:flex-row">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={emailOtp}
                                    placeholder="Enter email OTP"
                                    onChange={(event) => setEmailOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none flex-1"
                                />
                                <button
                                    type="button"
                                    onClick={handleVerifyEmailOtp}
                                    disabled={emailBusy || emailOtp.length !== 6}
                                    className="rounded-xl bg-[#15a276] px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Verify
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2 space-y-3">
                        <div className="flex flex-col gap-3 md:flex-row">
                        <input
                            type="text"
                            placeholder="Mobile Number"
                            required
                            value={formData.phone}
                            readOnly={phoneVerified}
                            className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none flex-1"
                            onChange={(event) => {
                                setFormData({ ...formData, phone: event.target.value });
                                setPhoneVerified(false);
                                setPhoneOtpSent(false);
                                setPhoneOtp('');
                                setSuccessMessage('');
                            }}
                        />
                        {phoneVerified ? (
                            <div className="flex items-center gap-3">
                                <span className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                                    &#10003; Verified
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPhoneVerified(false);
                                        setPhoneOtpSent(false);
                                    }}
                                    className="rounded-xl border border-[#d7e9ef] px-4 py-3 text-sm font-bold text-[#5f7488]"
                                >
                                    Edit
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSendPhoneOtp}
                                disabled={phoneBusy || !isValidMobile(formData.phone) || phoneResendSeconds > 0}
                                className="px-6 py-3 bg-[#e8f7f2] text-[#15a276] rounded-xl font-bold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {phoneBusy ? 'Sending...' : phoneOtpSent && phoneResendSeconds > 0 ? `Resend in ${phoneResendSeconds}s` : phoneOtpSent ? 'Resend OTP' : 'Verify Mobile'}
                            </button>
                        )}
                        </div>
                    </div>

                    {phoneOtpSent && !phoneVerified && (
                        <div className="md:col-span-2 flex flex-col gap-3 md:flex-row">
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={phoneOtp}
                                placeholder="Enter mobile OTP"
                                onChange={(event) => setPhoneOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none flex-1"
                            />
                            <button
                                type="button"
                                onClick={handleVerifyPhoneOtp}
                                disabled={phoneBusy || phoneOtp.length !== 6}
                                className="rounded-xl bg-[#15a276] px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Verify
                            </button>
                        </div>
                    )}

                    <div className="relative md:col-span-2">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            required
                            minLength={8}
                            value={formData.password}
                            className="bg-[#f7fbfc] p-3 pr-16 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none w-full"
                            onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                        />
                        {formData.password && (
                            <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 px-4 text-sm font-semibold text-[#15a276] hover:text-[#0f8968]" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                {showPassword ? 'Hide' : 'View'}
                            </button>
                        )}
                        {formData.password && !isValidPassword(formData.password) && <p className="mt-2 text-sm text-red-600">{PASSWORD_REQUIREMENTS_MESSAGE}</p>}
                    </div>
                    <div className="relative md:col-span-2">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm Password"
                            required
                            minLength={8}
                            value={formData.confirmPassword}
                            className="bg-[#f7fbfc] p-3 pr-16 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none w-full"
                            onChange={(event) => setFormData({ ...formData, confirmPassword: event.target.value })}
                        />
                        {formData.confirmPassword && (
                            <button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} className="absolute inset-y-0 right-0 px-4 text-sm font-semibold text-[#15a276] hover:text-[#0f8968]" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                                {showConfirmPassword ? 'Hide' : 'View'}
                            </button>
                        )}
                    </div>

                    {role === 'lawyer' && (
                        <>
                            <input
                                type="text"
                                placeholder="Bar Council Number"
                                required
                                className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none"
                                onChange={(event) => setFormData({ ...formData, barId: event.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Specialization (e.g. Criminal, Civil)"
                                required
                                className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none"
                                onChange={(event) => setFormData({ ...formData, specialization: event.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Languages Known (comma separated)"
                                required
                                className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none"
                                onChange={(event) => setFormData({ ...formData, languages: event.target.value })}
                            />
                            <input
                                type="number"
                                placeholder="Experience (Years)"
                                required
                                className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none"
                                onChange={(event) => setFormData({ ...formData, experienceYears: event.target.value })}
                            />

                            <div className="md:col-span-2 space-y-4 pt-4 border-t border-[#d7e9ef]">
                                <div className="flex items-center text-[#5f7488]">
                                    <FaMapMarkerAlt className="mr-2" />
                                    <span className="font-semibold text-sm uppercase">Location Details</span>
                                    {loadingAddr && <FaSpinner className="animate-spin ml-3 text-[#15a276]" />}
                                </div>
                                <button
                                    type="button"
                                    onClick={detectCurrentLocation}
                                    className="rounded-xl border border-[#15a276]/40 bg-[#15a276]/10 px-4 py-2 text-sm font-semibold text-[#118b66] transition hover:bg-[#15a276]/20"
                                >
                                    Use Current Location
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Pincode"
                                        value={formData.address.pincode}
                                        onChange={(event) => updateAddressField('pincode', event.target.value)}
                                        className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="City"
                                        value={formData.address.city}
                                        onChange={(event) => updateAddressField('city', event.target.value)}
                                        className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="State"
                                        value={formData.address.state}
                                        onChange={(event) => updateAddressField('state', event.target.value)}
                                        className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="District"
                                        value={formData.address.district}
                                        onChange={(event) => updateAddressField('district', event.target.value)}
                                        className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none"
                                    />
                                </div>
                                <p className="text-xs text-[#5f7488]">
                                    {locationHint || LOCATION_HINT_DEFAULT}
                                </p>
                            </div>
                        </>
                    )}

                    {role === 'student' && (
                        <>
                            <input
                                type="text"
                                placeholder="College Name"
                                required
                                className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none"
                                onChange={(event) => setFormData({ ...formData, collegeName: event.target.value })}
                            />
                            <input
                                type="email"
                                placeholder="College Email Address"
                                required
                                className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none"
                                onChange={(event) => setFormData({ ...formData, collegeEmail: event.target.value })}
                            />
                        </>
                    )}

                    {errorMessage && (
                        <p className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {errorMessage}
                        </p>
                    )}

                    {successMessage && (
                        <p className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {successMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={!canCreateAccount}
                        className="md:col-span-2 w-full font-bold py-4 rounded-xl mt-6 transition-all shadow-lg text-zinc-950 bg-[#f1d15f] hover:bg-[#d6a400] border border-[#d6b85b] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting
                            ? 'Creating Account...'
                            : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-[#5f7488] mt-6">
                    Already have an account? <Link to={`/login?role=${role}`} className="text-[#15a276] hover:underline font-medium">Login</Link>
                </p>
            </div>
        </div>
    );
}
