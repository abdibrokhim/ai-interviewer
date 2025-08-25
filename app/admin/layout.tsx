import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserProvider } from '@/providers/user-provider'
import type { UserProfile } from '@/types/user'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Get user profile with role
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Check if user is admin
  if (userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const fullProfile = {
    ...userProfile,
    profile_image: user.user_metadata.avatar_url || userProfile.profile_image || '',
    display_name: user.user_metadata.name || userProfile.display_name || '',
    email: user.email || userProfile.email || '',
    created_at: userProfile.created_at || new Date().toISOString(),
    last_active_at: userProfile.last_active_at || new Date().toISOString(),
  } as UserProfile

  return (
    <UserProvider initialUser={fullProfile}>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </UserProvider>
  )
}
