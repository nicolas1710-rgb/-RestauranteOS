import type { Profile, Restaurant, Area, Table, MenuItem, Order, OrderItem } from '@/types/database'

export const MOCK_RESTAURANT: Restaurant = {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Los Pollos',
    slug: 'los-pollos',
    logo_url: null,
    currency: 'COP',
    timezone: 'America/Bogota',
    active: true,
    n8n_webhook_url: null,
    created_at: new Date().toISOString()
}

export const MOCK_PROFILES: Profile[] = [
    {
        id: 'e0000000-0000-0000-0000-000000000001',
        restaurant_id: MOCK_RESTAURANT.id,
        full_name: 'Admin Demo',
        role: 'admin',
        active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 'e0000000-0000-0000-0000-000000000002',
        restaurant_id: MOCK_RESTAURANT.id,
        full_name: 'Mesero Demo',
        role: 'waiter',
        active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 'e0000000-0000-0000-0000-000000000003',
        restaurant_id: MOCK_RESTAURANT.id,
        full_name: 'Cocina Demo',
        role: 'kitchen',
        active: true,
        created_at: new Date().toISOString()
    }
]

export const MOCK_AREAS: Area[] = [
    { id: 'area-1', restaurant_id: MOCK_RESTAURANT.id, name: 'Salón Principal', display_order: 0 },
    { id: 'area-2', restaurant_id: MOCK_RESTAURANT.id, name: 'Terraza', display_order: 1 }
]

export const MOCK_TABLES: Table[] = [
    { id: 'table-1', restaurant_id: MOCK_RESTAURANT.id, area_id: 'area-1', number: '1', capacity: 4, status: 'available' },
    { id: 'table-2', restaurant_id: MOCK_RESTAURANT.id, area_id: 'area-1', number: '2', capacity: 4, status: 'available' },
    { id: 'table-3', restaurant_id: MOCK_RESTAURANT.id, area_id: 'area-2', number: 'T1', capacity: 2, status: 'occupied' }
]

export const MOCK_MENU_ITEMS: MenuItem[] = [
    {
        id: 'item-1',
        restaurant_id: MOCK_RESTAURANT.id,
        category_id: 'cat-1',
        name: 'Pollo Asado Superior',
        description: 'Medio pollo con papas y ensalada',
        price: 35000,
        image_url: null,
        preparation_time: 15,
        available: true,
        display_order: 0,
        allergens: null,
        tags: ['popular']
    },
    {
        id: 'item-2',
        restaurant_id: MOCK_RESTAURANT.id,
        category_id: 'cat-1',
        name: 'Pechuga a la Plancha',
        description: 'Acompañada de arroz y vegetales',
        price: 28000,
        image_url: null,
        preparation_time: 12,
        available: true,
        display_order: 1,
        allergens: null,
        tags: null
    }
]

export const MOCK_ORDERS: any[] = [
    {
        id: 'order-1',
        restaurant_id: MOCK_RESTAURANT.id,
        table_id: 'table-3',
        waiter_id: MOCK_PROFILES[1].id,
        order_number: '101',
        status: 'preparing',
        guests: 2,
        total: 63000,
        created_at: new Date().toISOString(),
        order_items: [
            {
                id: 'oi-1',
                menu_item_id: 'item-1',
                quantity: 1,
                unit_price: 35000,
                status: 'preparing',
                menu_item: MOCK_MENU_ITEMS[0]
            },
            {
                id: 'oi-2',
                menu_item_id: 'item-2',
                quantity: 1,
                unit_price: 28000,
                status: 'pending',
                menu_item: MOCK_MENU_ITEMS[1]
            }
        ]
    }
]
