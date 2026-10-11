import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1 border-2 border-border px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide whitespace-nowrap uppercase [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-primary text-ink',
        success: 'bg-success text-ink',
        warning: 'bg-primary text-ink',
        destructive: 'bg-destructive text-ink',
        info: 'bg-info text-ink',
        violet: 'bg-violet text-ink',
        ink: 'bg-secondary text-secondary-foreground',
        outline: 'bg-card text-card-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Badge({ className, variant = 'default', ...props }) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
