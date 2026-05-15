export type Plan = 'solo' | 'team' | 'org'
export type Role = 'admin' | 'employee'
export type SessionStatus = 'tracking' | 'paused' | 'ended'
export type ScreenshotStatus = 'pending' | 'approved' | 'removed'

export type Organization = {
  id: string
  name: string
  slug: string
  plan: Plan
  created_at: string
}

export type Member = {
  id: string
  org_id: string
  user_id: string
  role: Role
  full_name: string
  email: string
  avatar_color: string
  created_at: string
}

export type TrackingSession = {
  id: string
  org_id: string
  member_id: string
  project: string | null
  status: SessionStatus
  started_at: string
  paused_at: string | null
  ended_at: string | null
  elapsed_seconds: number
  paused_total_seconds: number
  created_at: string
}

export type Invite = {
  id: string
  org_id: string
  email: string
  role: Role
  full_name: string | null
  token: string
  invited_by: string | null
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export type Screenshot = {
  id: string
  org_id: string
  member_id: string
  session_id: string | null
  private_path: string
  submitted_path: string | null
  captured_at: string
  app_name: string | null
  window_title: string | null
  status: ScreenshotStatus
  note: string | null
  reviewed_at: string | null
  submitted_at: string | null
  created_at: string
}

// ── Joined types used in UI ───────────────────────────────────

export type MemberWithStats = Member & {
  active_session: TrackingSession | null
  today: {
    approved: number
    removed: number
    pending: number
    hours: number
  }
}

export type ScreenshotWithMember = Screenshot & {
  member: Pick<Member, 'id' | 'full_name' | 'avatar_color'>
}

// ── Supabase Database type map ────────────────────────────────
// Row types must be `type` (not `interface`) so they satisfy
// Supabase's `Record<string, unknown>` constraint in GenericTable.

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at'>
        Update: Partial<Omit<Organization, 'id' | 'created_at'>>
        Relationships: []
      }
      members: {
        Row: Member
        Insert: Omit<Member, 'id' | 'created_at'>
        Update: Partial<Omit<Member, 'id' | 'created_at'>>
        Relationships: []
      }
      tracking_sessions: {
        Row: TrackingSession
        Insert: Omit<TrackingSession, 'id' | 'created_at'>
        Update: Partial<Omit<TrackingSession, 'id' | 'created_at'>>
        Relationships: []
      }
      screenshots: {
        Row: Screenshot
        Insert: Omit<Screenshot, 'id' | 'created_at'>
        Update: Partial<Omit<Screenshot, 'id' | 'created_at'>>
        Relationships: []
      }
      invites: {
        Row: Invite
        Insert: Omit<Invite, 'id' | 'token' | 'expires_at' | 'accepted_at' | 'created_at'> & {
          token?: string
          expires_at?: string
          accepted_at?: string | null
        }
        Update: Partial<Omit<Invite, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      create_org_for_user: {
        Args: { p_company_name: string; p_full_name?: string | null }
        Returns: Member
      }
      create_invite: {
        Args: { p_email: string; p_role?: string; p_full_name?: string | null }
        Returns: Invite
      }
      revoke_invite: {
        Args: { p_invite_id: string }
        Returns: undefined
      }
      accept_invite: {
        Args: { p_token: string }
        Returns: Member
      }
      preview_invite: {
        Args: { p_token: string }
        Returns: { org_name: string; role: Role; email: string; expires_at: string }[]
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
