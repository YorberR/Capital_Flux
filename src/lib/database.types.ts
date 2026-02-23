export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          default_currency: string;
          preferred_rate_source: string;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          default_currency?: string;
          preferred_rate_source?: string;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          default_currency?: string;
          preferred_rate_source?: string;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          name: string;
          currency: string;
          balance: number;
          icon: string;
          color: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id?: string | null;
          name: string;
          currency: string;
          balance?: number;
          icon?: string;
          color?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string | null;
          name?: string;
          currency?: string;
          balance?: number;
          icon?: string;
          color?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          wallet_id: string;
          category_id: string | null;
          type: string;
          amount: number;
          currency: string;
          original_amount: number | null;
          exchange_rate: number | null;
          rate_source: string | null;
          description: string | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id?: string | null;
          wallet_id: string;
          category_id?: string | null;
          type: string;
          amount: number;
          currency: string;
          original_amount?: number | null;
          exchange_rate?: number | null;
          rate_source?: string | null;
          description?: string | null;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string | null;
          wallet_id?: string;
          category_id?: string | null;
          type?: string;
          amount?: number;
          currency?: string;
          original_amount?: number | null;
          exchange_rate?: number | null;
          rate_source?: string | null;
          description?: string | null;
          date?: string;
          created_at?: string;
        };
      };
      exchange_rates: {
        Row: {
          id: string;
          base_currency: string;
          target_currency: string;
          rate: number;
          source: string;
          fetched_at: string;
        };
        Insert: {
          id?: string;
          base_currency: string;
          target_currency: string;
          rate: number;
          source: string;
          fetched_at?: string;
        };
        Update: {
          id?: string;
          base_currency?: string;
          target_currency?: string;
          rate?: number;
          source?: string;
          fetched_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
