'use client'

import { useUser } from '@/providers/user-provider'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Building2, 
  Briefcase, 
  CreditCard, 
  Activity,
  TrendingUp,
  Settings,
  Shield
} from 'lucide-react'
import Link from 'next/link'

interface Stats {
  totalUsers: number
  totalCompanies: number
  totalJobs: number
  totalInterviews: number
  totalRevenue: number
  activeInterviews: number
}

export default function AdminDashboard() {
  const { user } = useUser()
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalJobs: 0,
    totalInterviews: 0,
    totalRevenue: 0,
    activeInterviews: 0,
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch various statistics
      const [
        { count: usersCount },
        { count: companiesCount },
        { count: jobsCount },
        { count: interviewsCount },
        { data: revenueData },
        { count: activeInterviewsCount }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }),
        supabase.from('interviews').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('amount_cents').eq('status', 'PAID'),
        supabase.from('interviews').select('*', { count: 'exact', head: true }).in('status', ['SCHEDULED', 'IN_PROGRESS']),
      ])

      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.amount_cents / 100), 0) || 0

      setStats({
        totalUsers: usersCount || 0,
        totalCompanies: companiesCount || 0,
        totalJobs: jobsCount || 0,
        totalInterviews: interviewsCount || 0,
        totalRevenue,
        activeInterviews: activeInterviewsCount || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">System overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Candidates & Employers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">Registered companies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Listings</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">All time postings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInterviews}</div>
            <p className="text-xs text-muted-foreground">{stats.activeInterviews} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Lifetime revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Packages</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <Button size="sm" variant="link" className="px-0" asChild>
              <Link href="/admin/billing/packages">Manage Packages</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>Manage candidates and employers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full" variant="secondary">
              <Link href="/admin/users">View All Users</Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/users/candidates">Manage Candidates</Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/users/employers">Manage Employers</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Job Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Job Listings
            </CardTitle>
            <CardDescription>Oversee all job postings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full" variant="secondary">
              <Link href="/admin/jobs">View All Jobs</Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/jobs/flagged">Flagged Content</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Interview Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Interview System
            </CardTitle>
            <CardDescription>Monitor AI interviews and logs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full" variant="secondary">
              <Link href="/admin/interviews">Interview Logs</Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/interviews/templates">Question Templates</Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/interviews/issues">Error Logs</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Financial Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing & Credits
            </CardTitle>
            <CardDescription>Manage payments and credit system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full" variant="secondary">
              <Link href="/admin/billing">View Transactions</Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/billing/packages">Credit Packages</Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/billing/analytics">Revenue Analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Settings */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </CardTitle>
          <CardDescription>Configure platform settings and AI parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <Button asChild variant="outline">
              <Link href="/admin/settings/ai">AI Configuration</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/settings/credits">Credit Rates</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/settings/email">Email Templates</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
