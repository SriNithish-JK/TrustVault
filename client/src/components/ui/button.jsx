import { cva } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

// Soft, springy button: lifts and glows on hover, squashes on press. The primary one gets a light sweep.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full border text-sm font-semibold whitespace-nowrap transition-[transform,box-shadow,background-color,border-color,background-position] duration-300 ease-[var(--ease-spring)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:scale-110",
  {
    variants: {
      variant: {
        default: 'shine neon-fill border-transparent bg-[length:180%_100%] shadow-[0_0_28px_-6px_var(--primary)] hover:bg-[position:100%_0] hover:shadow-[0_0_44px_-4px_var(--violet)]',
        secondary: 'shine border-transparent bg-secondary text-secondary-foreground shadow-brutal-sm hover:shadow-brutal',
        accent: 'shine border-transparent bg-violet text-ink shadow-brutal-sm hover:shadow-brutal',
        outline: 'border-border bg-card text-card-foreground shadow-brutal-sm hover:border-primary hover:shadow-brutal',
        success: 'shine border-transparent bg-success text-ink shadow-brutal-sm hover:shadow-brutal',
        destructive: 'shine border-transparent bg-destructive text-ink shadow-brutal-sm hover:shadow-brutal',
        ghost: 'border-transparent hover:translate-y-0 hover:bg-accent hover:text-accent-foreground',
        link: 'h-auto rounded-none border-0 p-0 font-medium underline decoration-primary/50 underline-offset-4 hover:translate-y-0 hover:text-primary hover:decoration-primary active:scale-100',
      },
      size: {
        default: 'h-10 px-5',
        sm: 'h-8 gap-1.5 px-3.5 text-[13px]',
        lg: 'h-13 px-7 text-base',
        icon: 'size-10',
        'icon-sm': 'size-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

function Button({ className, variant = 'default', size = 'default', asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : 'button';
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size }), variant === 'link' && 'h-auto p-0', className)} {...props} />;
}

export { Button, buttonVariants };
