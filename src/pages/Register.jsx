import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios.jsx';
import { FaGavel, FaMapMarkerAlt, FaSpinner, FaUser, FaUserGraduate } from 'react-icons/fa';
import BrandLogo from '../components/BrandLogo.jsx';

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

export default function Register() {
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role') || 'user';
    const navigate = useNavigate();
    const pincodeLookupTimerRef = useRef(null);
    const geocodeTimerRef = useRef(null);
    const lastResolvedPincodeRef = useRef('');
    const lastGeocodedSignatureRef = useRef('');
    const pincodeLookupRequestRef = useRef(0);
    const geocodeRequestRef = useRef(0);

    const [loadingAddr, setLoadingAddr] = useState(false);
    const [locationHint, setLocationHint] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
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

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                role,
            };

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

            await api.post('/auth/register', payload);
            alert('Registration Successful! Please Login.');
            navigate(`/login?role=${role}`);
        } catch (error) {
            alert(error.response?.data?.message || error.message || 'Signup Failed');
        }
    };

    const getIcon = () => {
        if (role === 'lawyer') return <FaGavel className="text-[#062552] text-3xl" />;
        if (role === 'student') return <FaUserGraduate className="text-emerald-500 text-3xl" />;
        return <FaUser className="text-[#15a276] text-3xl" />;
    };

    return (
        <div className="min-h-screen bg-[#f3f8fb] flex items-center justify-center p-4 font-sans text-[#062552] py-12">
            <div className="w-full max-w-3xl bg-white border border-[#d7e9ef] rounded-2xl p-8 shadow-2xl shadow-[#062552]/10">
                <div className="flex justify-center mb-6">
                    <BrandLogo className="h-16 max-w-[240px]" />
                </div>
                <div className="flex items-center justify-center gap-3 mb-8">
                    {getIcon()}
                    <h2 className="text-3xl font-bold capitalize">{role} Registration</h2>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input
                        type="text"
                        placeholder="First Name"
                        required
                        className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none w-full"
                        onChange={(event) => setFormData({ ...formData, firstName: event.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Last Name"
                        required
                        className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none w-full"
                        onChange={(event) => setFormData({ ...formData, lastName: event.target.value })}
                    />
                    <input
                        type="email"
                        placeholder="Personal Email ID"
                        required
                        className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none w-full md:col-span-2"
                        onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    />

                    <div className="md:col-span-2 flex gap-4">
                        <input
                            type="text"
                            placeholder="Mobile Number"
                            required
                            className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none flex-1"
                            onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                        />
                        {role === 'student' && (
                            <button type="button" className="px-6 py-3 bg-[#e8f7f2] text-[#15a276] rounded-xl font-bold whitespace-nowrap cursor-not-allowed">
                                Verify Mobile
                            </button>
                        )}
                    </div>

                    <input
                        type="password"
                        placeholder="Password"
                        required
                        className="bg-[#f7fbfc] p-3 rounded-xl border border-[#d7e9ef] focus:border-[#15a276] outline-none w-full md:col-span-2"
                        onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                    />

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

                    <button
                        type="submit"
                        className="md:col-span-2 w-full font-bold py-4 rounded-xl mt-6 transition-all shadow-lg text-white bg-[#062552] hover:bg-[#0b3b70]"
                    >
                        Create Account
                    </button>
                </form>

                <p className="text-center text-[#5f7488] mt-6">
                    Already have an account? <Link to={`/login?role=${role}`} className="text-[#15a276] hover:underline font-medium">Login</Link>
                </p>
                <div className="mt-4 text-center">
                    <Link to="/" className="text-[#5f7488] hover:text-[#062552] text-sm transition">
                        &larr; Back to Role Selection
                    </Link>
                </div>
            </div>
        </div>
    );
}
