import { supabase } from '../lib/supabase'
import type { User } from '../types'
import { logAction } from './auditLog.service'

export async function getAccounts(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('role', { ascending: false }) // super_admin first
    .order('full_name', { ascending: true })

  if (error) throw error

  return data as User[]
}

export async function createAccount(data: any, adminId: string): Promise<User> {
  const { data: result, error } = await supabase.functions.invoke('manage-account', {
    body: {
      action: 'create_account',
      username: data.username,
      password: data.password,
      full_name: data.full_name,
    },
  })
  
  if (error) throw new Error(error.message || 'Failed to create account')
  if (result?.error) throw new Error(result.error)

  await logAction('account_create', adminId, null, { username: data.username })
  return result
}

export async function updateAccount(userId: string, data: any, adminId: string): Promise<void> {
  const { data: result, error } = await supabase.functions.invoke('manage-account', {
    body: {
      action: 'update_account',
      user_id: userId,
      full_name: data.full_name,
      is_active: data.is_active
    },
  })
  
  if (error) throw new Error(error.message || 'Failed to update account')
  if (result?.error) throw new Error(result.error)

  await logAction('account_edit', adminId, null, { target_user_id: userId, full_name: data.full_name, is_active: data.is_active })
}

export async function resetPassword(userId: string, authUserId: string, newPassword: string, adminId: string): Promise<void> {
  const { data: result, error } = await supabase.functions.invoke('manage-account', {
    body: {
      action: 'reset_password',
      auth_user_id: authUserId,
      new_password: newPassword,
    },
  })
  
  if (error) throw new Error(error.message || 'Failed to reset password')
  if (result?.error) throw new Error(result.error)

  await logAction('password_change', adminId, null, { target_user_id: userId })
}

export async function deactivateAccount(userId: string, authUserId: string, username: string, adminId: string): Promise<void> {
  const { data: result, error } = await supabase.functions.invoke('manage-account', {
    body: {
      action: 'deactivate',
      user_id: userId,
      auth_user_id: authUserId
    },
  })
  
  if (error) throw new Error(error.message || 'Failed to deactivate account')
  if (result?.error) throw new Error(result.error)

  await logAction('account_delete', adminId, null, { target_user_id: userId, target_username: username })
}

export async function forceLogout(userId: string, username: string, adminId: string): Promise<void> {
  const { error } = await supabase
    .from('active_sessions')
    .update({ expired_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('expired_at', null)

  if (error) throw error

  await logAction('account_edit', adminId, null, { target_user_id: userId, target_username: username, note: 'force_logout' })
}
