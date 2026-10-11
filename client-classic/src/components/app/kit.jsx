// Shared building blocks used by every page: toasts, confirm dialog, modal, code boxes, vault forms,
// page header, filters, status badges. Primitives come from components/ui (shadcn/ui).
import { useEffect, useRef, useState } from 'react';
import { Toaster as Sonner, toast as sonner } from 'sonner';
import { AlertCircle, Check, CheckCircle2, Copy, Eye, EyeOff, Loader2, Unlock, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Toasts: toast('Saved') or toast('Failed', 'error') from anywhere ----------
export const toast = (message, tone = 'ok') => (tone === 'error' ? sonner.error(message) : sonner.success(message));

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      icons={{ success: <CheckCircle2 className="size-5" />, error: <AlertCircle className="size-5" /> }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'flex w-full items-center gap-2.5 border-2 border-border bg-card p-3 text-sm font-semibold text-card-foreground shadow-brutal',
          success: '!bg-success !text-ink',
          error: '!bg-destructive !text-ink',
        },
      }}
    />
  );
}

// ---------- Modal: Esc closes, focus stays inside, focus returns afterwards (Radix Dialog) ----------
// `locked` keeps it open until the page closes it (used for the session-ending warning).
export function Modal({ title, onClose, children, wide, locked }) {
  // Opened from code (no Radix trigger), so remember what had focus and give it back on close.
  const [previous] = useState(() => document.activeElement);
  useEffect(() => () => { setTimeout(() => previous?.isConnected && previous.focus?.(), 0); }, [previous]);
  return (
    <Dialog open onOpenChange={(open) => !open && !locked && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        showCloseButton={!locked}
        className={wide ? 'sm:max-w-4xl' : 'sm:max-w-lg'}
        onInteractOutside={(e) => locked && e.preventDefault()}
        onEscapeKeyDown={(e) => locked && e.preventDefault()}
      >
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

// ---------- Styled confirm / prompt: `await ask({...})` -> true | text | null ----------
let openDialog = () => {};
export const ask = (options) => new Promise((resolve) => openDialog({ ...options, resolve }));

export function DialogHost() {
  const [d, setD] = useState(null);
  openDialog = setD;
  if (!d) return null;
  const close = (value) => { d.resolve(value); setD(null); };
  return (
    <Modal title={d.title} onClose={() => close(null)}>
      <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); close(d.input ? new FormData(e.currentTarget).get('value').trim() : true); }}>
        {d.message && <p className="text-sm text-muted-foreground">{d.message}</p>}
        {d.input && (
          <Field label={d.input.label}>
            <Input name="value" required minLength={d.input.minLength ?? 1} placeholder={d.input.placeholder} />
          </Field>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => close(null)}>Cancel</Button>
          <Button variant={d.danger ? 'destructive' : 'default'}>{d.confirmText ?? 'Confirm'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Form field: label above, optional hint below ----------
export function Field({ label, hint, children, className }) {
  return (
    <label className={cn('grid gap-1.5 text-sm font-semibold', className)}>
      <span>{label}</span>
      {children}
      {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
    </label>
  );
}

export const CheckRow = ({ children, className, ...props }) => (
  <label className={cn('flex items-start gap-2.5 text-sm', className)}>
    <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[var(--violet)]" {...props} />
    <span>{children}</span>
  </label>
);

// ---------- 6-box code input. Paste works; submits the form when all 6 digits are in. ----------
// `invalid` shakes the boxes when they appear (parents remount them after a wrong code).
export function OtpInput({ name = 'code', autoSubmit = true, autoFocus = true, invalid = false, secret = false }) {
  const [digits, setDigits] = useState(Array(6).fill(''));
  const refs = useRef([]);
  const fill = (start, text) => {
    const chars = text.replace(/\D/g, '').slice(0, 6 - start).split('');
    const next = [...digits];
    chars.forEach((c, k) => { next[start + k] = c; });
    setDigits(next);
    refs.current[Math.min(start + chars.length, 5)]?.focus();
    if (autoSubmit && next.every(Boolean)) setTimeout(() => refs.current[0]?.form?.requestSubmit(), 0);
  };
  return (
    <div className={cn('flex justify-center gap-2', invalid && 'animate-shake')} role="group" aria-label="6-digit code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          inputMode="numeric"
          type={secret ? 'password' : 'text'}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
          className={cn(
            'h-13 w-full max-w-12 border-2 border-input bg-card text-center font-mono text-xl font-semibold text-card-foreground transition-shadow duration-100 focus-visible:bg-primary focus-visible:text-ink focus-visible:shadow-brutal-sm focus-visible:outline-none',
            d && 'bg-accent text-accent-foreground',
            invalid && 'border-destructive',
          )}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '');
            if (!v) { const next = [...digits]; next[i] = ''; setDigits(next); return; }
            fill(i, d && v.length === 2 ? v.replace(d, '') || v[0] : v);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !d && i) refs.current[i - 1]?.focus();
            if (e.key === 'ArrowLeft' && i) refs.current[i - 1]?.focus();
            if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
          }}
          onPaste={(e) => { e.preventDefault(); fill(0, e.clipboardData.getData('text')); }}
        />
      ))}
      <input type="hidden" name={name} value={digits.join('')} />
    </div>
  );
}

