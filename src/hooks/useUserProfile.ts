import { useState, useEffect } from 'react';
import type { UserProfile } from '@/types/user';

// Simple cache invalidation mechanism
let profileCache: UserProfile | null = null;
let cacheInvalidated = false;

export function invalidateProfileCache() {
  profileCache = null;
  cacheInvalidated = true;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(profileCache);
  const [loading, setLoading] = useState(!profileCache);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/profile');
      
      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated
          setProfile(null);
          setUserId(null);
          profileCache = null;
          return;
        }
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
      
      const data = await response.json();
      setProfile(data.profile);
      setUserId(data.profile?.id || null);
      profileCache = data.profile;
      cacheInvalidated = false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profileCache || cacheInvalidated) {
      fetchProfile();
    } else {
      // Set userId from cache
      setUserId(profileCache?.id || null);
    }
  }, []);

  return {
    profile,
    userId,
    loading,
    error,
    refetch: fetchProfile,
  };
}
