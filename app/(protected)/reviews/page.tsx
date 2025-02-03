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
import ReviewTable from "../_components/tables/ReviewTable";
import { ContentLayout } from "../_admin-panel/content-layout";
import Logo from "@/components/Logo";






export default function ReviewsPage() {
  const { theme } = useTheme();
  const dummyReviews: any[] = [
    {
      id: "1",
      client: "Alice",
      review: 4,
      message: "Great food, will definitely order again!",
      state: "MANGEQR",
      shop: {
        id: "shop1",
        name: "La Bella Cucina",
      },
    },
    {
      id: "2",
      client: "Bob",
      review: 5,
      message: "Absolutely fantastic! The service was excellent.",
      state: "GOOGLE",
      shop: {
        id: "shop2",
        name: "Sushi Masters",
      },
    },
    {
      id: "3",
      client: "Charlie",
      review: 3,
      message: "It was okay, but the portion size could be better.",
      state: "MANGEQR",
      shop: {
        id: "shop3",
        name: "Pasta Paradiso",
      },
    },
    {
      id: "4",
      client: "David",
      review: 2,
      message: "Not great, food was cold when it arrived.",
      state: "GOOGLE",
      shop: {
        id: "shop4",
        name: "Taco Heaven",
      },
    },
    {
      id: "5",
      client: "Eve",
      review: 4,
      message: "Delicious pizza, but delivery was a bit slow.",
      state: "MANGEQR",
      shop: {
        id: "shop5",
        name: "Pizza Palace",
      },
    },
    {
      id: "6",
      client: "Frank",
      review: 5,
      message: "Perfect, everything was exactly what I wanted.",
      state: "GOOGLE",
      shop: {
        id: "shop6",
        name: "Burger Joint",
      },
    },
    {
      id: "7",
      client: "Grace",
      review: 4,
      message: "Great flavors, loved the dessert!",
      state: "MANGEQR",
      shop: {
        id: "shop7",
        name: "Sweet Treats Bakery",
      },
    },
    {
      id: "8",
      client: "Hank",
      review: 3,
      message: "It was fine, but the salad was a bit bland.",
      state: "GOOGLE",
      shop: {
        id: "shop8",
        name: "Healthy Eats",
      },
    },
    {
      id: "9",
      client: "Ivy",
      review: 5,
      message: "Highly recommend this place! Amazing experience.",
      state: "MANGEQR",
      shop: {
        id: "shop9",
        name: "Steakhouse Deluxe",
      },
    },
    {
      id: "10",
      client: "Jack",
      review: 2,
      message: "Very disappointed. My order was wrong and cold.",
      state: "GOOGLE",
      shop: {
        id: "shop10",
        name: "Indian Spice",
      },
    },
  ];
  

  return (
    <ContentLayout title="Avis clients">
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
            <BreadcrumbPage>Avis clients</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card className="rounded-lg border-none  mt-6">
      <CardContent className="p-6">
      <div className="mt-6">


      <div className="text-center text-gray-500 py-6">
          
          <div className="flex justify-center">

            <Image
            className={`${theme === "dark" ? "dark:invert" : ""}`}

              src={"/images/empty-reviews.png"}
              alt="Empty folder"
              width={400} // Adjust size as needed
              height={400}
            />
          </div>
          <p className="text-lg  font-semibold mt-4">Aucun avis client disponible...</p>
          <p className="mt-2">Inciter vos serveurs à demander des avis clients pour renforcer la réputation de votre établissement .</p>   
        </div>
    

<ReviewTable reviews={dummyReviews}/>


        </div>
      </CardContent>
    </Card>
    </ContentLayout>
  );
}
