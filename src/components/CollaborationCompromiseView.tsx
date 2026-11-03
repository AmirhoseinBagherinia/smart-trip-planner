import React, { useState } from 'react';
import {
  Check,
  Copy,
  Handshake,
  MessageSquare,
  Send,
  ThumbsDown,
  ThumbsUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { Trip, User } from '../types.ts';
import { formatCurrency, getCurrencySymbol } from '../utils/currency.ts';

interface CollaborationCompromiseViewProps {
  trip: Trip;
  currentUser: User;
  allUsers: User[];
  onJoinByInviteCode: (inviteCode: string) => Promise<void>;
  onVoteStop: (stopId: string, direction: 'up' | 'down') => Promise<void>;
  onAddComment: (stopId: string, text: string) => Promise<void>;
  onSubmitCompromiseWish: (payload: {
    mustHaveInterests: string[];
    preferredPace: 'Relaxed' | 'Balanced' | 'Packed';
    dailyBudgetComfort: number;
    personalWish: string;
  }) => Promise<void>;
  onNegotiateCompromise: () => Promise<void>;
  isNegotiating: boolean;
}

const INTEREST_OPTIONS = [
  'Food & Dining',
  'History & Culture',
  'Art & Museums',
  'Nature & Parks',
  'Shopping & Markets',
  'Nightlife & Entertainment',
];

export const CollaborationCompromiseView: React.FC<
  CollaborationCompromiseViewProps
> = ({
  trip,
  currentUser,
  allUsers,
  onJoinByInviteCode,
  onVoteStop,
  onAddComment,
  onSubmitCompromiseWish,
  onNegotiateCompromise,
  isNegotiating,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinStatus, setJoinStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Compromise form state
  const existingSub = trip.compromiseSubmissions.find(
    (s) => s.userId === currentUser.id
  );
  const [wishText, setWishText] = useState(
    existingSub?.personalWish ||
      'Want authentic local street food, sunset viewpoints, and time to linger at historic cafes.'
  );
  const [pace, setPace] = useState<'Relaxed' | 'Balanced' | 'Packed'>(
    existingSub?.preferredPace || 'Balanced'
  );
  const [dailyBudget, setDailyBudget] = useState(
    String(existingSub?.dailyBudgetComfort || 120)
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    existingSub?.mustHaveInterests || ['Food & Dining', 'History & Culture']
  );
  const [submitMessage, setSubmitMessage] = useState('');

  // Quick comment state per stop
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {}
  );

  const shareLink = `${window.location.origin}/?invite=${trip.inviteCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(trip.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinStatus(null);
    if (!joinCodeInput.trim()) return;
    try {
      await onJoinByInviteCode(joinCodeInput.trim());
      setJoinStatus({
        type: 'success',
        text: `Joined shared trip with code ${joinCodeInput.toUpperCase()}!`,
      });
      setJoinCodeInput('');
    } catch (err: any) {
      setJoinStatus({
        type: 'error',
        text: err?.message || 'Could not join trip with that code.',
      });
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSaveWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishText.trim()) return;
    await onSubmitCompromiseWish({
      mustHaveInterests:
        selectedInterests.length > 0 ? selectedInterests : ['Food & Dining'],
      preferredPace: pace,
      dailyBudgetComfort: Math.max(25, parseInt(dailyBudget, 10) || 120),
      personalWish: wishText.trim(),
    });
    setSubmitMessage(`Saved ${currentUser.name}'s preferences for negotiation.`);
    setTimeout(() => setSubmitMessage(''), 3000);
  };

  const collaborators = allUsers.filter(
    (u) => u.id === trip.ownerId || trip.collaboratorIds.includes(u.id)
  );

  return (
    <div className="space-y-8">
      {/* SECTION 1: SHARE & INVITE TRAVEL BUDDIES (UC7) */}
      <section className="border border-slate-200 rounded-xl bg-white p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Share Trip & Co-Edit with Travel Buddies
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Invite friends with your unique trip code or share link so they can vote on stops, leave comments, and submit Group Compromise wishes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Shareable Invite Code
                  </div>
                  <div className="text-base font-mono font-bold text-slate-900 mt-0.5 tabular-nums">
                    {trip.inviteCode}
                  </div>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-700" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-500 font-medium">
                    Direct Collaborator Link
                  </div>
                  <div className="text-xs font-mono text-slate-700 truncate mt-0.5">
                    {shareLink}
                  </div>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-700" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Active Collaborator Roster */}
            <div className="pt-2">
              <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-700" />
                Active Trip Collaborators ({collaborators.length})
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                {collaborators.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                      {member.avatarInitials}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-900">
                        {member.name}
                      </span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span className="text-slate-500 capitalize">
                        {member.id === trip.ownerId
                          ? 'Trip Creator'
                          : 'Travel Buddy'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Join Another Shared Trip Box */}
          <div className="lg:col-span-5 p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-teal-700" />
                Join a Shared Trip via Invite Code
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Switch to another shared trip or join as a Travel Buddy using an invite code (e.g., <code className="font-mono text-slate-900">IST-2026-89B</code> or <code className="font-mono text-slate-900">MAD-2026-77M</code>).
              </p>
              <form onSubmit={handleJoinSubmit} className="mt-4 space-y-3">
                <input
                  type="text"
                  placeholder="Enter Invite Code (e.g., MAD-2026-77M)"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
                />
                <button
                  type="submit"
                  className="w-full py-2 px-4 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  Join & Switch to Shared Trip
                </button>
              </form>
              {joinStatus && (
                <p
                  className={`text-xs mt-2 font-medium ${
                    joinStatus.type === 'success'
                      ? 'text-teal-700'
                      : 'text-red-600'
                  }`}
                >
                  {joinStatus.text}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: GROUP COMPROMISE - AI NEGOTIATOR (Creative Feature 3) */}
      <section className="border border-slate-200 rounded-xl bg-white p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Handshake className="w-5 h-5 text-teal-700" />
              Group Compromise — AI Negotiator
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Each traveler and travel buddy submits their personal wish, pace preference, and budget comfort. The AI Negotiator synthesizes a balanced itinerary that honors everyone.
            </p>
          </div>
          <button
            onClick={onNegotiateCompromise}
            disabled={isNegotiating || trip.compromiseSubmissions.length === 0}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            {isNegotiating
              ? 'AI Negotiator Balancing Wishes...'
              : 'Negotiate Group Compromise with AI'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Submit Current User Wish Form */}
          <form
            onSubmit={handleSaveWish}
            className="lg:col-span-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Your Wish & Comfort Profile ({currentUser.name})
              </h3>
              <span className="text-xs text-slate-500 capitalize">
                Role: {currentUser.role}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Personal Must-Have Wish
              </label>
              <textarea
                rows={3}
                value={wishText}
                onChange={(e) => setWishText(e.target.value)}
                placeholder="Describe what matters most to you on this trip..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Preferred Pace
                </label>
                <select
                  value={pace}
                  onChange={(e) => setPace(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  <option value="Relaxed">Relaxed (2-3 stops/day)</option>
                  <option value="Balanced">Balanced (3-4 stops/day)</option>
                  <option value="Packed">Packed (4-5 stops/day)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Daily Budget Comfort ({getCurrencySymbol(trip.currency)})
                </label>
                <input
                  type="number"
                  min={25}
                  max={2500}
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Priority Interests
              </label>
              <div className="flex flex-wrap gap-1.5">
                {INTEREST_OPTIONS.map((interest) => {
                  const active = selectedInterests.includes(interest);
                  return (
                    <button
                      type="button"
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Save My Compromise Preferences
            </button>
            {submitMessage && (
              <p className="text-xs text-teal-700 font-medium">
                {submitMessage}
              </p>
            )}
          </form>

          {/* Submitted Wishes & AI Compromise Outcome */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Submitted Participant Wishes ({trip.compromiseSubmissions.length})
              </h3>
              <div className="space-y-2.5">
                {trip.compromiseSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
                      <span className="font-semibold text-slate-900">
                        {sub.userName} ({sub.role})
                      </span>
                      <span>
                        Pace: {sub.preferredPace} · Comfort: {formatCurrency(sub.dailyBudgetComfort, trip.currency)}/day · {sub.mustHaveInterests.join(', ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1.5">
                      "{sub.personalWish}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {trip.compromiseResult && (
              <div className="p-5 rounded-xl bg-teal-50/50 border border-teal-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      AI Negotiator Resolution Report
                    </h4>
                    <p className="text-xs text-slate-500">
                      Balanced across all group constraints
                    </p>
                  </div>
                  <div className="text-right tabular-nums">
                    <div className="text-xs text-slate-500">
                      Group Balance Index
                    </div>
                    <div className="text-lg font-bold text-teal-800">
                      {trip.compromiseResult.fairnessScore}% Match
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {trip.compromiseResult.summary}
                </p>

                <div className="space-y-3 pt-2 border-t border-teal-200/70">
                  {trip.compromiseResult.resolutions.map((res, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-white border border-slate-200"
                    >
                      <div className="text-xs font-semibold text-slate-900">
                        How {res.participantName}’s Wish Was Included:
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {res.howWishWasIncluded}
                      </p>
                      <div className="text-[11px] text-teal-800 font-medium mt-2">
                        Anchored Stops: {res.assignedStops.join(' · ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 3: COLLABORATIVE STOP VOTING & COMMENTS FEED (UC7) */}
      <section className="border border-slate-200 rounded-xl bg-white p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Stop-by-Stop Group Voting & Discussion
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Upvote or downvote stops and leave notes for your travel buddies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trip.days.flatMap((day) =>
            day.stops.map((stop) => {
              const upvoted = (stop.upvotes || []).includes(currentUser.id);
              const downvoted = (stop.downvotes || []).includes(currentUser.id);
              const draft = commentDrafts[stop.id] || '';

              return (
                <div
                  key={stop.id}
                  className="p-4 rounded-lg border border-slate-200 bg-white flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          Day {day.dayNumber} · {stop.startTime}–{stop.endTime} · {stop.category}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 mt-0.5">
                          {stop.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onVoteStop(stop.id, 'up')}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border flex items-center gap-1 transition-colors tabular-nums ${
                            upvoted
                              ? 'bg-teal-700 text-white border-teal-700'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          {(stop.upvotes || []).length}
                        </button>
                        <button
                          onClick={() => onVoteStop(stop.id, 'down')}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border flex items-center gap-1 transition-colors tabular-nums ${
                            downvoted
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                          {(stop.downvotes || []).length}
                        </button>
                      </div>
                    </div>

                    {/* Existing Comments */}
                    {stop.comments && stop.comments.length > 0 && (
                      <div className="mt-3 space-y-1.5 pt-2.5 border-t border-slate-100">
                        {stop.comments.map((c) => (
                          <div
                            key={c.id}
                            className="text-xs bg-slate-50 p-2 rounded border border-slate-200/70"
                          >
                            <span className="font-semibold text-slate-900">
                              {c.authorName}
                            </span>
                            <span className="text-slate-400 mx-1">·</span>
                            <span className="text-slate-500 capitalize">
                              {c.authorRole}
                            </span>
                            <p className="text-slate-700 mt-0.5">{c.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Comment Input */}
                  <div className="flex items-center gap-2 pt-2">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Add a note for your travel buddy..."
                      value={draft}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({
                          ...prev,
                          [stop.id]: e.target.value,
                        }))
                      }
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && draft.trim()) {
                          e.preventDefault();
                          await onAddComment(stop.id, draft.trim());
                          setCommentDrafts((prev) => ({
                            ...prev,
                            [stop.id]: '',
                          }));
                        }
                      }}
                      className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:bg-white focus:border-teal-700"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!draft.trim()) return;
                        await onAddComment(stop.id, draft.trim());
                        setCommentDrafts((prev) => ({
                          ...prev,
                          [stop.id]: '',
                        }));
                      }}
                      className="px-2.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shrink-0"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
