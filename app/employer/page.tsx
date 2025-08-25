'use client'

import { useUser } from '@/providers/user-provider'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Briefcase, CreditCard, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Tables } from '@/types/database.types'

type Company = Tables<'companies'>
type CompanyMember = Tables<'company_members'>

export default function EmployerDashboard() {
  const { user } = useUser()
  const [company, setCompany] = useState<Company | null>(null)
  const [membership, setMembership] = useState<CompanyMember | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (user?.id) {
      fetchCompanyMembership()
    }
  }, [user?.id])

  const fetchCompanyMembership = async () => {
    try {
      // Check if user is part of any company
      const { data: membershipData, error: membershipError } = await supabase
        .from('company_members')
        .select('*, companies(*)')
        .eq('user_id', user!.id)
        .single()

      if (membershipError || !membershipData) {
        // User is not part of any company
        setLoading(false)
        return
      }

      setMembership(membershipData)
      setCompany(membershipData.companies as Company)
    } catch (error) {
      console.error('Error fetching company:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Welcome to Jobstry for Employers</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Create your company profile to start posting jobs and conducting AI-powered interviews.
          </p>
          <Button onClick={() => router.push('/employer/company/create')} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Create Company Profile
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Employer Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.display_name}</p>
      </div>

      {/* Company Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {company.name}
          </CardTitle>
          <CardDescription>{company.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Location</p>
              <p className="font-medium">{company.location || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Size</p>
              <p className="font-medium">{company.size || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Credits Balance</p>
              <p className="font-medium">{company.credits_balance} credits</p>
            </div>
            <div>
              <p className="text-muted-foreground">Your Role</p>
              <p className="font-medium capitalize">{membership?.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Jobs
            </CardTitle>
            <CardDescription>Manage your job listings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/employer/jobs">View Jobs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Candidates
            </CardTitle>
            <CardDescription>Search and manage candidates</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/employer/candidates">Browse Candidates</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Interviews
            </CardTitle>
            <CardDescription>Schedule and manage interviews</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/employer/interviews">View Interviews</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing
            </CardTitle>
            <CardDescription>Credits and billing management</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant={company.credits_balance < 10 ? "destructive" : "default"}>
              <Link href="/employer/billing">
                {company.credits_balance < 10 ? 'Buy Credits' : 'Manage Billing'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Company Settings for owners/admins */}
      {(membership?.role === 'owner' || membership?.role === 'admin') && (
        <Card>
          <CardHeader>
            <CardTitle>Company Settings</CardTitle>
            <CardDescription>Manage your company profile and team</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button asChild variant="outline">
              <Link href="/employer/company/edit">Edit Company</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/employer/company/members">Manage Team</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
