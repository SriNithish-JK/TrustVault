// Adapted from the 21st.dev "Bento Grid" by kokonutd (https://21st.dev/r/kokonutd/bento-grid):
// same item model (title, description, icon, status, tags, colSpan). In this interface each tile
// scrolls in, lifts on hover and has a cursor spotlight (after the 21st.dev "Spotlight Card" pattern).
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { ease } from '@/lib/fx';

const TONES = {
  card: 'from-transparent', amber: 'from-primary/20', violet: 'from-violet/20',
  green: 'from-success/20', sky: 'from-info/20', ink: 'from-violet/10',
};

function BentoGrid({ items, className }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-3', className)}>
      {items.map((item, i) => (
        <motion.article
          key={item.title}
          data-spot
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-8% 0px' }}
          transition={{ duration: 0.65, delay: (i % 3) * 0.09, ease }}
          whileHover={{ y: -6 }}
          className={cn(
            'group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card bg-linear-to-br to-transparent p-5 text-card-foreground shadow-brutal transition-[border-color,box-shadow] duration-300 hover:border-primary/50 hover:shadow-brutal-lg',
            TONES[item.tone ?? 'card'],
            item.colSpan === 2 && 'md:col-span-2',
            item.colSpan === 3 && 'md:col-span-3',
          )}
        >
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-xl border border-primary/30 bg-accent text-primary transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-110 group-hover:-rotate-6">{item.icon}</span>
            {item.status && <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground uppercase">{item.status}</span>}
          </div>
          {item.visual && <div>{item.visual}</div>}
          <div className="mt-auto grid gap-2">
            <h3 className="text-xl leading-tight">{item.title}</h3>
            <p className="text-sm leading-snug text-muted-foreground">{item.description}</p>
          </div>
          {item.tags && (
            <div className="flex flex-wrap gap-1.5 font-mono text-[11px] text-muted-foreground uppercase">
              {item.tags.map((tag) => <span key={tag} className="rounded-full border border-border px-2 py-0.5">#{tag}</span>)}
            </div>
          )}
        </motion.article>
      ))}
    </div>
  );
}

export { BentoGrid };
