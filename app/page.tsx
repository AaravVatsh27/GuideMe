import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FREE_INTRO_DURATION,
  MAX_PRICE,
  MIN_PRICE,
  PLATFORM_CUT,
  SESSION_DURATIONS,
} from "@/lib/constants";

export default function Home() {
  const setupChecklist = [
    "Auth.js beta + Prisma adapter installed",
    "shadcn/ui primitives generated",
    "React Query, Zustand, UploadThing, Razorpay, Daily, Sentry, and Upstash wired into the repo",
    "Environment templates, shared constants, and platform interfaces added",
  ];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16 md:px-10">
        <div className="flex flex-col gap-4">
          <Badge className="w-fit">GuideMe Platform Starter</Badge>
          <div className="space-y-3">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
              Next.js 14 mentoring platform scaffolded and ready to build on.
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
              The repository now includes the core platform packages, shadcn/ui
              primitives, shared providers, environment templates, and baseline
              product constants for a production mentoring workflow.
            </p>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Guardrails</CardTitle>
              <CardDescription>Platform defaults baked into the scaffold.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Mentor price range: ₹{MIN_PRICE} to ₹{MAX_PRICE}</p>
              <p>Platform cut: {PLATFORM_CUT * 100}%</p>
              <p>Free intro duration: {FREE_INTRO_DURATION} minutes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Model</CardTitle>
              <CardDescription>Shared constants and base interfaces are in place.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Supported session lengths: {SESSION_DURATIONS.join(", ")} minutes</p>
              <p>Base types cover users, mentors, students, sessions, reviews, and API responses.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Infra Surface</CardTitle>
              <CardDescription>External services are installed and env keys are templated.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Auth, Prisma, Razorpay, Resend, UploadThing, Daily, Upstash, and Sentry are available.</p>
              <p>React Query, Zustand, Framer Motion, and shadcn/ui are ready for app features.</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {setupChecklist.map((item) => (
            <Card key={item}>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                {item}
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
