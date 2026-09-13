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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

import { RecentReviews } from "../_components/charts/RecentReviews";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { useTheme } from "next-themes";
import { ContentLayout } from "../_admin-panel/content-layout";
import Logo from "@/components/Logo";
import { Restaurant } from "@/types";
import { AreaGraph } from "../_components/charts/AreaGraph";
import { BarGraph } from "../_components/charts/BarGraph";
import { PieGraph } from "../_components/charts/PieGraph";
import KpiCard from "../_components/charts/KpiCard";
import { OrderRevenueChart } from "../_components/charts/OrderRevenueChart";
import PerformancesSkeleton from "../_components/charts/PerformancesSkeleton";
import { QrCode, Star, Heart, LayoutGrid, ShoppingCart, Euro, Receipt, Truck } from "lucide-react";
import { useI18n } from "@/lib/i18n";






















export default function PerformancesPage() {
  const { theme } = useTheme();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [data, setData] = useState({ scans: 0, reviews: 0 });





  // Default to the last 30 days so charts have a sensible range on first load.
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { from, to };
  });

  const [shops, setShops] = useState<{ id: string; name: string }[]>([]); 
  const [shopId, setShopId] = useState("");
  const [bargraphData, setbargraphData] = useState([]);
  const [areagraphData, setareagraphData] = useState([]);
  const [piegraphData, setpiegraphData] = useState([]);
  const [topDishName, setTopDishName] = useState<string | null>(null);
  const [topDishFavorites, setTopDishFavorites] = useState<number>(0);
  const [topCategoryName, setTopCategoryName] = useState<string | null>(null);

  // FEAT-1 order metrics (only rendered when ordering is enabled for the shop).
  const [orderMetrics, setOrderMetrics] = useState<{
    orderingEnabled: boolean;
    currency: string;
    totalOrders: number;
    revenue: number;
    avgOrderValue: number;
    dineInCount: number;
    deliveryCount: number;
    daily: { date: string; orders: number; revenue: number }[];
  } | null>(null);

  const getOrderMetrics = async (
    shopId: string,
    startDate: Date,
    endDate: Date
  ) => {
    try {
      const response = await fetch("/api/order-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, startDate, endDate }),
      });
      if (!response.ok) {
        setOrderMetrics(null);
        return;
      }
      const data = await response.json();
      setOrderMetrics(data);
    } catch (error) {
      console.error("Error fetching order metrics:", error);
      setOrderMetrics(null);
    }
  };

  const getcardsData = async (shopId: string, startDate: Date, endDate: Date) => {
    try {
      const response = await fetch('/api/cards1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopId,
          startDate,
          endDate,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
      }
  
      const data = await response.json();
  
      // Assuming the response contains 'scans' and 'reviews'
      return {
        scans: data.scans,
        reviews: data.reviews,
      };
    } catch (error) {
      console.error('Error fetching card data:', error);
      return {
        scans: 0,
        reviews: 0,
      };
    }
  };
  
  const getbargraphData = async (shopId: string, startDate: Date, endDate: Date) => {
    try {
      const response = await fetch('/api/bargraph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopId,
          startDate,
          endDate,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
      }
  
      const data = await response.json();
  
      // Assuming the response contains 'scans' and 'reviews'

        setbargraphData(data); // Set the chart data in the state
      } catch (error) {
        console.error('Error fetching bar graph data:', error);
      }
    };

    const getCardsData = async (shopId: string, startDate: Date, endDate: Date) => {
      try {
        const response = await fetch('/api/cards2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shopId,
            startDate,
            endDate,
          }),
        });
    
        // Check if the response is OK
        if (!response.ok) {
          throw new Error(`API call failed with status ${response.status}`);
        }
    
        // Parse the response data
        const data = await response.json();
    
        // Handle topDishName (most-favorited dish) + its favorite count.
        if (data.topDishName) {
          setTopDishName(data.topDishName);
        } else {
          setTopDishName('N/A');
        }
        setTopDishFavorites(Number(data.topDishFavorites) || 0);
    
        // Handle topCategoryName
        if (data.topCategoryName) {
          setTopCategoryName(data.topCategoryName);
        } else {
          setTopCategoryName('N/A');
        }
    
      } catch (error) {
        setTopDishName('N/A');
        setTopDishFavorites(0);
        setTopCategoryName('N/A');
      }
    };
    

    const getareagraphData = async (shopId: string, startDate: Date, endDate: Date) => {
      try {
        const response = await fetch('/api/areagraph', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shopId,
            startDate,
            endDate,
          }),
        });
  
        if (!response.ok) {
          throw new Error(`API call failed with status ${response.status}`);
        }
  
        const data = await response.json();
  
        // Assuming the response contains data in the required format:
        // { weekday: string, day: number, night: number }[]
        setareagraphData(data);
      } catch (error) {
        console.error('Error fetching area chart data:', error);
      }
    };


    const getpiegraphData = async (shopId: string, startDate: Date, endDate: Date) => {
      try {
        const response = await fetch('/api/piegraph', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shopId,
            startDate,
            endDate,
          }),
        });
  
        if (!response.ok) {
          throw new Error(`API call failed with status ${response.status}`);
        }
  
        const data = await response.json();
  
        // Assuming the response contains data in the required format:
        // { weekday: string, day: number, night: number }[]
        setpiegraphData(data);
      } catch (error) {
        console.error('Error fetching area chart data:', error);
      }
    };


    const fetchRestaurants = async () => {
      try {
        const response = await fetch('/api/magasin');
        if (response.ok) {
          const data = await response.json();
          const list = Array.isArray(data) ? data : [];
          setRestaurants(list);
          setShops(list);
        } else {
          // 404 => this user has no restaurants yet
          setRestaurants([]);
          setShops([]);
        }
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } 
    };


    // Load the restaurant list ONCE on mount. This used to live inside the
    // analytics effect below, which also set `shops`; with `shops` in that
    // effect's deps it re-ran → refetched → set `shops` again, an infinite loop.
    useEffect(() => {
      fetchRestaurants().finally(() => setLoading(false));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Once restaurants are loaded, default the selector to the first one.
    useEffect(() => {
      if (shops.length > 0 && !shopId) {
        setShopId(shops[0].id);
      }
    }, [shops, shopId]);

    // Fetch analytics only when the selected shop or date range changes.
    // Note: this deliberately does NOT depend on `shops`, and no longer
    // refetches the restaurant list (that is mount-only above).
    useEffect(() => {
      if (!dateRange?.from || !dateRange.to || !shopId) return;
      const { from, to } = dateRange;
      getbargraphData(shopId, from, to);
      getareagraphData(shopId, from, to);
      getpiegraphData(shopId, from, to);
      getCardsData(shopId, from, to);
      getcardsData(shopId, from, to).then(setData);
      getOrderMetrics(shopId, from, to);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange, shopId]);
  
    const handleDateRangeChange = (range: DateRange | undefined) => {
      setDateRange(range);
    };










  return (
    <ContentLayout title={t("nav.performances")}>
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
            <BreadcrumbPage>{t("nav.performances")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card className="rounded-lg border-none  mt-6">
      <CardContent className="p-6">
      <div className="mt-6">
      {loading ? (
        <PerformancesSkeleton />
      ) : shops.length === 0 ? (
        <div className="text-center text-muted-foreground py-6">
          <div className="flex justify-center">
            <Image
              className={`${theme === "dark" ? "dark:invert" : ""}`}
              src="/images/empty-performances.png"
              alt="Empty folder"
              width={400}
              height={400}
            />
          </div>
          <p className="text-lg  font-semibold mt-4 text-foreground">{t("performances.empty.title")}</p>
          <p className="mt-2">{t("performances.empty.subtitle")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Restaurant selector */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Select value={shopId} onValueChange={setShopId}>
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue placeholder={t("common.chooseRestaurant")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {shops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* KPI cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title={t("performances.kpi.scans")}
              number={data.scans}
              icon={<QrCode />}
              description={t("performances.kpi.scansDesc")}
            />
            <KpiCard
              title={t("performances.kpi.reviews")}
              number={data.reviews}
              icon={<Star />}
              description={t("performances.kpi.reviewsDesc")}
            />
            <KpiCard
              title={t("performances.kpi.topCategory")}
              number={topCategoryName ?? "N/A"}
              icon={<LayoutGrid />}
              description={t("performances.kpi.periodDesc")}
            />
            <KpiCard
              title={t("performances.kpi.topDish")}
              number={topDishName ?? "N/A"}
              icon={<Heart />}
              description={
                topDishName && topDishName !== "N/A"
                  ? t("performances.kpi.topDishDesc").replace(
                      "{count}",
                      String(topDishFavorites)
                    )
                  : t("performances.kpi.periodDesc")
              }
            />
          </div>

          {/* Order KPIs (FEAT-1) — only when ordering is enabled for this shop */}
          {orderMetrics?.orderingEnabled ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title={t("performances.kpi.orders")}
                number={orderMetrics.totalOrders}
                icon={<ShoppingCart />}
                description={t("performances.kpi.ordersDesc")}
              />
              <KpiCard
                title={t("performances.kpi.revenue")}
                number={`${
                  Number.isInteger(orderMetrics.revenue)
                    ? orderMetrics.revenue
                    : orderMetrics.revenue.toFixed(2)
                } ${orderMetrics.currency}`}
                icon={<Euro />}
                description={t("performances.kpi.revenueDesc")}
              />
              <KpiCard
                title={t("performances.kpi.avgBasket")}
                number={`${orderMetrics.avgOrderValue.toFixed(2)} ${orderMetrics.currency}`}
                icon={<Receipt />}
                description={t("performances.kpi.avgBasketDesc")}
              />
              <KpiCard
                title={t("performances.kpi.split")}
                number={`${orderMetrics.dineInCount} / ${orderMetrics.deliveryCount}`}
                icon={<Truck />}
                description={t("performances.kpi.splitDesc")}
              />
            </div>
          ) : null}

          {/* Order revenue chart (FEAT-1) */}
          {orderMetrics?.orderingEnabled ? (
            <OrderRevenueChart
              data={orderMetrics.daily}
              currency={orderMetrics.currency}
            />
          ) : null}

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <BarGraph data={bargraphData} />
            <AreaGraph data={areagraphData} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <PieGraph data={piegraphData} />
            <Card>
              <CardHeader>
                <CardTitle>{t("performances.recentReviews")}</CardTitle>
                <CardDescription>{t("performances.recentReviewsDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentReviews restaurantId={shopId} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
        </div>
      </CardContent>
    </Card>
    </ContentLayout>
  );
}