// ---------- Password with show/hide and optional strength meter ----------
const STRENGTH = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
const STRENGTH_TONE = ['bg-destructive', 'bg-destructive', 'bg-primary', 'bg-primary', 'bg-success', 'bg-success'];
export function PasswordInput({ name = 'password', strength, ...rest }) {
  const [show, setShow] = useState(false);
  const [value, setValue] = useState('');
  const score = [/.{8,}/, /.{12,}/, /[a-z].*[A-Z]|[A-Z].*[a-z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(value)).length;
  return <>
    <span className="relative block">
      <Input name={name} type={show ? 'text' : 'password'} value={value} onChange={(e) => setValue(e.target.value)} className="pr-11" {...rest} />
      <button type="button" className="absolute inset-y-0 right-0 grid w-10 place-items-center border-l-2 border-input hover:bg-accent hover:text-accent-foreground" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </span>
    {strength && value && (
      <span className="flex items-center gap-2 text-xs font-normal">
        <span className="flex flex-1 gap-1" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => <i key={n} className={cn('h-2 flex-1 border border-border', n <= score ? STRENGTH_TONE[score] : 'bg-card')} />)}
        </span>
        <span className="w-20 text-right font-mono uppercase">{STRENGTH[score]}</span>
      </span>
    )}
  </>;
}

export const ErrorText = ({ children }) => (children ? (
  <p className="flex items-start gap-2 border-2 border-border bg-destructive px-3 py-2 text-sm font-semibold text-ink" role="alert">
    <AlertCircle className="mt-0.5 size-4 shrink-0" /> <span>{children}</span>
  </p>
) : null);

// Highlighted note. tone: default (amber) | ok | bad | info
const CALLOUT = { default: 'bg-primary text-ink', ok: 'bg-success text-ink', bad: 'bg-destructive text-ink', info: 'bg-accent text-accent-foreground' };
export const Callout = ({ tone = 'default', className, children }) => (
  <div className={cn('border-2 border-border px-4 py-3 text-sm font-medium shadow-brutal-sm', CALLOUT[tone], className)}>{children}</div>
);

export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  const reload = () => fn().then((data) => setState({ loading: false, data, error: '' }), (e) => setState({ loading: false, data: null, error: e.message }));
  useEffect(() => { reload(); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, reload };
}

export const SkeletonRows = ({ rows = 3 }) => (
  <div className="grid gap-3" aria-busy="true" aria-label="Loading">{Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-20 border-2 border-border" />)}</div>
);

export const Spinner = ({ children }) => (
  <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground" role="status"><Loader2 className="size-4 animate-spin" /> {children}</p>
);

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="grid place-items-center gap-2 border-2 border-dashed border-border bg-card px-6 py-10 text-center">
      {Icon && <span className="grid size-12 place-items-center border-2 border-border bg-accent text-accent-foreground"><Icon className="size-5" /></span>}
      {title && <h3 className="text-lg">{title}</h3>}
      {children && <p className="max-w-md text-sm text-muted-foreground">{children}</p>}
      {action}
    </div>
  );
}

