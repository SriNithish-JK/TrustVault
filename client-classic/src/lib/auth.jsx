import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from './api';
import { BootLoader } from '@/components/app/brand';

const AuthContext = createContext(null);
const signedOut = { loading: false, user: null, expiresAt: null, pendingAccess: 0, vaultUnlocked: false, elevatedUntil: null };

export function AuthProvider({ children }) {
  const [state, setState] = useState({ ...signedOut, loading: true });

  const refresh = useCallback(async () => {
    try {
      const { user, expiresAt, pendingAccess, vaultUnlocked, elevatedUntil } = await api('/auth/me');
      setState({ loading: false, user, expiresAt, pendingAccess, vaultUnlocked, elevatedUntil });
    } catch {
      setState(signedOut);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onExpired = () => setState(signedOut);
    window.addEventListener('session-expired', onExpired);
    return () => window.removeEventListener('session-expired', onExpired);
  }, [refresh]);

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setState(signedOut);
  };

  // vault: PIN entered once this session. elevated: security check passed (time it runs out).
  const setVault = (vaultUnlocked) => setState((s) => ({ ...s, vaultUnlocked }));
  const setElevated = (elevatedUntil) => setState((s) => ({ ...s, elevatedUntil }));

  return <AuthContext.Provider value={{ ...state, refresh, logout, setVault, setElevated }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

// Not signed in -> /reauth, which asks only for the Authenticator code when the 12 h
// re-auth cookie is still valid, and otherwise sends the visitor to the welcome page.
export function RequireAuth({ children, roles }) {
  const { loading, user } = useAuth();
  if (loading) return <BootLoader />;
  if (!user) return <Navigate to="/reauth" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
