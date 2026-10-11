import { KeyRound } from 'lucide-react';
import { api, fmtDate } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAsync, ErrorText, StatusBadge, SkeletonRows, ask, toast, PageHeader, EmptyState } from '@/components/app/kit';

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

      {!loading && (pending.length ? pending.map((a) => (
        <article key={a.id} className="grid gap-3 border-2 border-border bg-card p-5 text-card-foreground shadow-brutal">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-xl">{a.verifier.name} <span className="block font-mono text-xs font-normal text-muted-foreground">{a.verifier.role} · {a.verifier.email}</span></h3>
            <span className="font-mono text-xs text-muted-foreground">{fmtDate(a.requestedAt)}</span>
          </div>
          <p className="border-l-4 border-primary pl-3 text-sm"><span className="font-mono text-xs text-muted-foreground uppercase">Reason</span><br />{a.reason}</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="success" onClick={() => answer(a, 'approve')}>Approve for 24 hours</Button>
            <Button variant="destructive" onClick={() => answer(a, 'deny')}>Deny</Button>
          </div>
        </article>
      )) : <EmptyState icon={KeyRound} title="No pending requests">You'll get an email when someone asks to see your records.</EmptyState>)}

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
