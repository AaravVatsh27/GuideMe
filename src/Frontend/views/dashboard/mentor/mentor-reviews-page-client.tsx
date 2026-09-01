"use client";

import { useEffect, useMemo, useState } from "react";
import { Flag, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/Frontend/components/ui/avatar";
import { Badge } from "@/Frontend/components/ui/badge";
import { Button } from "@/Frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Frontend/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/Frontend/components/ui/tabs";
import { Textarea } from "@/Frontend/components/ui/textarea";

import type { MentorDashboardData } from "./mentor-dashboard-data";
import { formatDateOnly, getInitials } from "./mentor-dashboard-utils";

type Props = {
  mentorId: string;
  reviews: MentorDashboardData["reviews"];
};

type Filter = "all" | "5" | "4" | "3";

type ReviewState = {
  responses: Record<string, string>;
  flagged: string[];
};

export function MentorReviewsPageClient({ mentorId, reviews }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [reviewState, setReviewState] = useState<ReviewState>({
    responses: {},
    flagged: [],
  });
  const [flaggingReviewIds, setFlaggingReviewIds] = useState<string[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(`mentor-dashboard:${mentorId}:reviews`);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<ReviewState>;
      setReviewState({
        responses: parsed.responses ?? {},
        flagged: parsed.flagged ?? [],
      });
    } catch {
      // ignore malformed local state
    }
  }, [mentorId]);

  useEffect(() => {
    window.localStorage.setItem(`mentor-dashboard:${mentorId}:reviews`, JSON.stringify(reviewState));
  }, [mentorId, reviewState]);

  const filteredReviews = useMemo(() => {
    switch (filter) {
      case "5":
        return reviews.items.filter((review) => review.rating === 5);
      case "4":
        return reviews.items.filter((review) => review.rating === 4);
      case "3":
        return reviews.items.filter((review) => review.rating <= 3);
      default:
        return reviews.items;
    }
  }, [filter, reviews.items]);

  const maxDistribution = Math.max(...reviews.distribution.map((item) => item.count), 1);

  function saveResponse(reviewId: string) {
    toast.success("Public response saved");
    setReviewState((current) => ({
      ...current,
      responses: {
        ...current.responses,
        [reviewId]: current.responses[reviewId] ?? "",
      },
    }));
  }

  async function flagReview(reviewId: string) {
    setFlaggingReviewIds((current) => (current.includes(reviewId) ? current : [...current, reviewId]));

    try {
      const response = await fetch(`/api/reviews/${reviewId}/flag`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to flag review");
      }

      setReviewState((current) => ({
        ...current,
        flagged: current.flagged.includes(reviewId) ? current.flagged : [...current.flagged, reviewId],
      }));
      toast.success("Review flagged for admin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to flag review");
    } finally {
      setFlaggingReviewIds((current) => current.filter((id) => id !== reviewId));
    }
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-[1.75rem] border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.14),_transparent_24%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_60%,_#ecfeff_100%)]">
        <CardContent className="p-6 sm:p-7">
          <Badge variant="outline" className="border-slate-300 bg-white/80 text-slate-700">
            Student feedback
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Reviews</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Filter by score, reply publicly to feedback, and surface reviews that should go to admin moderation.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="rounded-[1.5rem] border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-slate-950">Aggregate stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.distribution.map((item) => (
              <div key={item.rating} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>{item.rating}★</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-teal-500"
                    style={{ width: `${(item.count / maxDistribution) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
            <TabsList variant="line" className="rounded-none p-0">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="5">5★</TabsTrigger>
              <TabsTrigger value="4">4★</TabsTrigger>
              <TabsTrigger value="3">3★ and below</TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredReviews.length === 0 ? (
            <Card className="rounded-[1.5rem] border-slate-200 bg-white">
              <CardContent className="p-6 text-sm text-slate-600">No reviews match this filter.</CardContent>
            </Card>
          ) : (
            filteredReviews.map((review) => {
              const response = reviewState.responses[review.id] ?? "";
              const isFlagged = reviewState.flagged.includes(review.id);
              const isFlagging = flaggingReviewIds.includes(review.id);

              return (
                <Card key={review.id} className="rounded-[1.5rem] border-slate-200 bg-white">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="size-11">
                          <AvatarImage src={review.studentImage ?? ""} alt={review.studentName} />
                          <AvatarFallback>{getInitials(review.studentName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-950">{review.studentFirstName}</p>
                            <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                              {review.rating} / 5
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{formatDateOnly(review.createdAt)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => flagReview(review.id)}
                          disabled={isFlagged || isFlagging}
                        >
                          <Flag className="size-4" />
                          {isFlagged ? "Flagged" : isFlagging ? "Flagging..." : "Flag review"}
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm leading-6 text-slate-700">{review.reviewText ?? "No written review provided."}</p>

                    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <MessageSquare className="size-4 text-teal-700" />
                        <p className="text-sm font-medium text-slate-950">Public response</p>
                      </div>
                      <Textarea
                        value={response}
                        onChange={(event) =>
                          setReviewState((current) => ({
                            ...current,
                            responses: {
                              ...current.responses,
                              [review.id]: event.target.value,
                            },
                          }))
                        }
                        placeholder="Reply to this review. This will appear on your public profile."
                        className="min-h-28 bg-white"
                      />
                      <div className="mt-3 flex justify-end">
                        <Button size="sm" onClick={() => saveResponse(review.id)}>
                          Save response
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
