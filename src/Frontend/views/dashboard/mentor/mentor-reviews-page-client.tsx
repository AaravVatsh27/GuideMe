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
      <Card className="rounded-2xl border-violet-100 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.08),transparent_30%),linear-gradient(135deg,#ffffff_0%,#faf5ff_55%,#fdf2f8_100%)]">
        <CardContent className="px-5 py-5 sm:px-6 sm:py-6">
          <Badge variant="outline" className="border-violet-200 bg-white/90 text-violet-800">
            Student feedback
          </Badge>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Reviews</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            See what students say about your mentoring sessions.
          </p>
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="min-w-0 overflow-hidden rounded-2xl border-violet-100 bg-white shadow-sm shadow-violet-900/5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-950">Rating distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 px-5 pb-5 pt-0">
            {reviews.distribution.map((item) => (
              <div key={item.rating} className="space-y-1 py-2">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>{item.rating}★</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-violet-600"
                    style={{ width: `${(item.count / maxDistribution) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
            <TabsList variant="line" className="flex h-auto flex-wrap gap-2 rounded-none p-0">
              <TabsTrigger value="all" className="min-h-10 rounded-xl px-3 text-sm font-medium text-[#1E1B4B] opacity-100 hover:bg-violet-50 hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20 data-[state=active]:bg-violet-100 data-[state=active]:font-semibold data-[state=active]:text-violet-900">
                All
              </TabsTrigger>
              <TabsTrigger value="5" className="min-h-10 rounded-xl px-3 text-sm font-medium text-[#1E1B4B] opacity-100 hover:bg-violet-50 hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20 data-[state=active]:bg-violet-100 data-[state=active]:font-semibold data-[state=active]:text-violet-900">
                5★
              </TabsTrigger>
              <TabsTrigger value="4" className="min-h-10 rounded-xl px-3 text-sm font-medium text-[#1E1B4B] opacity-100 hover:bg-violet-50 hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20 data-[state=active]:bg-violet-100 data-[state=active]:font-semibold data-[state=active]:text-violet-900">
                4★
              </TabsTrigger>
              <TabsTrigger value="3" className="min-h-10 rounded-xl px-3 text-sm font-medium text-[#1E1B4B] opacity-100 hover:bg-violet-50 hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20 data-[state=active]:bg-violet-100 data-[state=active]:font-semibold data-[state=active]:text-violet-900">
                3★ and below
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredReviews.length === 0 ? (
            <Card className="min-w-0 overflow-hidden rounded-2xl border-violet-100 bg-white shadow-sm shadow-violet-900/5">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-slate-950">
                  {reviews.items.length === 0 && filter === "all" ? "No reviews yet" : "No reviews match this filter."}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {reviews.items.length === 0 && filter === "all"
                    ? "Student feedback will appear here after your first completed session."
                    : "Try another rating filter to see more feedback."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredReviews.map((review) => {
              const response = reviewState.responses[review.id] ?? "";
              const isFlagged = reviewState.flagged.includes(review.id);
              const isFlagging = flaggingReviewIds.includes(review.id);

              return (
                <Card key={review.id} className="min-w-0 overflow-hidden rounded-2xl border-violet-100 bg-white shadow-sm shadow-violet-900/5">
                  <CardContent className="space-y-4 p-4 sm:p-5">
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
                          className="min-h-10 border-violet-200 bg-white text-violet-900 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20"
                        >
                          <Flag className="size-4" />
                          {isFlagged ? "Flagged" : isFlagging ? "Flagging..." : "Flag review"}
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm leading-6 text-slate-700">{review.reviewText ?? "No written review provided."}</p>

                    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <MessageSquare className="size-4 text-violet-600" />
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
                        className="min-h-28 w-full rounded-xl border border-slate-200 bg-white text-sm leading-6 text-slate-950 shadow-none placeholder:text-slate-400 focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-500/20"
                      />
                      <div className="mt-3 flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => saveResponse(review.id)}
                          className="min-h-10 bg-[#7C3AED] text-white hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20"
                        >
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
