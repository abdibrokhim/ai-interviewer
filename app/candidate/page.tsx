'use client'

import { useUser } from '@/providers/user-provider'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Briefcase, Calendar, Search, MapPin, DollarSign, Building2 } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import type { Tables } from '@/types/database.types'

type Job = Tables<'jobs'> & {
  companies: {
    name: string
    location: string | null
  }
}
type Application = Tables<'applications'>
type Interview = Tables<'interviews'>

export default function CandidateDashboard() {
  const { user } = useUser()
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (user?.id) {
      fetchData()
    }
  }, [user?.id])

  const fetchData = async () => {
    try {
      // Fetch open jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*, companies(name, location)')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })

      if (jobsError) throw jobsError

      // Fetch user's applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('*')
        .eq('candidate_id', user!.id)

      if (applicationsError) throw applicationsError

      // Fetch user's interviews
      const { data: interviewsData, error: interviewsError } = await supabase
        .from('interviews')
        .select('*')
        .eq('candidate_id', user!.id)
        .in('status', ['SCHEDULED', 'IN_PROGRESS'])
        .order('scheduled_at', { ascending: true })

      if (interviewsError) throw interviewsError

      setJobs(jobsData || [])
      setApplications(applicationsData || [])
      setInterviews(interviewsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    const query = searchQuery.toLowerCase()
    return (
      job.title.toLowerCase().includes(query) ||
      job.description?.toLowerCase().includes(query) ||
      job.tech_stack.some(tech => tech.toLowerCase().includes(query)) ||
      job.companies.name.toLowerCase().includes(query)
    )
  })

  const appliedJobIds = applications.map(app => app.job_id)

  const getRemoteTypeBadge = (type: string | null) => {
    if (!type) return null
    const colors = {
      REMOTE: 'bg-blue-100 text-blue-800',
      HYBRID: 'bg-purple-100 text-purple-800',
      ONSITE: 'bg-gray-100 text-gray-800'
    }
    return <Badge className={colors[type as keyof typeof colors]}>{type}</Badge>
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Candidate Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.display_name}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
            <p className="text-xs text-muted-foreground">Active applications</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviews.length}</div>
            <p className="text-xs text-muted-foreground">Upcoming interviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
            <p className="text-xs text-muted-foreground">Open positions</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Interviews */}
      {interviews.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upcoming Interviews</CardTitle>
            <CardDescription>Your scheduled AI interviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interviews.map((interview) => (
                <div key={interview.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{interview.candidate_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {interview.scheduled_at && new Date(interview.scheduled_at).toLocaleString()}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {interview.interview_type}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" asChild>
                      <Link href={`/candidate/interviews/${interview.id}`}>View Details</Link>
                    </Button>
                    {interview.reschedule_allowed_count > 0 && (
                      <Button size="sm" variant="outline">Reschedule</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Search */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Browse Jobs</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search jobs by title, skills, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Building2 className="h-3 w-3" />
                    {job.companies.name}
                  </CardDescription>
                </div>
                {appliedJobIds.includes(job.id) && (
                  <Badge variant="secondary">Applied</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {job.description}
              </p>
              
              <div className="space-y-2 mb-4">
                {job.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{job.location}</span>
                    {getRemoteTypeBadge(job.remote_type)}
                  </div>
                )}
                {(job.salary_min || job.salary_max) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    <span>
                      {job.currency} {job.salary_min?.toLocaleString()}
                      {job.salary_max && ` - ${job.salary_max.toLocaleString()}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {job.tech_stack.slice(0, 3).map((tech) => (
                  <Badge key={tech} variant="outline" className="text-xs">
                    {tech}
                  </Badge>
                ))}
                {job.tech_stack.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{job.tech_stack.length - 3}
                  </Badge>
                )}
              </div>

              <Button 
                className="w-full" 
                disabled={appliedJobIds.includes(job.id)}
                asChild={!appliedJobIds.includes(job.id)}
              >
                {appliedJobIds.includes(job.id) ? (
                  'Already Applied'
                ) : (
                  <Link href={`/candidate/jobs/${job.id}/apply`}>
                    Apply Now
                  </Link>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search criteria' : 'Check back later for new opportunities'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
