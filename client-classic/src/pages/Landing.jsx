import { Link } from 'react-router-dom';
import { Lock, Smartphone, ScanLine, Link2, Eye, UploadCloud, BadgeCheck, QrCode, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { BentoGrid } from '@/components/ui/bento-grid';
import { useAsync, CountUp } from '@/components/app/kit';
import { PublicShell, Kicker } from '@/components/app/public';

const STANDARDS = ['AES-256-GCM encryption', 'SHA-256 hash ledger', 'TOTP · RFC 6238', 'Verhoeff checksum', 'Tesseract OCR', 'Have I Been Pwned', 'DPDP Act 2023', 'WCAG accessible'];

const STEPS = [
  [UploadCloud, 'Upload', 'Add your PAN, Aadhaar, licence, marksheets or any document - photo or PDF. It is encrypted before it touches the disk.', 'bg-primary'],
  [BadgeCheck, 'Get verified', 'Format, checksum, OCR and originality checks run in seconds, then an authorized verifier approves it.', 'bg-violet'],
  [ScanLine, 'Share proof', 'Show a QR code or send a time-limited link instead of handing over photocopies.', 'bg-success'],
];

const mono = 'font-mono text-xs leading-relaxed';
const FEATURES = [
  {
    title: 'Encrypted vault', tone: 'ink', colSpan: 2, status: 'AES-256-GCM', icon: <Lock className="size-5" />,
    description: 'Every file is locked before it is saved. Even someone with the database sees only ciphertext.',
    visual: <p className={`${mono} break-all opacity-70`} aria-hidden="true">9f2c 71ab e04d 5c18 a3f7 0b9e 44d2 c6a1 7e35 d810 2bf4 96c3 58ea 1d07 f3b9 6a42 c015 8de7 b29f 403a</p>,
    tags: ['at rest', 'per-file IV'],
  },
  {
    title: 'Google Authenticator', tone: 'amber', status: 'TOTP', icon: <Smartphone className="size-5" />,
    description: 'Password plus a 6-digit code that changes every 30 seconds. Sessions end after 60 minutes.',
    visual: <p className="font-mono text-4xl font-semibold tracking-widest" aria-hidden="true">482 915</p>,
  },
  {
    title: 'Real checks', tone: 'card', status: 'Auto', icon: <BadgeCheck className="size-5" />,
    description: 'PAN, Aadhaar and licence numbers, OCR text and file originality - checked automatically.',
    visual: (
      <ul className={`${mono} grid gap-1`} aria-hidden="true">
        {['PAN format', 'Verhoeff checksum', 'Name matches', 'No editing traces'].map((c) => <li key={c} className="flex items-center gap-2"><Check className="size-3.5 border border-border bg-success text-ink" />{c}</li>)}
      </ul>
    ),
  },
  {
    title: 'QR verification', tone: 'violet', status: 'Public', icon: <QrCode className="size-5" />,
    description: 'Employers scan the QR to confirm a document is genuine. No calls, no photocopies.',
  },
  {
    title: 'You stay in control', tone: 'green', status: 'Consent', icon: <Eye className="size-5" />,
    description: 'Verifiers must ask first. You approve, deny or revoke - every view is watermarked and logged.',
  },
  {
    title: 'Tamper-evident ledger', tone: 'card', colSpan: 3, status: 'Hash chain', icon: <Link2 className="size-5" />,
    description: 'Every upload and approval is chained by SHA-256. Change one byte of history and the chain breaks.',
    visual: (
      <div className={`${mono} flex flex-wrap items-center gap-2`} aria-hidden="true">
        {['#41 · a3f7…', '#42 · 0b9e…', '#43 · 44d2…', '#44 · c6a1…'].map((b, i) => (
          <span key={b} className="flex items-center gap-2"><span className="border-2 border-border bg-muted px-2 py-1">{b}</span>{i < 3 && <ArrowRight className="size-4" />}</span>
        ))}
      </div>
    ),
    tags: ['upload', 'approve', 'reject'],
  },
];

// Hero visual, after the 21st.dev "Hero Section" by lavikatiyar (https://21st.dev/r/lavikatiyar/hero-section):
// two tilted cards stacked on a grid background. Drawn here as ID cards instead of images.
function HeroCards() {
  return (
    <div className="relative mx-auto h-72 w-full max-w-md sm:h-80" aria-hidden="true">
      <div className="absolute top-2 right-0 w-64 rotate-6 border-2 border-border bg-violet p-4 text-ink shadow-brutal-lg transition-transform duration-200 hover:-translate-y-2 hover:rotate-3 sm:w-72">
        <p className="font-mono text-[11px] font-semibold tracking-widest uppercase">Aadhaar · UIDAI</p>
        <p className="mt-10 font-mono text-xl font-semibold">XXXX XXXX 4821</p>
        <p className="mt-3 text-xs font-semibold">Masked · last 4 digits only</p>
      </div>
      <div className="absolute bottom-0 left-0 w-64 -rotate-3 border-2 border-border bg-card p-4 text-card-foreground shadow-brutal-lg transition-transform duration-200 hover:-translate-y-2 hover:rotate-0 sm:w-80">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] font-semibold tracking-widest uppercase">Income Tax Department</p>
          <ShieldCheck className="size-5" />
        </div>
        <div className="mt-4 flex items-end gap-3">
          <span className="bg-dots block size-16 border-2 border-border bg-primary" />
          <div>
            <p className="font-mono text-lg font-semibold">ABCPX1234F</p>
            <p className="text-xs text-muted-foreground">Permanent Account Number</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t-2 border-border pt-3">
          <span className="font-mono text-[11px] uppercase">OCR · checksum · name</span>
          <span className="font-mono text-xs font-semibold">96%</span>
        </div>
        <span className="absolute -top-5 -right-6 rotate-12 animate-stamp border-4 border-ink bg-success px-3 py-1 font-mono text-lg font-semibold tracking-widest text-ink [animation-delay:600ms]">VERIFIED</span>
      </div>
    </div>
  );
}

