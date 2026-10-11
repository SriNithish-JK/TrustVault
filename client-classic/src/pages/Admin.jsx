import { useState } from 'react';
import { Settings, Link2, Check, CheckCircle2, XCircle } from 'lucide-react';
import { api, fmtDate } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAsync, ErrorText, ask, toast, Stat, PageHeader, Segmented, Callout } from '@/components/app/kit';
import { AuditTable } from './Activity';

function Overview() {
  const { data } = useAsync(() => api('/admin/stats'));
  if (!data) return null;
  const items = [
    ['Students', data.users.student ?? 0, 'violet'], ['Verifiers', data.users.verifier ?? 0, 'sky'],
    ['Verified docs', data.documents.verified ?? 0, 'green'], ['Pending docs', data.documents.pending ?? 0, 'amber'],
    ['Rejected docs', data.documents.rejected ?? 0, 'card'], ['Sign-ins (24h)', data.logins24h, 'card'],
    ['Ledger blocks', data.blocks, 'ink'], ['Tampered files', data.tampered, data.tampered ? 'red' : 'card'],
  ];
  return <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">{items.map(([label, n, tone], i) => <Stat key={label} label={label} value={n} tone={tone} style={{ '--i': i }} />)}</div>;
}

function Users() {
  const { data, error, reload } = useAsync(() => api('/admin/users'));
  const act = async (fn, done) => { try { await fn(); reload(); toast(done); } catch (e) { toast(e.message, 'error'); } };
  const reset2fa = async (u) => {
    const ok = await ask({
      title: `Reset Google Authenticator for ${u.name}?`,
      message: 'Only do this after confirming the person\'s identity (e.g. college ID in person). They will scan a new QR code at their next sign-in, and all their sessions end now.',
      confirmText: 'Reset 2FA', danger: true,
    });
    if (ok) act(() => api(`/admin/users/${u.id}/reset-2fa`, { method: 'POST' }), `2FA reset for ${u.name}.`);
  };
  return (
    <>
      <ErrorText>{error}</ErrorText>
      <Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Roll no.</TableHead><TableHead>2FA</TableHead><TableHead>Role</TableHead><TableHead>Joined</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
        <TableBody>
          {data?.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-semibold">{u.name}</TableCell><TableCell>{u.email}</TableCell><TableCell className="font-mono">{u.studentId || '-'}</TableCell>
              <TableCell>{u.totpEnabled ? <Check className="size-4" aria-label="On" /> : <span aria-label="Off">-</span>}</TableCell>
              <TableCell>
                <Select value={u.role} onValueChange={(role) => act(() => api(`/admin/users/${u.id}`, { method: 'PATCH', body: { role } }), `${u.name} is now ${role}.`)}>
                  <SelectTrigger size="sm" className="w-28 bg-card" aria-label={`Role of ${u.name}`}><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="student">student</SelectItem><SelectItem value="verifier">verifier</SelectItem><SelectItem value="admin">admin</SelectItem></SelectContent>
                </Select>
              </TableCell>
              <TableCell className="whitespace-nowrap">{fmtDate(u.createdAt)}</TableCell>
              <TableCell>
                <span className="flex gap-2">
                  {u.locked && <Button size="sm" onClick={() => act(() => api(`/admin/users/${u.id}/unlock`, { method: 'POST' }), `${u.name} unlocked.`)}>Unlock</Button>}
                  {u.totpEnabled && <Button size="sm" variant="outline" onClick={() => reset2fa(u)}>Reset 2FA</Button>}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

const hash = (h) => <TableCell className="font-mono text-xs" title={h}>{h.slice(0, 12)}…</TableCell>;

function Ledger() {
  const { data } = useAsync(() => api('/admin/ledger'));
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const check = async () => { setBusy(true); setResult(await api('/admin/integrity', { method: 'POST' }).catch((e) => ({ ok: false, problems: [e.message] }))); setBusy(false); };
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">Each block stores the SHA-256 of the previous block. Changing any old record breaks the chain.</p>
        <Button onClick={check} disabled={busy}><Link2 /> {busy ? 'Checking every file…' : 'Run integrity check'}</Button>
      </div>
      {result && (
        <Callout tone={result.ok ? 'ok' : 'bad'}>
          <p className="flex items-center gap-2 font-semibold">
            {result.ok ? <><CheckCircle2 className="size-4" /> All {result.blocks} blocks and {result.documents} documents are intact.</> : <><XCircle className="size-4" /> {result.problems.length} problem(s) found:</>}
          </p>
          {!result.ok && <ul className="mt-2 grid list-disc gap-1 pl-5">{result.problems.map((p) => <li key={p}>{p}</li>)}</ul>}
        </Callout>
      )}
      <Table>
        <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Time</TableHead><TableHead>Action</TableHead><TableHead>File hash</TableHead><TableHead>Previous hash</TableHead><TableHead>Block hash</TableHead></TableRow></TableHeader>
        <TableBody>
          {data?.map((b) => (
            <TableRow key={b._id}>
              <TableCell className="font-mono">{b.index}</TableCell><TableCell className="whitespace-nowrap">{fmtDate(b.at)}</TableCell><TableCell>{b.action}</TableCell>
              {hash(b.fileHash)}{hash(b.prevHash)}{hash(b.hash)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AllAudit() {
  const { data } = useAsync(() => api('/admin/audit'));
  return data ? <AuditTable logs={data} showSubject /> : null;
}

const TABS = { Overview, Users, Ledger, 'Audit log': AllAudit };

export default function Admin() {
  const [tab, setTab] = useState('Overview');
  const Tab = TABS[tab];
  return (
    <div className="grid gap-8">
      <PageHeader icon={Settings} kicker="Administrator" title="Admin Console">Users, roles, the hash ledger and the full audit trail.</PageHeader>
      <Segmented label="Admin sections" value={tab} onChange={setTab} options={Object.keys(TABS).map((t) => [t, t])} />
      <div key={tab} className="animate-rise"><Tab /></div>
    </div>
  );
}
