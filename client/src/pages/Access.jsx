import { Link } from 'react-router-dom';
import { Check, Eye, KeyRound, Mail, ShieldCheck, UserSearch, X } from 'lucide-react';
import { api, fmtDate } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAsync, ErrorText, StatusBadge, SkeletonRows, ask, toast, PageHeader, EmptyState, Initials, ago } from '@/components/app/kit';

// The student decides who may see their records.
export default function Access() {
  const { data, error, loading, reload } = useAsync(() => api('/access'));
  const { refresh } = useAuth();
  const answer = async (a, decision) => {
    const confirmText = { approve: 'Approve for 24 hours', deny: 'Deny', revoke: 'Revoke access' }[decision];
    const ok = await ask({
      title: `${confirmText}?`,
      message: decision === 'approve'
        ? `${a.verifier.name} will be able to see all your documents for 24 hours. Every view is logged and emailed to you.`
        : `${a.verifier.name} will not be able to see your records.`,
      confirmText, danger: decision !== 'approve',
    });
    if (!ok) return;
    try {
      await api(`/access/${a.id}`, { method: 'POST', body: { decision } });
      toast(`Request ${decision === 'approve' ? 'approved' : decision === 'deny' ? 'denied' : 'revoked'}.`);
      reload();
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    }
  };
  const pending = data?.filter((a) => a.status === 'pending') ?? [];
  const history = data?.filter((a) => a.status !== 'pending') ?? [];

  return (
    <div className="grid gap-8">
      <PageHeader icon={KeyRound} kicker="You decide who sees what" title="Access Requests"
        stats={[['waiting for you', pending.length, pending.length ? 'warn' : ''], ['active approvals', history.filter((a) => a.status === 'approved').length, 'ok'], ['answered', history.length]]}>
        Verifiers and admins must ask before they can see your records. Nothing is shared unless you approve.
      </PageHeader>
      <ErrorText>{error}</ErrorText>
      {loading && <SkeletonRows />}

      {!loading && (pending.length ? <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{pending.map((a) => (
        <article key={a.id} data-spot className="grid content-start gap-4 rounded-3xl border border-amber-400/40 bg-card p-5 text-card-foreground shadow-brutal transition-[transform,box-shadow,border-color] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-amber-400 hover:shadow-brutal-lg">
          <div className="flex items-start gap-3">
            <Initials name={a.verifier.name} size={48} />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xl leading-tight">{a.verifier.name}</h3>
              <p className="truncate font-mono text-xs text-muted-foreground">{a.verifier.email}</p>
            </div>
            <span className="grid justify-items-end gap-1"><Badge variant="violet">{a.verifier.role}</Badge><small className="text-xs whitespace-nowrap text-muted-foreground">{ago(a.requestedAt)}</small></span>
          </div>
          <blockquote className="rounded-2xl border border-border bg-muted/60 p-3 text-sm"><span className="mb-1 block font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Their reason</span>{a.reason}</blockquote>
          <p className="flex items-start gap-2 text-xs text-muted-foreground"><Eye className="mt-0.5 size-3.5 shrink-0" /> If you approve, they can open every document in your vault for 24 hours. Each view is logged and emailed to you.</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="success" className="flex-1" onClick={() => answer(a, 'approve')}><Check /> Approve for 24 hours</Button>
            <Button variant="outline" onClick={() => answer(a, 'deny')}><X /> Deny</Button>
          </div>
        </article>
      ))}</div> : <EmptyState icon={KeyRound} title="Nobody is asking right now" steps={[[UserSearch, 'A verifier asks to see your records and gives a reason'], [Mail, 'You get an email and the request appears here'], [ShieldCheck, 'You approve for 24 hours, or deny. You can revoke any time']]}
        action={<Button asChild variant="outline"><Link to="/activity">See who viewed your records</Link></Button>}>
        Verifiers and admins cannot open your vault on their own. This is how a request works:
      </EmptyState>)}

      {history.length > 0 && (
        <section className="grid gap-4">
          <h2 className="text-2xl">History</h2>
          <Table>
            <TableHeader><TableRow><TableHead>Requested</TableHead><TableHead>By</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
            <TableBody>
              {history.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="whitespace-nowrap">{fmtDate(a.requestedAt)}</TableCell><TableCell className="font-semibold">{a.verifier.name}</TableCell><TableCell className="min-w-48">{a.reason}</TableCell>
                  <TableCell>{a.status === 'approved' ? <StatusBadge status="approved">Active until {fmtDate(a.expiresAt)}</StatusBadge> : <StatusBadge status={a.status} />}</TableCell>
                  <TableCell>{a.status === 'approved' && <Button size="sm" variant="destructive" onClick={() => answer(a, 'revoke')}>Revoke</Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  );
}
