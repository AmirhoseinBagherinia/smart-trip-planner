import React, { useState } from 'react';
import {
  BookOpen,
  Camera,
  Check,
  Share2,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Trip, User } from '../types.ts';

interface TravelDiaryViewProps {
  trip: Trip;
  currentUser: User;
  onAddMemoryNote: (payload: {
    stopId: string;
    stopName: string;
    dayNumber: number;
    caption: string;
    photoDataUrl: string;
    mood: string;
  }) => Promise<void>;
  onGenerateDiaryStory: () => Promise<void>;
  isGeneratingDiary: boolean;
}

const MOOD_OPTIONS = [
  'Awestruck',
  'Delighted',
  'Inspired',
  'Serene',
  'Adventurous',
];

const PRESET_POSTCARDS = [
  { id: 'svg:hagia_sophia', label: 'Historic Dome & Morning Light' },
  { id: 'svg:spice_bazaar', label: 'Bazaar Lanterns & Spices' },
  { id: 'svg:bosphorus_ferry', label: 'Golden Hour Waterfront Ferry' },
  { id: 'svg:alley_bistro', label: 'Old Quarter Evening Bistro' },
];

const MemoryIllustration: React.FC<{
  photoDataUrl: string;
  title: string;
}> = ({ photoDataUrl, title }) => {
  if (photoDataUrl && photoDataUrl.startsWith('data:image/')) {
    return (
      <img
        src={photoDataUrl}
        alt={title}
        referrerPolicy="no-referrer"
        className="w-full h-44 object-cover"
      />
    );
  }

  // Bespoke architectural SVG postcards for zero-broken-image guarantee
  const variant = photoDataUrl || 'svg:bosphorus_ferry';
  return (
    <div className="w-full h-44 bg-slate-900 relative overflow-hidden flex flex-col justify-end p-4">
      <svg
        viewBox="0 0 400 180"
        className="absolute inset-0 w-full h-full object-cover opacity-85"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="55%" stopColor="#134e4a" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
        <rect width="400" height="180" fill="url(#skyGrad)" />
        <circle cx="310" cy="48" r="24" fill="#fbbf24" opacity="0.75" />
        {variant.includes('hagia') ? (
          <>
            <path
              d="M110 140 Q200 45 290 140 Z"
              fill="#1e293b"
              stroke="#fbbf24"
              strokeWidth="1.2"
            />
            <rect x="88" y="60" width="10" height="85" fill="#1e293b" />
            <rect x="302" y="60" width="10" height="85" fill="#1e293b" />
            <rect x="0" y="140" width="400" height="40" fill="#090d16" />
          </>
        ) : variant.includes('spice') ? (
          <>
            <path
              d="M40 180 L40 60 Q200 10 360 60 L360 180 Z"
              fill="#1e293b"
              opacity="0.7"
            />
            <circle cx="140" cy="75" r="14" fill="#f59e0b" opacity="0.85" />
            <circle cx="200" cy="65" r="18" fill="#fbbf24" opacity="0.9" />
            <circle cx="260" cy="75" r="14" fill="#f59e0b" opacity="0.85" />
          </>
        ) : (
          <>
            <path
              d="M0 125 Q120 105 240 125 T400 120 L400 180 L0 180 Z"
              fill="#0f766e"
              opacity="0.55"
            />
            <polygon points="150,122 250,122 235,138 165,138" fill="#f8fafc" />
            <rect x="175" y="106" width="45" height="16" fill="#e2e8f0" />
          </>
        )}
      </svg>
      <div className="relative z-10 text-xs font-medium text-amber-200/90 tracking-tight">
        Archival Postcard · {title}
      </div>
    </div>
  );
};

