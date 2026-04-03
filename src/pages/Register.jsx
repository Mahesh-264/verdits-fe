import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import api from '../api/axios.jsx';
import { FaMapMarkerAlt, FaSpinner, FaUser, FaGavel } from "react-icons/fa";

export default function Register() {
    const navigate = useNavigate();
    const [role, setRole] = useState('user');
    const [loadingAddr, setLoadingAddr] = useState(false);

    // Initial State updated to match Backend Schema
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        password: '',
        role: 'user',

        // Lawyer Specific Fields
        barId: '',
        specialization: '',
        experienceYears: '',
        about: '',
        languages: '',
        consultationFee: '',

        // Address
        address: {
            latitude: null, longitude: null, pincode: '',
            state: '', district: '', city: '', country: 'India'
        }
    });

    // 1. Auto-detect Location on Mount
    useEffect(() => {
        if (navigator.geolocation) {
            setLoadingAddr(true);
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                updateAddressField('latitude', latitude);
                updateAddressField('longitude', longitude);

                try {
                    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                    const addr = res.data.address;
                    setFormData(prev => ({
                        ...prev,
                        address: {
                            ...prev.address,
                            pincode: addr.postcode || '',
                            state: addr.state || '',
                            district: addr.state_district || addr.county || '',
                            city: addr.city || addr.town || addr.village || '',
                        }
                    }));
                } catch (err) { console.error("Geocode error", err); }
                setLoadingAddr(false);
            }, () => setLoadingAddr(false));
        }
    }, []);

    // 2. Fetch Address via Pincode
    const handlePincodeBlur = async () => {
        if (formData.address.pincode.length === 6) {
            setLoadingAddr(true);
            try {
                const res = await axios.get(`https://nominatim.openstreetmap.org/search?postalcode=${formData.address.pincode}&country=india&format=json&addressdetails=1`);
                if (res.data.length > 0) {
                    const addr = res.data[0].address;
                    setFormData(prev => ({
                        ...prev,
                        address: {
                            ...prev.address,
                            state: addr.state || '',
                            district: addr.state_district || addr.county || '',
                            city: addr.city || addr.town || addr.village || '',
                            latitude: res.data[0].lat,
                            longitude: res.data[0].lon
                        }
                    }));
                }
            } catch (err) { console.error("Pincode error", err); }
            setLoadingAddr(false);
        }
    };

    const updateAddressField = (field, value) => {
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address, [field]: value }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Prepare Payload
            const payload = {
                name: formData.name,
                phone: formData.phone,
                password: formData.password,
                role: role,
                address: formData.address,
            };

            // Add Lawyer specific data if role is lawyer
            if (role === 'lawyer') {
                payload.barId = formData.barId;
                payload.specialization = formData.specialization;
                payload.experienceYears = Number(formData.experienceYears);
                payload.about = formData.about;
                payload.consultationFee = Number(formData.consultationFee);
                // Convert comma-separated string to array
                payload.languages = formData.languages.split(',').map(lang => lang.trim());
            }

            await api.post('/auth/register', payload);
            alert('Registration Successful! Please Login.');
            navigate('/login');
        } catch (err) {
            alert(err.response?.data?.message || 'Signup Failed');
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center justify-center gap-3 mb-6">
                    {role === 'user' ? <FaUser className="text-blue-500 text-3xl" /> : <FaGavel className="text-amber-500 text-3xl" />}
                    <h2 className="text-3xl font-bold text-white">Create Account</h2>
                </div>

                {/* Role Switcher */}
                <div className="flex bg-zinc-800 p-1 rounded-xl mb-8">
                    {['user', 'lawyer'].map(r => (
                        <button
                            key={r}
                            onClick={() => setRole(r)}
                            className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-300 ${role === r ? (r === 'lawyer' ? 'bg-amber-600 text-white shadow-lg' : 'bg-blue-600 text-white shadow-lg') : 'text-zinc-400 hover:text-zinc-200'}`}
                        >
                            {r === 'lawyer' ? 'I am a Lawyer' : 'I am a User'}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* --- Common Fields --- */}
                    <div className="md:col-span-2 space-y-4">
                        <h3 className="text-zinc-500 text-sm font-bold uppercase tracking-wider">Personal Info</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Full Name" required
                                className="bg-zinc-800 text-white p-3 rounded-xl border border-zinc-700 focus:border-blue-500 outline-none w-full"
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                            <input type="text" placeholder="Phone Number" required
                                className="bg-zinc-800 text-white p-3 rounded-xl border border-zinc-700 focus:border-blue-500 outline-none w-full"
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                            <input type="password" placeholder="Password" required
                                className="bg-zinc-800 text-white p-3 rounded-xl border border-zinc-700 focus:border-blue-500 outline-none w-full md:col-span-2"
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* --- Address Section --- */}
                    <div className="md:col-span-2 space-y-4 pt-2 border-t border-zinc-800">
                        <div className="flex items-center text-zinc-400 mb-2">
                            <FaMapMarkerAlt className="mr-2" />
                            <span className="font-semibold text-sm uppercase">Location</span>
                            {loadingAddr && <FaSpinner className="animate-spin ml-3 text-blue-500" />}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <input type="text" placeholder="Pincode" value={formData.address.pincode} onBlur={handlePincodeBlur}
                                onChange={e => updateAddressField('pincode', e.target.value)}
                                className="bg-zinc-800 text-white p-3 rounded-xl border border-zinc-700 focus:border-blue-500 outline-none"
                            />
                            <input type="text" placeholder="City" value={formData.address.city} readOnly
                                className="bg-zinc-800 text-zinc-400 p-3 rounded-xl border border-zinc-700 outline-none cursor-not-allowed"
                            />
                            <input type="text" placeholder="State" value={formData.address.state} readOnly
                                className="bg-zinc-800 text-zinc-400 p-3 rounded-xl border border-zinc-700 outline-none cursor-not-allowed"
                            />
                            <input type="text" placeholder="Country" value={formData.address.country} readOnly
                                className="bg-zinc-800 text-zinc-400 p-3 rounded-xl border border-zinc-700 outline-none cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* --- Lawyer Specific Fields --- */}
                    {role === 'lawyer' && (
                        <div className="md:col-span-2 space-y-4 pt-2 border-t border-zinc-800 animate-in fade-in slide-in-from-top-4 duration-500">
                            <h3 className="text-amber-500 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                <FaGavel /> Professional Profile
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input type="text" placeholder="Bar Council ID" required
                                    className="bg-zinc-800 text-white p-3 rounded-xl border border-zinc-700 focus:border-amber-500 outline-none"
                                    onChange={e => setFormData({ ...formData, barId: e.target.value })}
                                />
                                <select
                                    className="bg-zinc-800 text-white p-3 rounded-xl border border-zinc-700 focus:border-amber-500 outline-none"
                                    onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                    required
                                >
                                    <option value="">Select Specialization</option>
                                    <option value="Criminal">Criminal Law</option>
                                    <option value="Civil">Civil Law</option>
                                    <option value="Family">Family/Marital Law</option>
                                    <option value="Corporate">Corporate Law</option>
                                    <option value="Property">Property Law</option>
                                </select>
                                <input type="number" placeholder="Experience (Years)" required
                                    className="bg-zinc-800 text-white p-3 rounded-xl border border-zinc-700 focus:border-amber-500 outline-none"
                                    onChange={e => setFormData({ ...formData, experienceYears: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" placeholder="Languages (e.g. Hindi, English)" required
                                    className="bg-zinc-800 text-white p-3 rounded-xl border border-zinc-700 focus:border-amber-500 outline-none"
                                    onChange={e => setFormData({ ...formData, languages: e.target.value })}
                                />
                                <input type="number" placeholder="Consultation Fee (₹/min)" required
                                    className="bg-zinc-800 text-white p-3 rounded-xl border border-zinc-700 focus:border-amber-500 outline-none"
                                    onChange={e => setFormData({ ...formData, consultationFee: e.target.value })}
                                />
                            </div>

                            <textarea
                                placeholder="About You (Short bio for clients)"
                                className="w-full bg-zinc-800 text-white p-3 rounded-xl border border-zinc-700 focus:border-amber-500 outline-none h-24 resize-none"
                                onChange={e => setFormData({ ...formData, about: e.target.value })}
                            ></textarea>
                        </div>
                    )}

                    <button
                        type="submit"
                        className={`md:col-span-2 w-full font-bold py-4 rounded-xl mt-4 transition-all active:scale-95 shadow-lg
                        ${role === 'lawyer' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                        Register as {role === 'lawyer' ? 'Lawyer' : 'User'}
                    </button>
                </form>

                <p className="text-center text-zinc-500 mt-6">
                    Already have an account? <Link to="/login" className="text-white hover:underline font-medium">Login</Link>
                </p>
            </div>
        </div>
    );
}