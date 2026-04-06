import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios.jsx';
import StudentLayout from './StudentLayout.jsx';

const getDisplayName = (person) => {
  if (!person) return 'User';
  const fullName = `${person.firstName || ''} ${person.lastName || ''}`.trim();
  return fullName || person.name || 'User';
};

const getProfileInitial = (person) => getDisplayName(person).charAt(0).toUpperCase();

const formatJoinLabel = (dateValue) => {
  if (!dateValue) return 'Recently registered';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Recently registered';

  return `Joined ${date.toLocaleDateString()}`;
};

const getSubtitle = (person) => {
  if (person.role === 'lawyer') {
    return person.lawyerProfile?.specialization || 'Registered lawyer';
  }

  if (person.role === 'student') {
    return person.studentProfile?.collegeName || 'Registered student';
  }

  return 'Registered user';
};

const getMeta = (person) => {
  if (person.role === 'lawyer') {
    return person.address?.city || person.address?.district || 'Lawin member';
  }

  if (person.role === 'student') {
    return person.studentProfile?.collegeEmail || person.studentProfile?.currentYear || 'Law student';
  }

  return 'Lawin member';
};

export default function StudentHome() {
  const [students, setStudents] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPeople = async () => {
      try {
        setLoading(true);
        const [studentsResponse, lawyersResponse] = await Promise.all([
          api.get('/auth/students'),
          api.get('/auth/lawyers'),
        ]);

        setStudents(Array.isArray(studentsResponse.data) ? studentsResponse.data : []);
        setLawyers(Array.isArray(lawyersResponse.data) ? lawyersResponse.data : []);
      } catch (error) {
        console.error('Error loading registered people:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPeople();
  }, []);

  const registeredPeople = useMemo(() => {
    return [...students, ...lawyers]
      .filter(Boolean)
      .sort((firstPerson, secondPerson) => {
        const firstDate = new Date(firstPerson?.createdAt || 0).getTime();
        const secondDate = new Date(secondPerson?.createdAt || 0).getTime();
        return secondDate - firstDate;
      });
  }, [students, lawyers]);

  return (
    <StudentLayout>
      <section className="mx-auto max-w-5xl rounded-[28px] border border-[#dbe2ef] bg-white p-6 shadow-[0_2px_12px_rgba(11,31,68,0.04)] md:p-8">
        <div className="flex flex-col gap-3 border-b border-[#e8edf6] pb-6">
          <h1 className="text-[28px] font-semibold text-[#0b1f44]">Registered People</h1>
          <p className="text-[16px] text-[#5e6c87]">
            This page shows only people who have registered in the app, including both lawyers and students.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[16px] text-[#7f8ba2]">
            Loading registered people...
          </div>
        ) : registeredPeople.length === 0 ? (
          <div className="py-16 text-center text-[16px] text-[#7f8ba2]">
            No registered people found yet.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            {registeredPeople.map((person) => {
              const personId = person._id || person.id;
              const isLawyer = person.role === 'lawyer';

              return (
                <article
                  key={`${person.role}-${personId}`}
                  className="rounded-[24px] border border-[#dbe2ef] bg-[#fbfcff] p-5 transition hover:border-[#bfd0f6]"
                >
                  <div className="flex items-start gap-4">
                    {person.profileImage ? (
                      <img
                        src={person.profileImage}
                        alt={getDisplayName(person)}
                        className="h-16 w-16 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white ${
                          isLawyer
                            ? 'bg-gradient-to-br from-[#f0a43a] to-[#c96b16]'
                            : 'bg-gradient-to-br from-[#4d8dff] to-[#2456f5]'
                        }`}
                      >
                        {getProfileInitial(person)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-[20px] font-semibold text-[#0b1f44]">
                          {getDisplayName(person)}
                        </h2>
                        <span
                          className={`rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-wide ${
                            isLawyer
                              ? 'bg-[#fff1df] text-[#9a5a09]'
                              : 'bg-[#eaf1ff] text-[#2456f5]'
                          }`}
                        >
                          {isLawyer ? 'Lawyer' : 'Student'}
                        </span>
                      </div>

                      <p className="mt-2 text-[15px] text-[#33415c]">{getSubtitle(person)}</p>
                      <p className="mt-1 text-[14px] text-[#6d7a92]">{getMeta(person)}</p>
                      <p className="mt-3 text-[13px] text-[#8b97ac]">{formatJoinLabel(person.createdAt)}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </StudentLayout>
  );
}
