export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          attachment_id: string
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          attachment_id?: string
          created_at?: string
          entity_id: string
          entity_type: string
          file_name: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          attachment_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action_type: string
          audit_id: string
          changed_at: string
          changed_by: string | null
          entity_id: string | null
          entity_type: string
          new_value: Json | null
          old_value: Json | null
          remarks: string | null
        }
        Insert: {
          action_type: string
          audit_id?: string
          changed_at?: string
          changed_by?: string | null
          entity_id?: string | null
          entity_type: string
          new_value?: Json | null
          old_value?: Json | null
          remarks?: string | null
        }
        Update: {
          action_type?: string
          audit_id?: string
          changed_at?: string
          changed_by?: string | null
          entity_id?: string | null
          entity_type?: string
          new_value?: Json | null
          old_value?: Json | null
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          is_read: boolean
          link: string | null
          notif_type: string
          notification_id: string
          priority: string
          recipient_id: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          is_read?: boolean
          link?: string | null
          notif_type: string
          notification_id?: string
          priority?: string
          recipient_id: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          is_read?: boolean
          link?: string | null
          notif_type?: string
          notification_id?: string
          priority?: string
          recipient_id?: string
          title?: string
        }
        Relationships: []
      }
      areas: {
        Row: {
          active: boolean
          area_code: string
          area_id: string
          area_name: string
          created_at: string
          description: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          area_code: string
          area_id?: string
          area_name: string
          created_at?: string
          description?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          area_code?: string
          area_id?: string
          area_name?: string
          created_at?: string
          description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          active: boolean
          created_at: string
          criticality: Database["public"]["Enums"]["equipment_criticality"]
          equipment_code: string
          equipment_id: string
          equipment_name: string
          equipment_type: string | null
          functional_location: string | null
          installation_date: string | null
          manufacturer: string | null
          model: string | null
          section_id: string
          serial_number: string | null
          status: Database["public"]["Enums"]["equipment_status"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          criticality?: Database["public"]["Enums"]["equipment_criticality"]
          equipment_code: string
          equipment_id?: string
          equipment_name: string
          equipment_type?: string | null
          functional_location?: string | null
          installation_date?: string | null
          manufacturer?: string | null
          model?: string | null
          section_id: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          criticality?: Database["public"]["Enums"]["equipment_criticality"]
          equipment_code?: string
          equipment_id?: string
          equipment_name?: string
          equipment_type?: string | null
          functional_location?: string | null
          installation_date?: string | null
          manufacturer?: string | null
          model?: string | null
          section_id?: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["section_id"]
          },
        ]
      }
      equipment_parts: {
        Row: {
          active: boolean
          created_at: string
          criticality: Database["public"]["Enums"]["equipment_criticality"]
          description: string | null
          equipment_id: string
          equipment_part_id: string
          inspectable: boolean
          part_code: string
          part_group: string | null
          part_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          criticality?: Database["public"]["Enums"]["equipment_criticality"]
          description?: string | null
          equipment_id: string
          equipment_part_id?: string
          inspectable?: boolean
          part_code: string
          part_group?: string | null
          part_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          criticality?: Database["public"]["Enums"]["equipment_criticality"]
          description?: string | null
          equipment_id?: string
          equipment_part_id?: string
          inspectable?: boolean
          part_code?: string
          part_group?: string | null
          part_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_parts_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["equipment_id"]
          },
        ]
      }
      inspection_activities: {
        Row: {
          acceptance_criteria: string | null
          active: boolean
          activity_code: string
          activity_name: string
          created_at: string
          custom_interval_days: number | null
          equipment_part_id: string
          estimated_duration_min: number | null
          failure_criteria: string | null
          frequency_type: Database["public"]["Enums"]["frequency_type"]
          inspection_activity_id: string
          inspection_category: Database["public"]["Enums"]["inspection_category"]
          instructions: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          responsible_role: Database["public"]["Enums"]["app_user_role"]
          standard_checklist: Json
          start_date: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          acceptance_criteria?: string | null
          active?: boolean
          activity_code: string
          activity_name: string
          created_at?: string
          custom_interval_days?: number | null
          equipment_part_id: string
          estimated_duration_min?: number | null
          failure_criteria?: string | null
          frequency_type?: Database["public"]["Enums"]["frequency_type"]
          inspection_activity_id?: string
          inspection_category?: Database["public"]["Enums"]["inspection_category"]
          instructions?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          responsible_role?: Database["public"]["Enums"]["app_user_role"]
          standard_checklist?: Json
          start_date?: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          acceptance_criteria?: string | null
          active?: boolean
          activity_code?: string
          activity_name?: string
          created_at?: string
          custom_interval_days?: number | null
          equipment_part_id?: string
          estimated_duration_min?: number | null
          failure_criteria?: string | null
          frequency_type?: Database["public"]["Enums"]["frequency_type"]
          inspection_activity_id?: string
          inspection_category?: Database["public"]["Enums"]["inspection_category"]
          instructions?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          responsible_role?: Database["public"]["Enums"]["app_user_role"]
          standard_checklist?: Json
          start_date?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_activities_equipment_part_id_fkey"
            columns: ["equipment_part_id"]
            isOneToOne: false
            referencedRelation: "equipment_parts"
            referencedColumns: ["equipment_part_id"]
          },
          {
            foreignKeyName: "inspection_activities_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "inspection_activity_templates"
            referencedColumns: ["template_id"]
          },
        ]
      }
      inspection_activity_templates: {
        Row: {
          acceptance_criteria: string | null
          active: boolean
          activity_code: string
          activity_name: string
          applicable_equipment_type: string | null
          created_at: string
          default_custom_interval_days: number | null
          default_frequency_type: Database["public"]["Enums"]["frequency_type"]
          estimated_duration_min: number | null
          failure_criteria: string | null
          inspection_category: Database["public"]["Enums"]["inspection_category"]
          inspection_method: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          reference_documents: string | null
          required_ppe: string | null
          required_skills: string | null
          required_tools: string | null
          safety_notes: string | null
          standard_checklist: Json
          template_id: string
          updated_at: string
        }
        Insert: {
          acceptance_criteria?: string | null
          active?: boolean
          activity_code: string
          activity_name: string
          applicable_equipment_type?: string | null
          created_at?: string
          default_custom_interval_days?: number | null
          default_frequency_type?: Database["public"]["Enums"]["frequency_type"]
          estimated_duration_min?: number | null
          failure_criteria?: string | null
          inspection_category?: Database["public"]["Enums"]["inspection_category"]
          inspection_method?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          reference_documents?: string | null
          required_ppe?: string | null
          required_skills?: string | null
          required_tools?: string | null
          safety_notes?: string | null
          standard_checklist?: Json
          template_id?: string
          updated_at?: string
        }
        Update: {
          acceptance_criteria?: string | null
          active?: boolean
          activity_code?: string
          activity_name?: string
          applicable_equipment_type?: string | null
          created_at?: string
          default_custom_interval_days?: number | null
          default_frequency_type?: Database["public"]["Enums"]["frequency_type"]
          estimated_duration_min?: number | null
          failure_criteria?: string | null
          inspection_category?: Database["public"]["Enums"]["inspection_category"]
          inspection_method?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          reference_documents?: string | null
          required_ppe?: string | null
          required_skills?: string | null
          required_tools?: string | null
          safety_notes?: string | null
          standard_checklist?: Json
          template_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      inspection_task_checklist_items: {
        Row: {
          created_at: string
          id: string
          inspection_task_id: string
          label: string
          measured_value: number | null
          notes: string | null
          result: Database["public"]["Enums"]["checklist_result"] | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_task_id: string
          label: string
          measured_value?: number | null
          notes?: string | null
          result?: Database["public"]["Enums"]["checklist_result"] | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inspection_task_id?: string
          label?: string
          measured_value?: number | null
          notes?: string | null
          result?: Database["public"]["Enums"]["checklist_result"] | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_task_checklist_items_inspection_task_id_fkey"
            columns: ["inspection_task_id"]
            isOneToOne: false
            referencedRelation: "inspection_tasks"
            referencedColumns: ["inspection_task_id"]
          },
        ]
      }
      inspection_tasks: {
        Row: {
          assigned_user_id: string | null
          completed_by: string | null
          completion_date: string | null
          condition_rating: Database["public"]["Enums"]["equipment_condition"] | null
          created_at: string
          due_date: string
          equipment_id: string
          equipment_part_id: string
          inspection_activity_id: string
          inspection_task_id: string
          notes: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          recurrence_cycle: number
          scheduled_date: string
          source_type: string
          started_at: string | null
          started_by: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_code: string
          updated_at: string
        }
        Insert: {
          assigned_user_id?: string | null
          completed_by?: string | null
          completion_date?: string | null
          condition_rating?: Database["public"]["Enums"]["equipment_condition"] | null
          created_at?: string
          due_date: string
          equipment_id: string
          equipment_part_id: string
          inspection_activity_id: string
          inspection_task_id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          recurrence_cycle: number
          scheduled_date: string
          source_type?: string
          started_at?: string | null
          started_by?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_code: string
          updated_at?: string
        }
        Update: {
          assigned_user_id?: string | null
          completed_by?: string | null
          completion_date?: string | null
          condition_rating?: Database["public"]["Enums"]["equipment_condition"] | null
          created_at?: string
          due_date?: string
          equipment_id?: string
          equipment_part_id?: string
          inspection_activity_id?: string
          inspection_task_id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          recurrence_cycle?: number
          scheduled_date?: string
          source_type?: string
          started_at?: string | null
          started_by?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_tasks_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_tasks_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "inspection_tasks_equipment_part_id_fkey"
            columns: ["equipment_part_id"]
            isOneToOne: false
            referencedRelation: "equipment_parts"
            referencedColumns: ["equipment_part_id"]
          },
          {
            foreignKeyName: "inspection_tasks_inspection_activity_id_fkey"
            columns: ["inspection_activity_id"]
            isOneToOne: false
            referencedRelation: "inspection_activities"
            referencedColumns: ["inspection_activity_id"]
          },
        ]
      }
      inspection_findings: {
        Row: {
          created_at: string
          created_by: string | null
          equipment_id: string
          equipment_part_id: string
          finding_code: string
          finding_description: string | null
          finding_id: string
          finding_title: string
          finding_type: Database["public"]["Enums"]["finding_type"]
          inspection_task_id: string
          recommended_action: string | null
          root_cause_note: string | null
          severity: Database["public"]["Enums"]["priority_level"]
          status: Database["public"]["Enums"]["finding_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          equipment_id: string
          equipment_part_id: string
          finding_code?: string
          finding_description?: string | null
          finding_id?: string
          finding_title: string
          finding_type?: Database["public"]["Enums"]["finding_type"]
          inspection_task_id: string
          recommended_action?: string | null
          root_cause_note?: string | null
          severity?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["finding_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          equipment_id?: string
          equipment_part_id?: string
          finding_code?: string
          finding_description?: string | null
          finding_id?: string
          finding_title?: string
          finding_type?: Database["public"]["Enums"]["finding_type"]
          inspection_task_id?: string
          recommended_action?: string | null
          root_cause_note?: string | null
          severity?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["finding_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_findings_inspection_task_id_fkey"
            columns: ["inspection_task_id"]
            isOneToOne: false
            referencedRelation: "inspection_tasks"
            referencedColumns: ["inspection_task_id"]
          },
          {
            foreignKeyName: "inspection_findings_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "inspection_findings_equipment_part_id_fkey"
            columns: ["equipment_part_id"]
            isOneToOne: false
            referencedRelation: "equipment_parts"
            referencedColumns: ["equipment_part_id"]
          },
          {
            foreignKeyName: "inspection_findings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_actions: {
        Row: {
          action_code: string
          action_description: string | null
          action_id: string
          action_title: string
          action_type: Database["public"]["Enums"]["action_type"]
          completion_date: string | null
          completion_note: string | null
          created_at: string
          created_by: string | null
          finding_id: string
          priority: Database["public"]["Enums"]["priority_level"]
          responsible_department: string | null
          responsible_person: string | null
          status: Database["public"]["Enums"]["action_status"]
          target_date: string | null
          updated_at: string
          verification_required: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          action_code?: string
          action_description?: string | null
          action_id?: string
          action_title: string
          action_type?: Database["public"]["Enums"]["action_type"]
          completion_date?: string | null
          completion_note?: string | null
          created_at?: string
          created_by?: string | null
          finding_id: string
          priority?: Database["public"]["Enums"]["priority_level"]
          responsible_department?: string | null
          responsible_person?: string | null
          status?: Database["public"]["Enums"]["action_status"]
          target_date?: string | null
          updated_at?: string
          verification_required?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          action_code?: string
          action_description?: string | null
          action_id?: string
          action_title?: string
          action_type?: Database["public"]["Enums"]["action_type"]
          completion_date?: string | null
          completion_note?: string | null
          created_at?: string
          created_by?: string | null
          finding_id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          responsible_department?: string | null
          responsible_person?: string | null
          status?: Database["public"]["Enums"]["action_status"]
          target_date?: string | null
          updated_at?: string
          verification_required?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_actions_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "inspection_findings"
            referencedColumns: ["finding_id"]
          },
          {
            foreignKeyName: "maintenance_actions_responsible_person_fkey"
            columns: ["responsible_person"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_actions_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_actions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: { label_ar: string; permission_key: string; sort_order: number }
        Insert: { label_ar: string; permission_key: string; sort_order?: number }
        Update: { label_ar?: string; permission_key?: string; sort_order?: number }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission_key: string
          role: Database["public"]["Enums"]["app_user_role"]
        }
        Insert: {
          permission_key: string
          role: Database["public"]["Enums"]["app_user_role"]
        }
        Update: {
          permission_key?: string
          role?: Database["public"]["Enums"]["app_user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["permission_key"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_user_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["app_user_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          active: boolean
          area_id: string
          created_at: string
          description: string | null
          section_code: string
          section_id: string
          section_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          area_id: string
          created_at?: string
          description?: string | null
          section_code: string
          section_id?: string
          section_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          area_id?: string
          created_at?: string
          description?: string | null
          section_code?: string
          section_id?: string
          section_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["area_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_execute_task: {
        Args: { p_task_id: string }
        Returns: boolean
      }
      complete_inspection_task: {
        Args: {
          p_task_id: string
          p_condition: Database["public"]["Enums"]["equipment_condition"]
          p_notes?: string | null
        }
        Returns: undefined
      }
      frequency_interval_days: {
        Args: {
          custom: number
          f: Database["public"]["Enums"]["frequency_type"]
        }
        Returns: number
      }
      generate_inspection_tasks: {
        Args: { p_horizon_days?: number }
        Returns: number
      }
      get_dashboard_data: { Args: never; Returns: Json }
      get_report_recipients: {
        Args: never
        Returns: {
          id: string
          full_name: string
          role: Database["public"]["Enums"]["app_user_role"]
          email: string
        }[]
      }
      has_maintenance_write: { Args: never; Returns: boolean }
      has_master_data_write: { Args: never; Returns: boolean }
      has_permission: { Args: { p_key: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      my_permissions: { Args: never; Returns: string[] }
      refresh_task_statuses: { Args: never; Returns: undefined }
      run_escalations: { Args: never; Returns: number }
      start_inspection_task: {
        Args: { p_task_id: string }
        Returns: undefined
      }
    }
    Enums: {
      action_status:
        | "Open"
        | "Planned"
        | "In Progress"
        | "Waiting Shutdown"
        | "Completed"
        | "Verified"
        | "Cancelled"
      action_type:
        | "Corrective"
        | "Preventive"
        | "Replacement"
        | "Repair"
        | "Cleaning"
        | "Adjustment"
        | "Investigation"
      app_user_role:
        | "Super Admin"
        | "Inspection Manager"
        | "Inspection Engineer"
        | "Inspector"
        | "Maintenance Manager"
        | "Mechanical Engineer"
        | "Electrical Engineer"
        | "Reliability Engineer"
        | "Production Manager"
        | "Plant Manager"
        | "Viewer"
        | "Pending"
        | "Inspection Section Head"
        | "Preparation Manager"
        | "Preparation Section Head"
        | "Preparation Engineer"
        | "Maintenance Section Head"
        | "Maintenance Engineer"
      checklist_result:
        | "OK"
        | "Attention"
        | "Not OK"
        | "Not Accessible"
        | "Not Applicable"
      equipment_condition: "Excellent" | "Good" | "Fair" | "Poor" | "Critical"
      equipment_criticality: "Low" | "Medium" | "High" | "Critical"
      equipment_status: "Operational" | "Warning" | "Critical" | "Offline"
      finding_status:
        | "Open"
        | "Monitoring"
        | "Escalated"
        | "Action Created"
        | "Closed"
      finding_type:
        | "Mechanical"
        | "Electrical"
        | "Process"
        | "Lubrication"
        | "Vibration"
        | "Structural"
        | "Instrumentation"
        | "Safety"
        | "Environmental"
      frequency_type:
        | "Daily"
        | "Weekly"
        | "Monthly"
        | "Quarterly"
        | "Semi-Annual"
        | "Annual"
        | "Custom"
      inspection_category:
        | "Visual"
        | "Vibration"
        | "Temperature"
        | "Lubrication"
        | "Alignment"
        | "Wear"
        | "Leakage"
        | "Electrical"
        | "Instrumentation"
        | "Housekeeping"
        | "Environmental"
      priority_level: "Low" | "Medium" | "High" | "Critical"
      task_status:
        | "Scheduled"
        | "Upcoming"
        | "In Progress"
        | "Completed"
        | "Overdue"
        | "Delayed"
        | "Cancelled"
        | "Skipped"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      action_status: [
        "Open",
        "Planned",
        "In Progress",
        "Waiting Shutdown",
        "Completed",
        "Verified",
        "Cancelled",
      ],
      action_type: [
        "Corrective",
        "Preventive",
        "Replacement",
        "Repair",
        "Cleaning",
        "Adjustment",
        "Investigation",
      ],
      app_user_role: [
        "Super Admin",
        "Inspection Manager",
        "Inspection Engineer",
        "Inspector",
        "Maintenance Manager",
        "Mechanical Engineer",
        "Electrical Engineer",
        "Reliability Engineer",
        "Production Manager",
        "Plant Manager",
        "Viewer",
        "Pending",
        "Inspection Section Head",
        "Preparation Manager",
        "Preparation Section Head",
        "Preparation Engineer",
        "Maintenance Section Head",
        "Maintenance Engineer",
      ],
      checklist_result: [
        "OK",
        "Attention",
        "Not OK",
        "Not Accessible",
        "Not Applicable",
      ],
      equipment_condition: ["Excellent", "Good", "Fair", "Poor", "Critical"],
      equipment_criticality: ["Low", "Medium", "High", "Critical"],
      equipment_status: ["Operational", "Warning", "Critical", "Offline"],
      finding_status: [
        "Open",
        "Monitoring",
        "Escalated",
        "Action Created",
        "Closed",
      ],
      finding_type: [
        "Mechanical",
        "Electrical",
        "Process",
        "Lubrication",
        "Vibration",
        "Structural",
        "Instrumentation",
        "Safety",
        "Environmental",
      ],
      frequency_type: [
        "Daily",
        "Weekly",
        "Monthly",
        "Quarterly",
        "Semi-Annual",
        "Annual",
        "Custom",
      ],
      inspection_category: [
        "Visual",
        "Vibration",
        "Temperature",
        "Lubrication",
        "Alignment",
        "Wear",
        "Leakage",
        "Electrical",
        "Instrumentation",
        "Housekeeping",
        "Environmental",
      ],
      priority_level: ["Low", "Medium", "High", "Critical"],
      task_status: [
        "Scheduled",
        "Upcoming",
        "In Progress",
        "Completed",
        "Overdue",
        "Delayed",
        "Cancelled",
        "Skipped",
      ],
    },
  },
} as const
