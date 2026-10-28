export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      admin_requests: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email: string;
          full_name: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          key: string;
          updated_at?: string;
          value: NonNullable<Json>;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: NonNullable<Json>;
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
        ComputedFields: never;
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
          category: string | null;
          city: string;
          created_at: string;
          deliver_to: string;
          delivery_address: string | null;
          delivery_latitude: number | null;
          delivery_longitude: number | null;
          delivery_zone_id: string | null;
          email: string | null;
          id: string;
          is_test: boolean;
          latitude: number | null;
          longitude: number | null;
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
          zone_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          category?: string | null;
          city: string;
          created_at?: string;
          deliver_to?: string;
          delivery_address?: string | null;
          delivery_latitude?: number | null;
          delivery_longitude?: number | null;
          delivery_zone_id?: string | null;
          email?: string | null;
          id?: string;
          is_test?: boolean;
          latitude?: number | null;
          longitude?: number | null;
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
          zone_id?: string | null;
        };
        Update: {
          address?: string | null;
          category?: string | null;
          city?: string;
          created_at?: string;
          deliver_to?: string;
          delivery_address?: string | null;
          delivery_latitude?: number | null;
          delivery_longitude?: number | null;
          delivery_zone_id?: string | null;
          email?: string | null;
          id?: string;
          is_test?: boolean;
          latitude?: number | null;
          longitude?: number | null;
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
          zone_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_delivery_zone_id_fkey";
            columns: ["delivery_zone_id"];
            isOneToOne: false;
            referencedRelation: "delivery_zones";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "businesses_zone_id_fkey";
            columns: ["zone_id"];
            isOneToOne: false;
            referencedRelation: "delivery_zones";
            referencedColumns: ["id"];
          },
        ];
      };
      campaigns: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
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
        ComputedFields: never;
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
      delivery_zones: {
        Row: {
          active: boolean;
          areas: string | null;
          created_at: string;
          delivery_fee: number;
          id: string;
          name: string;
          sort: number;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          areas?: string | null;
          created_at?: string;
          delivery_fee?: number;
          id?: string;
          name: string;
          sort?: number;
        };
        Update: {
          active?: boolean;
          areas?: string | null;
          created_at?: string;
          delivery_fee?: number;
          id?: string;
          name?: string;
          sort?: number;
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
        ComputedFields: never;
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
          confirmed_at: string | null;
          courier_ref: string | null;
          created_at: string;
          declined_at: string | null;
          delivered_at: string | null;
          delivery_address: string | null;
          delivery_fee: number;
          delivery_latitude: number | null;
          delivery_longitude: number | null;
          delivery_zone_id: string | null;
          failure_reason: string | null;
          fulfilment_status: string;
          id: string;
          out_for_delivery_at: string | null;
          paid_at: string | null;
          participation_id: string | null;
          payment_method: string | null;
          payment_reference: string | null;
          payment_status: string;
          pool_id: string;
          problem_note: string | null;
          problem_reported_at: string | null;
          quantity: number;
          received_at: string | null;
          ref: string | null;
          status: string;
          terms_version: string | null;
          total: number;
          unit_price: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          allocated_qty?: number;
          amount_paid?: number;
          business_id: string;
          confirmed_at?: string | null;
          courier_ref?: string | null;
          created_at?: string;
          declined_at?: string | null;
          delivered_at?: string | null;
          delivery_address?: string | null;
          delivery_fee?: number;
          delivery_latitude?: number | null;
          delivery_longitude?: number | null;
          delivery_zone_id?: string | null;
          failure_reason?: string | null;
          fulfilment_status?: string;
          id?: string;
          out_for_delivery_at?: string | null;
          paid_at?: string | null;
          participation_id?: string | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          payment_status?: string;
          pool_id: string;
          problem_note?: string | null;
          problem_reported_at?: string | null;
          quantity: number;
          received_at?: string | null;
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
          confirmed_at?: string | null;
          courier_ref?: string | null;
          created_at?: string;
          declined_at?: string | null;
          delivered_at?: string | null;
          delivery_address?: string | null;
          delivery_fee?: number;
          delivery_latitude?: number | null;
          delivery_longitude?: number | null;
          delivery_zone_id?: string | null;
          failure_reason?: string | null;
          fulfilment_status?: string;
          id?: string;
          out_for_delivery_at?: string | null;
          paid_at?: string | null;
          participation_id?: string | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          payment_status?: string;
          pool_id?: string;
          problem_note?: string | null;
          problem_reported_at?: string | null;
          quantity?: number;
          received_at?: string | null;
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
            foreignKeyName: "orders_delivery_zone_id_fkey";
            columns: ["delivery_zone_id"];
            isOneToOne: false;
            referencedRelation: "delivery_zones";
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
        ComputedFields: never;
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
      payment_proofs: {
        Row: {
          created_at: string;
          file_path: string;
          id: string;
          note: string | null;
          order_id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          uploaded_by: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          file_path: string;
          id?: string;
          note?: string | null;
          order_id: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          uploaded_by: string;
        };
        Update: {
          created_at?: string;
          file_path?: string;
          id?: string;
          note?: string | null;
          order_id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_proofs_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
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
          method: string;
          note: string | null;
          order_id: string;
          recorded_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          channel_reference?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          method?: string;
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
          method?: string;
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
      pool_costs: {
        Row: {
          pool_id: string;
          supplier_cost: number;
        };
        ComputedFields: never;
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
      pool_locations: {
        Row: {
          label: string | null;
          latitude: number;
          longitude: number;
          pool_id: string;
          radius_km: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          label?: string | null;
          latitude: number;
          longitude: number;
          pool_id: string;
          radius_km?: number;
          updated_at?: string;
        };
        Update: {
          label?: string | null;
          latitude?: number;
          longitude?: number;
          pool_id?: string;
          radius_km?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pool_locations_pool_id_fkey";
            columns: ["pool_id"];
            isOneToOne: true;
            referencedRelation: "pools";
            referencedColumns: ["id"];
          },
        ];
      };
      pool_members: {
        Row: {
          created_at: string;
          pool_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          pool_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          pool_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pool_members_pool_id_fkey";
            columns: ["pool_id"];
            isOneToOne: false;
            referencedRelation: "pools";
            referencedColumns: ["id"];
          },
        ];
      };
      pool_zones: {
        Row: {
          pool_id: string;
          zone_id: string;
        };
        ComputedFields: never;
        Insert: {
          pool_id: string;
          zone_id: string;
        };
        Update: {
          pool_id?: string;
          zone_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pool_zones_pool_id_fkey";
            columns: ["pool_id"];
            isOneToOne: false;
            referencedRelation: "pools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pool_zones_zone_id_fkey";
            columns: ["zone_id"];
            isOneToOne: false;
            referencedRelation: "delivery_zones";
            referencedColumns: ["id"];
          },
        ];
      };
      pools: {
        Row: {
          campaign_id: string | null;
          closed_at: string | null;
          closes_at: string;
          confirm_window_hours: number;
          confirmed_qty: number;
          created_at: string;
          discount_share_pct: number | null;
          fee_note: string | null;
          fulfilment_note: string | null;
          id: string;
          invite_code: string | null;
          is_private: boolean;
          is_sample: boolean;
          is_test: boolean;
          max_per_customer: number | null;
          max_qty: number | null;
          min_per_customer: number;
          min_qty: number;
          opens_at: string;
          outcome_note: string | null;
          paid_qty: number;
          participant_count: number;
          payment_deadline: string | null;
          pledged_qty: number;
          price: number | null;
          product_id: string;
          proposed_by: string | null;
          qualified_at: string | null;
          reference_date: string | null;
          reference_price: number | null;
          reference_source: string | null;
          reopened_at: string | null;
          status: string;
          supplier_id: string | null;
          unit: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          campaign_id?: string | null;
          closed_at?: string | null;
          closes_at: string;
          confirm_window_hours?: number;
          confirmed_qty?: number;
          created_at?: string;
          discount_share_pct?: number | null;
          fee_note?: string | null;
          fulfilment_note?: string | null;
          id?: string;
          invite_code?: string | null;
          is_private?: boolean;
          is_sample?: boolean;
          is_test?: boolean;
          max_per_customer?: number | null;
          max_qty?: number | null;
          min_per_customer?: number;
          min_qty: number;
          opens_at?: string;
          outcome_note?: string | null;
          paid_qty?: number;
          participant_count?: number;
          payment_deadline?: string | null;
          pledged_qty?: number;
          price?: number | null;
          product_id: string;
          proposed_by?: string | null;
          qualified_at?: string | null;
          reference_date?: string | null;
          reference_price?: number | null;
          reference_source?: string | null;
          reopened_at?: string | null;
          status?: string;
          supplier_id?: string | null;
          unit: string;
          updated_at?: string;
        };
        Update: {
          campaign_id?: string | null;
          closed_at?: string | null;
          closes_at?: string;
          confirm_window_hours?: number;
          confirmed_qty?: number;
          created_at?: string;
          discount_share_pct?: number | null;
          fee_note?: string | null;
          fulfilment_note?: string | null;
          id?: string;
          invite_code?: string | null;
          is_private?: boolean;
          is_sample?: boolean;
          is_test?: boolean;
          max_per_customer?: number | null;
          max_qty?: number | null;
          min_per_customer?: number;
          min_qty?: number;
          opens_at?: string;
          outcome_note?: string | null;
          paid_qty?: number;
          participant_count?: number;
          payment_deadline?: string | null;
          pledged_qty?: number;
          price?: number | null;
          product_id?: string;
          proposed_by?: string | null;
          qualified_at?: string | null;
          reference_date?: string | null;
          reference_price?: number | null;
          reference_source?: string | null;
          reopened_at?: string | null;
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
          name: string;
          pack_size: string | null;
          sku: string;
          unit: string;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          brand?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
          location: string | null;
          mobile: string | null;
          name: string;
          notes: string | null;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          categories?: string[] | null;
          contact_person?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
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
        ComputedFields: never;
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
      admin_cancel_pool: { Args: { _pool: string; _reason: string }; Returns: undefined };
      admin_close_now: { Args: { _pool: string }; Returns: undefined };
      admin_complete_refund: { Args: { _reference: string; _refund: string }; Returns: undefined };
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
      admin_dispatch_pool: { Args: { _courier_ref: string; _pool: string }; Returns: number };
      admin_exists: { Args: Record<PropertyKey, never>; Returns: boolean };
      admin_finalise_funding: { Args: { _pool: string }; Returns: string };
      admin_flag_payment_issue: { Args: { _note: string; _order: string }; Returns: undefined };
      admin_mark_delivered: { Args: { _note: string; _order: string }; Returns: undefined };
      admin_publish_pool: { Args: { _pool: string }; Returns: undefined };
      admin_receive_stock: {
        Args: { _note: string; _pool: string; _received: number };
        Returns: undefined;
      };
      admin_record_payment: {
        Args: {
          _amount: number;
          _channel_ref: string;
          _kind: string;
          _method?: string;
          _note: string;
          _order: string;
        };
        Returns: undefined;
      };
      admin_reset_test_data: { Args: { _load?: boolean }; Returns: string };
      admin_resolve_delivery_problem: {
        Args: { _note: string; _order: string };
        Returns: undefined;
      };
      admin_resolve_failed_pool: { Args: { _note: string; _pool: string }; Returns: undefined };
      admin_review_access: { Args: { _approve: boolean; _user: string }; Returns: undefined };
      admin_review_payment_proof: {
        Args: { _amount?: number; _approve: boolean; _note?: string; _proof: string };
        Returns: undefined;
      };
      admin_set_pool_location: {
        Args: { _label: string; _lat: number; _lon: number; _pool: string; _radius: number };
        Returns: undefined;
      };
      admin_set_role: { Args: { _email: string; _make_admin: boolean }; Returns: undefined };
      admin_skip_ahead: { Args: { _pool: string }; Returns: string };
      audit: {
        Args: { _action: string; _details?: Json; _entity: string; _id: string };
        Returns: undefined;
      };
      choose_payment_method: { Args: { _method: string; _order: string }; Returns: undefined };
      claim_first_admin: { Args: Record<PropertyKey, never>; Returns: undefined };
      claim_pool_invite: { Args: { _code: string }; Returns: string };
      close_pool: { Args: { _pool: string }; Returns: undefined };
      complete_pool_if_delivered: { Args: { _pool: string }; Returns: undefined };
      confirm_delivery_received: { Args: { _order: string }; Returns: undefined };
      confirm_order: {
        Args: { _accept: boolean; _method?: string; _order: string };
        Returns: string;
      };
      decline_order: { Args: { _order: string }; Returns: undefined };
      discount_share_pct: { Args: Record<PropertyKey, never>; Returns: number };
      fail_pool: { Args: { _note: string; _pool: string }; Returns: string };
      finalise_funding: { Args: { _pool: string }; Returns: string };
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _user_id: string };
        Returns: boolean;
      };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_test_shop: { Args: Record<PropertyKey, never>; Returns: boolean };
      join_pool: { Args: { _pool: string; _qty: number }; Returns: Json };
      my_pool_distances: {
        Args: Record<PropertyKey, never>;
        Returns: {
          distance_km: number;
          in_range: boolean;
          pool_id: string;
          radius_km: number;
        }[];
      };
      notify: {
        Args: { _body: string; _link: string; _title: string; _user: string };
        Returns: undefined;
      };
      notify_admins: { Args: { _body: string; _link: string; _title: string }; Returns: undefined };
      pool_price: { Args: { _bulk: number; _list: number; _share_pct: number }; Returns: number };
      propose_pool: {
        Args: {
          _closes: string;
          _max_per: number | null;
          _max_qty: number | null;
          _min_per: number | null;
          _min_qty: number;
          _note: string | null;
          _opens: string;
          _private?: boolean;
          _product: string;
          _unit: string;
        };
        Returns: string;
      };
      recalc_pool: { Args: { _pool: string }; Returns: undefined };
      refresh_pool_states: { Args: Record<PropertyKey, never>; Returns: undefined };
      report_delivery_problem: { Args: { _note: string; _order: string }; Returns: undefined };
      request_admin_access: { Args: { _name: string }; Returns: undefined };
      set_order_delivery: { Args: { _order: string }; Returns: undefined };
      submit_payment_proof: { Args: { _order: string; _path: string }; Returns: string };
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "customer"],
    },
  },
} as const;
