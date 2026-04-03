import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import api from '../api/axios.jsx';
import { FaMapMarkerAlt, FaSpinner, FaUser, FaGavel, FaUserGraduate } from "react-icons/fa";

export default function Register() {
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role') || 'user';
    const navigate = useNavigate();
    
    const [loadingAddr, setLoadingAddr] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        
        // Lawyer Specific
        barId: '',
        specialization: '',
        experienceYears: '',
        languages: '',
        
        // Student Specific
        collegeName: '',
        collegeEmail: '',

        // Address
        address: {
            latitude: null, longitude: null, pincode: '',
            state: '', district: '', city: '', country: 'India'
        }
    });

    useEffect(() => {
        if (role === 'lawyer' && navigator.geolocation) {
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
    }, [role]);

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
        setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, role };
            
            if (role === 'lawyer') {
                payload.experienceYears = Number(formData.experienceYears);
                payload.languages = formData.languages.split(',').map(lang => lang.trim());
            }

            await api.post('/auth/register', payload);
            alert('Registration Successful! Please Login.');
            navigate(`/login?role=${role}`);
        } catch (err) {
            alert(err.response?.data?.message || 'Signup Failed');
        }
    };

    const getIcon = () => {
        if (role === 'lawyer') return <FaGavel className="text-amber-500 text-3xl" />;
        if (role === 'student') return <FaUserGraduate className="text-emerald-500 text-3xl" />;
        return <FaUser className="text-blue-500 text-3xl" />;
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans text-white py-12">
            <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center justify-center gap-3 mb-8">
                    {getIcon()}
                    <h2 className="text-3xl font-bold capitalize">{role} Registration</h2>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Common Name Fields */}
                    <input type="text" placeholder="First Name" required
                        className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-blue-500 outline-none w-full"
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    />
                    <input type="text" placeholder="Last Name" required
                        className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-blue-500 outline-none w-full"
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    />
                    <input type="email" placeholder="Personal Email ID" required
                        className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-blue-500 outline-none w-full md:col-span-2"
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />

                    {/* Mobile Number - required for everyone */}
                    <div className="md:col-span-2 flex gap-4">
                        <input type="text" placeholder="Mobile Number" required
                            className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-blue-500 outline-none flex-1"
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                        {/* Student specific static button without logic per request */}
                        {role === 'student' && (
                            <button type="button" className="px-6 py-3 bg-zinc-700 text-zinc-400 rounded-xl font-bold whitespace-nowrap cursor-not-allowed">
                                Verify Mobile
                            </button>
                        )}
                    </div>

                    {/* Password - Everyone */}
                    <input type="password" placeholder="Password" required
                        className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-blue-500 outline-none w-full md:col-span-2"
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />

                    {/* Lawyer Fields */}
                    {role === 'lawyer' && (
                        <>
                            <input type="text" placeholder="Bar Council Number" required
                                className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-amber-500 outline-none"
                                onChange={e => setFormData({ ...formData, barId: e.target.value })}
                            />
                            <input type="text" placeholder="Specialization (e.g. Criminal, Civil)" required
                                className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-amber-500 outline-none"
                                onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                            />
                            <input type="text" placeholder="Languages Known (comma separated)" required
                                className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-amber-500 outline-none"
                                onChange={e => setFormData({ ...formData, languages: e.target.value })}
                            />
                            <input type="number" placeholder="Experience (Years)" required
                                className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-amber-500 outline-none"
                                onChange={e => setFormData({ ...formData, experienceYears: e.target.value })}
                            />

                            <div className="md:col-span-2 space-y-4 pt-4 border-t border-zinc-800">
                                <div className="flex items-center text-zinc-400">
                                    <FaMapMarkerAlt className="mr-2" />
                                    <span className="font-semibold text-sm uppercase">Location & Pincode</span>
                                    {loadingAddr && <FaSpinner className="animate-spin ml-3 text-amber-500" />}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Pincode" value={formData.address.pincode} onBlur={handlePincodeBlur}
                                        onChange={e => updateAddressField('pincode', e.target.value)}
                                        className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-amber-500 outline-none"
                                    />
                                    <input type="text" placeholder="City" value={formData.address.city} readOnly
                                        className="bg-zinc-800 text-zinc-400 p-3 rounded-xl border border-zinc-700 outline-none"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Student Fields */}
                    {role === 'student' && (
                        <>
                            <input type="text" placeholder="College Name" required
                                className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-emerald-500 outline-none"
                                onChange={e => setFormData({ ...formData, collegeName: e.target.value })}
                            />
                            <input type="email" placeholder="College Email Address" required
                                className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-emerald-500 outline-none"
                                onChange={e => setFormData({ ...formData, collegeEmail: e.target.value })}
                            />
                        </>
                    )}

                    <button type="submit" className={`md:col-span-2 w-full font-bold py-4 rounded-xl mt-6 transition-all shadow-lg text-white
                        ${role === 'lawyer' ? 'bg-amber-600 hover:bg-amber-700' : role === 'student' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        Create Account
                    </button>
                </form>

                <p className="text-center text-zinc-500 mt-6">
                    Already have an account? <Link to={`/login?role=${role}`} className="text-white hover:underline font-medium">Login</Link>
                </p>
                <div className="mt-4 text-center">
                    <Link to="/" className="text-zinc-600 hover:text-zinc-400 text-sm transition">
                        &larr; Back to Role Selection
                    </Link>
                </div>
            </div>
        </div>
    );
}