import React, { useEffect, useMemo, useState } from 'react';
import { Heart, MessageCircle, Send, UserPlus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/axios.jsx';
import { updateUser } from '../redux/authSlice.jsx';
import StudentLayout from './StudentLayout.jsx';

const getDisplayName = (user) => {
  if (!user) return 'Student';
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return fullName || user.name || 'Student';
};

const getProfileInitial = (user) => getDisplayName(user).charAt(0).toUpperCase();

const formatJoinLabel = (dateValue) => {
  if (!dateValue) return 'Registered student';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Registered student';

  return `Joined ${date.toLocaleDateString()}`;
};

export default function StudentHome() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const studentName = useMemo(() => getDisplayName(user), [user]);
  const [students, setStudents] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState('');

  useEffect(() => {
    const loadCommunity = async () => {
      try {
        setLoading(true);
        const [studentsResponse, lawyersResponse] = await Promise.all([
          api.get('/auth/students'),
          api.get('/auth/lawyers'),
        ]);

        setStudents(studentsResponse.data || []);
        setLawyers(lawyersResponse.data || []);
      } catch (error) {
        console.error('Error loading student community:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCommunity();
  }, []);

  const suggestedStudents = students.slice(0, 3);
  const lawyersToFollow = lawyers;
  const feedPosts = lawyers.slice(0, 4);
  const connectedStudents = user?.studentProfile?.connectedStudents || [];
  const pendingInvitations = user?.studentProfile?.connectionRequests || [];
  const outgoingRequests = user?.studentProfile?.outgoingConnectionRequests || [];
  const followingLawyers = user?.studentProfile?.followingLawyers || [];

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

  return (
    <StudentLayout>
      <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-7 items-start">
        <aside className="space-y-8">
          <section className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
            <h2 className="text-[22px] font-semibold">Connect with Students</h2>
            <p className="text-[#5e6c87] text-[18px] mt-2">Expand your network</p>

            <div className="mt-8 space-y-6">
              {loading ? (
                <p className="text-[#7f8ba2] text-[16px]">Loading registered students...</p>
              ) : suggestedStudents.length === 0 ? (
                <p className="text-[#7f8ba2] text-[16px]">No registered students found yet.</p>
              ) : suggestedStudents.map((student) => (
                <div key={student._id || student.id}>
                  <div className="flex items-center gap-4">
                    {student.profileImage ? (
                      <img src={student.profileImage} alt={getDisplayName(student)} className="h-16 w-16 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#8ec5fc] to-[#3a6ff8] text-white flex items-center justify-center text-xl font-bold shrink-0">
                        {getProfileInitial(student)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[18px] font-semibold truncate">{getDisplayName(student)}</p>
                      <p className="text-[#5e6c87] text-[15px] leading-6 line-clamp-2">
                        {student.studentProfile?.collegeName || 'Registered student'}
                      </p>
                      <p className="text-[#8b97ac] text-[14px] mt-1">{formatJoinLabel(student.createdAt)}</p>
                    </div>
                  </div>

                  {hasIncomingRequest(student._id || student.id) ? (
                    <button
                      type="button"
                      onClick={() => handleAcceptStudent(student._id || student.id)}
                      disabled={actionLoadingId === (student._id || student.id)}
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-[18px] font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60"
                    >
                      <UserPlus size={18} />
                      {actionLoadingId === (student._id || student.id) ? 'Accepting...' : 'Accept Request'}
                    </button>
                  ) : isConnected(student._id || student.id) ? (
                    <button type="button" disabled className="mt-4 w-full rounded-2xl bg-[#d9e7ff] py-3 text-[18px] font-semibold text-[#2456f5]">
                      Connected
                    </button>
                  ) : hasOutgoingRequest(student._id || student.id) ? (
                    <button type="button" disabled className="mt-4 w-full rounded-2xl bg-[#eef2f8] py-3 text-[18px] font-semibold text-[#5e6c87]">
                      Request Sent
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleConnectStudent(student._id || student.id)}
                      disabled={actionLoadingId === (student._id || student.id)}
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dbe2ef] py-3 text-[18px] font-semibold text-[#0d1024] hover:bg-[#f8faff] transition disabled:opacity-60"
                    >
                      <UserPlus size={18} />
                      {actionLoadingId === (student._id || student.id) ? 'Sending...' : 'Connect'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
            <h2 className="text-[22px] font-semibold">Lawyers to Follow</h2>
            <p className="text-[#5e6c87] text-[18px] mt-2">See all registered lawyers across specializations</p>

            <div className="mt-8 space-y-6 max-h-[720px] overflow-y-auto pr-2">
              {loading ? (
                <p className="text-[#7f8ba2] text-[16px]">Loading verified lawyers...</p>
              ) : lawyersToFollow.length === 0 ? (
                <p className="text-[#7f8ba2] text-[16px]">No verified lawyers available yet.</p>
              ) : lawyersToFollow.map((lawyer) => (
                <div key={lawyer._id || lawyer.id}>
                  <div className="flex items-center gap-4">
                    {lawyer.profileImage ? (
                      <img src={lawyer.profileImage} alt={getDisplayName(lawyer)} className="h-16 w-16 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#ffd89b] to-[#19547b] text-white flex items-center justify-center text-xl font-bold shrink-0">
                        {getProfileInitial(lawyer)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[18px] font-semibold truncate">{getDisplayName(lawyer)}</p>
                      <p className="text-[#5e6c87] text-[15px] leading-6 line-clamp-2">
                        {lawyer.lawyerProfile?.specialization || 'Verified lawyer'}
                      </p>
                      <p className="text-[#8b97ac] text-[14px] mt-1">
                        {lawyer.address?.city || lawyer.address?.district || 'Registered on Lawin'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFollowLawyer(lawyer._id || lawyer.id)}
                    disabled={actionLoadingId === (lawyer._id || lawyer.id)}
                    className={`mt-4 w-full rounded-2xl py-3 text-[18px] font-semibold transition disabled:opacity-60 ${
                      isFollowingLawyer(lawyer._id || lawyer.id)
                        ? 'bg-[#d9e7ff] text-[#2456f5]'
                        : 'bg-[#0d1024] text-white hover:bg-[#171b34]'
                    }`}
                  >
                    {actionLoadingId === (lawyer._id || lawyer.id)
                      ? 'Updating...'
                      : isFollowingLawyer(lawyer._id || lawyer.id)
                        ? 'Following'
                        : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="space-y-8">
          <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
            <textarea
              rows="4"
              placeholder={`${studentName}, share your legal insights, case discussions, or thoughts...`}
              className="w-full resize-none rounded-[24px] border border-[#dbe2ef] px-5 py-5 text-[18px] outline-none placeholder:text-[#8a95ab]"
            />
            <div className="mt-6 flex justify-end">
              <button type="button" className="rounded-2xl bg-[#0d1024] px-8 py-3 text-[18px] font-semibold text-white hover:bg-[#171b34] transition">
                Post
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-8 text-[#7f8ba2] shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
              Loading verified lawyer updates...
            </div>
          ) : feedPosts.length === 0 ? (
            <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-8 text-[#7f8ba2] shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
              No verified lawyer updates are available yet.
            </div>
          ) : feedPosts.map((post) => (
            <article key={post._id || post.id} className="rounded-[28px] border border-[#dbe2ef] bg-white shadow-[0_2px_12px_rgba(11,31,68,0.04)] overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {post.profileImage ? (
                      <img src={post.profileImage} alt={getDisplayName(post)} className="h-16 w-16 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#ffb76b] to-[#ff7b54] text-white flex items-center justify-center text-xl font-bold shrink-0">
                        {getProfileInitial(post)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-[18px] md:text-[22px] font-semibold">{getDisplayName(post)}</h3>
                      <p className="text-[#5e6c87] text-[16px] mt-1">
                        {(post.lawyerProfile?.specialization || 'Verified Lawyer') +
                          (post.address?.city ? ` - ${post.address.city}` : '')}
                      </p>
                      <p className="text-[#8b97ac] text-[15px] mt-2">{formatJoinLabel(post.createdAt)}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFollowLawyer(post._id || post.id)}
                    disabled={actionLoadingId === (post._id || post.id)}
                    className="text-[18px] font-semibold text-[#0d1024] hover:text-[#2456f5] transition disabled:opacity-60"
                  >
                    {actionLoadingId === (post._id || post.id)
                      ? 'Updating...'
                      : isFollowingLawyer(post._id || post.id)
                        ? 'Following'
                        : 'Follow'}
                  </button>
                </div>

                <p className="mt-8 text-[18px] leading-9 text-[#243b67]">
                  {post.lawyerProfile?.about ||
                    `${getDisplayName(post)} is available on Lawin for students interested in ${post.lawyerProfile?.specialization || 'legal practice'}. Follow registered lawyers here to discover internships, insights, and community updates.`}
                </p>
              </div>

              <div className="border-t border-[#e3e8f3] px-6 py-5 md:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3 text-[#5e6c87] text-[16px]">
                  <span>{post.lawyerProfile?.experienceYears || 0} years experience</span>
                  <div className="flex items-center gap-6">
                    <span>{post.address?.district || 'Lawin verified'}</span>
                    <span>{post.lawyerProfile?.consultationFee ? `Rs. ${post.lawyerProfile.consultationFee}` : 'Consultation ready'}</span>
                  </div>
                </div>

                <div className="mt-5 border-t border-[#e3e8f3] pt-5 grid grid-cols-3 gap-3">
                  <button type="button" className="inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-[18px] font-semibold hover:bg-[#f4f7fc] transition">
                    <Heart size={20} />
                    Like
                  </button>
                  <button type="button" className="inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-[18px] font-semibold hover:bg-[#f4f7fc] transition">
                    <MessageCircle size={20} />
                    Comment
                  </button>
                  <button type="button" className="inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-[18px] font-semibold hover:bg-[#f4f7fc] transition">
                    <Send size={20} />
                    Share
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </StudentLayout>
  );
}
