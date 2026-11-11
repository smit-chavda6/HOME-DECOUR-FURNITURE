import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarsProps = {
  /** 0 to 5; halves are drawn as half-filled stars. */
  rating: number;
  className?: string;
  size?: "sm" | "md";
};

/** Read-only star rating. */
export function Stars({ rating, className, size = "sm" }: StarsProps) {
  const starSize = size === "sm" ? "size-3.5" : "size-5";
  const rounded = Math.round(rating * 2) / 2;

  return (
    <span
      role="img"
      aria-label={`Rated ${rating.toFixed(1)} out of 5`}
      className={cn("inline-flex gap-0.5", className)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = rounded >= star ? 100 : rounded >= star - 0.5 ? 50 : 0;
        return (
          <span key={star} className="relative">
            <Star className={cn(starSize, "text-line")} aria-hidden />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill}%` }}
              >
                <Star className={cn(starSize, "fill-accent text-accent")} aria-hidden />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
