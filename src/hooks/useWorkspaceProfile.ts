import { useState, useEffect } from 'react';
import { API_URL } from '../config';

interface UseWorkspaceProfileReturn {
  loading: boolean;
  profileType: string | null;
  profileData: any;
  saveProfile: (type: string, data: any) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useWorkspaceProfile(): UseWorkspaceProfileReturn {
  const [loading, setLoading] = useState(true);
  const [profileType, setProfileType] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('session_token');
      if (!token) { setLoading(false); return; }

      const response = await fetch(`${API_URL}/api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'profile.get' })
      });

      const data = await response.json();

      if (data.ok && data.profile) {
        setProfileType(data.profile.type);
        setProfileData(data.profile.data);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (type: string, data: any) => {
    try {
      const token = localStorage.getItem('session_token');
      if (!token) throw new Error('Not signed in');

      const response = await fetch(`${API_URL}/api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'profile.save',
          profileType: type,
          profileData: data
        })
      });

      const result = await response.json();

      if (!result.ok) throw new Error(result.error || 'Failed to save profile');

      setProfileType(result.profile.type);
      setProfileData(result.profile.data);
    } catch (error) {
      console.error('Failed to save profile:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    setLoading(true);
    await loadProfile();
  };

  return { loading, profileType, profileData, saveProfile, refreshProfile };
}
