'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Briefcase, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Database } from '@/types/database.types'

type RemoteType = Database['public']['Enums']['remote_type']

const currencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
]

export default function CreateJobPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [techInput, setTechInput] = useState('')
  const [publishNow, setPublishNow] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tech_stack: [] as string[],
    experience_min: 0,
    experience_max: 5,
    salary_min: null as number | null,
    salary_max: null as number | null,
    currency: 'USD',
    location: '',
    remote_type: 'ONSITE' as RemoteType,
  })

  const handleAddTech = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && techInput.trim()) {
      e.preventDefault()
      if (!formData.tech_stack.includes(techInput.trim())) {
        setFormData({
          ...formData,
          tech_stack: [...formData.tech_stack, techInput.trim()]
        })
      }
      setTechInput('')
    }
  }

  const handleRemoveTech = (tech: string) => {
    setFormData({
      ...formData,
      tech_stack: formData.tech_stack.filter(t => t !== tech)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)

    try {
      // Create job via secure API
      const res = await fetch('/api/employer/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          status: publishNow ? 'OPEN' : 'DRAFT',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create job')

      toast.success('Job created successfully!')
      router.push('/employer/jobs')
    } catch (error: any) {
      console.error('Error creating job:', error)
      toast.error(error.message || 'Failed to create job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        asChild
        className="mb-6"
      >
        <Link href="/employer/jobs">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Post a New Job
          </CardTitle>
          <CardDescription>
            Create a job listing to attract the best candidates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Senior Full Stack Developer"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the role, responsibilities, and what you're looking for..."
                rows={6}
                required
              />
            </div>

            {/* Tech Stack */}
            <div className="space-y-2">
              <Label htmlFor="tech">Required Skills / Tech Stack</Label>
              <div className="space-y-3">
                <Input
                  id="tech"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={handleAddTech}
                  placeholder="Type a skill and press Enter (e.g., React, Node.js, Python)"
                />
                <div className="flex flex-wrap gap-2">
                  {formData.tech_stack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="pl-3 pr-1">
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(tech)}
                        className="ml-2 hover:bg-secondary rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Experience Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exp-min">Minimum Experience (years) *</Label>
                <Input
                  id="exp-min"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experience_min}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    experience_min: parseInt(e.target.value) || 0 
                  })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-max">Maximum Experience (years) *</Label>
                <Input
                  id="exp-max"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experience_max}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    experience_max: parseInt(e.target.value) || 0 
                  })}
                  required
                />
              </div>
            </div>

            {/* Salary Range */}
            <div className="space-y-4">
              <Label>Salary Range (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary-min" className="text-sm">Minimum</Label>
                  <Input
                    id="salary-min"
                    type="number"
                    min="0"
                    value={formData.salary_min || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      salary_min: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    placeholder="50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary-max" className="text-sm">Maximum</Label>
                  <Input
                    id="salary-max"
                    type="number"
                    min="0"
                    value={formData.salary_max || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      salary_max: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    placeholder="100000"
                  />
                </div>
              </div>
            </div>

            {/* Location & Remote */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remote">Work Type *</Label>
                <Select
                  value={formData.remote_type}
                  onValueChange={(value: RemoteType) => setFormData({ ...formData, remote_type: value })}
                >
                  <SelectTrigger id="remote">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONSITE">On-site</SelectItem>
                    <SelectItem value="REMOTE">Remote</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Publish Options */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="publish" className="text-base font-medium">
                  Publish immediately
                </Label>
                <p className="text-sm text-muted-foreground">
                  Make this job visible to candidates right away
                </p>
              </div>
              <Switch
                id="publish"
                checked={publishNow}
                onCheckedChange={setPublishNow}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading || !formData.title || !formData.description}
                className="flex-1"
              >
                {loading ? 'Creating...' : publishNow ? 'Publish Job' : 'Save as Draft'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/employer/jobs')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
