import React, { useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  IndianRupee,
  MapPin,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import api from '../api/axios.jsx';
import StudentLayout from './StudentLayout.jsx';

const specializationOptions = ['All Specializations', 'Criminal Law', 'Corporate Law', 'Constitutional Law'];

const getDisplayName = (user) => {
  if (!user) return 'Verified Lawyer';
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return fullName || user.name || 'Verified Lawyer';
};

const formatInternshipCard = (lawyer) => {
  const specialization = lawyer.lawyerProfile?.specialization || 'General Law';

  return {
    id: lawyer._id || lawyer.id,
    title: `${specialization} Intern`,
    lawyerName: getDisplayName(lawyer),
    firm: lawyer.address?.city || lawyer.address?.district || 'Registered Lawin Lawyer',
    specialization: [specialization],
    description:
      lawyer.lawyerProfile?.about ||
      `Internship opportunity under a registered lawyer specializing in ${specialization}. Students can explore drafting, research, and practical legal workflow exposure through this listing.`,
    duration: `${Math.max(lawyer.lawyerProfile?.experienceYears || 1, 1)} months`,
    location: lawyer.address?.city || lawyer.address?.district || 'India',
    stipend: `Rs. ${lawyer.lawyerProfile?.consultationFee || 5000}/month`,
    postedAt: lawyer.createdAt ? `Posted ${new Date(lawyer.createdAt).toLocaleDateString()}` : 'Recently posted',
    skills: [specialization, 'Legal Research', 'Drafting'],
    profileImage: lawyer.profileImage,
    avatar: getDisplayName(lawyer).charAt(0).toUpperCase(),
  };
};

export default function StudentExplore() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All Specializations');
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLawyerInternships = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/auth/lawyers');
        setInternships((data || []).map(formatInternshipCard));
      } catch (error) {
        console.error('Error loading internship listings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLawyerInternships();
  }, []);

  const filteredInternships = useMemo(() => {
    return internships.filter((internship) => {
      const matchesSearch = [internship.title, internship.lawyerName, internship.firm, internship.location]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesSpecialization =
        selectedSpecialization === 'All Specializations' ||
        internship.specialization.includes(selectedSpecialization);

      return matchesSearch && matchesSpecialization;
    });
  }, [searchTerm, selectedSpecialization]);

  return (
    <StudentLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Explore Internships</h1>
          <p className="text-[#5e6c87] text-lg mt-3">
            Discover opportunities with senior lawyers and law firms
          </p>
        </div>

        <section className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 rounded-2xl bg-[#f4f6fb] px-4 py-4">
                <Search className="text-[#93a0b6]" size={20} />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  type="text"
                  placeholder="Search internships, lawyers, or specializations..."
                  className="w-full bg-transparent outline-none text-[#0b1f44] placeholder:text-[#7f8ba2]"
                />
              </div>
            </div>

            <div className="lg:w-[320px]">
              <div className="relative">
                <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7f8ba2]" size={18} />
                <select
                  value={selectedSpecialization}
                  onChange={(event) => setSelectedSpecialization(event.target.value)}
                  className="w-full appearance-none rounded-2xl bg-[#f4f6fb] py-4 pl-12 pr-12 outline-none text-[#0b1f44] font-medium"
                >
                  {specializationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1acc0]" size={18} />
              </div>
            </div>
          </div>
        </section>

        <p className="text-[#44516d] text-[18px]">{filteredInternships.length} internships found</p>

        <div className="space-y-6">
          {loading ? (
            <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 text-[#7f8ba2] shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
              Loading internship listings from registered lawyers...
            </div>
          ) : filteredInternships.length === 0 ? (
            <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 text-[#7f8ba2] shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
              No internship listings are available from registered lawyers yet.
            </div>
          ) : filteredInternships.map((internship) => (
            <article
              key={internship.id}
              className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 shadow-[0_2px_12px_rgba(11,31,68,0.04)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {internship.profileImage ? (
                    <img src={internship.profileImage} alt={internship.lawyerName} className="h-[72px] w-[72px] rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="h-[72px] w-[72px] rounded-full bg-gradient-to-br from-[#ffb76b] to-[#ff7b54] text-white flex items-center justify-center text-2xl font-bold shrink-0">
                      {internship.avatar}
                    </div>
                  )}
                  <div>
                    <h2 className="text-[24px] font-semibold">{internship.title}</h2>
                    <p className="text-[18px] text-[#243b67] mt-1">{internship.lawyerName}</p>
                    <p className="text-[16px] text-[#5e6c87]">{internship.firm}</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {internship.specialization.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#d9e7ff] px-3 py-1 text-sm font-medium text-[#2456f5]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-sm font-medium text-[#2456f5] shrink-0">Verified</div>
              </div>

              <p className="mt-8 text-[18px] leading-9 text-[#243b67]">{internship.description}</p>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-[#44516d]">
                <div className="flex items-center gap-3">
                  <CalendarDays size={18} className="text-[#7d8aa5]" />
                  <span>{internship.duration}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-[#7d8aa5]" />
                  <span>{internship.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <IndianRupee size={18} className="text-[#7d8aa5]" />
                  <span>{internship.stipend}</span>
                </div>
                <div className="flex items-center gap-3">
                  <BriefcaseBusiness size={18} className="text-[#7d8aa5]" />
                  <span>{internship.postedAt}</span>
                </div>
              </div>

              <div className="mt-7">
                <p className="font-semibold text-[18px]">Required Skills:</p>
                <div className="flex flex-wrap gap-3 mt-4">
                  {internship.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-[#dbe2ef] bg-white px-4 py-2 text-sm font-medium text-[#0b1f44]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-col lg:flex-row gap-4">
                <button
                  type="button"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0d1024] px-5 py-4 text-lg font-semibold text-white hover:bg-[#171b34] transition"
                >
                  Apply Now
                  <ExternalLink size={18} />
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-[#dbe2ef] bg-white px-6 py-4 text-lg font-semibold text-[#0d1024] hover:bg-[#f8faff] transition"
                >
                  View Lawyer Profile
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
}
