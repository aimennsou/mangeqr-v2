
import { Safari } from '@/components/safari'

import React from 'react'
import HolyLoader from "holy-loader";
type Props = {
  children: React.ReactNode
}

const AuthLayout = async ({ children }: Props) => {


  return (
    <div className="h-screen flex w-full justify-center">

<div className="w-[800px] ld:w-full flex flex-col items-center  my-auto p-6">
<HolyLoader />
        {children}
      </div>
      <div className="hidden lg:flex flex-1 w-full max-h-full overflow-hidden  relative bg-gradient_indigo-purple  justify-center flex-col pt-10 pl-24 gap-3">
      <div className="m-auto max-h-[400px]">



</div>



 
     


      </div>
    </div>
  )
}

export default AuthLayout
