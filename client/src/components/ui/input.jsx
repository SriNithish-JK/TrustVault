import { cn } from '@/lib/utils';

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base text-card-foreground transition-[box-shadow,border-color] duration-200 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:shadow-[0_0_0_4px_var(--glow)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
