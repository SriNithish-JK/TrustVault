import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { BootLoader } from '@/components/app/brand';
import { ErrorText, OtpInput } from '@/components/app/kit';
import { AuthShell } from './Login';

// Shown when the 60-minute session ends: only the Google Authenticator code is needed to continue.
export default function Reauth() {
  const { user, refresh, logout } = useAuth();
  const [who, setWho] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    api('/auth/reauth').then(setWho).catch(() => navigate('/welcome', { replace: true }));
  }, [navigate]);

  if (user) return <Navigate to="/" replace />;
  if (!who) return <BootLoader text="Checking your secure session…" />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/auth/reauth', { method: 'POST', body: { code: new FormData(e.currentTarget).get('code') } });
      await refresh();
      navigate('/');
    } catch (err) {
      setError(err.message);
      setAttempt((a) => a + 1);
    }
  };

  return (
    <AuthShell>
      <form className="grid gap-4" onSubmit={submit}>
        <h2 className="text-3xl leading-none">Session ended</h2>
        <p className="text-sm text-muted-foreground">Hi {who.name} ({who.email}), your 60-minute secure session has ended. Enter your Google Authenticator code to continue.</p>
        <OtpInput key={attempt} invalid={Boolean(error)} />
        <ErrorText>{error}</ErrorText>
        <Button size="lg">Continue</Button>
        <Button type="button" variant="link" className="justify-self-center" onClick={async () => { await logout(); navigate('/login'); }}>Sign in as someone else</Button>
      </form>
    </AuthShell>
  );
}
