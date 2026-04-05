export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          created_at: string
        }
        Insert: {
          id: string
          display_name: string
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          created_at?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          id: number
          name: string
          muscle_group: string
          equipment: string | null
          is_custom: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          muscle_group: string
          equipment?: string | null
          is_custom?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          muscle_group?: string
          equipment?: string | null
          is_custom?: boolean
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          id: number
          user_id: string
          started_at: string
          finished_at: string | null
          notes: string | null
          split_day_id: number | null
          edited_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          started_at?: string
          finished_at?: string | null
          notes?: string | null
          split_day_id?: number | null
          edited_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          started_at?: string
          finished_at?: string | null
          notes?: string | null
          split_day_id?: number | null
          edited_at?: string | null
        }
        Relationships: []
      }
      workout_sets: {
        Row: {
          id: number
          session_id: number
          exercise_id: number
          set_number: number
          weight_kg: number
          reps: number
          rpe: number | null
          logged_at: string
        }
        Insert: {
          id?: number
          session_id: number
          exercise_id: number
          set_number: number
          weight_kg: number
          reps: number
          rpe?: number | null
          logged_at?: string
        }
        Update: {
          id?: number
          session_id?: number
          exercise_id?: number
          set_number?: number
          weight_kg?: number
          reps?: number
          rpe?: number | null
          logged_at?: string
        }
        Relationships: []
      }
      body_weight_logs: {
        Row: {
          id: number
          user_id: string
          weight_kg: number
          logged_at: string
        }
        Insert: {
          id?: number
          user_id: string
          weight_kg: number
          logged_at: string
        }
        Update: {
          id?: number
          user_id?: string
          weight_kg?: number
          logged_at?: string
        }
        Relationships: []
      }
      foods: {
        Row: {
          id: number
          user_id: string
          name: string
          calories_per_100g: number
          protein_per_100g: number
          carbs_per_100g: number
          fat_per_100g: number
          fiber_per_100g: number | null
          sugar_per_100g: number | null
          saturated_fat_per_100g: number | null
          sodium_per_100g: number | null
          is_verified: boolean
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          name: string
          calories_per_100g: number
          protein_per_100g: number
          carbs_per_100g: number
          fat_per_100g: number
          fiber_per_100g?: number | null
          sugar_per_100g?: number | null
          saturated_fat_per_100g?: number | null
          sodium_per_100g?: number | null
          is_verified?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
          calories_per_100g?: number
          protein_per_100g?: number
          carbs_per_100g?: number
          fat_per_100g?: number
          fiber_per_100g?: number | null
          sugar_per_100g?: number | null
          saturated_fat_per_100g?: number | null
          sodium_per_100g?: number | null
          is_verified?: boolean
          created_at?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          id: number
          user_id: string
          name: string
          total_weight_g: number | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          name: string
          total_weight_g?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
          total_weight_g?: number | null
          created_at?: string
        }
        Relationships: []
      }
      meal_ingredients: {
        Row: {
          id: number
          meal_id: number
          food_id: number
          quantity_g: number
        }
        Insert: {
          id?: number
          meal_id: number
          food_id: number
          quantity_g: number
        }
        Update: {
          id?: number
          meal_id?: number
          food_id?: number
          quantity_g?: number
        }
        Relationships: []
      }
      food_log: {
        Row: {
          id: number
          user_id: string
          logged_at: string
          meal_type: string
          food_id: number | null
          meal_id: number | null
          quantity_g: number | null
          servings: number
          calories: number
          protein: number
          carbs: number
          fat: number
          fiber: number | null
          sugar: number | null
          saturated_fat: number | null
          sodium: number | null
        }
        Insert: {
          id?: number
          user_id: string
          logged_at?: string
          meal_type: string
          food_id?: number | null
          meal_id?: number | null
          quantity_g?: number | null
          servings?: number
          calories: number
          protein: number
          carbs: number
          fat: number
          fiber?: number | null
          sugar?: number | null
          saturated_fat?: number | null
          sodium?: number | null
        }
        Update: {
          id?: number
          user_id?: string
          logged_at?: string
          meal_type?: string
          food_id?: number | null
          meal_id?: number | null
          quantity_g?: number | null
          servings?: number
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          fiber?: number | null
          sugar?: number | null
          saturated_fat?: number | null
          sodium?: number | null
        }
        Relationships: []
      }
      nutrition_targets: {
        Row: {
          id: number
          user_id: string
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          fiber_g: number | null
          sugar_g: number | null
        }
        Insert: {
          id?: number
          user_id: string
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          fiber_g?: number | null
          sugar_g?: number | null
        }
        Update: {
          id?: number
          user_id?: string
          calories?: number
          protein_g?: number
          carbs_g?: number
          fat_g?: number
          fiber_g?: number | null
          sugar_g?: number | null
        }
        Relationships: []
      }
      workout_splits: {
        Row: {
          id: number
          user_id: string
          name: string
          description: string | null
          is_preset: boolean
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          name: string
          description?: string | null
          is_preset?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
          description?: string | null
          is_preset?: boolean
          created_at?: string
        }
        Relationships: []
      }
      split_days: {
        Row: {
          id: number
          split_id: number
          name: string
          day_order: number
        }
        Insert: {
          id?: number
          split_id: number
          name: string
          day_order: number
        }
        Update: {
          id?: number
          split_id?: number
          name?: string
          day_order?: number
        }
        Relationships: []
      }
      split_day_exercises: {
        Row: {
          id: number
          split_day_id: number
          exercise_id: number
          order_index: number
          target_sets: number | null
          target_reps: number | null
        }
        Insert: {
          id?: number
          split_day_id: number
          exercise_id: number
          order_index: number
          target_sets?: number | null
          target_reps?: number | null
        }
        Update: {
          id?: number
          split_day_id?: number
          exercise_id?: number
          order_index?: number
          target_sets?: number | null
          target_reps?: number | null
        }
        Relationships: []
      }
      split_schedule: {
        Row: {
          id: number
          user_id: string
          day_of_week: number
          split_day_id: number | null
          is_rest_day: boolean
        }
        Insert: {
          id?: number
          user_id: string
          day_of_week: number
          split_day_id?: number | null
          is_rest_day?: boolean
        }
        Update: {
          id?: number
          user_id?: string
          day_of_week?: number
          split_day_id?: number | null
          is_rest_day?: boolean
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: number
          user_id: string
          subscription: Json
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          subscription: Json
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          subscription?: Json
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
