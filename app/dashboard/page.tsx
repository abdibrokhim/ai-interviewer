'use client'

import { useUser } from "@/providers/user-provider";
import { UserDetails } from '@/components/dashboard/user-details'
import { TextShimmer } from "@/components/motion-primitives/text-shimmer";
import AuthWidget from "@/components/auth/auth-popover";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProjectsPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect based on user role
    if (user?.role === 'admin') {
      router.push('/admin');
    } else if (user?.role === 'employer') {
      router.push('/employer');
    } else if (user?.role === 'candidate') {
      router.push('/candidate');
    }
  }, [user?.role, router]);

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
