import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BriefcaseBusiness, GraduationCap, MapPin, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios.jsx';
import { updateUser } from '../redux/authSlice.jsx';
import ReactionBar from '../components/feed/ReactionBar.jsx';
import StudentLayout from './StudentLayout.jsx';

const getDisplayName = (user) => {
  if (!user) return 'Student';
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return fullName || user.name || 'Student';
};

const getStringList = (value) => (
  Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : []
);

const getInternships = (value) => (
  Array.isArray(value)
    ? value.filter((item) => item && typeof item === 'object').map((item) => ({ ...item }))
    : []
);

const getInitialFormState = (user) => ({
  firstName: user?.firstName || '',
  lastName: user?.lastName || '',
  email: user?.email || '',
  city: user?.address?.city || '',
  district: user?.address?.district || '',
  bio: user?.studentProfile?.bio || '',
  currentYear: user?.studentProfile?.currentYear || '',
  collegeName: user?.studentProfile?.collegeName || '',
  collegeEmail: user?.studentProfile?.collegeEmail || '',
  specializations: getStringList(user?.studentProfile?.specializations).join(', '),
  skills: getStringList(user?.studentProfile?.skills).join(', '),
  internships: getInternships(user?.studentProfile?.internships),
});

export default function StudentProfile() {
  const { user } = useSelector((state) => state.auth);
  const { id: profileId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [viewedStudent, setViewedStudent] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(Boolean(profileId));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(() => getInitialFormState(user));

  const isOwnProfile = !profileId || String(profileId) === String(user?._id || user?.id);
  const profileUser = isOwnProfile ? user : viewedStudent;
  const studentName = useMemo(() => getDisplayName(profileUser), [profileUser]);
  const collegeName = profileUser?.studentProfile?.collegeName || 'National Law School of India University, Bangalore';
  const cityLabel = profileUser?.address?.city || profileUser?.address?.district || 'Location not added';
  const studentBio = profileUser?.studentProfile?.bio || 'Build your student profile, update your academic details, and keep your VERDITS presence current.';
  const specializations = getStringList(profileUser?.studentProfile?.specializations);
  const skills = getStringList(profileUser?.studentProfile?.skills);
  const internships = getInternships(profileUser?.studentProfile?.internships);
  const currentYearLabel = profileUser?.studentProfile?.currentYear || 'Not added yet';
  const profileReactionItem = useMemo(() => ({
    id: profileUser?._id || profileUser?.id || 'student-profile',
    title: `${studentName}'s student profile`,
    likesCount: profileUser?.studentProfile?.profileLikesCount || 0,
    commentsCount: profileUser?.studentProfile?.profileCommentsCount || 0,
    comments: [],
  }), [profileUser, studentName]);

  useEffect(() => {
    const loadViewedStudent = async () => {
      if (isOwnProfile) {
        setViewedStudent(null);
        setIsLoadingProfile(false);
        return;
      }

      try {
        setIsLoadingProfile(true);
        const { data } = await api.get('/auth/students');
        const match = (Array.isArray(data?.students) ? data.students : []).find((student) =>
          String(student._id || student.id) === String(profileId)
        );
        setViewedStudent(match || null);
      } catch (error) {
        console.error('Error loading student profile:', error);
        setViewedStudent(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadViewedStudent();
  }, [isOwnProfile, profileId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleInternshipChange = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      internships: current.internships.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addInternshipField = () => {
    setFormData((current) => ({
      ...current,
      internships: [
        ...current.internships,
        { role: '', org: '', period: '', description: '' },
      ],
    }));
  };

  const removeInternshipField = (index) => {
    setFormData((current) => ({
      ...current,
      internships: current.internships.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const openEditor = () => {
    if (!isOwnProfile) return;
    setFormData(getInitialFormState(user));
    setIsEditing(true);
  };

  const openInternshipEditor = () => {
    if (!isOwnProfile) return;
    const nextFormData = getInitialFormState(user);
    if (!nextFormData.internships.length) {
      nextFormData.internships = [{ role: '', org: '', period: '', description: '' }];
    }
    setFormData(nextFormData);
    setIsEditing(true);
  };

  const closeEditor = () => {
    setIsEditing(false);
    setFormData(getInitialFormState(user));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setIsSaving(true);

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        address: {
          city: formData.city,
          district: formData.district,
        },
        studentProfile: {
          bio: formData.bio,
          currentYear: formData.currentYear,
          collegeName: formData.collegeName,
          collegeEmail: formData.collegeEmail,
          specializations: formData.specializations.split(',').map((item) => item.trim()).filter(Boolean),
          skills: formData.skills.split(',').map((item) => item.trim()).filter(Boolean),
          internships: formData.internships
            .map((item) => ({
              role: item.role?.trim(),
              org: item.org?.trim(),
              period: item.period?.trim(),
              description: item.description?.trim(),
            }))
            .filter((item) => item.role || item.org || item.period || item.description),
        },
      };

      const { data } = await api.put('/auth/update-profile', payload);
      dispatch(updateUser(data.user));
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating student profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const Field = ({ label, children, fullWidth = false }) => (
    <label className={fullWidth ? 'md:col-span-2' : ''}>
      <span className="block text-sm font-semibold text-[#44516d] mb-2">{label}</span>
      {children}
    </label>
  );

  if (isLoadingProfile) {
    return (
      <StudentLayout>
        <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-8 text-[#5e6c87] shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
          Loading student profile...
        </div>
      </StudentLayout>
    );
  }

  if (!profileUser) {
    return (
      <StudentLayout>
        <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-8 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
          <h1 className="text-2xl font-semibold">Student profile not found</h1>
          <p className="mt-2 text-[#5e6c87]">This student may no longer be available in your network list.</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-8">
        <button
          type="button"
          onClick={() => navigate('/student-home', { replace: true })}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#d7e9ef] bg-white px-4 py-3 text-sm font-bold text-[#062552] shadow-sm transition hover:border-[#15a276]"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <section className="rounded-[28px] border border-[#dbe2ef] bg-white overflow-hidden shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
          <div className="h-40 bg-gradient-to-r from-[#15a276] to-[#15a276]" />
          <div className="p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="-mt-20 h-36 w-36 rounded-full border-[6px] border-white bg-gradient-to-br from-[#ff8a80] to-[#b71c1c] text-white flex items-center justify-center text-4xl font-bold shrink-0">
                  {studentName.charAt(0).toUpperCase()}
                </div>
                <div className="pt-2">
                  <h1 className="text-4xl font-bold">{studentName}</h1>
                  <p className="mt-3 text-[18px] leading-8 text-[#44516d] max-w-3xl">
                    {studentBio}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-6 text-[#5e6c87] text-[18px]">
                    <div className="inline-flex items-center gap-2">
                      <GraduationCap size={18} />
                      {collegeName}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <MapPin size={18} />
                      {currentYearLabel}
                    </div>
                  </div>
                </div>
              </div>

              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={openEditor}
                  className="rounded-2xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 px-6 py-4 text-[18px] font-bold transition shadow-sm border border-[#d6b85b]"
                >
                  Edit Profile
                </button>
              ) : null}
            </div>

            <div className="mt-8 border-t border-[#e9eef7] pt-5">
              <ReactionBar item={profileReactionItem} itemLabel="student profile" compact />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-8">
          <div className="space-y-8">
            <section className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
              <h2 className="text-[22px] font-semibold">Specialization</h2>
              <div className="flex flex-wrap gap-3 mt-8">
                {specializations.length ? specializations.map((item) => (
                  <span key={item} className="rounded-full bg-[#e8f7f2] px-4 py-2 text-[#15a276] font-medium">
                    {item}
                  </span>
                )) : (
                  <div>
                    <p className="text-[#5e6c87]">No specializations added yet.</p>
                    {isOwnProfile && <button type="button" onClick={openEditor} className="mt-3 text-sm font-semibold text-[#15a276] hover:underline">Add specializations</button>}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
              <h2 className="text-[22px] font-semibold">Skills</h2>
              <div className="flex flex-wrap gap-3 mt-8">
                {skills.length ? skills.map((item) => (
                  <span key={item} className="rounded-full border border-[#dbe2ef] px-4 py-2 text-[16px] font-medium">
                    {item}
                  </span>
                )) : (
                  <div>
                    <p className="text-[#5e6c87]">No skills added yet.</p>
                    {isOwnProfile && <button type="button" onClick={openEditor} className="mt-3 text-sm font-semibold text-[#15a276] hover:underline">Add skills</button>}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
              <h2 className="text-[22px] font-semibold">Academic Details</h2>
              <div className="mt-8 space-y-6 text-[18px] text-[#44516d]">
                <div>
                  <p className="font-semibold text-[#0b1f44]">College</p>
                  <p className="mt-2">{profileUser?.studentProfile?.collegeName || 'Not added yet'}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#0b1f44]">College Email</p>
                  <p className="mt-2">{profileUser?.studentProfile?.collegeEmail || 'Not added yet'}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#0b1f44]">Email</p>
                  <p className="mt-2">{profileUser?.email || 'Not added yet'}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#0b1f44]">Location</p>
                  <p className="mt-2">{cityLabel}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#0b1f44]">Current Year</p>
                  <p className="mt-2">{currentYearLabel}</p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 md:p-8 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[22px] font-semibold">Internship Experience</h2>
                  <p className="text-[#5e6c87] text-[18px] mt-2">
                    {internships.length
                      ? `${internships.length} ${internships.length === 1 ? 'internship' : 'internships'} added`
                      : 'Add your internship experience'}
                  </p>
                </div>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={openInternshipEditor}
                    className="rounded-2xl border border-[#dbe2ef] px-5 py-3 text-[18px] font-semibold hover:bg-[#f8faff] transition"
                  >
                    Add Internship
                  </button>
                )}
              </div>

              <div className="mt-8 space-y-10">
                {internships.length ? internships.map((item, index) => (
                  <div key={`${item.role}-${item.org}-${index}`} className="flex items-start gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-[#e8f7f2] text-[#15a276] flex items-center justify-center shrink-0">
                      <BriefcaseBusiness size={28} />
                    </div>
                    <div>
                      <h3 className="text-[20px] font-semibold">{item.role}</h3>
                      <p className="text-[18px] text-[#44516d] mt-1">{item.org}</p>
                      <p className="text-[18px] text-[#5e6c87] mt-2">{item.period}</p>
                      <p className="text-[18px] leading-9 text-[#243b67] mt-4">{item.description}</p>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-[#dbe2ef] p-6 text-[#5e6c87]">
                    <p>No internship experience added yet.</p>
                    {isOwnProfile && <button type="button" onClick={openInternshipEditor} className="mt-3 text-sm font-semibold text-[#15a276] hover:underline">Add your first internship</button>}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-6xl max-h-[92vh] rounded-[28px] border border-[#dbe2ef] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-[#e4ebf5] px-6 py-5 md:px-8">
              <div>
                <h2 className="text-2xl font-semibold">Edit Student Profile</h2>
                <p className="text-[#5e6c87] mt-2">Update your student details and save them to your account.</p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="h-10 w-10 rounded-full border border-[#dbe2ef] flex items-center justify-center text-[#44516d] hover:bg-[#f8faff] transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col max-h-[calc(92vh-88px)]">
              <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="rounded-2xl bg-[#f8faff] border border-[#dbe2ef] p-5 self-start">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <p className="text-sm text-[#5e6c87] mt-1">Update how your profile appears across the student module.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <Field label="First Name">
                    <input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Enter first name"
                      className="w-full rounded-2xl border border-[#dbe2ef] bg-white px-4 py-4 outline-none focus:border-[#15a276]"
                      required
                    />
                  </Field>
                  <Field label="Last Name">
                    <input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Enter last name"
                      className="w-full rounded-2xl border border-[#dbe2ef] bg-white px-4 py-4 outline-none focus:border-[#15a276]"
                      required
                    />
                  </Field>
                  <Field label="Email" fullWidth>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email"
                      className="w-full rounded-2xl border border-[#dbe2ef] bg-white px-4 py-4 outline-none focus:border-[#15a276]"
                    />
                  </Field>
                  <Field label="Profile Bio" fullWidth>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Write a short profile summary"
                      rows="4"
                      className="w-full rounded-2xl border border-[#dbe2ef] bg-white px-4 py-4 outline-none focus:border-[#15a276]"
                    />
                  </Field>
                </div>
              </div>

              <div className="rounded-2xl bg-[#f8faff] border border-[#dbe2ef] p-5 self-start">
                <h3 className="text-lg font-semibold">Academic Details</h3>
                <p className="text-sm text-[#5e6c87] mt-1">Keep your college and year information current.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                  <Field label="College Name">
                    <input
                      name="collegeName"
                      value={formData.collegeName}
                      onChange={handleChange}
                      placeholder="Enter college name"
                      className="w-full rounded-2xl border border-[#dbe2ef] bg-white px-4 py-4 outline-none focus:border-[#15a276]"
                    />
                  </Field>
                  <Field label="College Email">
                    <input
                      name="collegeEmail"
                      type="email"
                      value={formData.collegeEmail}
                      onChange={handleChange}
                      placeholder="Enter college email"
                      className="w-full rounded-2xl border border-[#dbe2ef] bg-white px-4 py-4 outline-none focus:border-[#15a276]"
                    />
                  </Field>
                  <Field label="Current Year">
                    <input
                      name="currentYear"
                      value={formData.currentYear}
                      onChange={handleChange}
                      placeholder="Example: 3rd Year B.A. LL.B"
                      className="w-full rounded-2xl border border-[#dbe2ef] bg-white px-4 py-4 outline-none focus:border-[#15a276]"
                    />
                  </Field>
                  <Field label="City">
                    <input
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Enter city"
                      className="w-full rounded-2xl border border-[#dbe2ef] bg-white px-4 py-4 outline-none focus:border-[#15a276]"
                    />
                  </Field>
                  <Field label="District">
                    <input
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      placeholder="Enter district"
                      className="w-full rounded-2xl border border-[#dbe2ef] bg-white px-4 py-4 outline-none focus:border-[#15a276]"
                    />
                  </Field>
                </div>
              </div>

              <div className="rounded-2xl bg-[#f8faff] border border-[#dbe2ef] p-5 xl:col-span-2">
                <h3 className="text-lg font-semibold">Skills &amp; Experience</h3>
                <p className="text-sm text-[#5e6c87] mt-1">Add the skills you want others to see, then include each internship below.</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
                  <div className="rounded-2xl border border-[#dbe2ef] bg-white p-4">
                    <Field label="Specializations">
                      <input
                        name="specializations"
                        value={formData.specializations}
                        onChange={handleChange}
                        placeholder="Criminal Law, Constitutional Law"
                        className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none transition focus:border-[#15a276] focus:ring-2 focus:ring-[#15a276]/15"
                      />
                    </Field>
                    <p className="mt-2 text-xs text-[#5e6c87]">Separate each specialization with a comma.</p>
                  </div>
                  <div className="rounded-2xl border border-[#dbe2ef] bg-white p-4">
                    <Field label="Skills">
                      <input
                        name="skills"
                        value={formData.skills}
                        onChange={handleChange}
                        placeholder="Legal Research, Drafting, Moot Court"
                        className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none transition focus:border-[#15a276] focus:ring-2 focus:ring-[#15a276]/15"
                      />
                    </Field>
                    <p className="mt-2 text-xs text-[#5e6c87]">Type a skill, add a comma, and continue with the next one.</p>
                  </div>
                </div>

                <div className="mt-6 border-t border-[#dbe2ef] pt-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold">Internship Experience</h4>
                    <p className="text-sm text-[#5e6c87] mt-1">Use “Add internship” to create a new entry, then fill in its details.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addInternshipField}
                    className="shrink-0 rounded-xl bg-[#15a276] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#10835e] focus:outline-none focus:ring-2 focus:ring-[#15a276] focus:ring-offset-2"
                  >
                    + Add Internship
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {formData.internships.map((item, index) => (
                    <div key={`${item.role}-${index}`} className="rounded-2xl bg-white border border-[#dbe2ef] p-4">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <h4 className="font-semibold text-[#0b1f44]">Internship {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeInternshipField(index)}
                          className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Role">
                          <input
                            value={item.role}
                            onChange={(event) => handleInternshipChange(index, 'role', event.target.value)}
                            placeholder="Example: Legal Intern"
                            className="w-full rounded-2xl border border-[#dbe2ef] px-4 py-3 outline-none focus:border-[#15a276]"
                          />
                        </Field>
                        <Field label="Organization">
                          <input
                            value={item.org}
                            onChange={(event) => handleInternshipChange(index, 'org', event.target.value)}
                            placeholder="Example: District Court, Delhi"
                            className="w-full rounded-2xl border border-[#dbe2ef] px-4 py-3 outline-none focus:border-[#15a276]"
                          />
                        </Field>
                        <Field label="Period" fullWidth>
                          <input
                            value={item.period}
                            onChange={(event) => handleInternshipChange(index, 'period', event.target.value)}
                            placeholder="Example: Jun 2025 - Aug 2025"
                            className="w-full rounded-2xl border border-[#dbe2ef] px-4 py-3 outline-none focus:border-[#15a276]"
                          />
                        </Field>
                        <Field label="Description" fullWidth>
                          <textarea
                            value={item.description}
                            onChange={(event) => handleInternshipChange(index, 'description', event.target.value)}
                            placeholder="Describe what you worked on"
                            rows="3"
                            className="w-full rounded-2xl border border-[#dbe2ef] px-4 py-3 outline-none focus:border-[#15a276]"
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              </div>
                </div>
              </div>

              <div className="border-t border-[#e4ebf5] bg-white px-6 py-4 md:px-8">
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-2xl border border-[#dbe2ef] px-5 py-4 font-semibold text-[#0b1f44] hover:bg-[#f8faff] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-[#15a276] px-8 py-4 font-semibold text-white hover:bg-[#fff2bf] transition disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
