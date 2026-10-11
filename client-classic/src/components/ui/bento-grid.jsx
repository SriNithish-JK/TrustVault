// Adapted from the 21st.dev "Bento Grid" by kokonutd (https://21st.dev/r/kokonutd/bento-grid):
// same item model (title, description, icon, status, tags, colSpan), restyled to this project's
// thick borders and hard shadows, and extended with a `tone` fill and an optional `visual` slot.
import { cn } from '@/lib/utils';

const TONES = {
  card: 'bg-card text-card-foreground', amber: 'bg-primary text-ink', violet: 'bg-violet text-ink',
  green: 'bg-success text-ink', sky: 'bg-info text-ink', ink: 'bg-secondary text-secondary-foreground',
};

function BentoGrid({ items, className }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-3', className)}>
      {items.map((item) => (
        <article
          key={item.title}
          className={cn(
            'group relative flex flex-col gap-4 overflow-hidden border-2 border-border p-5 shadow-brutal transition-[transform,box-shadow] duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg',
            TONES[item.tone ?? 'card'],
            item.colSpan === 2 && 'md:col-span-2',
            item.colSpan === 3 && 'md:col-span-3',
          )}
        >
          <div className="bg-dots pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100" aria-hidden="true" />
          <div className="relative flex items-center justify-between">
            <span className="grid size-10 place-items-center border-2 border-current">{item.icon}</span>
            {item.status && <span className="border-2 border-current px-2 py-0.5 font-mono text-[11px] font-semibold uppercase">{item.status}</span>}
          </div>
          {item.visual && <div className="relative">{item.visual}</div>}
          <div className="relative mt-auto grid gap-2">
            <h3 className="text-xl leading-tight">{item.title}</h3>
            <p className="text-sm leading-snug opacity-85">{item.description}</p>
          </div>
          {item.tags && (
            <div className="relative flex flex-wrap gap-1.5 font-mono text-[11px] uppercase">
              {item.tags.map((tag) => <span key={tag} className="border border-current px-1.5 py-0.5">#{tag}</span>)}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

export { BentoGrid };
