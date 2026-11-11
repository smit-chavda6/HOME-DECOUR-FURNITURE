"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormMessage, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteReviewAction, saveReviewAction } from "@/lib/actions/reviews";
import { cn } from "@/lib/utils";
import type { FormState } from "@/lib/validation";

type ReviewFormProps = {
  productId: string;
  productName: string;
  rating: number | null;
  comment: string;
};

const labels = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** Write, edit or remove your review of a delivered product. */
export function ReviewForm({ productId, productName, rating, comment }: ReviewFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(Math.round(rating ?? 0));
  const [hover, setHover] = useState(0);
  const [deleting, startDelete] = useTransition();

  const [state, action] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await saveReviewAction(prev, formData);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      }
      return result;
    },
    {} as FormState,
  );

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {rating != null && (
          <span className="flex items-center gap-1 text-sm">
            <Star className="size-4 fill-accent text-accent" aria-hidden />
            You rated this {rating}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          {rating != null ? "Edit review" : "Write a review"}
        </Button>
      </div>
    );
  }

  const shown = hover || stars;

  return (
    <form action={action} className="w-full space-y-4 rounded-2xl bg-surface-2 p-5">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={stars || ""} />

      <fieldset>
        <legend className="text-sm font-medium">Your rating for {productName}</legend>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} ${n === 1 ? "star" : "stars"}: ${labels[n]}`}
                aria-pressed={stars === n}
                onMouseEnter={() => setHover(n)}
                onClick={() => setStars(n)}
                className="p-1"
              >
                <Star
                  className={cn(
                    "size-7 transition-colors",
                    n <= shown ? "fill-accent text-accent" : "text-muted/50",
                  )}
                  aria-hidden
                />
              </button>
            ))}
          </div>
          <span className="text-sm text-muted">{labels[shown]}</span>
        </div>
      </fieldset>

      <div>
        <label htmlFor={`comment-${productId}`} className="text-sm font-medium">
          Your review <span className="font-normal text-muted">(optional)</span>
        </label>
        <Textarea
          id={`comment-${productId}`}
          name="comment"
          maxLength={1500}
          defaultValue={comment}
          placeholder="How does it look and feel at home?"
          className="mt-1.5 min-h-24"
        />
      </div>

      <FormMessage ok={state.ok}>{state.message}</FormMessage>

      <div className="flex flex-wrap gap-2">
        <SubmitButton size="sm" disabled={stars === 0} pendingText="Saving…">
          Save review
        </SubmitButton>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        {rating != null && (
          <Button
            variant="ghost"
            size="sm"
            disabled={deleting}
            className="ml-auto text-red-700 dark:text-red-400"
            onClick={() =>
              startDelete(async () => {
                await deleteReviewAction(productId);
                setStars(0);
                setOpen(false);
                router.refresh();
              })
            }
          >
            {deleting ? "Removing…" : "Delete review"}
          </Button>
        )}
      </div>
    </form>
  );
}
