import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Smartphone, Link2, ScanLine, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brand } from '@/components/app/brand';
import { ThemeToggle } from '@/components/app/account';
import { ErrorText, BackupCodes, OtpInput, PasswordInput, Field, CheckRow, Callout, toast } from '@/components/app/kit';

const PROOF = [[Lock, 'AES-256 encrypted vault'], [Smartphone, 'Google Authenticator 2FA'], [Link2, 'Tamper-evident hash ledger'], [ScanLine, 'QR verification for anyone']];

export function AuthShell({ children }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <section className="bg-grid relative hidden flex-col justify-between gap-10 border-r-2 border-border bg-primary p-10 text-ink lg:flex">
        <Brand to="/welcome" className="[&_span_span]:bg-ink [&_span_span]:text-primary" />
        <div className="grid gap-6">
          <h1 className="text-6xl leading-[0.95]">Your identity. Verified. Vaulted.</h1>
          <ul className="grid gap-3">
            {PROOF.map(([Icon, text]) => (
              <li key={text} className="flex w-fit items-center gap-3 border-2 border-ink bg-white px-3 py-2 text-sm font-semibold shadow-[4px_4px_0_0_#0f172a]"><Icon className="size-4" /> {text}</li>
            ))}
          </ul>
        </div>
        <p className="font-mono text-xs tracking-widest uppercase">Sessions end after 60 minutes · every view is logged</p>
      </section>
      <section className="grid content-start gap-8 p-4 sm:p-10 lg:content-center">
        <div className="flex items-center justify-between lg:justify-end">
          <Brand to="/welcome" className="lg:hidden" />
          <ThemeToggle />
        </div>
        <div className="mx-auto w-full max-w-md animate-rise border-2 border-border bg-card p-6 text-card-foreground shadow-brutal-lg sm:p-8">{children}</div>
      </section>
    </div>
  );
}

const TITLES = {
  login: 'Sign in', register: 'Create your account', 'verify-email': 'Verify your email', otp: 'Check your email',
  totp: 'Google Authenticator', 'totp-setup': 'Set up Google Authenticator', backup: 'Save your backup codes',
  forgot: 'Reset your password', reset: 'Choose a new password',
};
const SUBMIT = { login: 'Continue', register: 'Create account', backup: "I've saved them - continue", forgot: 'Send reset code', reset: 'Reset password' };

