import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RefreshCw, Sparkles } from 'lucide-react';
import api from '../api/axios.jsx';
import StudentLayout from './StudentLayout.jsx';
import FeedPostCard from '../components/feed/FeedPostCard.jsx';
import PostComposerModal from '../components/feed/PostComposerModal.jsx';
import { InternshipApplicationModal, JamJoinModal } from '../components/student/StudentActionModals.jsx';
import { buildInternshipApplicationFormData, createInitialApplicationForm } from '../components/student/studentDiscoveryUtils.js';
import { updateUser } from '../redux/authSlice.jsx';

export default function StudentHome() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [feedState, setFeedState] = useState({ network: [], suggested: [], all: [] });
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [applicationTarget, setApplicationTarget] = useState(null);
  const [joinTarget, setJoinTarget] = useState(null);
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [joiningSession, setJoiningSession] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadFeed = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/posts/feed');
      setFeedState({
        network: Array.isArray(data?.network) ? data.network : [],
        suggested: Array.isArray(data?.suggested) ? data.suggested : [],
        all: Array.isArray(data?.all) ? data.all : [],
      });
    } catch (error) {
      console.error('Error loading feed:', error);
      setFeedState({ network: [], suggested: [], all: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const feedHighlights = useMemo(() => {
    const internshipCount = feedState.all.filter((item) => item.type === 'internship').length;
    const jamCount = feedState.all.filter((item) => item.type === 'jam').length;

    return { internshipCount, jamCount };
  }, [feedState.all]);

  const updateFeedItem = (targetId, updater) => {
    const applyUpdate = (items) => items.map((item) => (item.id === targetId ? updater(item) : item));

    setFeedState((current) => ({
      network: applyUpdate(current.network),
      suggested: applyUpdate(current.suggested),
      all: applyUpdate(current.all),
    }));
  };

  const prependPostToFeed = (post) => {
    setFeedState((current) => ({
      network: [post, ...current.network],
      suggested: [...current.suggested],
      all: [post, ...current.all],
    }));
  };

  const handleCreatePost = async ({ content, visibility, tags, images }) => {
    if (!String(content || '').trim()) {
      setPostError('Please add some text before posting.');
      return;
    }

    try {
      setPosting(true);
      setPostError('');
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('visibility', visibility);
      tags.forEach((tag) => formData.append('tags', tag));
      images.forEach((image) => formData.append('images', image));

      const { data } = await api.post('/posts/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data?.post) {
        prependPostToFeed({ ...data.post, priority: 3 });
      }
      setShowComposer(false);
    } catch (error) {
      console.error('Error creating post:', error);
      setPostError(error.response?.data?.message || 'Failed to create post.');
    } finally {
      setPosting(false);
    }
  };

  const handleApply = async (values) => {
    if (!applicationTarget) return;

    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'collegeName', 'degree', 'yearOfStudy'];
    const hasMissingField = requiredFields.some((field) => !String(values[field] || '').trim());
    if (hasMissingField) {
      setActionError('Please complete all required fields before submitting.');
      return;
    }

    if (!values.skills.length) {
      setActionError('Please add at least one skill.');
      return;
    }

    try {
      setSubmittingApplication(true);
      setActionError('');
      const { data } = await api.post(
        `/auth/student/internships/${applicationTarget.id}/apply`,
        buildInternshipApplicationFormData(values),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      dispatch(updateUser(data.user));
      updateFeedItem(applicationTarget.id, (post) => ({
        ...post,
        applied: true,
        applicationCount: (post.applicationCount || 0) + 1,
      }));
      setApplicationTarget(null);
    } catch (error) {
      console.error('Error submitting internship application:', error);
      setActionError(error.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmittingApplication(false);
    }
  };

  const handleJoin = async (values) => {
    if (!joinTarget) return;

    if (!String(values.name || '').trim()) {
      setActionError('Please enter your name to join the session.');
      return;
    }

    try {
      setJoiningSession(true);
      setActionError('');
      const { data } = await api.post(`/auth/student/jam-sessions/${joinTarget.id}/join`, values);
      dispatch(updateUser(data.user));
      updateFeedItem(joinTarget.id, (post) => ({
        ...post,
        joined: true,
        participantCount: data.participantCount ?? post.participantCount,
      }));
      setJoinTarget(null);
    } catch (error) {
      console.error('Error joining jam session:', error);
      setActionError(error.response?.data?.message || 'Failed to join session.');
    } finally {
      setJoiningSession(false);
    }
  };

  return (
    <StudentLayout>
      <div className="min-w-0 space-y-8">
        <section className="overflow-hidden rounded-[28px] border border-[#ead79c] bg-[linear-gradient(135deg,#f4e6ae_0%,#fff2c9_52%,#fff6dc_52%,#fffdf7_100%)] p-4 text-[#102144] shadow-[0_20px_60px_rgba(91,65,17,0.16)] sm:rounded-[32px] sm:p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#fff7de]/20 px-4 py-2 text-sm font-semibold backdrop-blur">
                <Sparkles size={16} />
                Personalized Feed
              </div>
              <h1 className="mt-5 max-w-2xl text-[30px] font-semibold leading-tight tracking-tight sm:text-[34px] md:text-[46px]">
                Network-first legal updates, opportunities, and conversations.
              </h1>
              <p className="mt-4 max-w-2xl text-[16px] leading-8 text-[#44516d]">
                Your home feed now blends posts from your network, relevant legal content, and internship or jam opportunities in one modern stream.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[28px] bg-white/94 p-5 text-[#102144]">
                <p className="text-sm uppercase tracking-[0.16em] text-[#6d7a92]">Internships in Feed</p>
                <p className="mt-3 text-[32px] font-semibold">{feedHighlights.internshipCount}</p>
              </div>
              <div className="rounded-[28px] bg-[#f7e9bb] p-5 text-[#102144]">
                <p className="text-sm uppercase tracking-[0.16em] text-[#6d7a92]">Jam Sessions in Feed</p>
                <p className="mt-3 text-[32px] font-semibold">{feedHighlights.jamCount}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#dbe2ef] bg-white p-5 shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
          <button
            type="button"
            onClick={() => {
              setPostError('');
              setShowComposer(true);
            }}
            className="flex w-full items-center justify-between rounded-[24px] bg-[#f6f8fc] px-5 py-5 text-left transition hover:bg-[#eef3fb]"
          >
            <span className="text-[18px] font-medium text-[#44516d]">What&apos;s on your mind? ✍️</span>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#15a276]">Create Post</span>
          </button>
        </section>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[28px] font-semibold text-[#0b1f44]">Your Feed</h2>
            <p className="mt-2 text-[16px] text-[#5e6c87]">Connections and follows come first, then relevant suggested posts.</p>
          </div>
          <button
            type="button"
            onClick={loadFeed}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#dbe2ef] bg-white px-4 py-3 font-semibold text-[#243b67] transition hover:bg-[#f8faff]"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 text-[#7f8ba2] shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
            Loading your personalized feed...
          </div>
        ) : (
          <div className="space-y-10">
            <FeedSection
              title="From your network 🔥"
              description="Posts from followed lawyers, connected students, and your own updates."
              items={feedState.network}
              emptyMessage="Nothing from your network yet. Follow lawyers or connect with students to personalize this section."
              onApply={setApplicationTarget}
              onJoin={setJoinTarget}
              onActionStart={() => setActionError('')}
            />

            <FeedSection
              title="Suggested for you"
              description="Relevant legal content, internships, jam sessions, and discovery posts."
              items={feedState.suggested}
              emptyMessage="No suggested posts yet."
              onApply={setApplicationTarget}
              onJoin={setJoinTarget}
              onActionStart={() => setActionError('')}
            />
          </div>
        )}
      </div>

      <PostComposerModal
        key={showComposer ? 'student-post-open' : 'student-post-closed'}
        open={showComposer}
        title="Create a student post"
        description="Share a legal insight, ask a question, or post an update with your network."
        submitting={posting}
        error={postError}
        onClose={() => {
          setShowComposer(false);
          setPostError('');
        }}
        onSubmit={handleCreatePost}
      />

      <InternshipApplicationModal
        key={applicationTarget?.id || 'application-closed'}
        open={Boolean(applicationTarget)}
        internship={applicationTarget}
        initialValues={createInitialApplicationForm(user)}
        submitting={submittingApplication}
        error={actionError}
        onClose={() => {
          setApplicationTarget(null);
          setActionError('');
        }}
        onSubmit={handleApply}
      />

      <JamJoinModal
        key={joinTarget?.id || 'join-closed'}
        open={Boolean(joinTarget)}
        session={joinTarget}
        defaultName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
        defaultEmail={user?.email || ''}
        submitting={joiningSession}
        error={actionError}
        onClose={() => {
          setJoinTarget(null);
          setActionError('');
        }}
        onSubmit={handleJoin}
      />
    </StudentLayout>
  );
}

function FeedSection({ title, description, items, emptyMessage, onApply, onJoin, onActionStart }) {
  return (
    <section className="space-y-5">
      <div>
        <h3 className="text-[24px] font-semibold text-[#0b1f44]">{title}</h3>
        <p className="mt-2 text-[16px] text-[#5e6c87]">{description}</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 text-[#7f8ba2] shadow-[0_2px_12px_rgba(11,31,68,0.04)]">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((post) => (
            <FeedPostCard
              key={`${post.sourceModel || 'Post'}-${post.id}`}
              post={post}
              onApply={(target) => {
                onActionStart();
                onApply(target);
              }}
              onJoin={(target) => {
                onActionStart();
                onJoin(target);
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