export const TravelDiaryView: React.FC<TravelDiaryViewProps> = ({
  trip,
  currentUser,
  onAddMemoryNote,
  onGenerateDiaryStory,
  isGeneratingDiary,
}) => {
  const allStops = trip.days.flatMap((d) =>
    d.stops.map((s) => ({ ...s, dayNumber: d.dayNumber }))
  );

  const [selectedStopId, setSelectedStopId] = useState(
    allStops[0]?.id || 'custom'
  );
  const [caption, setCaption] = useState('');
  const [mood, setMood] = useState('Inspired');
  const [photoDataUrl, setPhotoDataUrl] = useState('svg:hagia_sophia');
  const [copiedShare, setCopiedShare] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) return;
    const matchedStop = allStops.find((s) => s.id === selectedStopId);
    await onAddMemoryNote({
      stopId: selectedStopId,
      stopName: matchedStop?.name || trip.destination,
      dayNumber: matchedStop?.dayNumber || 1,
      caption: caption.trim(),
      photoDataUrl,
      mood,
    });
    setCaption('');
  };

  const handleCopyDiaryStory = () => {
    if (!trip.diaryStory) return;
    const text = `${trip.diaryStory.title}\n${trip.diaryStory.subtitle}\n\n${trip.diaryStory.narrativeMarkdown}\n\n${trip.diaryStory.closingReflection}`;
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* HEADER & ACTION */}
      <section className="border border-slate-200 rounded-xl bg-white p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-700" />
              After the Trip — Memories & AI Travel Diary
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Upload photos and capture personal notes from visited stops, then weave them into a magazine-grade Travel Diary story.
            </p>
          </div>
          <button
            onClick={onGenerateDiaryStory}
            disabled={isGeneratingDiary}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 disabled:opacity-50 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isGeneratingDiary
              ? 'Weaving Travelogue Story...'
              : 'Weave AI Travel Diary Story'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
          {/* LEFT: ADD PHOTO & MEMORY NOTE FORM */}
          <form
            onSubmit={handleAddMemory}
            className="lg:col-span-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 h-fit"
          >
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-teal-700" />
              Log a Visited Stop Memory
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Visited Stop
              </label>
              <select
                value={selectedStopId}
                onChange={(e) => setSelectedStopId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              >
                {allStops.map((s) => (
                  <option key={s.id} value={s.id}>
                    Day {s.dayNumber}: {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mood & Atmosphere
              </label>
              <div className="flex flex-wrap gap-1.5">
                {MOOD_OPTIONS.map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMood(m)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                      mood === m
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Photo Upload or Illustrated Postcard
              </label>
              <div className="space-y-2">
                <label className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-teal-700 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-teal-700" />
                  <span>Upload Photo from Device</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_POSTCARDS.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPhotoDataUrl(p.id)}
                      className={`px-2.5 py-1.5 text-[11px] text-left rounded border transition-colors truncate ${
                        photoDataUrl === p.id
                          ? 'bg-teal-50 border-teal-700 text-teal-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Your Memory Note
              </label>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What stood out? A scent, a conversation, a view at sunset..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Save Memory to Trip Chronicle
            </button>
          </form>

          {/* RIGHT: GENERATED EDITORIAL DIARY STORY */}
          <div className="lg:col-span-7 space-y-6">
            {trip.diaryStory ? (
              <article className="p-6 rounded-xl border border-slate-200 bg-white space-y-5">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <div className="text-xs font-medium text-teal-700">
                      Editorial Travel Diary · {trip.destination}, {trip.country}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">
                      {trip.diaryStory.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {trip.diaryStory.subtitle}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyDiaryStory}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    {copiedShare ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-teal-700" />
                        Story Copied
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        Share Story
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-3 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {trip.diaryStory.narrativeMarkdown}
                </div>

                {trip.diaryStory.highlights &&
                  trip.diaryStory.highlights.length > 0 && (
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                      <div className="text-xs font-semibold text-slate-900">
                        Signature Journey Highlights
                      </div>
                      <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                        {trip.diaryStory.highlights.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                <div className="pt-3 border-t border-slate-200 text-xs italic text-slate-600">
                  "{trip.diaryStory.closingReflection}"
                </div>
              </article>
            ) : (
              <div className="p-8 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-3">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-sm font-semibold text-slate-900">
                  No Travel Diary Story Generated Yet
                </div>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Add memory notes from your stops and click "Weave AI Travel Diary Story" to create a formatted travelogue.
                </p>
              </div>
            )}

            {/* CAPTURED PHOTO & MEMORY GALLERY */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Captured Stop Memories ({trip.diaryNotes.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trip.diaryNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg border border-slate-200 bg-white overflow-hidden flex flex-col"
                  >
                    <MemoryIllustration
                      photoDataUrl={note.photoDataUrl}
                      title={note.stopName}
                    />
                    <div className="p-3.5 space-y-1.5">
                      <div className="text-[11px] text-slate-500 tabular-nums">
                        Day {note.dayNumber} · {note.stopName} · Mood: {note.mood}
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed">
                        "{note.caption}"
                      </p>
                      <div className="text-[11px] text-slate-400 pt-1">
                        Logged by {note.authorName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
