import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/Backend/server/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap outline-none select-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-[#7C3AED] text-white shadow-[0_8px_24px_-12px_rgba(124,58,237,0.50)] hover:bg-[#6D28D9] hover:shadow-[0_12px_32px_-12px_rgba(124,58,237,0.65)] active:scale-[0.99]",
        outline:
          "rounded-xl border border-[color:var(--light-border)] bg-transparent text-foreground hover:bg-[color:var(--light-surface)] aria-expanded:bg-[color:var(--light-surface)] dark:border-[color:var(--dark-border)] dark:hover:bg-[color:var(--dark-surface)]",
        secondary:
          "rounded-xl border border-[color:var(--light-border)] bg-[color:var(--light-surface)] text-foreground hover:border-[color:var(--light-border-hover)] dark:border-[color:var(--dark-border)] dark:bg-[color:var(--dark-surface)] dark:hover:border-[color:var(--dark-border-hover)]",
        ghost:
          "rounded-xl bg-transparent text-foreground hover:bg-[color:var(--light-surface)] dark:hover:bg-[color:var(--dark-surface)]",
        destructive:
          "rounded-xl bg-[color:var(--color-error)] text-white hover:bg-red-500 focus-visible:ring-destructive/20 dark:bg-[color:var(--color-error)]",
        link: "rounded-xl bg-transparent text-[color:var(--brand-purple)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-full px-3 text-sm in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-1.5 rounded-full px-5 text-base has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-10 rounded-full",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-full in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : ButtonPrimitive

    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
