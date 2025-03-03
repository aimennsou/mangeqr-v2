'use client'
import { UserCog } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area"

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import UpdateProfileForm from '@/components/auth/update-profile-form';
import UpdatePasswordForm from '@/components/auth/update-password-form';
import { UserInfo } from '@/components/user-info';
import { Server } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import BillingSettings from '@/components/billing/billing-settings';
import { DeleteAccountSection } from '@/components/settings/delete-account';

export default function SettingsPage() {

  return (



    
    <ContentLayout title="Mon compte">
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
          <BreadcrumbPage>Mon compte</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
    <Card className="rounded-lg border-none  mt-6">
    <CardContent className="p-6">
    <div className="mt-6">


 
    <div className="  flex flex-row  ">

      {/* Page Title */}
   
  

  
      {/* Update Profile Section */}
      <section className="mb-8 mx-auto">
        <Card className="w-full  ">
          <CardHeader>
            <h3 className="text-lg md:text-xl font-semibold">Profile settings</h3>
          </CardHeader>
          <CardContent>
            <UpdateProfileForm />
          </CardContent>
        </Card>
      </section>
 
      {/* Update Password Section */}
 
        <section className=" mx-auto">
          <Card >
            <CardHeader>
              <h3 className="text-lg md:text-xl font-semibold">Update Password</h3>
            </CardHeader>
            <CardContent>
              <UpdatePasswordForm />
            </CardContent>
          </Card>
        </section>
    

  </div>


      </div>
    </CardContent>
  </Card>
  </ContentLayout>



  
  );
}




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
import { ContentLayout } from "../_admin-panel/content-layout";
import Logo from "@/components/Logo";



