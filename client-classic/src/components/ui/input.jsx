import { cn } from '@/lib/utils';

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 border-2 border-input bg-card px-3 text-base text-card-foreground transition-shadow duration-100 placeholder:text-muted-foreground focus-visible:shadow-brutal-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
