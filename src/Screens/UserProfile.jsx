import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  Calendar,
  Edit2,
  LogOut,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Save,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { updateUser } from '../redux/authSlice';
import useSessionLogout from '../hooks/useSessionLogout';
import AppHeader from '../components/AppHeader.jsx';

// Shared profile editor for users and lawyers, including location refresh for discovery accuracy.
const UserProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isLawyer = user?.role === 'lawyer';
  const dashboardHome = isLawyer ? '/lawyer-dash' : '/user-home';
  const [teamWorkspace, setTeamWorkspace] = useState(null);
  // Legacy profile data remains a fallback until every deployed account has
  // been migrated. The normalized workspace API is authoritative.
  const lawyerTeam = teamWorkspace || user?.lawyerProfile?.team || null;
  const hasTeam = Boolean(lawyerTeam?.teamCode);
  const isTeamOwner = lawyerTeam?.role === 'owner';
  const teamMembers = Array.isArray(lawyerTeam?.members) ? lawyerTeam.members : [];
  const teamSize = isTeamOwner ? teamMembers.length + 1 : hasTeam ? 1 : 0;

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    age: user?.age || '',
    gender: user?.gender || '',
    email: user?.email || '',
    phone: user?.phone || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    country: user?.address?.country || 'India',
    latitude: user?.address?.latitude || '',
    longitude: user?.address?.longitude || '',
    barId: user?.lawyerProfile?.barId || '',
    specialization: user?.lawyerProfile?.specialization || '',
    experienceYears: user?.lawyerProfile?.experienceYears || '',
    languages: Array.isArray(user?.lawyerProfile?.languages) ? user.lawyerProfile.languages.join(', ') : '',
    consultationFee: user?.lawyerProfile?.consultationFee || '',
    about: user?.lawyerProfile?.about || '',
    isOnline: Boolean(user?.lawyerProfile?.isOnline),
  });

  useEffect(() => {
    if (!isLawyer) return undefined;
    let active = true;
    api.get('/teams/workspace')
      .then(({ data }) => {
        if (active && data?.team) setTeamWorkspace(data.team);
      })
      .catch((error) => console.error('Error loading normalized team workspace:', error));
    return () => { active = false; };
  }, [isLawyer]);

  const handleLogout = useSessionLogout(user?.role);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser location is not supported on this device.');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLatitude = Number(position.coords.latitude).toFixed(6);
        const nextLongitude = Number(position.coords.longitude).toFixed(6);

        setFormData((current) => ({
          ...current,
          latitude: nextLatitude,
          longitude: nextLongitude,
        }));

        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${nextLatitude}&lon=${nextLongitude}&format=json`
          );
          const address = response.data?.address || {};

          setFormData((current) => ({
            ...current,
            city: address.city || address.town || address.village || current.city,
            state: address.state || current.state,
            country: address.country || current.country,
            latitude: nextLatitude,
            longitude: nextLongitude,
          }));
        } catch (error) {
          console.error('Error reverse geocoding current location:', error);
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error('Error getting browser location:', error);
        setLoadingLocation(false);
        alert('Unable to access your location right now.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: formData.age,
        gender: formData.gender,
        email: formData.email,
        address: {
          city: formData.city,
          state: formData.state,
          country: formData.country,
          latitude: formData.latitude,
          longitude: formData.longitude,
        },
      };

      if (isLawyer) {
        payload.lawyerProfile = {
          barId: formData.barId,
          specialization: formData.specialization,
          experienceYears: formData.experienceYears,
          languages: formData.languages,
          consultationFee: formData.consultationFee,
          about: formData.about,
          isOnline: formData.isOnline,
        };
      }

      const response = await api.put('/auth/update-profile', payload);
      dispatch(updateUser(response.data.user));
      setIsEditing(false);
      alert('Profile updated successfully.');
    } catch (error) {
      console.error('Update failed', error);
      alert(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const renderField = ({ icon, label, name, value, type = 'text', readOnly = false }) => {
    const FieldIcon = icon;

    return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500">
          <FieldIcon size={18} />
        </div>
        <div className="flex-1">
          <p className="mb-1 text-xs font-medium text-gray-400">{label}</p>
          {isEditing && !readOnly ? (
            <input
              type={type}
              name={name}
              value={value}
              onChange={handleChange}
              className="w-full border-b border-[#15a276] pb-1 text-lg font-semibold text-gray-800 outline-none"
            />
          ) : (
            <p className="text-lg font-semibold text-gray-800">{value || 'Not set'}</p>
          )}
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f3f8fb] pb-10">
      <AppHeader variant={isLawyer ? 'lawyer' : 'user'} profileTo="/profile">
        {isEditing ? (
          <button onClick={() => setIsEditing(false)} className="text-[#6f633f] hover:text-[#0d1117]">
            <X />
          </button>
        ) : (
          <div className="w-6" />
        )}
      </AppHeader>

      <div className="mx-auto max-w-3xl px-4">
        <button
          type="button"
          onClick={() => navigate(dashboardHome, { replace: true })}
          className="my-4 inline-flex items-center gap-2 rounded-2xl border border-[#d7e9ef] bg-white px-4 py-3 text-sm font-bold text-[#062552] shadow-sm transition hover:border-[#15a276]"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="relative mb-6 rounded-b-[2.5rem] bg-white px-6 pb-8 pt-5 text-center shadow-sm">
          <div className="mx-auto h-24 w-24 rounded-full border-2 border-[#15a276] p-1">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt="Profile"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#e8f7f2] text-[#15a276]">
                <User size={42} />
              </div>
            )}
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            {`${formData.firstName} ${formData.lastName}`.trim() || 'Profile'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 capitalize">{user?.role || 'user'} account</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {renderField({ icon: User, label: 'First Name', name: 'firstName', value: formData.firstName })}
          {renderField({ icon: User, label: 'Last Name', name: 'lastName', value: formData.lastName })}
          {renderField({ icon: Calendar, label: 'Age', name: 'age', value: formData.age, type: 'number' })}
          {renderField({ icon: User, label: 'Gender', name: 'gender', value: formData.gender })}
          {renderField({ icon: Mail, label: 'Email', name: 'email', value: formData.email, type: 'email' })}
          {renderField({ icon: Phone, label: 'Phone', name: 'phone', value: formData.phone, readOnly: true })}
          {renderField({ icon: MapPin, label: 'City', name: 'city', value: formData.city })}
          {renderField({ icon: MapPin, label: 'State', name: 'state', value: formData.state })}
          {renderField({ icon: MapPin, label: 'Country', name: 'country', value: formData.country })}
        </div>

        {isLawyer ? (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff4cf] text-[#062552]">
                <Users size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-[#0b1f44]">My Team</h2>
                    <p className="mt-1 text-sm text-[#5e6c87]">
                      {hasTeam
                        ? `${isTeamOwner ? 'Team Owner' : 'Team Member'} at ${lawyerTeam.firmName || 'your team'}.`
                        : 'Create a team or join one with a Team Owner code.'}
                    </p>
                  </div>
                  {hasTeam ? (
                    <span className="rounded-full bg-[#e8f7f2] px-3 py-1 text-sm font-bold text-[#14795d]">
                      {isTeamOwner ? 'Owner' : 'Member'}
                    </span>
                  ) : null}
                </div>

                {hasTeam ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-xs font-medium text-gray-400">Firm</p>
                      <p className="mt-1 font-semibold text-gray-900">{lawyerTeam.firmName || 'Not set'}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-xs font-medium text-gray-400">Team Code</p>
                      <p className="mt-1 font-mono font-bold tracking-wider text-gray-900">{lawyerTeam.teamCode}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-xs font-medium text-gray-400">Team Size</p>
                      <p className="mt-1 font-semibold text-gray-900">{teamSize}/{lawyerTeam.maxTeamSize || teamSize}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => navigate('/lawyer-dash?section=team&mode=create')}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#15a276] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#12845f]"
                    >
                      <Users size={18} />
                      Create a team
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/lawyer-dash?section=team&mode=join')}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d7e9ef] bg-white px-4 py-3 text-sm font-bold text-[#062552] transition hover:border-[#15a276]"
                    >
                      <UserPlus size={18} />
                      Join a team
                    </button>
                  </div>
                )}

                {hasTeam ? (
                  <button
                    type="button"
                    onClick={() => navigate('/lawyer-dash?section=team')}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d7e9ef] bg-white px-4 py-3 text-sm font-bold text-[#062552] transition hover:border-[#15a276]"
                  >
                    Manage Team
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {isLawyer ? (
          <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#0b1f44]">Lawyer Discovery Settings</h2>
                <p className="mt-1 text-sm text-[#5e6c87]">
                  Keep these details updated so clients can discover you accurately nearby.
                </p>
              </div>
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={loadingLocation}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#15a276] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#fff2bf] disabled:opacity-60"
                >
                  <Navigation size={16} />
                  {loadingLocation ? 'Updating location...' : 'Use current location'}
                </button>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {renderField({ icon: User, label: 'Bar ID', name: 'barId', value: formData.barId })}
              {renderField({ icon: User, label: 'Specialization', name: 'specialization', value: formData.specialization })}
              {renderField({ icon: Calendar, label: 'Experience (years)', name: 'experienceYears', value: formData.experienceYears, type: 'number' })}
              {renderField({ icon: User, label: 'Languages', name: 'languages', value: formData.languages })}
              {renderField({ icon: User, label: 'Consultation Fee', name: 'consultationFee', value: formData.consultationFee, type: 'number' })}
            </div>

            <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-2 text-xs font-medium text-gray-400">About</p>
              {isEditing ? (
                <textarea
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800 outline-none focus:border-[#15a276]"
                />
              ) : (
                <p className="text-sm leading-7 text-gray-700">{formData.about || 'No bio added yet.'}</p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div>
                <p className="font-semibold text-gray-900">Available for instant consult</p>
                <p className="text-sm text-gray-500">This controls whether you appear on the nearby online consult list.</p>
              </div>
              {isEditing ? (
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    name="isOnline"
                    checked={formData.isOnline}
                    onChange={handleChange}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    {formData.isOnline ? 'Online' : 'Offline'}
                  </span>
                </label>
              ) : (
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${formData.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                  {formData.isOnline ? 'Online' : 'Offline'}
                </span>
              )}
            </div>
          </section>
        ) : null}

        {!isLawyer && isEditing ? (
          <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={loadingLocation}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#15a276] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#fff2bf] disabled:opacity-60"
            >
              <Navigation size={16} />
              {loadingLocation ? 'Updating location...' : 'Use current location'}
            </button>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3">
          {isEditing ? (
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#15a276] py-4 font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-60"
            >
              <Save size={20} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#15a276] py-4 font-bold text-white shadow-lg transition-colors hover:bg-[#12845f] active:scale-[0.98] select-none touch-manipulation"
            >
              <Edit2 size={20} />
              Edit Profile
            </button>
          )}

          {!isEditing ? (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 hover:bg-red-700 py-4 font-bold text-white shadow-lg transition-colors select-none touch-manipulation active:scale-[0.98]"
            >
              <LogOut size={20} />
              Logout
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
