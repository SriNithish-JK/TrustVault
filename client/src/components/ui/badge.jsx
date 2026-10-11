import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Tinted pills: a translucent fill with a readable foreground and a leading status dot colour.
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide whitespace-nowrap uppercase [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-primary/40 bg-primary/15 text-foreground',
        success: 'border-success/50 bg-success/15 text-foreground',
        warning: 'border-amber-400/60 bg-amber-400/15 text-foreground',
        destructive: 'border-destructive/60 bg-destructive/15 text-foreground',
        info: 'border-info/50 bg-info/15 text-foreground',
        violet: 'border-violet/50 bg-violet/15 text-foreground',
        ink: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border bg-card text-card-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Badge({ className, variant = 'default', ...props }) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
