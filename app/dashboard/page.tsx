'use client'

import { useUser } from "@/providers/user-provider";
import { UserDetails } from '@/components/dashboard/user-details'
import { TextShimmer } from "@/components/motion-primitives/text-shimmer";
import AuthWidget from "@/components/auth/auth-popover";

export default function ProjectsPage() {
  const { user } = useUser();
  console.log('user: ', user);

  if (!user) {
    return <AuthWidget isOpen={true} setIsOpen={() => {}} user={null} />
  }

  return (
    <div 
      className="flex items-center justify-center h-screen w-screen"
    >
      <div className="text-center">
        {user ? <UserDetails /> : <TextShimmer className='text-xs'>Setting up your account...</TextShimmer>}
      </div>
    </div>
  )
}