// Numbers count up from 0 with an ease-out curve.
export function CountUp({ value = 0, duration = 900 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reducedMotion()) return setN(value);
    let raf;
    const start = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.round(value * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return n;
}

// Big number tile. tone picks the fill.
const STAT = {
  amber: 'bg-primary text-ink', violet: 'bg-violet text-ink', green: 'bg-success text-ink', red: 'bg-destructive text-ink',
  sky: 'bg-info text-ink', ink: 'bg-secondary text-secondary-foreground', card: 'bg-card text-card-foreground',
};
export const Stat = ({ label, value, tone = 'card', className, style }) => (
  <div className={cn('border-2 border-border p-4 shadow-brutal', STAT[tone], className)} style={style}>
    <b className="block font-mono text-4xl leading-none font-semibold tabular-nums"><CountUp value={value} /></b>
    <span className="mt-2 block text-sm font-semibold">{label}</span>
  </div>
);

const STATUS = {
  verified: 'success', approved: 'success', active: 'success', pending: 'warning', rejected: 'destructive', denied: 'destructive',
  tampered: 'destructive', revoked: 'ink', expired: 'outline', stored: 'info', used: 'outline',
};
export const StatusBadge = ({ status, children }) => <Badge variant={STATUS[status] ?? 'outline'}>{children ?? status}</Badge>;

// Form for actions that need the vault. The PIN is asked only while the vault is locked; the first
// correct PIN unlocks it for the rest of the session. `children` are the caller's own fields.
export function PinForm({ label = 'Enter your 6-digit vault PIN', submitText = 'Unlock', onSubmit, children }) {
  const { vaultUnlocked, setVault } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <form className="grid gap-4" onSubmit={async (e) => {
      e.preventDefault();
      setBusy(true);
      setError('');
      const form = Object.fromEntries(new FormData(e.currentTarget));
      try {
        await onSubmit(form);
        if (form.pin) setVault(true);
      } catch (err) {
        if (err.code === 'VAULT_LOCKED') setVault(false);
        setError(err.message);
      }
      setBusy(false);
    }}>
      {children}
      {vaultUnlocked
        ? <p className="flex items-center gap-2 font-mono text-xs uppercase"><Unlock className="size-4" /> Vault unlocked for this session - no PIN needed.</p>
        : <Field label={label}>
          <Input name="pin" type="password" inputMode="numeric" pattern="\d{6}" maxLength={6} required className="font-mono text-lg tracking-[0.5em]" autoComplete="off" />
        </Field>}
      <ErrorText>{error}</ErrorText>
      <Button disabled={busy}>{busy ? 'Please wait…' : submitText}</Button>
    </form>
  );
}

