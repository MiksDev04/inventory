import React, { createContext, useEffect, useState } from 'react';
import * as api from '../lib/api';

const ProfileContext = createContext(null);

export default function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const p = await api.getProfile();
      setProfile(p);
    } catch (err) {
      console.error('ProfileProvider: failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    const handler = (e) => {
      const updated = e?.detail;
      if (updated) setProfile(updated);
    };

    window.addEventListener('profile:updated', handler);
    return () => window.removeEventListener('profile:updated', handler);
  }, []);

  const updateProfile = async (payload) => {
    const res = await api.updateProfile(payload);
    setProfile(res);
    return res;
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, reload: load, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

// export context for a separate hook file
export { ProfileContext };
