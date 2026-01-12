import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export type Database = {
  public: {
    Tables: {
      requisitions: {
        Row: {
          id: string
          rc: string
          project: string
          category: string | null
          item: string
          freight: boolean
          supplier: string | null
          observations: string | null
          po_sent: string | null
          status: string
          update_date: string
          adt_invoice: string | null
          quotation_deadline: string | null
          omie_inclusion: string | null
          delivery_forecast: string | null
          quotation_inclusion: string | null
          sent_for_approval: string | null
          omie_approval: string | null
          criticality: string
          dismembered_rc: string | null
          invoice_value: number
          invoice_number: string | null
          payment_method: string | null
          due_date_1: string | null
          due_date_2: string | null
          due_date_3: string | null
          quoted_by: string | null
          freight_value: number
          freight_status: string | null
          freight_company: string | null
          quoted_supplier: string | null
          quotation_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rc: string
          project: string
          category?: string | null
          item: string
          freight?: boolean
          supplier?: string | null
          observations?: string | null
          po_sent?: string | null
          status?: string
          update_date?: string
          adt_invoice?: string | null
          quotation_deadline?: string | null
          omie_inclusion?: string | null
          delivery_forecast?: string | null
          quotation_inclusion?: string | null
          sent_for_approval?: string | null
          omie_approval?: string | null
          criticality?: string
          dismembered_rc?: string | null
          invoice_value?: number
          invoice_number?: string | null
          payment_method?: string | null
          due_date_1?: string | null
          due_date_2?: string | null
          due_date_3?: string | null
          quoted_by?: string | null
          freight_value?: number
          freight_status?: string | null
          freight_company?: string | null
          quoted_supplier?: string | null
          quotation_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          rc?: string
          project?: string
          category?: string | null
          item?: string
          freight?: boolean
          supplier?: string | null
          observations?: string | null
          po_sent?: string | null
          status?: string
          update_date?: string
          adt_invoice?: string | null
          quotation_deadline?: string | null
          omie_inclusion?: string | null
          delivery_forecast?: string | null
          quotation_inclusion?: string | null
          sent_for_approval?: string | null
          omie_approval?: string | null
          criticality?: string
          dismembered_rc?: string | null
          invoice_value?: number
          invoice_number?: string | null
          payment_method?: string | null
          due_date_1?: string | null
          due_date_2?: string | null
          due_date_3?: string | null
          quoted_by?: string | null
          freight_value?: number
          freight_status?: string | null
          freight_company?: string | null
          quoted_supplier?: string | null
          quotation_type?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}