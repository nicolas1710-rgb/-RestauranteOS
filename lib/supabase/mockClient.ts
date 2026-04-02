import { MOCK_RESTAURANT, MOCK_PROFILES, MOCK_AREAS, MOCK_TABLES, MOCK_MENU_ITEMS, MOCK_ORDERS } from '@/lib/mockData'

// Simplified stateful mock store
const mockStore: any = {
    restaurants: [MOCK_RESTAURANT],
    profiles: MOCK_PROFILES,
    areas: MOCK_AREAS,
    tables: MOCK_TABLES,
    menu_categories: [
        { id: 'cat-1', restaurant_id: MOCK_RESTAURANT.id, name: 'Pollo', icon: '🍗', display_order: 0, active: true },
        { id: 'cat-2', restaurant_id: MOCK_RESTAURANT.id, name: 'Bebidas', icon: '🥤', display_order: 1, active: true }
    ],
    menu_items: MOCK_MENU_ITEMS,
    orders: MOCK_ORDERS
}

function loadStore() {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('restaurant_mock_store')
    if (saved) {
        try {
            const parsed = JSON.parse(saved)
            Object.assign(mockStore, parsed)
        } catch (e) {
            console.error('Error loading mock store:', e)
        }
    }
}

function saveStore() {
    if (typeof window === 'undefined') return
    localStorage.setItem('restaurant_mock_store', JSON.stringify(mockStore))
}

// Ensure store is loaded on start
loadStore()

export function createMockSupabaseClient() {
    const chainable = (table: string, query: string) => {
        const data = mockStore[table] || []
        
        const obj: any = {
            data: data,
            error: null,
            count: Array.isArray(data) ? data.length : 0,
            
            select: (q?: string, opts?: any) => {
                // Simplified selection
                obj.data = mockStore[table] || []
                if (opts?.count) obj.count = obj.data.length
                return obj
            },
            
            eq: (col: string, val: any) => {
                if (Array.isArray(obj.data)) {
                    obj.data = obj.data.filter((item: any) => item[col] === val)
                }
                return obj
            },
            
            in: (col: string, vals: any[]) => {
                if (Array.isArray(obj.data)) {
                    obj.data = obj.data.filter((item: any) => vals.includes(item[col]))
                }
                return obj
            },
            
            order: (col: string, opts?: any) => {
                if (Array.isArray(obj.data)) {
                    obj.data = [...obj.data].sort((a, b) => {
                        const valA = a[col]; const valB = b[col]
                        const factor = opts?.ascending === false ? -1 : 1
                        return valA > valB ? factor : valA < valB ? -factor : 0
                    })
                }
                return obj
            },
            
            single: () => {
                const res = Array.isArray(obj.data) ? obj.data[0] : obj.data
                return { data: res || null, error: res ? null : { message: 'Not found' } }
            },
            
            insert: async (newData: any) => {
                const tableData = mockStore[table] || []
                const items = Array.isArray(newData) ? newData : [newData]
                const added = items.map(item => ({
                    id: Math.random().toString(36).substr(2, 9),
                    created_at: new Date().toISOString(),
                    ...item
                }))
                mockStore[table] = [...tableData, ...added]
                saveStore()
                return { data: Array.isArray(newData) ? added : added[0], error: null }
            },
            
            upsert: async (newData: any, opts?: any) => {
                const tableData = mockStore[table] || []
                const items = Array.isArray(newData) ? newData : [newData]
                // Very simplified upsert (mostly just inserts)
                mockStore[table] = [...tableData, ...items]
                saveStore()
                return { data: newData, error: null }
            },
            
            update: async (patch: any) => {
                // Simplified update: assumes eq() was called before to filter obj.data
                const tableData = mockStore[table] || []
                const targets = obj.data.map((t: any) => t.id)
                mockStore[table] = tableData.map((item: any) => 
                    targets.includes(item.id) ? { ...item, ...patch } : item
                )
                saveStore()
                return { data: patch, error: null }
            },
            
            delete: async () => {
                // Simplified delete: assumes eq() was called
                const tableData = mockStore[table] || []
                const targets = obj.data.map((t: any) => t.id)
                mockStore[table] = tableData.filter((item: any) => !targets.includes(item.id))
                saveStore()
                return { data: null, error: null }
            },

            match: () => obj,
            limit: () => obj,
            rpc: () => obj,
        }
        
        obj.then = (cb: any) => Promise.resolve({ data: obj.data, error: obj.error, count: obj.count }).then(cb)
        return obj
    }

    return {
        auth: {
            getUser: async () => {
                let id = null
                if (typeof window !== 'undefined') {
                    id = localStorage.getItem('mock_user_id')
                }
                if (!id) return { data: { user: null }, error: null }
                const profile = mockStore.profiles.find((p: any) => p.id === id)
                return { data: { user: { id, email: profile?.email || (profile?.role + '@a') } }, error: null }
            },
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signOut: async () => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('mock_user_id')
                    localStorage.removeItem('mock_user_role')
                    document.cookie = "mock_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                }
                return { error: null }
            },
            signInWithPassword: async ({ email }: { email: string }) => {
                // Support new email format admin@a
                const profile = mockStore.profiles.find((p: any) => {
                    const prefix = p.role === 'admin' ? 'admin' : p.role === 'waiter' ? 'mesero' : 'cocina';
                    return email.startsWith(prefix);
                })
                if (profile) return { data: { user: { id: profile.id, email }, session: {} }, error: null }
                return { data: { user: null, session: null }, error: { message: 'Credenciales inválidas' } }
            },
            getSession: async () => ({ data: { session: null }, error: null }),
        },
        from: (table: string) => chainable(table, '*'),
        channel: () => ({ on: () => ({ subscribe: () => ({}) }), unsubscribe: () => { } }),
        removeChannel: () => { }
    } as any
}