export default function Landing() {
  const stats = useAsync(() => api('/public/stats'));
  const numbers = stats.data && [[stats.data.documents, 'documents protected'], [stats.data.verified, 'verified with a QR'], [stats.data.blocks, 'ledger records sealed'], [256, 'bit AES encryption']];
  return (
    <PublicShell nav={<Button asChild size="sm" variant="outline" className="hidden sm:inline-flex"><Link to="/verify">Verify a document</Link></Button>}>
      <section className="grid items-center gap-12 lg:grid-cols-2">
        <div className="stagger grid justify-items-start gap-6">
          <Kicker>Digital identity & document verification</Kicker>
          <h1 className="text-5xl leading-[0.95] sm:text-6xl lg:text-7xl" style={{ '--i': 1 }}>
            Your documents. <span className="bg-primary box-decoration-clone px-2 text-ink">Verified once,</span> trusted everywhere.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground" style={{ '--i': 2 }}>TrustVault keeps your identity and academic documents in an encrypted vault, checks them in seconds, and lets anyone confirm they are genuine with a QR code.</p>
          <div className="flex flex-wrap gap-4" style={{ '--i': 3 }}>
            <Button asChild size="lg"><Link to="/register">Create free account <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/login">I already have an account</Link></Button>
          </div>
        </div>
        <HeroCards />
      </section>

      <div className="-mx-4 overflow-hidden border-y-2 border-border bg-secondary py-3 text-secondary-foreground" aria-label="Security standards used">
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <span key={copy} aria-hidden={copy === 1} className="flex shrink-0 gap-10 pr-10 font-mono text-sm font-semibold tracking-wide uppercase">
              {STANDARDS.map((s) => <span key={s} className="flex items-center gap-10">{s}<span className="size-2 bg-primary" /></span>)}
            </span>
          ))}
        </div>
      </div>

      <section className="grid gap-8">
        <div className="grid gap-3">
          <Kicker>01 / Process</Kicker>
          <h2 className="text-4xl sm:text-5xl">How it works</h2>
          <p className="max-w-xl text-muted-foreground">Three steps from a phone photo to a proof anyone can check.</p>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map(([Icon, title, text, tone], i) => (
            <li key={title} className="relative grid gap-3 border-2 border-border bg-card p-5 pt-8 shadow-brutal">
              <span className={`absolute -top-5 left-5 grid size-10 place-items-center border-2 border-border font-mono text-lg font-semibold text-ink ${tone}`}>{i + 1}</span>
              <h3 className="flex items-center gap-2 text-xl"><Icon className="size-5" /> {title}</h3>
              <p className="text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {numbers && (
        <section className="grid grid-cols-2 border-2 border-border bg-primary text-ink shadow-brutal-lg lg:grid-cols-4" aria-label="TrustVault in numbers">
          {numbers.map(([n, label]) => (
            <div key={label} className="border-ink p-5 max-lg:odd:border-r-2 max-lg:[&:nth-child(-n+2)]:border-b-2 lg:[&:not(:last-child)]:border-r-2">
              <b className="block font-mono text-4xl font-semibold tabular-nums sm:text-5xl"><CountUp value={n} duration={1200} /></b>
              <span className="text-sm font-semibold">{label}</span>
            </div>
          ))}
        </section>
      )}

      <section className="grid gap-8">
        <div className="grid gap-3">
          <Kicker>02 / Security</Kicker>
          <h2 className="text-4xl sm:text-5xl">Built for security</h2>
          <p className="max-w-xl text-muted-foreground">The same protections and checks every document in your vault goes through.</p>
        </div>
        <BentoGrid items={FEATURES} />
      </section>

      <section className="flex flex-wrap items-center justify-between gap-6 border-2 border-border bg-violet p-6 text-ink shadow-brutal-lg sm:p-10">
        <div className="grid gap-2">
          <h2 className="text-3xl sm:text-4xl">Ready to stop carrying photocopies?</h2>
          <p className="font-medium">Set up takes about 3 minutes. You'll need your phone for Google Authenticator.</p>
        </div>
        <Button asChild size="lg" variant="secondary"><Link to="/register">Get started <ArrowRight /></Link></Button>
      </section>
    </PublicShell>
  );
}
