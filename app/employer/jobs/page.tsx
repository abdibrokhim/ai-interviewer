'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Briefcase, 
  Plus, 
  Search, 
  MapPin, 
  DollarSign, 
  Users,
  Clock,
  Edit,
  Eye,
  MoreVertical,
  Pause,
  Play,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Tables } from '@/types/database.types'
import { toast } from 'sonner'

type Job = Tables<'jobs'>
type Application = Tables<'applications'>

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      // Get user's company
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: membership } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .single()

      if (!membership) {
        router.push('/employer')
        return
      }

      // Fetch jobs for the company
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', membership.company_id)
        .order('created_at', { ascending: false })

      if (jobsError) throw jobsError

      setJobs(jobsData || [])

      // Fetch application counts
      const counts: Record<string, number> = {}
      for (const job of jobsData || []) {
        const { count } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', job.id)
        
        counts[job.id] = count || 0
      }
      setApplications(counts)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (jobId: string, newStatus: 'OPEN' | 'PAUSED' | 'CLOSED') => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', jobId)

      if (error) throw error

      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, status: newStatus } : job
      ))
      
      toast.success(`Job ${newStatus.toLowerCase()}`)
    } catch (error) {
      console.error('Error updating job status:', error)
      toast.error('Failed to update job status')
    }
  }

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)

      if (error) throw error

      setJobs(jobs.filter(job => job.id !== jobId))
      toast.success('Job deleted successfully')
    } catch (error) {
      console.error('Error deleting job:', error)
      toast.error('Failed to delete job')
    }
  }

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.tech_stack.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-500'
      case 'PAUSED': return 'bg-yellow-500'
      case 'CLOSED': return 'bg-gray-500'
      default: return 'bg-blue-500'
    }
  }

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
          <p className="mt-4 text-sm text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Job Listings</h1>
          <p className="text-muted-foreground">Manage your company's job postings</p>
        </div>
        <Button asChild>
          <Link href="/employer/jobs/create">
            <Plus className="mr-2 h-4 w-4" />
            Post New Job
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search jobs by title, description, or tech stack..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No jobs found' : 'No jobs posted yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'Try adjusting your search criteria' 
                : 'Start by creating your first job listing'
              }
            </p>
            {!searchQuery && (
              <Button asChild>
                <Link href="/employer/jobs/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Post Your First Job
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(job.status)}`} />
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{job.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {job.description}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/employer/jobs/${job.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/employer/jobs/${job.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/employer/jobs/${job.id}/applications`}>
                          <Users className="mr-2 h-4 w-4" />
                          View Applications
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {job.status === 'OPEN' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'PAUSED')}>
                          <Pause className="mr-2 h-4 w-4" />
                          Pause Job
                        </DropdownMenuItem>
                      )}
                      {job.status === 'PAUSED' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'OPEN')}>
                          <Play className="mr-2 h-4 w-4" />
                          Reopen Job
                        </DropdownMenuItem>
                      )}
                      {job.status !== 'CLOSED' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'CLOSED')}>
                          <Pause className="mr-2 h-4 w-4" />
                          Close Job
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(job.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-1">
                    {job.tech_stack.slice(0, 3).map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {job.tech_stack.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{job.tech_stack.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Job Details */}
                  <div className="space-y-1 text-sm">
                    {job.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{job.location}</span>
                        {getRemoteTypeBadge(job.remote_type)}
                      </div>
                    )}
                    {(job.salary_min || job.salary_max) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        <span>
                          {job.currency} {job.salary_min?.toLocaleString()}
                          {job.salary_max && ` - ${job.salary_max.toLocaleString()}`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {job.experience_min}-{job.experience_max} years
                      </span>
                    </div>
                  </div>

                  {/* Applications Count */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">
                          {applications[job.id] || 0} Applications
                        </span>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(job.status)} text-white`}>
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
