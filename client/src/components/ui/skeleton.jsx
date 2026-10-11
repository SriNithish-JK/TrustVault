import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-shimmer rounded-lg bg-[linear-gradient(100deg,var(--muted)_40%,var(--accent)_50%,var(--muted)_60%)] bg-[length:200%_100%]", className)}
      {...props}
    />
  )
}

export { Skeleton }
