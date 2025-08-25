import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await request.json()
    const {
      title,
      description,
      tech_stack,
      experience_min,
      experience_max,
      salary_min,
      salary_max,
      currency,
      location,
      remote_type,
      status = 'OPEN',
    } = body || {}

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    const { data: membership, error: mErr } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .single()

    if (mErr || !membership) {
      return NextResponse.json({ error: 'No company membership found' }, { status: 400 })
    }

    // Use admin client to avoid RLS conflicts on write
    const admin = createAdminClient()
    const { data: job, error: jobError } = await admin
      .from('jobs')
      .insert({
        company_id: membership.company_id,
        title,
        description,
        tech_stack,
        experience_min,
        experience_max,
        salary_min,
        salary_max,
        currency,
        location,
        remote_type,
        status,
      })
      .select()
      .single()

    if (jobError) throw jobError

    return NextResponse.json({ success: true, job })
  } catch (error: any) {
    console.error('Create job failed:', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}


