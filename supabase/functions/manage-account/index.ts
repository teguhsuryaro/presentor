import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !caller) {
      throw new Error('Unauthorized')
    }

    // Check if caller is super_admin
    const { data: callerData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('auth_user_id', caller.id)
      .single()

    if (callerData?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden. Only Super Admin can perform this action.' }), { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Process request
    const payload = await req.json()
    const { action, ...params } = payload

    switch (action) {
      case 'create_account': {
        // 1. Create in Supabase Auth
        const { data: authUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
          email: `${params.username}@internal.presensi.local`,
          password: params.password,
          email_confirm: true,
        })
        
        if (createAuthError) throw createAuthError

        // 2. Insert into users table
        const { data: newUser, error: dbError } = await supabaseAdmin
          .from('users')
          .insert({
            username: params.username,
            password_hash: 'managed_by_supabase_auth',
            auth_user_id: authUser.user.id,
            full_name: params.full_name,
            role: 'panitia',
            is_active: true
          })
          .select()
          .single()
          
        if (dbError) throw dbError

        return new Response(JSON.stringify(newUser), { 
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'reset_password': {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(params.auth_user_id, {
          password: params.new_password,
        })
        if (error) throw error
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'deactivate': {
        // Soft delete/deactivate in users table
        const { error: dbError } = await supabaseAdmin
          .from('users')
          .update({ is_active: false })
          .eq('id', params.user_id)
          
        if (dbError) throw dbError

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      case 'update_account': {
        const { error: dbError } = await supabaseAdmin
          .from('users')
          .update({
            full_name: params.full_name,
            is_active: params.is_active
          })
          .eq('id', params.user_id)
          
        if (dbError) throw dbError
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
