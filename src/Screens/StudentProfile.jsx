import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Award, BriefcaseBusiness, GraduationCap, MapPin, Paperclip, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios.jsx';
import { updateUser } from '../redux/authSlice.jsx';
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

const getCertificates = (value) => (
  Array.isArray(value)
    ? value.filter((item) => item && typeof item === 'object').map((item) => ({ ...item, file: null }))
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
  certificates: getCertificates(user?.studentProfile?.certificates),
  profileImageFile: null,
});

// Helper Field component defined outside StudentProfile to preserve input focus during typing
const Field = ({ label, children, fullWidth = false }) => (
  <div className={fullWidth ? 'md:col-span-2' : ''}>
    <span className="block text-sm font-semibold text-[#44516d] mb-2">{label}</span>
    {children}
  </div>
);

export default function StudentProfile() {
  const { user } = useSelector((state) => state.auth);
  const { id: profileId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [viewedStudent, setViewedStudent] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(Boolean(profileId));
  const [activeEditModal, setActiveEditModal] = useState(null); // 'full' | 'specializations' | 'skills' | 'internships' | 'academic' | null
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(() => getInitialFormState(user));

  const isOwnProfile = !profileId || String(profileId) === String(user?._id || user?.id);
  const isLawyerViewingStudent = user?.role === 'lawyer' && !isOwnProfile;
  const profileUser = isOwnProfile ? user : viewedStudent;
  const studentName = useMemo(() => getDisplayName(profileUser), [profileUser]);
  const collegeName = profileUser?.studentProfile?.collegeName || 'National Law School of India University, Bangalore';
  const cityLabel = profileUser?.address?.city || profileUser?.address?.district || 'Location not added';
  const studentBio = profileUser?.studentProfile?.bio || 'Build your student profile, update your academic details, and keep your VERDITS presence current.';
  const specializations = getStringList(profileUser?.studentProfile?.specializations);
  const skills = getStringList(profileUser?.studentProfile?.skills);
  const internships = getInternships(profileUser?.studentProfile?.internships);
  const certificates = getCertificates(profileUser?.studentProfile?.certificates);
  const currentYearLabel = profileUser?.studentProfile?.currentYear || 'Not added yet';
  const renderLayout = (content) => (
    isLawyerViewingStudent ? (
      <main className="min-h-screen bg-[#f3f8fb] px-4 py-6 text-[#062552] md:px-6 md:py-8">
        <div className="mx-auto max-w-[1200px]">{content}</div>
      </main>
    ) : (
      <StudentLayout>{content}</StudentLayout>
    )
  );

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

  const addCertificateField = () => {
    setFormData((current) => ({
      ...current,
      certificates: [...current.certificates, { name: '', description: '', fileUrl: '', fileName: '', file: null }],
    }));
  };

  const updateCertificateField = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      certificates: current.certificates.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  };

  const removeCertificateField = (index) => {
    setFormData((current) => ({ ...current, certificates: current.certificates.filter((_, itemIndex) => itemIndex !== index) }));
  };

  const openEditor = (section = 'full') => {
    if (!isOwnProfile) return;
    const nextFormData = getInitialFormState(user);
    if (section === 'internships' && !nextFormData.internships.length) {
      nextFormData.internships = [{ role: '', org: '', period: '', description: '' }];
    }
    if (section === 'certificates' && !nextFormData.certificates.length) {
      nextFormData.certificates = [{ name: '', description: '', fileUrl: '', fileName: '', file: null }];
    }
    setFormData(nextFormData);
    setActiveEditModal(section);
  };

  const closeEditor = () => {
    setActiveEditModal(null);
    setFormData(getInitialFormState(user));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setIsSaving(true);

      let certificateFileIndex = 0;
      const studentProfile = {
        bio: formData.bio,
        currentYear: formData.currentYear,
        collegeName: formData.collegeName,
        collegeEmail: formData.collegeEmail,
        specializations: String(formData.specializations || '').split(',').map((item) => item.trim()).filter(Boolean),
        skills: String(formData.skills || '').split(',').map((item) => item.trim()).filter(Boolean),
        internships: formData.internships
          .map((item) => ({ role: item.role?.trim(), org: item.org?.trim(), period: item.period?.trim(), description: item.description?.trim() }))
          .filter((item) => item.role || item.org || item.period || item.description),
        certificates: formData.certificates
          .map((item) => {
            const fileIndex = item.file ? certificateFileIndex++ : undefined;
            return { name: item.name?.trim(), description: item.description?.trim(), fileUrl: item.fileUrl, fileName: item.fileName, fileIndex };
          })
          .filter((item) => item.name || item.description || item.fileUrl || item.fileIndex !== undefined),
      };
      const payload = new FormData();
      payload.append('firstName', formData.firstName);
      payload.append('lastName', formData.lastName);
      payload.append('email', formData.email);
      payload.append('address', JSON.stringify({ city: formData.city, district: formData.district }));
      payload.append('studentProfile', JSON.stringify(studentProfile));
      if (formData.profileImageFile) payload.append('profileImage', formData.profileImageFile);
      formData.certificates.forEach((item) => {
        if (item.file) payload.append('certificateFiles', item.file);
      });

      const { data } = await api.put('/auth/update-profile', payload);
      dispatch(updateUser(data.user));
      setActiveEditModal(null);
    } catch (error) {
      console.error('Error updating student profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingProfile) {
    return renderLayout(
      <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-8 text-[#5e6c87] shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
        Loading student profile...
      </div>
    );
  }

  if (!profileUser) {
    return renderLayout(
      <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-8 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
        <h1 className="text-2xl font-semibold">Student profile not found</h1>
        <p className="mt-2 text-[#5e6c87]">This student may no longer be available in your network list.</p>
      </div>
    );
  }

  return renderLayout(
    <>
      <div className="space-y-8">
        {!isOwnProfile && (
          <button
            type="button"
            onClick={() => navigate(location.state?.returnTo || '/lawyer-dash?section=student-interactions&tab=followers')}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#dbe2ef] bg-white px-4 py-3 text-[16px] font-semibold text-[#243b67] shadow-[0_2px_12px_rgba(11,31,68,0.04)] hover:bg-[#f8faff] transition"
          >
            <ArrowLeft size={18} />
            Back to Network
          </button>
        )}

        <section className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 md:p-8 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex min-w-0 items-start gap-5">
                {profileUser?.profileImage ? (
                  <img
                    src={profileUser.profileImage}
                    alt={studentName}
                    className="h-24 w-24 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#779bf6] to-[#456be8] text-white font-bold text-3xl flex items-center justify-center shrink-0">
                    {studentName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0b1f44]">{studentName}</h1>
                  <div className="mt-3 space-y-2 text-[17px] text-[#44516d]">
                    <div className="flex items-center gap-2">
                      <GraduationCap size={20} className="text-[#15a276] shrink-0" />
                      <span>{collegeName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={20} className="text-[#5e6c87] shrink-0" />
                      <span>{cityLabel}</span>
                    </div>
                  </div>
                  <p className="mt-4 text-[17px] leading-8 text-[#243b67] max-w-3xl">{studentBio}</p>
                </div>
              </div>

              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={() => openEditor('full')}
                  className="rounded-2xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 px-6 py-4 text-[18px] font-bold transition-colors shadow-sm border border-[#d6b85b] select-none touch-manipulation active:scale-[0.98]"
                >
                  Edit Profile
                </button>
              ) : null}
            </div>

          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-8">
          <div className="min-w-0 space-y-8">
            <section className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[22px] font-semibold">Specialization</h2>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => openEditor('specializations')}
                    className="text-sm font-semibold text-[#15a276] hover:underline"
                  >
                    {specializations.length ? 'Edit' : 'Add Specialization'}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-8">
                {specializations.length ? specializations.map((item) => (
                  <span key={item} className="rounded-full bg-[#e8f7f2] px-4 py-2 text-[#15a276] font-medium">
                    {item}
                  </span>
                )) : (
                  <div>
                    <p className="text-[#5e6c87]">No specializations added yet.</p>
                    {isOwnProfile && (
                      <button type="button" onClick={() => openEditor('specializations')} className="mt-3 text-sm font-semibold text-[#15a276] hover:underline">
                        Add Specialization
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[22px] font-semibold">Skills</h2>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => openEditor('skills')}
                    className="text-sm font-semibold text-[#15a276] hover:underline"
                  >
                    {skills.length ? 'Edit' : 'Add Skills'}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-8">
                {skills.length ? skills.map((item) => (
                  <span key={item} className="rounded-full border border-[#dbe2ef] px-4 py-2 text-[16px] font-medium">
                    {item}
                  </span>
                )) : (
                  <div>
                    <p className="text-[#5e6c87]">No skills added yet.</p>
                    {isOwnProfile && (
                      <button type="button" onClick={() => openEditor('skills')} className="mt-3 text-sm font-semibold text-[#15a276] hover:underline">
                        Add Skills
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[22px] font-semibold">Academic Details</h2>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => openEditor('academic')}
                    className="text-sm font-semibold text-[#15a276] hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>
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

          <div className="min-w-0 space-y-8">
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
                    onClick={() => openEditor('internships')}
                    className="rounded-2xl border border-[#dbe2ef] px-5 py-3 text-[18px] font-semibold text-[#15a276] hover:bg-[#f8faff] transition"
                  >
                    {internships.length ? 'Edit Internships' : 'Add Internship'}
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
                    {isOwnProfile && (
                      <button type="button" onClick={() => openEditor('internships')} className="mt-3 text-sm font-semibold text-[#15a276] hover:underline">
                        Add Internship Experience
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 md:p-8 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[22px] font-semibold">Certificates</h2>
                  <p className="mt-2 text-[18px] text-[#5e6c87]">Add certificates and supporting documents.</p>
                </div>
                {isOwnProfile && (
                  <button type="button" onClick={() => openEditor('certificates')} className="rounded-2xl border border-[#dbe2ef] px-5 py-3 text-[18px] font-semibold text-[#15a276] hover:bg-[#f8faff] transition">
                    {certificates.length ? 'Edit Certificates' : 'Add Certificate'}
                  </button>
                )}
              </div>
              <div className="mt-8 space-y-4">
                {certificates.length ? certificates.map((certificate, index) => (
                  <div key={`${certificate.name}-${index}`} className="rounded-2xl border border-[#dbe2ef] p-5">
                    <div className="flex items-start gap-3">
                      <Award size={22} className="mt-0.5 shrink-0 text-[#15a276]" />
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0b1f44]">{certificate.name || 'Certificate'}</p>
                        {certificate.description ? <p className="mt-1 leading-7 text-[#5e6c87]">{certificate.description}</p> : null}
                        {certificate.fileUrl ? <a href={certificate.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#15a276] hover:underline"><Paperclip size={15} /> View certificate</a> : null}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-[#dbe2ef] p-6 text-[#5e6c87]">
                    <p>No certificates added yet.</p>
                    {isOwnProfile && <button type="button" onClick={() => openEditor('certificates')} className="mt-3 text-sm font-semibold text-[#15a276] hover:underline">Add Certificate</button>}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {activeEditModal !== null && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[92vh] rounded-[28px] border border-[#dbe2ef] bg-white shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-[#e4ebf5] px-6 py-5 md:px-8">
              <div>
                <h2 className="text-2xl font-semibold">
                  {activeEditModal === 'specializations'
                    ? 'Add / Edit Specializations'
                    : activeEditModal === 'skills'
                      ? 'Add / Edit Skills'
                        : activeEditModal === 'internships'
                          ? 'Add / Edit Internship Experience'
                          : activeEditModal === 'certificates'
                            ? 'Add / Edit Certificates'
                        : activeEditModal === 'academic'
                          ? 'Edit Academic Details'
                          : 'Edit Student Profile'}
                </h2>
                <p className="text-[#5e6c87] mt-1 text-sm">
                  {activeEditModal === 'specializations'
                    ? 'Add or update the legal specializations you focus on.'
                    : activeEditModal === 'skills'
                      ? 'Add or update the legal and professional skills you possess.'
                      : activeEditModal === 'internships'
                        ? 'Add or update your internship experiences below.'
                        : activeEditModal === 'certificates'
                          ? 'Add certificates and supporting files to your student profile.'
                        : activeEditModal === 'academic'
                          ? 'Keep your college and location details current.'
                          : 'Update your student details and save them to your account.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="h-10 w-10 rounded-full border border-[#dbe2ef] flex items-center justify-center text-[#44516d] hover:bg-[#f8faff] transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
                {activeEditModal === 'specializations' && (
                  <div className="rounded-2xl bg-[#f8faff] border border-[#dbe2ef] p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-[#0b1f44]">Legal Specializations</h3>
                    <Field label="Specializations">
                      <input
                        name="specializations"
                        value={formData.specializations}
                        onChange={handleChange}
                        placeholder="Criminal Law, Constitutional Law, Corporate Law"
                        className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none transition focus:border-[#15a276] focus:ring-2 focus:ring-[#15a276]/15 text-[#0b1f44]"
                        autoFocus
                      />
                    </Field>
                    <p className="text-sm text-[#5e6c87]">Separate each specialization with a comma (e.g. Criminal Law, Corporate Law).</p>
                  </div>
                )}

                {activeEditModal === 'skills' && (
                  <div className="rounded-2xl bg-[#f8faff] border border-[#dbe2ef] p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-[#0b1f44]">Skills</h3>
                    <Field label="Skills">
                      <input
                        name="skills"
                        value={formData.skills}
                        onChange={handleChange}
                        placeholder="Legal Research, Drafting, Moot Court, Client Advocacy"
                        className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none transition focus:border-[#15a276] focus:ring-2 focus:ring-[#15a276]/15 text-[#0b1f44]"
                        autoFocus
                      />
                    </Field>
                    <p className="text-sm text-[#5e6c87]">Type a skill, add a comma, and continue with the next one.</p>
                  </div>
                )}

                {activeEditModal === 'internships' && (
                  <div className="rounded-2xl bg-[#f8faff] border border-[#dbe2ef] p-6 space-y-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-[#0b1f44]">Internship Experience</h3>
                        <p className="text-sm text-[#5e6c87] mt-1">Use “Add Internship” to create a new entry, then fill in its details.</p>
                      </div>
                      <button
                        type="button"
                        onClick={addInternshipField}
                        className="shrink-0 rounded-xl bg-[#15a276] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#10835e]"
                      >
                        + Add Internship
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formData.internships.map((item, index) => (
                        <div key={`internship-${index}`} className="rounded-2xl bg-white border border-[#dbe2ef] p-5 space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="font-semibold text-[#0b1f44]">Internship {index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removeInternshipField(index)}
                              className="rounded-xl border border-red-200 px-3.5 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
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
                                className="w-full rounded-xl border border-[#dbe2ef] px-4 py-3 outline-none focus:border-[#15a276]"
                              />
                            </Field>
                            <Field label="Organization">
                              <input
                                value={item.org}
                                onChange={(event) => handleInternshipChange(index, 'org', event.target.value)}
                                placeholder="Example: High Court of Delhi"
                                className="w-full rounded-xl border border-[#dbe2ef] px-4 py-3 outline-none focus:border-[#15a276]"
                              />
                            </Field>
                            <Field label="Period" fullWidth>
                              <input
                                value={item.period}
                                onChange={(event) => handleInternshipChange(index, 'period', event.target.value)}
                                placeholder="Example: Jun 2025 - Aug 2025"
                                className="w-full rounded-xl border border-[#dbe2ef] px-4 py-3 outline-none focus:border-[#15a276]"
                              />
                            </Field>
                            <Field label="Description" fullWidth>
                              <textarea
                                value={item.description}
                                onChange={(event) => handleInternshipChange(index, 'description', event.target.value)}
                                placeholder="Describe your responsibilities and learnings"
                                rows="3"
                                className="w-full rounded-xl border border-[#dbe2ef] px-4 py-3 outline-none focus:border-[#15a276]"
                              />
                            </Field>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeEditModal === 'certificates' && (
                  <div className="rounded-2xl bg-[#f8faff] border border-[#dbe2ef] p-6 space-y-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-[#0b1f44]">Certificates</h3>
                        <p className="mt-1 text-sm text-[#5e6c87]">Add the certificate name, its file, and a short description.</p>
                      </div>
                      <button type="button" onClick={addCertificateField} className="shrink-0 rounded-xl bg-[#15a276] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#10835e]">+ Add Certificate</button>
                    </div>
                    <div className="space-y-4">
                      {formData.certificates.map((certificate, index) => (
                        <div key={`certificate-${index}`} className="rounded-2xl border border-[#dbe2ef] bg-white p-5 space-y-4">
                          <div className="flex items-center justify-between gap-3"><h4 className="font-semibold text-[#0b1f44]">Certificate {index + 1}</h4><button type="button" onClick={() => removeCertificateField(index)} className="rounded-xl border border-red-200 px-3.5 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition">Remove</button></div>
                          <Field label="Certificate Name"><input value={certificate.name} onChange={(event) => updateCertificateField(index, 'name', event.target.value)} placeholder="Example: Moot Court Competition" className="w-full rounded-xl border border-[#dbe2ef] px-4 py-3 outline-none focus:border-[#15a276]" /></Field>
                          <Field label="Add Certificate"><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx" onChange={(event) => { const file = event.target.files?.[0] || null; updateCertificateField(index, 'file', file); updateCertificateField(index, 'fileName', file?.name || certificate.fileName); }} className="w-full rounded-xl border border-[#dbe2ef] px-4 py-3 outline-none focus:border-[#15a276]" />{certificate.fileName ? <p className="mt-2 text-sm text-[#5e6c87]">Selected: {certificate.fileName}</p> : null}</Field>
                          <Field label="Description"><textarea value={certificate.description} onChange={(event) => updateCertificateField(index, 'description', event.target.value)} placeholder="Describe the certificate and achievement" rows="3" className="w-full rounded-xl border border-[#dbe2ef] px-4 py-3 outline-none focus:border-[#15a276]" /></Field>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeEditModal === 'academic' && (
                  <div className="rounded-2xl bg-[#f8faff] border border-[#dbe2ef] p-6 space-y-5">
                    <h3 className="text-lg font-semibold text-[#0b1f44]">Academic & Contact Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Field label="College Name">
                        <input
                          name="collegeName"
                          value={formData.collegeName}
                          onChange={handleChange}
                          placeholder="Enter college name"
                          className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none focus:border-[#15a276]"
                        />
                      </Field>
                      <Field label="College Email">
                        <input
                          name="collegeEmail"
                          type="email"
                          value={formData.collegeEmail}
                          onChange={handleChange}
                          placeholder="Enter college email"
                          className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none focus:border-[#15a276]"
                        />
                      </Field>
                      <Field label="Current Year">
                        <input
                          name="currentYear"
                          value={formData.currentYear}
                          onChange={handleChange}
                          placeholder="Example: 3rd Year B.A. LL.B"
                          className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none focus:border-[#15a276]"
                        />
                      </Field>
                      <Field label="City">
                        <input
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Enter city"
                          className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none focus:border-[#15a276]"
                        />
                      </Field>
                      <Field label="District">
                        <input
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          placeholder="Enter district"
                          className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none focus:border-[#15a276]"
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {activeEditModal === 'full' && (
                  <div className="space-y-6">
                    <div className="rounded-2xl bg-[#f8faff] border border-[#dbe2ef] p-5">
                      <h3 className="text-lg font-semibold text-[#0b1f44]">Profile Photo</h3>
                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                        {formData.profileImageFile ? (
                          <img src={URL.createObjectURL(formData.profileImageFile)} alt="Profile preview" className="h-20 w-20 rounded-full object-cover" />
                        ) : profileUser?.profileImage ? (
                          <img src={profileUser.profileImage} alt={studentName} className="h-20 w-20 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#e8f7f2] text-2xl font-bold text-[#15a276]">{studentName.charAt(0).toUpperCase()}</div>
                        )}
                        <div>
                          <Field label="Add Profile Photo">
                            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFormData((current) => ({ ...current, profileImageFile: event.target.files?.[0] || null }))} className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none focus:border-[#15a276]" />
                          </Field>
                          <p className="mt-2 text-sm text-[#5e6c87]">JPG, PNG, or WEBP up to 10 MB.</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-[#f8faff] border border-[#dbe2ef] p-5">
                      <h3 className="text-lg font-semibold text-[#0b1f44]">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                        <Field label="First Name">
                          <input
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="Enter first name"
                            className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none focus:border-[#15a276]"
                            required
                          />
                        </Field>
                        <Field label="Last Name">
                          <input
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Enter last name"
                            className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none focus:border-[#15a276]"
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
                            className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none focus:border-[#15a276]"
                          />
                        </Field>
                        <Field label="Profile Bio" fullWidth>
                          <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Write a short profile summary"
                            rows="3"
                            className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none focus:border-[#15a276]"
                          />
                        </Field>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#f8faff] border border-[#dbe2ef] p-5">
                      <h3 className="text-lg font-semibold text-[#0b1f44]">Academic Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                        <Field label="College Name">
                          <input
                            name="collegeName"
                            value={formData.collegeName}
                            onChange={handleChange}
                            placeholder="Enter college name"
                            className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none focus:border-[#15a276]"
                          />
                        </Field>
                        <Field label="College Email">
                          <input
                            name="collegeEmail"
                            type="email"
                            value={formData.collegeEmail}
                            onChange={handleChange}
                            placeholder="Enter college email"
                            className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none focus:border-[#15a276]"
                          />
                        </Field>
                        <Field label="Current Year">
                          <input
                            name="currentYear"
                            value={formData.currentYear}
                            onChange={handleChange}
                            placeholder="Example: 3rd Year B.A. LL.B"
                            className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none focus:border-[#15a276]"
                          />
                        </Field>
                        <Field label="City">
                          <input
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Enter city"
                            className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none focus:border-[#15a276]"
                          />
                        </Field>
                        <Field label="District">
                          <input
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                            placeholder="Enter district"
                            className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none focus:border-[#15a276]"
                          />
                        </Field>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#f8faff] border border-[#dbe2ef] p-5">
                      <h3 className="text-lg font-semibold text-[#0b1f44]">Skills &amp; Specializations</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <Field label="Specializations">
                          <input
                            name="specializations"
                            value={formData.specializations}
                            onChange={handleChange}
                            placeholder="Criminal Law, Constitutional Law"
                            className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none focus:border-[#15a276]"
                          />
                        </Field>
                        <Field label="Skills">
                          <input
                            name="skills"
                            value={formData.skills}
                            onChange={handleChange}
                            placeholder="Legal Research, Drafting, Moot Court"
                            className="w-full rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 outline-none focus:border-[#15a276]"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[#e4ebf5] bg-white px-6 py-4 md:px-8">
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeEditor}
                    className="rounded-2xl border border-[#dbe2ef] px-5 py-3 font-semibold text-[#0b1f44] hover:bg-[#f8faff] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-2xl bg-[#15a276] px-8 py-3 font-semibold text-white hover:bg-[#10835e] transition disabled:opacity-60"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
