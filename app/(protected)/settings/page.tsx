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
 const user = useCurrentUser();

  return (
    <div className="     w-[1200px] pt-8 pb-8 px-4 sm:px-8">
    <ScrollArea className="p-4  lg:p-12">
      {/* Page Title */}
   
  

  
      {/* Update Profile Section */}
      <section className="mb-8">
        <Card className="w-full  mx-auto">
          <CardHeader>
            <h3 className="text-lg md:text-xl font-semibold">Profile settings</h3>
          </CardHeader>
          <CardContent>
            <UpdateProfileForm />
          </CardContent>
        </Card>
      </section>
 
      {/* Update Password Section */}
      {user?.isOAuth === false && (
        <section>
          <Card className="w-full  mx-auto">
            <CardHeader>
              <h3 className="text-lg md:text-xl font-semibold">Update Password</h3>
            </CardHeader>
            <CardContent>
              <UpdatePasswordForm />
            </CardContent>
          </Card>
        </section>
      )}
    </ScrollArea>
  </div>
  
  );
}
