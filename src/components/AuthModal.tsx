import React, { useState } from 'react';
import { UserCheck, X } from 'lucide-react';
import { User, UserRole } from '../types.ts';

interface AuthModalProps {
  users: User[];
  currentUser: User;
  onSelectUser: (user: User) => void;
  onRegisterUser: (payload: {
    name: string;
    email: string;
    role: UserRole;
  }) => Promise<void>;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  users,
  currentUser,
  onSelectUser,
  onRegisterUser,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('traveler');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    setSubmitting(true);
    try {
      await onRegisterUser({
        name: name.trim(),
        email: email.trim(),
        role,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not register account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Account Sign In & Role Directory
            </h2>
            <p className="text-xs text-slate-500">
              Switch accounts instantly or create a new profile.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Existing Accounts */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-800">
              Existing Accounts (One-Click Switch)
            </div>
            <div className="space-y-1.5">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onSelectUser(u);
                      onClose();
                    }}
                    className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                      isCurrent
                        ? 'bg-teal-50/70 border-teal-700'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                        {u.avatarInitials}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-slate-900">
                          {u.name}
                          {u.isBlocked ? ' (Restricted)' : ''}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {u.email} · Role: <strong className="capitalize">{u.role}</strong>
                        </div>
                      </div>
                    </div>
                    {isCurrent && (
                      <UserCheck className="w-4 h-4 text-teal-700" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Register / Sign Up Form */}
          <form
            onSubmit={handleSubmit}
            className="pt-4 border-t border-slate-200 space-y-3"
          >
            <div className="text-xs font-semibold text-slate-800">
              Create New Account / Sign Up
            </div>
            {error && (
              <p className="text-xs text-red-600 font-medium">{error}</p>
            )}
            <input
              type="text"
              placeholder="Full Name (e.g., Sofia Rossi)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
            />
            <input
              type="email"
              placeholder="Email Address (e.g., sofia@smarttrip.io)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-700"
            />
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Account Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              >
                <option value="traveler">Traveler (Trip Creator & Planner)</option>
                <option value="buddy">Travel Buddy (Collaborator & Voter)</option>
                <option value="admin">Admin (Moderation & Places Manager)</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors"
            >
              {submitting ? 'Creating Account...' : 'Sign Up & Switch Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
