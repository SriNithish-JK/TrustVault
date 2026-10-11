import { useState } from 'react';
import { History, LogIn, FileText, Eye, ShieldCheck } from 'lucide-react';
import { api, fmtDate, actionLabel, cleanDetail } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAsync, ErrorText, PageHeader, Segmented, EmptyState } from '@/components/app/kit';

export function AuditTable({ logs, showSubject }) {
  const { user } = useAuth();
  return (
    <Table>
      <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Action</TableHead><TableHead>Details</TableHead><TableHead>By</TableHead>{showSubject && <TableHead>Whose data</TableHead>}<TableHead>IP</TableHead></TableRow></TableHeader>
      <TableBody>
        {logs.map((a) => {
          const byOther = a.user && a.user._id !== user.id && !showSubject;
          return (
            <TableRow key={a._id} className={byOther ? 'bg-primary/25' : undefined}>
              <TableCell className="whitespace-nowrap">{fmtDate(a.createdAt)}</TableCell>
              <TableCell className="font-semibold whitespace-nowrap" title={a.action}>{actionLabel(a.action)}</TableCell>
              <TableCell className="min-w-56">{cleanDetail(a.detail)}</TableCell>
              <TableCell className="whitespace-nowrap">{a.user ? `${a.user.name} (${a.user.role})` : <span className="text-muted-foreground">system / guest</span>}</TableCell>
              {showSubject && <TableCell>{a.subject?.name ?? '-'}</TableCell>}
              <TableCell className="font-mono text-xs">{a.ip}</TableCell>
            </TableRow>
          );
        })}
        {!logs.length && <TableRow><TableCell colSpan={6} className="text-muted-foreground">No activity yet.</TableCell></TableRow>}
      </TableBody>
    </Table>
  );
}

// Category of each action -> filter group, icon, fill
const KIND = (action) => {
  if (/^login|^session|^devices/.test(action)) return ['signin', LogIn, 'bg-info'];
  if (/^document/.test(action)) return ['docs', FileText, 'bg-violet'];
  if (/^(record|access|share)/.test(action)) return ['access', Eye, 'bg-primary'];
  return ['security', ShieldCheck, 'bg-success'];
};
const FILTERS = [['all', 'Everything'], ['signin', 'Sign-ins'], ['docs', 'Documents'], ['access', 'Access & sharing'], ['security', 'Security']];

const dayLabel = (d) => {
  const day = new Date(d).toDateString();
  if (day === new Date().toDateString()) return 'Today';
  if (day === new Date(Date.now() - 864e5).toDateString()) return 'Yesterday';
  return new Date(d).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
};

export default function Activity() {
  const { user } = useAuth();
  const { data, error } = useAsync(() => api('/auth/activity'));
  const [filter, setFilter] = useState('all');
  const logs = data ?? [];
  const shown = logs.filter((a) => filter === 'all' || KIND(a.action)[0] === filter);
  const days = Object.entries(Object.groupBy(shown, (a) => dayLabel(a.createdAt)));
  const byOthers = logs.filter((a) => a.user && a.user._id !== user.id).length;

  return (
    <div className="grid gap-8">
      <PageHeader icon={History} kicker="Tamper-evident audit trail" title="Activity Log"
        stats={[['events recorded', logs.length], ['sign-ins', logs.filter((a) => a.action === 'login').length], ['views by verifiers', byOthers, byOthers ? 'warn' : '']]}>
        Everything done with your account - including every time an authorized verifier opened your records (highlighted).
      </PageHeader>
      <ErrorText>{error}</ErrorText>
      <Segmented label="Filter activity" value={filter} onChange={setFilter}
        options={FILTERS.map(([k, label]) => [k, label, k === 'all' ? logs.length : logs.filter((a) => KIND(a.action)[0] === k).length])} />
      {days.map(([day, items]) => (
        <section key={day} className="grid gap-3">
          <h2 className="w-fit bg-secondary px-3 py-1 font-mono text-sm font-semibold tracking-wide text-secondary-foreground uppercase">{day}</h2>
          <ol className="grid border-2 border-border bg-card text-card-foreground shadow-brutal">
            {items.map((a) => {
              const [, Icon, tone] = KIND(a.action);
              const other = a.user && a.user._id !== user.id;
              const failed = a.action === 'login.failed';
              return (
                <li key={a._id} className={cn('flex items-start gap-3 border-border p-3 [&:not(:last-child)]:border-b-2', other && 'bg-primary/25')}>
                  <span className={cn('grid size-8 shrink-0 place-items-center border-2 border-border text-ink', failed ? 'bg-destructive' : tone)}><Icon className="size-4" /></span>
                  <div className="grid gap-0.5 text-sm">
                    <span><b>{actionLabel(a.action)}</b>{a.detail && <span className="text-muted-foreground"> · {cleanDetail(a.detail)}</span>}</span>
                    <small className="font-mono text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      {other && <> · by <b className="text-foreground">{a.user.name}</b> ({a.user.role})</>}
                    </small>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      {data && !shown.length && <EmptyState icon={History} title="Nothing here yet" />}
    </div>
  );
}
