import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await request.json()
    const { name, description, size, location, website } = body || {}

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    // Use service role for multi-table writes that are otherwise blocked by RLS
    const admin = createAdminClient()

    const { data: company, error: companyError } = await admin
      .from('companies')
      .insert({
        name,
        description,
        size,
        location,
        website,
        created_by: user.id,
        credits_balance: 0,
      })
      .select()
      .single()

    if (companyError) throw companyError

    const { error: memberError } = await admin
      .from('company_members')
      .insert({ company_id: company.id, user_id: user.id, role: 'owner' })

    if (memberError) throw memberError

    // Elevate user role to employer
    const { error: roleError } = await admin
      .from('users')
      .update({ role: 'employer' })
      .eq('id', user.id)

    if (roleError) throw roleError

    return NextResponse.json({ success: true, company })
  } catch (error: any) {
    console.error('Create company failed:', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}


