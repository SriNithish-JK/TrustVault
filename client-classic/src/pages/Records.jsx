import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Lock, Search, GraduationCap, ArrowLeft } from 'lucide-react';
import { api, fmtDate, fmtDay, TYPE_LABELS } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAsync, ErrorText, StatusBadge, DocViewer, ScoreBar, SkeletonRows, toast, PageHeader, Field, EmptyState } from '@/components/app/kit';

const accessLabel = (a) => {
  if (!a) return <span className="text-muted-foreground">No access</span>;
  if (a.status === 'approved') return <StatusBadge status="approved">Approved until {fmtDate(a.expiresAt)}</StatusBadge>;
  return <StatusBadge status={a.status} />;
};

export function StudentList() {
  const [q, setQ] = useState('');
  const { data, error, loading } = useAsync(() => api(`/records/students?q=${encodeURIComponent(q)}`), [q]);
  return (
    <div className="grid gap-8">
      <PageHeader icon={GraduationCap} kicker="Consent-based access" title="Student Records"
        stats={[['students', data?.length ?? 0], ['you can open now', data?.filter((s) => s.access?.status === 'approved').length ?? 0, 'ok'], ['requests pending', data?.filter((s) => s.access?.status === 'pending').length ?? 0, 'warn']]}>
        To open a record you must ask the student. They approve or deny it, and approved access lasts 24 hours.
      </PageHeader>
      <label className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" className="pl-9" placeholder="Search by name, email or roll number…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search students" />
      </label>
      <ErrorText>{error}</ErrorText>
      {loading ? <SkeletonRows /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Roll no.</TableHead><TableHead>Email</TableHead><TableHead>Verified</TableHead><TableHead>Your access</TableHead></TableRow></TableHeader>
          <TableBody>
            {data?.map((s) => (
              <TableRow key={s.id}>
                <TableCell><Link to={`/records/${s.id}`} className="font-semibold underline underline-offset-4">{s.name}</Link></TableCell><TableCell className="font-mono">{s.studentId || '-'}</TableCell><TableCell>{s.email}</TableCell>
                <TableCell className="font-mono">{s.verified}/{s.total}</TableCell><TableCell>{accessLabel(s.access)}</TableCell>
              </TableRow>
            ))}
            {data && !data.length && <TableRow><TableCell colSpan={5} className="text-muted-foreground">No students found.</TableCell></TableRow>}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function RequestAccess({ student, access, onSent }) {
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api(`/records/students/${student.id}/request`, { method: 'POST', body: { reason: new FormData(e.currentTarget).get('reason') } });
      toast(`Request sent to ${student.name}.`);
      onSent();
    } catch (err) {
      setError(err.message);
    }
  };
  if (access?.status === 'pending') {
    return <EmptyState icon={Lock} title={`Waiting for ${student.name}`}>You asked on {fmtDate(access.requestedAt)}: "{access.reason}". You'll get an email when they answer.</EmptyState>;
  }
  return (
    <Card>
      <form className="grid gap-4" onSubmit={submit}>
        <h2 className="flex items-center gap-2 text-xl"><Lock className="size-5" /> You need {student.name}'s permission</h2>
        <p className="text-sm text-muted-foreground">
          {access?.status === 'denied' && 'Your last request was denied. '}
          {access?.status === 'expired' && 'Your previous access has expired. '}
          {access?.status === 'revoked' && 'The student revoked your access. '}
          The student sees your name and reason, and decides. Access lasts 24 hours and every view is logged.
        </p>
        <Field label="Reason for access"><Input name="reason" required minLength={5} placeholder="e.g. Placement document check for Infosys drive" /></Field>
        <ErrorText>{error}</ErrorText>
        <Button className="justify-self-start">Request access</Button>
      </form>
    </Card>
  );
}

export function StudentRecord() {
  const { id } = useParams();
  const { data, error, reload } = useAsync(() => api(`/records/students/${id}`), [id]);
  const [viewing, setViewing] = useState(null);
  if (error) return <ErrorText>{error}</ErrorText>;
  if (!data) return <SkeletonRows rows={4} />;
  const { student, documents, access } = data;
  const granted = access?.status === 'approved';
  return (
    <div className="grid gap-6">
      <Button asChild variant="link" className="justify-self-start"><Link to="/records"><ArrowLeft /> All students</Link></Button>
      <header className="flex flex-wrap items-center justify-between gap-3 border-2 border-border bg-primary p-5 text-ink shadow-brutal">
        <div><h1 className="text-3xl leading-none">{student.name}</h1><p className="mt-1 text-sm">{student.email} · Roll no. <span className="font-mono">{student.studentId || '-'}</span> · joined {fmtDay(student.joined)}</p></div>
        {accessLabel(access)}
      </header>
      {!granted ? <RequestAccess student={student} access={access} onSent={reload} /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Document</TableHead><TableHead>Type</TableHead><TableHead>Number</TableHead><TableHead>Auto-check</TableHead><TableHead>Status</TableHead><TableHead>Uploaded</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
          <TableBody>
            {documents.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-semibold">{d.title} {d.tampered && <Badge variant="destructive">Tampered</Badge>}</TableCell><TableCell>{TYPE_LABELS[d.type]}</TableCell>
                <TableCell className="font-mono">{d.numberMasked || '-'}</TableCell><TableCell><ScoreBar check={d.autoCheck} /></TableCell>
                <TableCell><StatusBadge status={d.status} /></TableCell><TableCell className="whitespace-nowrap">{fmtDate(d.createdAt)}</TableCell>
                <TableCell><Button size="sm" onClick={() => setViewing(d)}>View</Button></TableCell>
              </TableRow>
            ))}
            {!documents.length && <TableRow><TableCell colSpan={7} className="text-muted-foreground">This student has not uploaded any documents.</TableCell></TableRow>}
          </TableBody>
        </Table>
      )}
      {viewing && <DocViewer doc={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
