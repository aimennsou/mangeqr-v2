'use client'
import Link from "next/link";
import Image from "next/image";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ReviewTable from "../_components/tables/ReviewTable";
import ReviewTableSkeleton from "../_components/tables/ReviewTableSkeleton";
import { ReviewBadgeShare } from "../_components/reviews/ReviewBadgeShare";
import { ContentLayout } from "../_admin-panel/content-layout";
import Logo from "@/components/Logo";
import { useI18n } from "@/lib/i18n";






export default function ReviewsPage() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [reviews, setReviews] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch("/api/magasin");
        const data = response.ok ? await response.json() : [];
        const list = Array.isArray(data)
          ? data.map((r: any) => ({ id: r.id, name: r.name }))
          : [];
        setRestaurants(list);
        if (list.length > 0) setSelectedRestaurantId((prev) => prev || list[0].id);
      } catch {
        setRestaurants([]);
      }
    };
    fetchRestaurants();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch("/api/review");
        if (!response.ok) {
          setReviews([]);
          return;
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          setReviews([]);
          return;
        }
        // Map DB reviews to the shape ReviewTable expects.
        setReviews(
          data.map((r: any) => ({
            id: r.id,
            client: r.clientEmail || r.clientNumero || "Anonyme",
            review: r.review,
            message: r.message ?? "",
            state: r.state,
            shop: {
              id: r.restaurant?.id ?? r.restaurantId,
              name: r.restaurant?.name ?? "",
            },
          }))
        );
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const hasReviews = reviews.length > 0;

  return (
    <ContentLayout title={t("reviews.title")}>
      <Breadcrumb>
        <BreadcrumbList>
        <BreadcrumbItem>
            <BreadcrumbLink asChild>
            <Link href="/dashboard" className="flex mx-auto justify-center items-center gap-2">
                    <Logo className="max-md:hidden" />
        </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("reviews.title")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card className="rounded-lg border-none  mt-6">
      <CardContent className="p-6">
      <div className="mt-6">

      {loading ? (
        // While loading, the WHOLE page (top selector + badge + table) shows a
        // pulsating skeleton — not just a bare table under an empty top area.
        <ReviewTableSkeleton />
      ) : (
        <>
          {restaurants.length > 0 && (
            <>
              {/* Page-level restaurant selector (top): drives the shareable badge. */}
              <div className="mb-6 grid gap-2 max-w-xs">
                <Label>{t("common.restaurant")}</Label>
                <Select
                  value={selectedRestaurantId}
                  onValueChange={setSelectedRestaurantId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisissez un restaurant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {restaurants.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <ReviewBadgeShare
                restaurants={restaurants}
                selectedId={selectedRestaurantId}
              />
            </>
          )}

          {hasReviews ? (
            <ReviewTable reviews={reviews} />
          ) : (
        <div className="text-center text-gray-500 py-6">
          <div className="flex justify-center">
            <Image
              className={`${theme === "dark" ? "dark:invert" : ""}`}
              src={"/images/empty-reviews.png"}
              alt="Empty folder"
              width={400}
              height={400}
            />
          </div>
          <p className="text-lg  font-semibold mt-4">{t("reviews.empty.title")}</p>
          <p className="mt-2">{t("reviews.empty.subtitle")}</p>
        </div>
          )}
        </>
      )}

        </div>
      </CardContent>
    </Card>
    </ContentLayout>
  );
}
