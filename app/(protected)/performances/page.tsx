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
import { SetStateAction, useEffect, useState } from "react";

import LastReviewsCard, { RecentSales } from "../_components/charts/LastReviews";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tabs } from "@radix-ui/react-tabs";
import { Select } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { useTheme } from "next-themes";
import { ContentLayout } from "../_admin-panel/content-layout";
import Logo from "@/components/Logo";
import { Restaurant } from "@/types";






















export default function PerformancesPage() {
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [data, setData] = useState({ scans: 0, reviews: 0 });





  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [shops, setShops] = useState<{ id: string; name: string }[]>([]); 
  const [shopId, setShopId] = useState("");
  const [bargraphData, setbargraphData] = useState([]);
  const [areagraphData, setareagraphData] = useState([]);
  const [piegraphData, setpiegraphData] = useState([]);
  const [topDishName, setTopDishName] = useState<string | null>(null);
  const [topCategoryName, setTopCategoryName] = useState<string | null>(null);

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
    
        // Handle topDishName
        if (data.topDishName) {
          setTopDishName(data.topDishName);
        } else {
          setTopDishName('N/A');
        }
    
        // Handle topCategoryName
        if (data.topCategoryName) {
          setTopCategoryName(data.topCategoryName);
        } else {
          setTopCategoryName('N/A');
        }
    
      } catch (error) {
        setTopDishName('N/A');
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
        const response = await fetch('/api/restaurant');
        if (response.ok) {
          const data = await response.json();
          setRestaurants(data);
          setShops(data);
        } else {
          console.error('Failed to fetch restaurants');
        }
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } 
    };


  


    useEffect(() => {
      if (shops.length > 0 && !shopId) {
        setShopId(shops[0].id); // Set the first shop as the default shopId
      }
      const fetchData = async () => {
        if (dateRange?.from && dateRange.to && shopId) {
          getbargraphData(shopId, dateRange.from, dateRange.to);
          getareagraphData(shopId, dateRange.from, dateRange.to);
          getpiegraphData(shopId, dateRange.from, dateRange.to);
          getCardsData(shopId, dateRange.from, dateRange.to);
          const fetchedData = await getcardsData(shopId, dateRange.from, dateRange.to);
          setData(fetchedData); // Update state with the fetched data
        }
        await fetchRestaurants();
      
      };
      fetchData();
    }, [shops, dateRange, shopId]); // Runs when dateRange or shopId changes
  
    const handleDateRangeChange = (range: DateRange | undefined) => {
      setDateRange(range);
    };










  return (
    <ContentLayout title="Mes performances">
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
            <BreadcrumbPage>Mes performances</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card className="rounded-lg border-none  mt-6">
      <CardContent className="p-6">
      <div className="mt-6">
      <>
      <div className="text-center text-gray-500 py-6">
          
          <div className="flex justify-center">
      <Image
        className={`${theme === "dark" ? "dark:invert" : ""}`}
        src="/images/empty-performances.png"
        alt="Empty folder"
        width={400} // Adjust size as needed
        height={400}
      />

      
    
 
</div>
<p className="text-lg  font-semibold mt-4">Aucune donnée disponible..</p>
<p className="mt-2">Créez votre premier restaurant pour pouvoir visualiser vos performances..</p>  
</div>
    </>




        </div>
      </CardContent>
    </Card>
    </ContentLayout>
  );
}