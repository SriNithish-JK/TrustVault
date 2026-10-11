import { Link2 } from 'lucide-react';
import { api, fmtDate } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAsync, StatusBadge, ErrorText, ask, toast, PageHeader, EmptyState, SkeletonRows } from '@/components/app/kit';

export default function Shares() {
  const { data, error, loading, reload } = useAsync(() => api('/shares'));
  const revoke = async (s) => {
    if (!(await ask({ title: 'Revoke this link?', message: `${s.recipient} will no longer be able to open "${s.title}".`, confirmText: 'Revoke', danger: true }))) return;
    await api(`/shares/${s.id}`, { method: 'DELETE' });
    toast('Link revoked.');
    reload();
  };
  return (
    <div className="grid gap-8">
      <PageHeader icon={Link2} kicker="Time-limited sharing" title="Shared Links"
        stats={[['links sent', data?.length ?? 0], ['active now', data?.filter((s) => s.status === 'active').length ?? 0, 'ok'], ['total views', data?.reduce((n, s) => n + s.views, 0) ?? 0]]}>
        Links you sent. Recipients must confirm an email code, and every view is watermarked with their address.
      </PageHeader>
      <ErrorText>{error}</ErrorText>
      {loading && <SkeletonRows />}
      {data && !data.length && <EmptyState icon={Link2} title="No shared links yet">Use "Share" on a document to send a time-limited link.</EmptyState>}
      {data?.length > 0 && (
        <Table>
          <TableHeader><TableRow><TableHead>Document</TableHead><TableHead>Recipient</TableHead><TableHead>Expires</TableHead><TableHead>Views</TableHead><TableHead>Status</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-semibold">{s.title}</TableCell><TableCell>{s.recipient}</TableCell><TableCell className="whitespace-nowrap">{fmtDate(s.expiresAt)}</TableCell>
                <TableCell className="font-mono">{s.views}/{s.maxViews}</TableCell>
                <TableCell><StatusBadge status={s.status} /></TableCell>
                <TableCell>{s.status === 'active' && <Button size="sm" variant="destructive" onClick={() => revoke(s)}>Revoke</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
