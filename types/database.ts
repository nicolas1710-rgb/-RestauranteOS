export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            restaurants: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    logo_url: string | null
                    currency: string
                    timezone: string
                    active: boolean
                    n8n_webhook_url: string | null
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['restaurants']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['restaurants']['Insert']>
            }
            profiles: {
                Row: {
                    id: string
                    restaurant_id: string
                    full_name: string | null
                    role: 'superadmin' | 'admin' | 'waiter' | 'kitchen'
                    active: boolean
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
                Update: Partial<Database['public']['Tables']['profiles']['Insert']>
            }
            areas: {
                Row: {
                    id: string
                    restaurant_id: string
                    name: string
                    display_order: number
                }
                Insert: Omit<Database['public']['Tables']['areas']['Row'], 'id'>
                Update: Partial<Database['public']['Tables']['areas']['Insert']>
            }
            tables: {
                Row: {
                    id: string
                    restaurant_id: string
                    area_id: string | null
                    number: string
                    capacity: number
                    status: 'available' | 'occupied' | 'reserved'
                }
                Insert: Omit<Database['public']['Tables']['tables']['Row'], 'id'>
                Update: Partial<Database['public']['Tables']['tables']['Insert']>
            }
            menu_categories: {
                Row: {
                    id: string
                    restaurant_id: string
                    name: string
                    icon: string | null
                    display_order: number
                    active: boolean
                }
                Insert: Omit<Database['public']['Tables']['menu_categories']['Row'], 'id'>
                Update: Partial<Database['public']['Tables']['menu_categories']['Insert']>
            }
            menu_items: {
                Row: {
                    id: string
                    restaurant_id: string
                    category_id: string
                    name: string
                    description: string | null
                    price: number
                    image_url: string | null
                    preparation_time: number
                    available: boolean
                    display_order: number
                    allergens: string[] | null
                    tags: string[] | null
                }
                Insert: Omit<Database['public']['Tables']['menu_items']['Row'], 'id'>
                Update: Partial<Database['public']['Tables']['menu_items']['Insert']>
            }
            modifiers: {
                Row: {
                    id: string
                    restaurant_id: string
                    name: string
                    type: 'single' | 'multiple'
                }
                Insert: Omit<Database['public']['Tables']['modifiers']['Row'], 'id'>
                Update: Partial<Database['public']['Tables']['modifiers']['Insert']>
            }
            modifier_options: {
                Row: {
                    id: string
                    modifier_id: string
                    name: string
                    price_delta: number
                }
                Insert: Omit<Database['public']['Tables']['modifier_options']['Row'], 'id'>
                Update: Partial<Database['public']['Tables']['modifier_options']['Insert']>
            }
            menu_item_modifiers: {
                Row: {
                    menu_item_id: string
                    modifier_id: string
                    required: boolean
                }
                Insert: Database['public']['Tables']['menu_item_modifiers']['Row']
                Update: Partial<Database['public']['Tables']['menu_item_modifiers']['Insert']>
            }
            orders: {
                Row: {
                    id: string
                    restaurant_id: string
                    table_id: string
                    waiter_id: string
                    order_number: string
                    status: 'open' | 'sent' | 'preparing' | 'ready' | 'delivered' | 'closed' | 'cancelled'
                    notes: string | null
                    guests: number
                    subtotal: number
                    tax: number
                    total: number
                    payment_status: 'pending' | 'partial' | 'paid'
                    payment_method: string | null
                    created_at: string
                    sent_at: string | null
                    closed_at: string | null
                }
                Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['orders']['Insert']>
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    menu_item_id: string
                    quantity: number
                    unit_price: number
                    notes: string | null
                    status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
                    sent_to_kitchen_at: string | null
                    ready_at: string | null
                    selected_modifiers: Json | null
                }
                Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id'>
                Update: Partial<Database['public']['Tables']['order_items']['Insert']>
            }
            activity_log: {
                Row: {
                    id: string
                    restaurant_id: string
                    user_id: string
                    action: string
                    entity_type: string | null
                    entity_id: string | null
                    metadata: Json | null
                    created_at: string
                }
                Insert: Omit<Database['public']['Tables']['activity_log']['Row'], 'id' | 'created_at'>
                Update: Partial<Database['public']['Tables']['activity_log']['Insert']>
            }
        }
    }
}

// Convenience types
export type Restaurant = Database['public']['Tables']['restaurants']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Area = Database['public']['Tables']['areas']['Row']
export type Table = Database['public']['Tables']['tables']['Row']
export type MenuCategory = Database['public']['Tables']['menu_categories']['Row']
export type MenuItem = Database['public']['Tables']['menu_items']['Row']
export type Modifier = Database['public']['Tables']['modifiers']['Row']
export type ModifierOption = Database['public']['Tables']['modifier_options']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']

export type OrderStatus = Order['status']
export type TableStatus = Table['status']
export type UserRole = Profile['role']

export type CartItem = {
    menuItemId: string
    menuItemName: string
    unitPrice: number
    quantity: number
    notes: string
    selectedModifiers: SelectedModifier[]
}

export type SelectedModifier = {
    modifierId: string
    modifierName: string
    optionId: string
    optionName: string
    priceDelta: number
}

export type OrderWithDetails = Order & {
    table: Table
    waiter: Profile
    order_items: (OrderItem & { menu_item: MenuItem })[]
}

export type MenuItemWithModifiers = MenuItem & {
    menu_item_modifiers: (Database['public']['Tables']['menu_item_modifiers']['Row'] & {
        modifier: Modifier & { modifier_options: ModifierOption[] }
    })[]
}

export type TableWithArea = Table & {
    area: Area | null
    active_order?: Order | null
}
