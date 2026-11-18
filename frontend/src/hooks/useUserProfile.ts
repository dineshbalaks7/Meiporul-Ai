import { useState, useCallback } from 'react';

export interface UserProfile {
  name: string;
  email: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Meiporul User',
  email: 'user@meiporul.ai',
};

export function getUserInitials(name: string): string {
  if (!name.trim()) return 'M';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const savedName = localStorage.getItem('meiporul_user_name') || localStorage.getItem('documind_user_name');
      const savedEmail = localStorage.getItem('meiporul_user_email') || localStorage.getItem('documind_user_email');
      return {
        name: savedName || DEFAULT_PROFILE.name,
        email: savedEmail || DEFAULT_PROFILE.email,
      };
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const updateProfile = useCallback((newProfile: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...newProfile };
      try {
        localStorage.setItem('meiporul_user_name', updated.name);
        localStorage.setItem('meiporul_user_email', updated.email);
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  }, []);

  return {
    profile,
    updateProfile,
    initials: getUserInitials(profile.name),
  };
}
