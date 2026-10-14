"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Star, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v3";
import { apiClient } from "@/core/api/api.client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/common/form";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { handleTrpcAuthClientError } from "@/shared/utils/handle-trpc-auth-error";

const reviewFormSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().max(200).optional(),
  content: z.string().min(10).max(2000),
  images: z.array(z.object({ url: z.string().url() })).default([]),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

interface ReviewFormProps {
  productId: string;
  orderItemId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ productId, orderItemId, onSuccess, onCancel }: ReviewFormProps) {
  const router = useRouter();
  const [hoveredRating, setHoveredRating] = useState(0);

  const form = useForm<ReviewFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: zod/v3 vs react-hook-form resolver type conflict
    resolver: zodResolver(reviewFormSchema) as any,
    defaultValues: {
      rating: 0,
      title: "",
      content: "",
      images: [],
    },
  });

  const rating = form.watch("rating");
  const images = form.watch("images");

  const createMutation = apiClient.review.create.useMutation({
    onSuccess: (result: { status: string; message?: string }) => {
      if (result.status === "success") {
        toast.success("Review submitted successfully! It will be published after moderation.");
        onSuccess?.();
        router.push(`/store/products/${productId}`);
      } else {
        toast.error(result.message || "Failed to submit review");
      }
    },
    onError: (error) => {
      if (handleTrpcAuthClientError(error, "Please sign in to submit your review.")) return;
      toast.error(error instanceof Error ? error.message : "An error occurred");
    },
  });

  const onSubmit = (data: ReviewFormData) => {
    if (data.rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    createMutation.mutate({
      body: {
        productId,
        orderItemId,
        rating: data.rating,
        title: data.title,
        content: data.content,
        images: data.images,
      },
    });
  };

  const handleImageRemove = (index: number) => {
    form.setValue(
      "images",
      images.filter((_, i) => i !== index),
    );
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <CardDescription>
          Share your experience with this product to help other customers make informed decisions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating *</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star: number) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => field.onChange(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className="p-1 focus:outline-none"
                        >
                          <Star
                            className={`size-8 transition-colors ${
                              star <= (hoveredRating || field.value)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground">
                        {field.value > 0
                          ? ["Poor", "Fair", "Good", "Very Good", "Excellent"][field.value - 1]
                          : "Select a rating"}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review Title (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Summarize your experience in a few words"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us what you liked or disliked about this product. Minimum 10 characters."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Images */}
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photos (Optional)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {field.value?.map((image: { url: string }, index: number) => (
                          <div key={index} className="relative size-20 rounded-md overflow-hidden group">
                            <Image src={image.url} alt={`Review ${index + 1}`} fill className="object-cover" />
                            <button
                              type="button"
                              onClick={() => handleImageRemove(index)}
                              className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Photo uploads are not available yet. You can still submit a written review.
                      </p>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={createMutation.isPending || rating === 0}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
