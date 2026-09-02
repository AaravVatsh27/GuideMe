import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/Backend/server/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-secondary-foreground",
        secondary:
          "border-transparent bg-[color:var(--light-surface)] text-[color:var(--brand-navy)] dark:bg-[color:var(--dark-surface)] dark:text-foreground",
        destructive:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200",
        outline:
          "border-[color:var(--light-border)] bg-transparent text-foreground dark:border-[color:var(--dark-border)]",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:bg-muted dark:hover:bg-[color:var(--dark-surface)]",
        link: "border-transparent bg-transparent text-[color:var(--brand-purple)] underline-offset-4 hover:underline",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200",
        warning:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200",
        error:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200",
        brand:
          "border-[color:var(--brand-purple)]/20 bg-[color:var(--brand-purple)]/10 text-[color:var(--brand-navy)]",
        verified:
          "border-[color:var(--brand-pink)]/20 bg-[color:var(--brand-pink)]/10 text-[color:var(--brand-navy)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
