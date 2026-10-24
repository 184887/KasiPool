export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      audit_events: {
        Row: {
          action: string;
          actor: string | null;
          created_at: string;
          details: Json | null;
          entity: string;
          entity_id: string | null;
          id: string;
        };
        Insert: {
          action: string;
          actor?: string | null;
          created_at?: string;
          details?: Json | null;
          entity: string;
          entity_id?: string | null;
          id?: string;
        };
        Update: {
          action?: string;
          actor?: string | null;
          created_at?: string;
          details?: Json | null;
          entity?: string;
          entity_id?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      businesses: {
        Row: {
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          category: string | null;
          city: string;
          created_at: string;
          email: string | null;
          id: string;
          is_demo: boolean;
          marketing_opt_in: boolean;
          mobile: string;
          notify_in_app: boolean;
          province: string;
          rep_name: string;
          terms_accepted_at: string;
          terms_version: string;
          township: string;
          trading_name: string;
          user_id: string;
        };
        Insert: {
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          category?: string | null;
          city: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_demo?: boolean;
          marketing_opt_in?: boolean;
          mobile: string;
          notify_in_app?: boolean;
          province: string;
          rep_name: string;
          terms_accepted_at?: string;
          terms_version?: string;
          township: string;
          trading_name: string;
          user_id: string;
        };
        Update: {
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          category?: string | null;
          city?: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_demo?: boolean;
          marketing_opt_in?: boolean;
          mobile?: string;
          notify_in_app?: boolean;
          province?: string;
          rep_name?: string;
          terms_accepted_at?: string;
          terms_version?: string;
          township?: string;
          trading_name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_demo: boolean;
          name: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_demo?: boolean;
          name: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_demo?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          sort: number;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          sort?: number;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          sort?: number;
        };
        Relationships: [];
      };
      collection_points: {
        Row: {
          active: boolean;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          area: string;
          created_at: string;
          fee_note: string | null;
          id: string;
          instructions: string | null;
          name: string;
        };
        Insert: {
          active?: boolean;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          area: string;
          created_at?: string;
          fee_note?: string | null;
          id?: string;
          instructions?: string | null;
          name: string;
        };
        Update: {
          active?: boolean;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          area?: string;
          created_at?: string;
          fee_note?: string | null;
          id?: string;
          instructions?: string | null;
          name?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          link: string | null;
          read_at: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          read_at?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          link?: string | null;
          read_at?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          allocated_qty: number;
          amount_paid: number;
          business_id: string;
          collected_at: string | null;
          collected_by: string | null;
          collection_code: string | null;
          confirmed_at: string | null;
          created_at: string;
          declined_at: string | null;
          failure_reason: string | null;
          fulfilment_status: string;
          id: string;
          is_demo: boolean;
          paid_at: string | null;
          participation_id: string | null;
          payment_reference: string | null;
          payment_status: string;
          pool_id: string;
          quantity: number;
          ready_at: string | null;
          ref: string | null;
          status: string;
          terms_version: string | null;
          total: number;
          unit_price: number;
          user_id: string;
        };
        Insert: {
          allocated_qty?: number;
          amount_paid?: number;
          business_id: string;
          collected_at?: string | null;
          collected_by?: string | null;
          collection_code?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          declined_at?: string | null;
          failure_reason?: string | null;
          fulfilment_status?: string;
          id?: string;
          is_demo?: boolean;
          paid_at?: string | null;
          participation_id?: string | null;
          payment_reference?: string | null;
          payment_status?: string;
          pool_id: string;
          quantity: number;
          ready_at?: string | null;
          ref?: string | null;
          status?: string;
          terms_version?: string | null;
          total: number;
          unit_price: number;
          user_id: string;
        };
        Update: {
          allocated_qty?: number;
          amount_paid?: number;
          business_id?: string;
          collected_at?: string | null;
          collected_by?: string | null;
          collection_code?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          declined_at?: string | null;
          failure_reason?: string | null;
          fulfilment_status?: string;
          id?: string;
          is_demo?: boolean;
          paid_at?: string | null;
          participation_id?: string | null;
          payment_reference?: string | null;
          payment_status?: string;
          pool_id?: string;
          quantity?: number;
          ready_at?: string | null;
          ref?: string | null;
          status?: string;
          terms_version?: string | null;
          total?: number;
          unit_price?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_participation_id_fkey";
            columns: ["participation_id"];
            isOneToOne: true;
            referencedRelation: "participations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_pool_id_fkey";
            columns: ["pool_id"];
            isOneToOne: false;
            referencedRelation: "pools";
            referencedColumns: ["id"];
          },
        ];
      };
      participations: {
        Row: {
          business_id: string;
          created_at: string;
          id: string;
          pool_id: string;
          quantity: number;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          id?: string;
          pool_id: string;
          quantity: number;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          id?: string;
          pool_id?: string;
          quantity?: number;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "participations_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "participations_pool_id_fkey";
            columns: ["pool_id"];
            isOneToOne: false;
            referencedRelation: "pools";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          channel_reference: string | null;
          created_at: string;
          id: string;
          kind: string;
          note: string | null;
          order_id: string;
          recorded_by: string | null;
        };
        Insert: {
          amount: number;
          channel_reference?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          note?: string | null;
          order_id: string;
          recorded_by?: string | null;
        };
        Update: {
          amount?: number;
          channel_reference?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          note?: string | null;
          order_id?: string;
          recorded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      yoco_checkout_attempts: {
        Row: {
          amount_cents: number;
          checkout_id: string | null;
          created_at: string;
          id: string;
          order_id: string;
          payment_id: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          amount_cents: number;
          checkout_id?: string | null;
          created_at?: string;
          id?: string;
          order_id: string;
          payment_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          amount_cents?: number;
          checkout_id?: string | null;
          created_at?: string;
          id?: string;
          order_id?: string;
          payment_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "yoco_checkout_attempts_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      whatsapp_campaign_deliveries: {
        Row: {
          business_id: string;
          campaign_id: string;
          created_at: string;
          error: string | null;
          id: string;
          provider_message_id: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          campaign_id: string;
          created_at?: string;
          error?: string | null;
          id?: string;
          provider_message_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          campaign_id?: string;
          created_at?: string;
          error?: string | null;
          id?: string;
          provider_message_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_campaign_deliveries_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "whatsapp_campaign_deliveries_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      pool_costs: {
        Row: {
          pool_id: string;
          supplier_cost: number;
        };
        Insert: {
          pool_id: string;
          supplier_cost: number;
        };
        Update: {
          pool_id?: string;
          supplier_cost?: number;
        };
        Relationships: [
          {
            foreignKeyName: "pool_costs_pool_id_fkey";
            columns: ["pool_id"];
            isOneToOne: true;
            referencedRelation: "pools";
            referencedColumns: ["id"];
          },
        ];
      };
      pools: {
        Row: {
          campaign_id: string | null;
          closed_at: string | null;
          closes_at: string;
          collection_point_id: string | null;
          confirm_window_hours: number;
          confirmed_qty: number;
          created_at: string;
          fee_note: string | null;
          fulfilment_note: string | null;
          id: string;
          is_demo: boolean;
          max_per_customer: number | null;
          max_distance_km: number;
          is_private: boolean;
          invite_code: string | null;
          max_qty: number | null;
          min_per_customer: number;
          min_qty: number;
          opens_at: string;
          outcome_note: string | null;
          paid_qty: number;
          participant_count: number;
          payment_deadline: string | null;
          pledged_qty: number;
          price: number;
          proposed_by: string | null;
          product_id: string;
          qualified_at: string | null;
          reference_date: string | null;
          reference_price: number | null;
          reference_source: string | null;
          status: string;
          supplier_id: string | null;
          unit: string;
          updated_at: string;
        };
        Insert: {
          campaign_id?: string | null;
          closed_at?: string | null;
          closes_at: string;
          collection_point_id?: string | null;
          confirm_window_hours?: number;
          confirmed_qty?: number;
          created_at?: string;
          fee_note?: string | null;
          fulfilment_note?: string | null;
          id?: string;
          is_demo?: boolean;
          max_per_customer?: number | null;
          max_distance_km?: number;
          is_private?: boolean;
          invite_code?: string | null;
          max_qty?: number | null;
          min_per_customer?: number;
          min_qty: number;
          opens_at?: string;
          outcome_note?: string | null;
          paid_qty?: number;
          participant_count?: number;
          payment_deadline?: string | null;
          pledged_qty?: number;
          price: number;
          proposed_by?: string | null;
          product_id: string;
          qualified_at?: string | null;
          reference_date?: string | null;
          reference_price?: number | null;
          reference_source?: string | null;
          status?: string;
          supplier_id?: string | null;
          unit: string;
          updated_at?: string;
        };
        Update: {
          campaign_id?: string | null;
          closed_at?: string | null;
          closes_at?: string;
          collection_point_id?: string | null;
          confirm_window_hours?: number;
          confirmed_qty?: number;
          created_at?: string;
          fee_note?: string | null;
          fulfilment_note?: string | null;
          id?: string;
          is_demo?: boolean;
          max_per_customer?: number | null;
          max_distance_km?: number;
          is_private?: boolean;
          invite_code?: string | null;
          max_qty?: number | null;
          min_per_customer?: number;
          min_qty?: number;
          opens_at?: string;
          outcome_note?: string | null;
          paid_qty?: number;
          participant_count?: number;
          payment_deadline?: string | null;
          pledged_qty?: number;
          price?: number;
          proposed_by?: string | null;
          product_id?: string;
          qualified_at?: string | null;
          reference_date?: string | null;
          reference_price?: number | null;
          reference_source?: string | null;
          status?: string;
          supplier_id?: string | null;
          unit?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pools_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pools_collection_point_id_fkey";
            columns: ["collection_point_id"];
            isOneToOne: false;
            referencedRelation: "collection_points";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pools_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pools_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          active: boolean;
          brand: string | null;
          category_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_demo: boolean;
          name: string;
          pack_size: string | null;
          sku: string;
          unit: string;
        };
        Insert: {
          active?: boolean;
          brand?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_demo?: boolean;
          name: string;
          pack_size?: string | null;
          sku: string;
          unit?: string;
        };
        Update: {
          active?: boolean;
          brand?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_demo?: boolean;
          name?: string;
          pack_size?: string | null;
          sku?: string;
          unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_orders: {
        Row: {
          created_at: string;
          created_by: string | null;
          discrepancy_note: string | null;
          expected_date: string | null;
          id: string;
          order_date: string | null;
          pool_id: string;
          quantity: number;
          received_at: string | null;
          received_qty: number | null;
          status: string;
          supplier_id: string | null;
          supplier_ref: string | null;
          total: number;
          unit_cost: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          discrepancy_note?: string | null;
          expected_date?: string | null;
          id?: string;
          order_date?: string | null;
          pool_id: string;
          quantity: number;
          received_at?: string | null;
          received_qty?: number | null;
          status?: string;
          supplier_id?: string | null;
          supplier_ref?: string | null;
          total: number;
          unit_cost: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          discrepancy_note?: string | null;
          expected_date?: string | null;
          id?: string;
          order_date?: string | null;
          pool_id?: string;
          quantity?: number;
          received_at?: string | null;
          received_qty?: number | null;
          status?: string;
          supplier_id?: string | null;
          supplier_ref?: string | null;
          total?: number;
          unit_cost?: number;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_orders_pool_id_fkey";
            columns: ["pool_id"];
            isOneToOne: true;
            referencedRelation: "pools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      refunds: {
        Row: {
          amount: number;
          completed_at: string | null;
          completed_reference: string | null;
          created_at: string;
          id: string;
          order_id: string;
          reason: string;
          recorded_by: string | null;
          status: string;
        };
        Insert: {
          amount: number;
          completed_at?: string | null;
          completed_reference?: string | null;
          created_at?: string;
          id?: string;
          order_id: string;
          reason: string;
          recorded_by?: string | null;
          status?: string;
        };
        Update: {
          amount?: number;
          completed_at?: string | null;
          completed_reference?: string | null;
          created_at?: string;
          id?: string;
          order_id?: string;
          reason?: string;
          recorded_by?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      suppliers: {
        Row: {
          active: boolean;
          categories: string[] | null;
          contact_person: string | null;
          created_at: string;
          email: string | null;
          id: string;
          is_demo: boolean;
          location: string | null;
          mobile: string | null;
          name: string;
          notes: string | null;
        };
        Insert: {
          active?: boolean;
          categories?: string[] | null;
          contact_person?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_demo?: boolean;
          location?: string | null;
          mobile?: string | null;
          name: string;
          notes?: string | null;
        };
        Update: {
          active?: boolean;
          categories?: string[] | null;
          contact_person?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_demo?: boolean;
          location?: string | null;
          mobile?: string | null;
          name?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_cancel_pool: {
        Args: { _pool: string; _reason: string };
        Returns: undefined;
      };
      admin_close_now: { Args: { _pool: string }; Returns: undefined };
      admin_collect: {
        Args: { _code: string; _order: string };
        Returns: undefined;
      };
      admin_complete_refund: {
        Args: { _reference: string; _refund: string };
        Returns: undefined;
      };
      admin_create_po: {
        Args: {
          _expected: string | null;
          _order_date: string;
          _pool: string;
          _supplier_ref: string;
        };
        Returns: undefined;
      };
      admin_create_refund: {
        Args: { _amount: number; _order: string; _reason: string };
        Returns: undefined;
      };
      admin_exists: { Args: never; Returns: boolean };
      admin_finalise_funding: { Args: { _pool: string }; Returns: string };
      admin_flag_payment_issue: {
        Args: { _note: string; _order: string };
        Returns: undefined;
      };
      admin_mark_ready: { Args: { _pool: string }; Returns: number };
      admin_publish_pool: { Args: { _pool: string }; Returns: undefined };
      claim_pool_invite: { Args: { _code: string }; Returns: string };
      propose_pool: {
        Args: {
          _product: string;
          _unit: string;
          _price: number;
          _min_qty: number;
          _max_qty: number | null;
          _min_per: number | null;
          _max_per: number | null;
          _opens: string;
          _closes: string;
          _collection_point: string;
          _note: string | null;
          _private?: boolean;
        };
        Returns: string;
      };
      admin_receive_stock: {
        Args: { _note: string; _pool: string; _received: number };
        Returns: undefined;
      };
      admin_record_payment: {
        Args: {
          _amount: number;
          _channel_ref: string;
          _kind: string;
          _note: string;
          _order: string;
        };
        Returns: undefined;
      };
      admin_resolve_failed_pool: {
        Args: { _note: string; _pool: string };
        Returns: undefined;
      };
      admin_set_role: {
        Args: { _email: string; _make_admin: boolean };
        Returns: undefined;
      };
      audit: {
        Args: { _action: string; _details?: Json; _entity: string; _id: string };
        Returns: undefined;
      };
      claim_first_admin: { Args: never; Returns: undefined };
      close_pool: { Args: { _pool: string }; Returns: undefined };
      confirm_order: {
        Args: { _accept: boolean; _order: string };
        Returns: string;
      };
      decline_order: { Args: { _order: string }; Returns: undefined };
      finalise_funding: { Args: { _pool: string }; Returns: string };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_admin: { Args: never; Returns: boolean };
      join_pool: { Args: { _pool: string; _qty: number }; Returns: Json };
      notify: {
        Args: { _body: string; _link: string; _title: string; _user: string };
        Returns: undefined;
      };
      provider_attach_yoco_checkout: {
        Args: { _attempt: string; _checkout_id: string };
        Returns: undefined;
      };
      provider_complete_yoco_checkout: {
        Args: { _amount_cents: number; _attempt: string; _currency: string; _payment_id: string };
        Returns: boolean;
      };
      provider_fail_yoco_checkout: {
        Args: { _attempt: string };
        Returns: undefined;
      };
      provider_fail_yoco_webhook: {
        Args: { _attempt: string; _payment_id: string };
        Returns: undefined;
      };
      provider_finish_whatsapp_delivery: {
        Args: {
          _delivery: string;
          _error: string | null;
          _provider_message_id: string | null;
          _status: string;
        };
        Returns: undefined;
      };
      provider_prepare_whatsapp_campaign: {
        Args: { _campaign: string; _retry_failed?: boolean };
        Returns: {
          business_id: string;
          campaign_name: string;
          delivery_id: string;
          description: string | null;
          mobile: string;
          trading_name: string;
        }[];
      };
      provider_prepare_yoco_checkout: {
        Args: { _order: string };
        Returns: Json;
      };
      recalc_pool: { Args: { _pool: string }; Returns: undefined };
      refresh_pool_states: { Args: never; Returns: undefined };
      withdraw_from_pool: { Args: { _pool: string }; Returns: undefined };
    };
    Enums: {
      app_role: "admin" | "customer";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer"],
    },
  },
} as const;
