import { cva } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

// Neo-brutal button: thick border, hard shadow; lifts on hover and presses flat on click.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 border-2 border-border text-sm font-semibold whitespace-nowrap shadow-brutal-sm transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        accent: 'bg-violet text-ink',
        outline: 'bg-card text-card-foreground',
        success: 'bg-success text-ink',
        destructive: 'bg-destructive text-ink',
        ghost: 'border-transparent shadow-none hover:translate-x-0 hover:translate-y-0 hover:border-border hover:bg-accent hover:text-accent-foreground hover:shadow-none',
        link: 'h-auto border-0 p-0 font-medium underline underline-offset-4 shadow-none hover:translate-x-0 hover:translate-y-0 hover:text-violet hover:shadow-none active:translate-x-0 active:translate-y-0',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 gap-1.5 px-3 text-[13px]',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
        'icon-sm': 'size-8',
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
