import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, User, Calendar, Mail, Phone, MapPin, LogOut, Edit2, Save, X } from 'lucide-react';
import api from '../api/axios';
import { updateUser, logout } from '../redux/authSlice';

const UserProfile = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State (initialized with Redux user data)
    const [formData, setFormData] = useState({
        name: user?.name || '',
        age: user?.age || '',
        gender: user?.gender || '',
        email: user?.email || '',
        phone: user?.phone || '',
        // Flatten address for easier editing
        city: user?.address?.city || '',
        country: user?.address?.country || 'India'
    });

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            // Construct payload matching your backend structure
            const payload = {
                name: formData.name,
                age: formData.age,
                gender: formData.gender,
                email: formData.email,
                address: {
                    city: formData.city,
                    country: formData.country
                }
            };

            const res = await api.put('/auth/update-profile', payload);

            // Update Redux Store immediately
            dispatch(updateUser(res.data.user));
            setIsEditing(false);
            alert("Profile Updated Successfully!");
        } catch (error) {
            console.error("Update failed", error);
            alert("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    // Reusable Card Component for Fields
    const ProfileField = ({ icon: Icon, label, name, value, type = "text" }) => (
        <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-4 border border-gray-100">
            <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 shrink-0">
                <Icon size={20} />
            </div>
            <div className="flex-1">
                <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
                {isEditing && name !== 'phone' ? ( // Phone usually shouldn't be editable
                    <input
                        type={type}
                        name={name}
                        value={value}
                        onChange={handleChange}
                        className="w-full text-gray-800 font-semibold border-b border-blue-500 outline-none pb-1"
                    />
                ) : (
                    <p className="text-gray-800 font-semibold text-lg">{value || "Not set"}</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center pb-10">

            {/* Header */}
            <div className="w-full bg-black text-white p-4 flex items-center justify-between shadow-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <ArrowLeft onClick={() => navigate(-1)} className="cursor-pointer hover:text-gray-300" />
                    <span className="text-xl font-bold tracking-wide">Nyaya Setu</span>
                </div>
                {isEditing ? (
                    <div className="flex gap-4">
                        <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white"><X /></button>
                    </div>
                ) : (
                    <div className="w-6"></div> // Spacer
                )}
            </div>

            {/* Profile Avatar Section */}
            <div className="w-full bg-white pb-8 pt-4 flex flex-col items-center rounded-b-[2.5rem] shadow-sm mb-6 relative">
                <div className="h-24 w-24 rounded-full p-1 border-2 border-blue-500">
                    <img
                        src={user?.profileImage || `https://ui-avatars.com/api/?name=${formData.name}&background=0D8ABC&color=fff`}
                        alt="Profile"
                        className="h-full w-full rounded-full object-cover"
                    />
                </div>
                {/* Visual purple circle from design */}
                <div className="absolute top-0 w-20 h-10 bg-purple-600 rounded-b-full blur-xl opacity-20"></div>
            </div>

            {/* Fields Container */}
            <div className="w-full max-w-md px-4 flex flex-col gap-4">

                <ProfileField icon={User} label="Name" name="name" value={formData.name} />

                <ProfileField icon={Calendar} label="Age" name="age" value={formData.age} type="number" />

                <ProfileField icon={User} label="Gender" name="gender" value={formData.gender} />

                <ProfileField icon={Mail} label="Email" name="email" value={formData.email} type="email" />

                <ProfileField icon={Phone} label="Phone" name="phone" value={formData.phone} />

                <ProfileField icon={MapPin} label="Location" name="city" value={`${formData.city}${formData.city && formData.country ? ', ' : ''}${formData.country}`} />

            </div>

            {/* Buttons */}
            <div className="w-full max-w-md px-4 mt-8 flex flex-col gap-3">
                {isEditing ? (
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
                    >
                        {loading ? "Saving..." : <><Save size={20} /> Save Changes</>}
                    </button>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
                    >
                        <Edit2 size={20} /> Edit Profile
                    </button>
                )}

                {!isEditing && (
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
                    >
                        <LogOut size={20} /> Logout
                    </button>
                )}
            </div>

        </div>
    );
};

export default UserProfile;