export default function Login({ mode = 'login' }) {
  const [step, setStep] = useState(mode);
  const [data, setData] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0); // remounts the code boxes after a wrong code
  const [cooldown, setCooldown] = useState(0);
  const [useBackup, setUseBackup] = useState(false);
  const { refresh } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { setStep(mode); setError(''); }, [mode]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const go = (next, extra = {}) => {
    setData((d) => ({ ...d, ...extra }));
    setStep(next);
    setUseBackup(false);
    if (next === 'otp' || next === 'verify-email' || next === 'reset') setCooldown(30);
  };
  const finish = async () => { await refresh(); navigate('/'); };
  const post = (path, body) => api(path, { method: 'POST', body });

  const submit = async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    setError('');
    setBusy(true);
    try {
      switch (step) {
        case 'login': { const r = await post('/auth/login', f); go(r.next, r); break; }
        case 'register': { const r = await post('/auth/register', { ...f, consent: f.consent === 'on' }); go(r.next, r); break; }
        case 'verify-email': { const r = await post('/auth/verify-email', { ticket: data.ticket, code: f.code }); go(r.next, r); break; }
        case 'otp': { const r = await post('/auth/login/otp', { ticket: data.ticket, code: f.code }); go(r.next, r); break; }
        case 'totp':
        case 'totp-setup': {
          const r = await post('/auth/login/totp', { ticket: data.ticket, code: f.code, remember: f.remember === 'on' });
          if (r.backupCodes) go('backup', { backupCodes: r.backupCodes }); else await finish();
          break;
        }
        case 'backup': await finish(); break;
        case 'forgot': { const r = await post('/auth/forgot', f); go('reset', r); break; }
        case 'reset':
          await post('/auth/reset', { ticket: data.ticket, code: f.code, totp: f.totp, password: f.password });
          toast('Password changed. Sign in with your new password.');
          go('login');
          break;
      }
    } catch (err) {
      setError(err.message);
      setAttempt((a) => a + 1);
    }
    setBusy(false);
  };

  const resend = async () => {
    try {
      if (step === 'reset') await post('/auth/forgot', { email: data.emailRaw });
      else await post('/auth/login/resend', { ticket: data.ticket });
      toast('A new code was sent.');
      setCooldown(30);
    } catch (err) { setError(err.message); }
  };

  const resendButton = (
    <Button type="button" variant="link" className="justify-self-center text-xs" onClick={resend} disabled={cooldown > 0}>
      {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
    </Button>
  );
  const rememberDevice = <CheckRow name="remember" className="text-xs">Trust this device for 30 days (skip the email code next time)</CheckRow>;
  const muted = 'text-sm text-muted-foreground';

  return (
    <AuthShell>
      <form className="grid gap-4" onSubmit={submit}>
        <h2 className="text-3xl leading-none">{TITLES[step]}</h2>

        {step === 'login' && <>
          <Field label="Email"><Input name="email" type="email" required autoFocus autoComplete="email" /></Field>
          <Field label="Password"><PasswordInput required autoComplete="current-password" /></Field>
          <Button type="button" variant="link" className="justify-self-end text-xs" onClick={() => go('forgot')}>Forgot password?</Button>
        </>}

        {step === 'register' && <>
          <Field label="Full name (exactly as on your documents)"><Input name="name" required autoFocus autoComplete="name" /></Field>
          <Field label="Email"><Input name="email" type="email" required autoComplete="email" /></Field>
          <Field label="Student ID / Roll number"><Input name="studentId" placeholder="e.g. 22CS101" /></Field>
          <Field label="Password" hint="8+ characters with letters and numbers. Passwords found in data breaches are blocked.">
            <PasswordInput required minLength={8} strength autoComplete="new-password" />
          </Field>
          <CheckRow name="consent" required className="text-xs">
            I agree to the <Link to="/privacy" target="_blank" className="font-semibold underline underline-offset-4">privacy policy</Link> and consent to TrustVault storing my documents for verification.
          </CheckRow>
        </>}

        {(step === 'verify-email' || step === 'otp') && <>
          <p className={muted}>We sent a 6-digit code to <b className="text-foreground">{data.email}</b>. It expires in 5 minutes.</p>
          <OtpInput key={step + attempt} invalid={Boolean(error)} />
          {resendButton}
        </>}

        {step === 'totp-setup' && <>
          <ol className={`${muted} grid list-decimal gap-1 pl-5`}>
            <li>Install <b className="text-foreground">Google Authenticator</b> on your phone.</li>
            <li>Tap <b className="text-foreground">+</b> → <b className="text-foreground">Scan a QR code</b> and scan this:</li>
          </ol>
          <img className="mx-auto size-44 border-2 border-border bg-white p-2" src={data.qr} alt="Google Authenticator QR code" />
          <p className="text-xs text-muted-foreground">Can't scan? Enter this key manually: <code className="bg-muted px-1 font-mono font-semibold break-all text-foreground">{data.secret}</code></p>
          <p className="text-sm font-semibold">Enter the 6-digit code shown in the app:</p>
          <OtpInput key={step + attempt} autoFocus={false} invalid={Boolean(error)} />
          {rememberDevice}
        </>}

        {step === 'totp' && <>
          {data.trusted && <Callout tone="ok" className="flex items-center gap-2"><Check className="size-4" /> Trusted device - email code skipped.</Callout>}
          <p className={muted}>Open Google Authenticator and enter the 6-digit code for TrustVault.</p>
          {useBackup
            ? <Field label="Backup code"><Input name="code" required autoFocus placeholder="XXXX-XXXX" className="font-mono" autoComplete="off" /></Field>
            : <OtpInput key={step + attempt} invalid={Boolean(error)} />}
          <Button type="button" variant="link" className="justify-self-center text-xs" onClick={() => setUseBackup(!useBackup)}>
            {useBackup ? 'Use Google Authenticator instead' : 'Lost your phone? Use a backup code'}
          </Button>
          {!data.trusted && rememberDevice}
        </>}

        {step === 'backup' && <BackupCodes codes={data.backupCodes} />}

        {step === 'forgot' && <>
          <p className={muted}>Enter your account email. We'll send a code to reset your password.</p>
          <Field label="Email"><Input name="email" type="email" required autoFocus autoComplete="email" onChange={(e) => setData((d) => ({ ...d, emailRaw: e.target.value }))} /></Field>
        </>}

        {step === 'reset' && <>
          <p className={muted}>If an account exists for <b className="text-foreground">{data.email}</b>, we sent it a 6-digit code.</p>
          <span className="text-sm font-semibold">Email code</span>
          <OtpInput key={step + attempt} autoSubmit={false} invalid={Boolean(error)} />
          {resendButton}
          <Field label="Google Authenticator code (or a backup code)" hint="Leave empty only if you never finished setting up Google Authenticator.">
            <Input name="totp" className="font-mono" autoComplete="off" placeholder="123456 or XXXX-XXXX" />
          </Field>
          <Field label="New password"><PasswordInput required minLength={8} strength autoComplete="new-password" /></Field>
        </>}

        <ErrorText>{error}</ErrorText>
        <Button size="lg" disabled={busy}>{busy ? 'Please wait…' : SUBMIT[step] ?? 'Verify'}</Button>

        <div className="grid justify-items-center gap-2 text-sm">
          {step === 'login' && <p>New here? <Link to="/register" className="font-semibold underline underline-offset-4">Create an account</Link></p>}
          {step === 'register' && <p>Have an account? <Link to="/login" className="font-semibold underline underline-offset-4">Sign in</Link></p>}
          {(step === 'forgot' || step === 'reset') && <Button type="button" variant="link" onClick={() => go('login')}>← Back to sign in</Button>}
          <Link to="/verify" className="text-xs text-muted-foreground underline underline-offset-4">Verify a document without signing in →</Link>
        </div>
      </form>
    </AuthShell>
  );
}
