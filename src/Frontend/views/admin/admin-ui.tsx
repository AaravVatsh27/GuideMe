import { Check, type LucideIcon } from "lucide-react";

import { cn } from "@/Backend/server/utils";

// Shared look for the admin list pages (Users, Mentors, Sessions, Payments, Notifications, Settings).

export const adminCardClass = "rounded-[24px] border border-[#EEF2FF] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

const fieldBase =
  "h-11 border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] shadow-none transition-colors focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus-visible:border-[#4F46E5] focus-visible:ring-2 focus-visible:ring-[#4F46E5]/20 focus-visible:ring-offset-0";

export const adminSearchInputClass = cn(fieldBase, "w-full rounded-full pl-10 pr-4");
export const adminFieldClass = cn(fieldBase, "rounded-[12px] px-3.5");
export const adminSelectClass = cn(fieldBase, "rounded-[12px] pl-3.5 pr-8");
export const adminToolbarButtonClass =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#334155] transition-colors hover:bg-[#F5F3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/30 disabled:cursor-not-allowed disabled:opacity-50";

export const adminPillTones = {
  green: "bg-[#DCFCE7] text-[#166534]",
  amber: "bg-[#FEF3C7] text-[#92400E]",
  red: "bg-[#FEE2E2] text-[#991B1B]",
  indigo: "bg-[#EEF2FF] text-[#4F46E5]",
  gray: "bg-[#F1F5F9] text-[#475569]",
} as const;

export type AdminPillTone = keyof typeof adminPillTones;

export function AdminPill({ tone, children }: { tone: AdminPillTone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium", adminPillTones[tone])}>
      {children}
    </span>
  );
}

export function AdminAvatar({ name, image, className = "size-9 text-xs" }: { name: string; image?: string | null; className?: string }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" className={cn("shrink-0 rounded-full object-cover", className)} />;
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] font-semibold text-[#4F46E5]", className)} aria-hidden="true">
      {initials}
    </span>
  );
}

export function AdminPersonCell({ name, secondary, image }: { name: string; secondary?: string | null; image?: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <AdminAvatar name={name} image={image} />
      <div className="min-w-0">
        <p className="truncate font-medium text-[#0F172A]">{name}</p>
        {secondary ? <p className="truncate text-xs text-[#64748B]">{secondary}</p> : null}
      </div>
    </div>
  );
}

export function AdminCheckbox({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <span className={cn("relative inline-flex size-[18px] shrink-0 align-middle", className)}>
      <input
        type="checkbox"
        className="peer absolute inset-0 m-0 cursor-pointer appearance-none rounded-[6px] border border-[#CBD5E1] bg-white transition-colors checked:border-[#4F46E5] checked:bg-[#4F46E5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/30 disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
      <Check
        className="pointer-events-none absolute inset-0 m-auto size-3 text-white opacity-0 peer-checked:opacity-100"
        strokeWidth={3}
        aria-hidden="true"
      />
    </span>
  );
}

export type AdminHeaderStat = { label: string; value: number };

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  stats = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  stats?: AdminHeaderStat[];
}) {
  return (
    <section className={cn(adminCardClass, "flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between")}>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">{eyebrow}</p>
        <h1 className="mt-2 text-[36px] font-bold leading-tight tracking-tight text-[#0F172A]">{title}</h1>
        <p className="mt-2 text-sm text-[#64748B]">{description}</p>
      </div>
      {stats.length > 0 ? (
        <dl className="flex shrink-0 divide-x divide-[#E2E8F0]">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col px-4 first:pl-0 last:pr-0 sm:px-8">
              <dt className="mt-1 text-sm text-[#64748B]">{stat.label}</dt>
              <dd className="order-first text-[40px] font-bold leading-none tracking-tight text-[#0F172A]">
                {stat.value.toLocaleString("en-IN")}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

export type AdminEmptyStateConfig = { icon: LucideIcon; title: string; caption: string };
