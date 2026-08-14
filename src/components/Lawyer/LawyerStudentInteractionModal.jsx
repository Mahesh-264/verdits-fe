import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBriefcase, FaPlus, FaUserGraduate } from 'react-icons/fa';
import { Users } from 'lucide-react';
import FeedPostCard from '../feed/FeedPostCard.jsx';
import ReactionBar from '../feed/ReactionBar.jsx';
import { EmptyBlock, ModalShell } from './LawyerSharedComponents';

export default function LawyerStudentInteractionModal({
  show,
  onClose,
  studentInteractionTab,
  setStudentInteractionTab,
  setShowInternshipForm,
  setShowJamSessionForm,
  followerStudents,
  interactionLoading,
  publishedInternships,
  handleInternshipLike,
  handleInternshipComment,
  handleOpenApplicantsDrawer,
  handleToggleInternshipStatus,
  togglingInternshipId,
  handleDeleteInternship,
  deletingInternshipId,
  publishedJamSessions,
  handleJamLike,
  handleJamComment,
  handleOpenParticipantsDrawer,
  handleDeleteJamSession,
  deletingJamSessionId,
  postLoading,
  publishedPosts,
  showInternshipForm,
  handlePublishInternship,
  internshipForm,
  handleInternshipInput,
  showJamSessionForm,
  handlePublishJamSession,
  jamSessionForm,
  handleJamSessionInput,
  setPostError,
  setShowPostComposer,
  handleDeletePost,
  deletingPostId,
}) {
  const navigate = useNavigate();

  if (!show) return null;

  return (
    <ModalShell
      title="Student Interaction"
      icon={<FaUserGraduate className="text-cyan-400" />}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[#5f7488]">Create, manage, and track all student engagement from one dashboard module.</p>
        
        {/* Top Horizontal Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#d7e9ef] pb-3">
          <button
            type="button"
            onClick={() => {
              setStudentInteractionTab('internships');
              setShowJamSessionForm(false);
            }}
            className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
              studentInteractionTab === 'internships'
                ? 'bg-[#f1d15f] text-zinc-950 shadow-sm border border-[#d6b85b]'
                : 'bg-white text-[#43556a] hover:bg-[#e8f7f2] hover:text-[#15a276] border border-[#d7e9ef]'
            }`}
          >
            Internships
          </button>
          <button
            type="button"
            onClick={() => {
              setStudentInteractionTab('jamSessions');
              setShowInternshipForm(false);
            }}
            className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
              studentInteractionTab === 'jamSessions'
                ? 'bg-[#f1d15f] text-zinc-950 shadow-sm border border-[#d6b85b]'
                : 'bg-white text-[#43556a] hover:bg-[#e8f7f2] hover:text-[#15a276] border border-[#d7e9ef]'
            }`}
          >
            Jam Sessions
          </button>
          <button
            type="button"
            onClick={() => {
              setStudentInteractionTab('posts');
              setShowInternshipForm(false);
              setShowJamSessionForm(false);
            }}
            className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
              studentInteractionTab === 'posts'
                ? 'bg-[#f1d15f] text-zinc-950 shadow-sm border border-[#d6b85b]'
                : 'bg-white text-[#43556a] hover:bg-[#e8f7f2] hover:text-[#15a276] border border-[#d7e9ef]'
            }`}
          >
            Posts
          </button>
          <button
            type="button"
            onClick={() => {
              setStudentInteractionTab('followers');
              setShowInternshipForm(false);
              setShowJamSessionForm(false);
            }}
            className={`rounded-xl px-5 py-3 text-sm font-bold transition inline-flex items-center gap-2 ${
              studentInteractionTab === 'followers'
                ? 'bg-[#f1d15f] text-zinc-950 shadow-sm border border-[#d6b85b]'
                : 'bg-white text-[#43556a] hover:bg-[#e8f7f2] hover:text-[#15a276] border border-[#d7e9ef]'
            }`}
          >
            Followers
            {followerStudents.length > 0 ? (
              <span className="rounded-full bg-zinc-950 px-2 py-0.5 text-xs text-white">
                {followerStudents.length}
              </span>
            ) : null}
          </button>
        </div>

        <div className="min-h-[600px] border border-[#d7e9ef] rounded-2xl overflow-hidden bg-white shadow-sm text-[#062552]">

          <div className="relative flex-1 grid min-h-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="overflow-y-auto p-6">
              {studentInteractionTab === 'internships' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold">Posted Internships</h3>
                      <p className="text-sm text-zinc-400 mt-1">Track posted roles, applicant volume, and open or close intake without leaving the dashboard.</p>
                    </div>
                  </div>

                  {interactionLoading ? (
                    <EmptyBlock icon={<FaBriefcase size={24} />} message="Loading internships..." />
                  ) : publishedInternships.length === 0 ? (
                    <EmptyBlock icon={<FaBriefcase size={24} />} message="No internships published yet." />
                  ) : (
                    publishedInternships.map((internship) => (
                      <div key={internship.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h4 className="text-lg font-bold text-white">{internship.title}</h4>
                              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                                internship.status === 'closed'
                                  ? 'bg-red-500/10 text-red-300 border-red-500/20'
                                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                              }`}>
                                {internship.status === 'closed' ? 'Closed' : 'Open'}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-400 mt-1">{internship.location || 'Location not specified'}</p>
                          </div>
                          <span className="text-xs font-bold bg-[#15a276]/10 text-[#19b98d] border border-[#15a276]/20 px-3 py-1 rounded-full">
                            {new Date(internship.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-sm text-zinc-300 mt-4 leading-7">{internship.description || 'No description added.'}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 text-xs text-zinc-400">
                          <div>Location: {internship.location || 'Not specified'}</div>
                          <div>Duration: {internship.duration || 'Not specified'}</div>
                          <div>Stipend: {internship.stipend || 'Not specified'}</div>
                          <div>{internship.applicationCount || 0} Applied</div>
                        </div>

                        <div className="mt-5 rounded-xl border border-zinc-800 bg-white p-4 text-zinc-950">
                          <ReactionBar
                            item={internship}
                            itemLabel="internship"
                            compact
                            onLike={handleInternshipLike}
                            onComment={handleInternshipComment}
                          />
                        </div>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => handleOpenApplicantsDrawer(internship)}
                            className="verdits-primary-action inline-flex items-center justify-center gap-2 rounded-lg border border-[#d6b85b] px-4 py-3 font-semibold transition"
                          >
                            <Users size={16} />
                            View Applicants
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleInternshipStatus(internship)}
                            disabled={togglingInternshipId === internship.id}
                            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold transition ${
                              internship.status === 'closed'
                                ? 'verdits-primary-action'
                                : 'verdits-danger-action'
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            {togglingInternshipId === internship.id
                              ? 'Updating...'
                              : internship.status === 'closed'
                                ? 'Reopen Internship'
                                : 'Close Internship'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteInternship(internship)}
                            disabled={deletingInternshipId === internship.id}
                            className="verdits-danger-secondary inline-flex items-center justify-center gap-2 rounded-lg border border-red-900/60 px-4 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingInternshipId === internship.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : studentInteractionTab === 'jamSessions' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold">Posted Jam Sessions</h3>
                      <p className="text-sm text-zinc-400 mt-1">Monitor participation and review everyone who joined from the same dashboard workspace.</p>
                    </div>
                  </div>

                  {interactionLoading ? (
                    <EmptyBlock icon={<FaUserGraduate size={24} />} message="Loading jam sessions..." />
                  ) : publishedJamSessions.length === 0 ? (
                    <EmptyBlock icon={<FaUserGraduate size={24} />} message="No jam sessions published yet." />
                  ) : (
                    publishedJamSessions.map((session) => (
                      <div key={session.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <h4 className="text-lg font-bold text-white">{session.title}</h4>
                            <p className="text-sm text-zinc-400 mt-1">{session.location || 'Location not specified'}</p>
                          </div>
                          <span className="text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-sm text-zinc-300 mt-4 leading-7">{session.summary || 'No description added.'}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4 text-xs text-zinc-400">
                          <div>Schedule: {session.schedule || 'Not specified'}</div>
                          <div>Date: {new Date(session.createdAt).toLocaleDateString()}</div>
                          <div>Location: {session.location || 'Not specified'}</div>
                          <div>{session.participantCount || 0} Students Joined</div>
                        </div>

                        <div className="mt-5 rounded-xl border border-zinc-800 bg-white p-4 text-zinc-950">
                          <ReactionBar
                            item={session}
                            itemLabel="jam session"
                            compact
                            onLike={handleJamLike}
                            onComment={handleJamComment}
                          />
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handleOpenParticipantsDrawer(session)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 font-semibold text-white hover:border-cyan-500/40"
                          >
                            <Users size={16} />
                            View Participants
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteJamSession(session)}
                            disabled={deletingJamSessionId === session.id}
                            className="inline-flex items-center justify-center rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 font-semibold text-red-200 transition hover:bg-red-900/60 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingJamSessionId === session.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : studentInteractionTab === 'posts' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold">Published Posts</h3>
                      <p className="text-sm text-zinc-400 mt-1">General social posts from your account appear here and flow into the personalized student feed.</p>
                    </div>
                  </div>

                  {postLoading ? (
                    <EmptyBlock icon={<FaUserGraduate size={24} />} message="Loading posts..." />
                  ) : publishedPosts.length === 0 ? (
                    <EmptyBlock icon={<FaUserGraduate size={24} />} message="No posts published yet." />
                  ) : (
                    publishedPosts.map((post) => (
                      <FeedPostCard
                        key={`lawyer-post-${post.id}`}
                        post={post}
                        onDelete={handleDeletePost}
                        deleting={deletingPostId === post.id}
                      />
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#062552]">Student Followers</h3>
                      <p className="text-sm text-[#5f7488] mt-1">Students who are currently following your profile and updates.</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[#d7e9ef] bg-[#f8fbfc] px-4 py-1.5 text-sm font-bold text-[#5f7488]">
                      {followerStudents.length} {followerStudents.length === 1 ? 'Follower' : 'Followers'}
                    </span>
                  </div>

                  {interactionLoading ? (
                    <EmptyBlock icon={<Users size={24} />} message="Loading followers..." />
                  ) : followerStudents.length === 0 ? (
                    <EmptyBlock icon={<Users size={24} />} message="No student followers yet." />
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {followerStudents.map((follower) => {
                        const followerId = follower.id || follower._id;
                        return (
                          <div
                            key={followerId}
                            className="rounded-2xl border border-[#d7e9ef] bg-white p-5 shadow-sm transition hover:border-[#15a276] hover:shadow-md flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-4">
                                {follower.profileImage ? (
                                  <img
                                    src={follower.profileImage}
                                    alt={follower.name}
                                    className="h-14 w-14 rounded-full object-cover border border-[#d7e9ef]"
                                  />
                                ) : (
                                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#8de2c6] to-[#15a276] text-white font-bold text-lg flex items-center justify-center border border-[#d7e9ef]">
                                    {follower.name ? follower.name.charAt(0).toUpperCase() : 'S'}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <h4 className="truncate text-base font-bold text-[#062552]">{follower.name}</h4>
                                  <p className="truncate text-xs font-semibold text-[#15a276]">
                                    {follower.collegeName || 'Law Student'}
                                  </p>
                                  {follower.currentYear ? (
                                    <p className="text-[11px] text-[#5f7488]">{follower.currentYear}</p>
                                  ) : null}
                                </div>
                              </div>

                              <div className="mt-4 border-t border-[#f0f6f8] pt-3 text-xs text-[#5f7488] space-y-1">
                                {follower.email ? (
                                  <p className="truncate">Email: <span className="font-semibold text-[#062552]">{follower.email}</span></p>
                                ) : null}
                                {follower.phone ? (
                                  <p>Phone: <span className="font-semibold text-[#062552]">{follower.phone}</span></p>
                                ) : null}
                              </div>
                            </div>

                            <div className="mt-4 border-t border-[#f0f6f8] pt-3 flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  navigate(`/student-profile/${followerId}`, {
                                    state: { returnTo: '/lawyer-dash?section=student-interactions&tab=followers' },
                                  });
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] px-4 py-2 text-xs font-bold text-[#062552] transition hover:bg-[#15a276] hover:text-white"
                              >
                                View Profile &rarr;
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t xl:border-t-0 xl:border-l border-zinc-800 bg-zinc-950/30 p-6 overflow-y-auto">
              {studentInteractionTab === 'internships' ? (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInternshipForm((current) => !current);
                      setShowJamSessionForm(false);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#15a276] hover:bg-[#19b98d] text-zinc-950 font-bold px-5 py-3 transition"
                  >
                    <FaPlus />
                    New Internship
                  </button>

                  {showInternshipForm && (
                    <form onSubmit={handlePublishInternship} className="mt-5 space-y-4">
                      <input name="title" value={internshipForm.title} onChange={handleInternshipInput} placeholder="Internship title" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-[#15a276]" required />
                      <textarea name="description" value={internshipForm.description} onChange={handleInternshipInput} placeholder="Description" rows="4" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-[#15a276]" required />
                      <input name="location" value={internshipForm.location} onChange={handleInternshipInput} placeholder="Location" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-[#15a276]" />
                      <input name="duration" value={internshipForm.duration} onChange={handleInternshipInput} placeholder="Duration" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-[#15a276]" />
                      <input name="stipend" value={internshipForm.stipend} onChange={handleInternshipInput} placeholder="Stipend" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-[#15a276]" />
                      <button type="submit" className="w-full rounded-xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 font-bold px-5 py-3 border border-[#d6b85b] shadow-sm transition">
                        Publish Internship
                      </button>
                    </form>
                  )}
                </div>
              ) : studentInteractionTab === 'jamSessions' ? (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowJamSessionForm((current) => !current);
                      setShowInternshipForm(false);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-bold px-5 py-3 transition"
                  >
                    <FaPlus />
                    New Jam Session
                  </button>

                  {showJamSessionForm && (
                    <form onSubmit={handlePublishJamSession} className="mt-5 space-y-4">
                      <input name="title" value={jamSessionForm.title} onChange={handleJamSessionInput} placeholder="Session title" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-cyan-400" required />
                      <input name="topic" value={jamSessionForm.topic} onChange={handleJamSessionInput} placeholder="Session topic" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-cyan-400" required />
                      <textarea name="summary" value={jamSessionForm.summary} onChange={handleJamSessionInput} placeholder="Session summary" rows="4" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-cyan-400" required />
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">Session Date *</label>
                          <input
                            type="date"
                            name="scheduleDate"
                            value={jamSessionForm.scheduleDate || ''}
                            onChange={handleJamSessionInput}
                            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">Session Time *</label>
                          <input
                            type="time"
                            name="scheduleTime"
                            value={jamSessionForm.scheduleTime || ''}
                            onChange={handleJamSessionInput}
                            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                            required
                          />
                        </div>
                      </div>

                      <input name="location" value={jamSessionForm.location} onChange={handleJamSessionInput} placeholder="Location / online link" className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-cyan-400" />
                      <button type="submit" className="w-full rounded-xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 font-bold px-5 py-3 border border-[#d6b85b] shadow-sm transition">
                        Publish Jam Session
                      </button>
                    </form>
                  )}
                </div>
              ) : studentInteractionTab === 'posts' ? (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setPostError('');
                      setShowPostComposer(true);
                    }}
                    className="new-post-action w-full inline-flex items-center justify-center gap-2 rounded-xl text-zinc-950 font-bold px-5 py-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1d15f] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    <FaPlus />
                    New Post
                  </button>
                  <p className="mt-4 text-sm leading-7 text-zinc-400">
                    Share general updates, insights, and media posts. These appear instantly in the social feed and are ranked by network relevance and recency.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="rounded-2xl border border-[#d7e9ef] bg-[#f8fbfc] p-5">
                    <h4 className="text-base font-bold text-[#062552]">Followers Overview</h4>
                    <p className="mt-2 text-xs leading-6 text-[#5f7488]">
                      Students who follow you receive real-time notifications whenever you publish new internships, jam sessions, or educational posts.
                    </p>
                    <div className="mt-4 rounded-xl border border-[#d7e9ef] bg-white p-4">
                      <p className="text-xs font-semibold text-[#5f7488]">Total Followers</p>
                      <p className="mt-1 text-2xl font-bold text-[#062552]">{followerStudents.length}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