// Asks for the PIN, then shows the watermarked file. Right-click and the PDF toolbar are disabled.
export function DocViewer({ doc, onClose }) {
  const { vaultUnlocked, setVault } = useAuth();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);
  const open = async ({ pin }) => {
    const res = await api(`/documents/${doc.id}/view`, { method: 'POST', body: { pin }, raw: true });
    setUrl(URL.createObjectURL(await res.blob()));
  };
  // vault already unlocked this session: open straight away, no PIN
  useEffect(() => {
    if (vaultUnlocked) open({}).catch((e) => { if (e.code === 'VAULT_LOCKED') setVault(false); else setError(e.message); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Modal title={doc.title} onClose={onClose} wide={Boolean(url)}>
      {url ? (
        <FileFrame url={url} pdf={doc.mime === 'application/pdf'} title={doc.title}>
          This copy is watermarked with your email. Every view is recorded in the activity log.
        </FileFrame>
      ) : vaultUnlocked ? (
        error ? <ErrorText>{error}</ErrorText> : <Spinner>Opening securely…</Spinner>
      ) : (
        <PinForm label="Enter your 6-digit vault PIN to view this document" onSubmit={open} />
      )}
    </Modal>
  );
}

export const FileFrame = ({ url, pdf, title, children }) => (
  <div className="grid gap-3" onContextMenu={(e) => e.preventDefault()}>
    {pdf
      ? <iframe src={`${url}#toolbar=0`} title={title} className="h-[70dvh] w-full border-2 border-border bg-white" />
      : <img src={url} alt={title} draggable={false} className="max-h-[70dvh] w-full border-2 border-border bg-white object-contain" />}
    <p className="text-xs text-muted-foreground">{children}</p>
  </div>
);

export function ScoreBar({ check }) {
  if (!check || check.state === 'running') return <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Checking…</span>;
  if (check.state === 'failed') return <span className="text-xs text-muted-foreground">Check failed</span>;
  const tone = check.score >= 80 ? 'bg-success' : check.score >= 50 ? 'bg-primary' : 'bg-destructive';
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold" title="Automatic verification score">
      <span className="block h-3 w-20 border-2 border-border bg-card"><span className={cn('block h-full', tone)} style={{ width: `${check.score}%` }} /></span>{check.score}%
    </span>
  );
}

export const CheckList = ({ checks = [] }) => (
  <ul className="grid gap-1.5 text-sm">
    {checks.map((c) => (
      <li key={c.name} className="flex items-start gap-2">
        <span className={cn('mt-0.5 grid size-4 shrink-0 place-items-center border border-border text-ink', c.ok ? 'bg-success' : 'bg-destructive')}>
          {c.ok ? <Check className="size-3" /> : <X className="size-3" />}
        </span>
        <span><span className="sr-only">{c.ok ? 'Passed: ' : 'Failed: '}</span>{c.name}{c.detail && <span className="text-muted-foreground"> - {c.detail}</span>}</span>
      </li>
    ))}
  </ul>
);

export const copyText = (text, message) => { navigator.clipboard?.writeText(text); toast(message); };

export function BackupCodes({ codes }) {
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">Save these one-time backup codes somewhere safe. Each one can replace a Google Authenticator code once if you lose your phone.</p>
      <div className="grid grid-cols-2 gap-2">{codes.map((c) => <code key={c} className="border-2 border-border bg-muted px-2 py-1.5 text-center font-mono text-sm font-semibold">{c}</code>)}</div>
      <Button type="button" variant="outline" onClick={() => copyText(codes.join('\n'), 'Backup codes copied.')}><Copy /> Copy codes</Button>
    </div>
  );
}

// ---------- Page header shared by every signed-in page ----------
// stats: [label, value, tone]
export function PageHeader({ icon: Icon, kicker, title, children, actions, stats }) {
  return (
    <header className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="hidden size-14 shrink-0 place-items-center border-2 border-border bg-primary text-ink shadow-brutal sm:grid"><Icon className="size-7" /></span>
          <div>
            <span className="font-mono text-xs font-semibold tracking-widest text-muted-foreground uppercase">{kicker}</span>
            <h1 className="text-3xl leading-none sm:text-4xl">{title}</h1>
            {children && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{children}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
      {stats && (
        <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map(([label, value, tone], i) => (
            <Stat key={label} label={label} value={value} tone={tone === 'ok' ? 'green' : tone === 'warn' ? 'amber' : 'card'} className="p-3 [&>b]:text-3xl" style={{ '--i': i }} />
          ))}
        </div>
      )}
    </header>
  );
}

// ---------- Segmented filter: options are [value, text, count?] ----------
export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map(([v, text, count]) => (
        <button key={v} type="button" aria-pressed={v === value} onClick={() => v !== value && onChange(v)}
          className={cn(
            'inline-flex h-9 items-center gap-2 border-2 border-border px-3 text-sm font-semibold transition-[transform,box-shadow] duration-100',
            v === value ? 'bg-secondary text-secondary-foreground shadow-brutal-sm' : 'bg-card hover:-translate-y-0.5 hover:shadow-brutal-sm',
          )}>
          {text}
          {count != null && <span className={cn('px-1.5 font-mono text-xs', v === value ? 'bg-primary text-ink' : 'bg-muted')}>{count}</span>}
        </button>
      ))}
    </div>
  );
}

const LOCAL_IP = /^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/;
export const friendlyIp = (ip) => (LOCAL_IP.test(ip) ? 'This computer' : ip);

export const ago = (d) => {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};
