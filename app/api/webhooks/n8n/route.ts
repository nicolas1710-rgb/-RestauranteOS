import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { event, data, restaurant_id } = await request.json()

        if (!event || !restaurant_id) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
        }

        // Get webhook URL for this restaurant (use service role client)
        const { createClient } = await import('@supabase/supabase-js')
        const adminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: restaurant } = await adminClient
            .from('restaurants')
            .select('n8n_webhook_url, name')
            .eq('id', restaurant_id)
            .single()

        if (!restaurant?.n8n_webhook_url) {
            return NextResponse.json({ ok: true, skipped: 'No webhook configured' })
        }

        // Forward event to n8n
        const payload = {
            event,
            timestamp: new Date().toISOString(),
            restaurant: restaurant.name,
            data,
        }

        const res = await fetch(restaurant.n8n_webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })

        return NextResponse.json({ ok: true, status: res.status })
    } catch (err: any) {
        console.error('Webhook error:', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
