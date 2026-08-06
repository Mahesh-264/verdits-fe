import React, { useEffect, useState } from 'react';
import { BadgePlus, Sparkles, UserPlus, Users } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios.jsx';
import { updateUser } from '../redux/authSlice.jsx';
import StudentLayout from './StudentLayout.jsx';

const getDisplayName = (user) => {
  if (!user) return 'Account';
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return fullName || user.name || 'Account';
};

export default function StudentNetwork() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'lawyers' ? 'lawyers' : 'students');
  const [students, setStudents] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState('');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'students' || tab === 'lawyers') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadNetwork = async () => {
      try {
        setLoading(true);
        setLoadError('');
        const [studentsResult, lawyersResult] = await Promise.allSettled([
          api.get('/auth/students'),
          api.get('/auth/lawyers'),
        ]);

        if (studentsResult.status === 'fulfilled') {
          const studentData = studentsResult.value.data;
          const studentList = Array.isArray(studentData)
            ? studentData
            : (Array.isArray(studentData?.students) ? studentData.students : []);
          setStudents(studentList);
        }
        if (lawyersResult.status === 'fulfilled') {
          setLawyers(Array.isArray(lawyersResult.value.data) ? lawyersResult.value.data : (Array.isArray(lawyersResult.value.data?.lawyers) ? lawyersResult.value.data.lawyers : []));
        }
        if (studentsResult.status === 'rejected' || lawyersResult.status === 'rejected') {
          const failure = studentsResult.status === 'rejected' ? studentsResult.reason : lawyersResult.reason;
          setLoadError(failure.response?.data?.message || 'Unable to load all network results. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadNetwork();
  }, []);

  const connectedStudents = user?.studentProfile?.connectedStudents || [];
  const followingLawyers = user?.studentProfile?.followingLawyers || [];
  const pendingInvitations = user?.studentProfile?.connectionRequests || [];
  const outgoingRequests = user?.studentProfile?.outgoingConnectionRequests || [];

  const isConnected = (studentId) =>
    connectedStudents.some((id) => String(id) === String(studentId));

  const hasIncomingRequest = (studentId) =>
    pendingInvitations.some((id) => String(id) === String(studentId));

  const hasOutgoingRequest = (studentId) =>
    outgoingRequests.some((id) => String(id) === String(studentId));

  const isFollowingLawyer = (lawyerId) =>
    followingLawyers.some((id) => String(id) === String(lawyerId));

  const handleConnectStudent = async (studentId) => {
    try {
      setActionLoadingId(studentId);
      const { data } = await api.post(`/auth/connect-student/${studentId}`);
      dispatch(updateUser(data.user));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send connection request');
    } finally {
      setActionLoadingId('');
    }
  };

  const handleAcceptStudent = async (studentId) => {
    try {
      setActionLoadingId(studentId);
      const { data } = await api.post(`/auth/accept-student-request/${studentId}`);
      dispatch(updateUser(data.user));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to accept request');
    } finally {
      setActionLoadingId('');
    }
  };

  const handleFollowLawyer = async (lawyerId) => {
    try {
      setActionLoadingId(lawyerId);
      const { data } = await api.post(`/auth/follow-lawyer/${lawyerId}`);
      dispatch(updateUser(data.user));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update follow status');
    } finally {
      setActionLoadingId('');
    }
  };

  const statCards = [
    { label: 'Connections', value: String(connectedStudents.length), Icon: Users, color: 'bg-[#e8f7f2] text-[#15a276]' },
    { label: 'Lawyers Following', value: String(followingLawyers.length), Icon: BadgePlus, color: 'bg-[#f0e3ff] text-[#8c2bff]' },
    { label: 'Pending Invitations', value: String(pendingInvitations.length), Icon: Sparkles, color: 'bg-[#dcfce7] text-[#16a34a]' },
  ];

  return (
    <StudentLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">My Network</h1>
          <p className="text-[#5e6c87] text-lg mt-3">
            Grow your legal network by connecting with students and following lawyers
          </p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map(({ label, value, Icon: StatIcon, color }) => (
            <div key={label} className="rounded-[28px] border border-[#dbe2ef] bg-white p-8 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
              <div className="flex items-center gap-5">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center ${color}`}>
                  {React.createElement(StatIcon, { size: 28 })}
                </div>
                <div>
                  <p className="text-4xl font-bold">{value}</p>
                  <p className="text-[#44516d] text-[18px] mt-1">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <div className="inline-flex rounded-[22px] bg-[#e9edf5] p-1">
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`rounded-[18px] px-14 py-3 text-[18px] font-semibold transition ${
              activeTab === 'students' ? 'bg-white text-[#0b1f44]' : 'text-[#44516d]'
            }`}
          >
            Student Connections
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lawyers')}
            className={`rounded-[18px] px-14 py-3 text-[18px] font-semibold transition ${
              activeTab === 'lawyers' ? 'bg-white text-[#0b1f44]' : 'text-[#44516d]'
            }`}
          >
            Follow Lawyers
          </button>
        </div>

        {loadError ? <p role="alert" className="text-sm font-medium text-red-700">{loadError}</p> : null}

        {activeTab === 'students' ? (
          <section className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
            <h2 className="text-[22px] font-semibold">Connect with Fellow Students</h2>
            <p className="text-[#5e6c87] text-[18px] mt-2">Build your circle with law students from across India</p>

            <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
              {loading ? (
                <p className="text-[#7f8ba2] text-[16px]">Loading registered students...</p>
              ) : students.length === 0 ? (
                <p className="text-[#7f8ba2] text-[16px]">No registered students found yet.</p>
              ) : students.map((student) => {
                const studentId = student._id || student.id;

                return (
                <div
                  key={studentId}
                  onClick={() => navigate(`/student-profile/${studentId}`)}
                  className="cursor-pointer rounded-[26px] border border-[#dbe2ef] p-6 text-center transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {student.profileImage ? (
                    <img src={student.profileImage} alt={getDisplayName(student)} className="h-28 w-28 mx-auto rounded-full object-cover" />
                  ) : (
                    <div className="h-28 w-28 mx-auto rounded-full bg-gradient-to-br from-[#8de2c6] to-[#15a276] text-white text-3xl font-bold flex items-center justify-center">
                      {getDisplayName(student).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h3 className="text-[20px] font-semibold mt-6">{getDisplayName(student)}</h3>
                  <p className="text-[#44516d] text-[16px] leading-7 mt-2">
                    {student.studentProfile?.collegeName || 'Registered student'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-5">
                    <span className="rounded-full bg-[#e8f7f2] px-3 py-1 text-sm font-medium text-[#15a276]">
                      Law Student
                    </span>
                  </div>
                  <p className="text-[#7f8ba2] text-[15px] mt-5">
                    {student.studentProfile?.collegeEmail || 'Registered on VERDITS'}
                  </p>
                  {hasIncomingRequest(student._id || student.id) ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAcceptStudent(studentId);
                      }}
                      disabled={actionLoadingId === studentId}
                      className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-[18px] font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60"
                    >
                      <UserPlus size={18} />
                      {actionLoadingId === studentId ? 'Accepting...' : 'Accept Request'}
                    </button>
                  ) : isConnected(studentId) ? (
                    <button type="button" disabled className="mt-6 w-full rounded-2xl bg-[#e8f7f2] py-4 text-[18px] font-semibold text-[#15a276]">
                      Connected
                    </button>
                  ) : hasOutgoingRequest(studentId) ? (
                    <button type="button" disabled className="mt-6 w-full rounded-2xl bg-[#eef2f8] py-4 text-[18px] font-semibold text-[#5e6c87]">
                      Request Sent
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleConnectStudent(studentId);
                      }}
                      disabled={actionLoadingId === studentId}
                      className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#15a276] py-4 text-[18px] font-semibold text-white hover:bg-[#fff2bf] transition disabled:opacity-60"
                    >
                      <UserPlus size={18} />
                      {actionLoadingId === studentId ? 'Sending...' : 'Connect'}
                    </button>
                  )}
                </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
            <h2 className="text-[22px] font-semibold">Lawyers to Follow</h2>
            <p className="text-[#5e6c87] text-[18px] mt-2">Follow all registered lawyers from different practice areas</p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <p className="text-[#7f8ba2] text-[16px]">Loading verified lawyers...</p>
              ) : lawyers.length === 0 ? (
                <p className="text-[#7f8ba2] text-[16px]">No verified lawyers available yet.</p>
              ) : lawyers.map((lawyer) => {
                const lawyerId = lawyer._id || lawyer.id;

                return (
                <div
                  key={lawyerId}
                  onClick={() => navigate(`/lawyer-profile/${lawyerId}`)}
                  className="cursor-pointer rounded-[26px] border border-[#dbe2ef] p-6 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    {lawyer.profileImage ? (
                      <img src={lawyer.profileImage} alt={getDisplayName(lawyer)} className="h-20 w-20 rounded-full object-cover" />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#ffd89b] to-[#19547b] text-white text-2xl font-bold flex items-center justify-center">
                        {getDisplayName(lawyer).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-[20px] font-semibold">{getDisplayName(lawyer)}</h3>
                      <p className="text-[#44516d] text-[16px] mt-2">
                        {lawyer.lawyerProfile?.specialization || 'Verified lawyer'}
                      </p>
                      <p className="text-[#7f8ba2] text-[15px] mt-2">
                        {lawyer.address?.city || lawyer.address?.district || 'Available on VERDITS'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleFollowLawyer(lawyerId);
                    }}
                    disabled={actionLoadingId === lawyerId}
                    className={`mt-6 rounded-2xl px-6 py-4 text-[18px] font-semibold transition disabled:opacity-60 ${
                      isFollowingLawyer(lawyerId)
                        ? 'bg-[#e8f7f2] text-[#15a276]'
                        : 'bg-[#15a276] text-white hover:bg-[#fff2bf]'
                    }`}
                  >
                    {actionLoadingId === lawyerId
                      ? 'Updating...'
                      : isFollowingLawyer(lawyerId)
                        ? 'Following'
                        : 'Follow'}
                  </button>
                </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </StudentLayout>
  );
}
//