'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import {
    X, Info, TrendingUp, RotateCcw, Flame, Clock, Users, BarChart2,
    ChevronLeft, ChevronRight, Calendar
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, ReferenceLine, LabelList,
    LineChart, Line
} from 'recharts'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Order {
    id: string
    table_id: string
    waiter_id: string
    total: number
    guests: number
    status: string
    created_at: string
    closed_at: string | null
    waiter?: { full_name: string | null }
    table?: { number: string }
}

interface Table {
    id: string
    number: string
    status: string
}

interface AdvancedStats {
    // KPI 1
    avgTicketPerTable: number
    avgTicketPerClient: number
    avgTicketPerTableYesterday: number
    avgTicketPerClientYesterday: number

    // KPI 2 - table rotation
    tableRotation: {
        tableNumber: string
        rotations: number
        avgOccupancyMins: number
        currentStatus: string
    }[]

    // KPI 3 - heatmap
    heatmap: { hour: number; day: number; count: number; revenue: number }[]

    // KPI 4 - avg service time
    waiterServiceTime: { name: string; avgMins: number }[]
    restaurantAvgMins: number

    // KPI 5 - sales by waiter
    waiterSales: { name: string; total: number; tickets: number; orders: number }[]

    // KPI 6 - occupancy & RevPASH
    occupancyPct: number
    totalTables: number
    occupiedTables: number
    revpashByHour: { hour: string; revpash: number }[]
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 06h - 23h
const COL_MIN_WAGE_2026 = 1750905
const COL_MIN_WAGE_DAILY = COL_MIN_WAGE_2026 / 30

// ─── Tooltip component ───────────────────────────────────────────────────────

function InfoTooltip({ text }: { text: string }) {
    const [visible, setVisible] = useState(false)
    return (
        <span className="relative inline-flex items-center">
            <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                style={{ minHeight: 'unset', padding: 0 }}
                onMouseEnter={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
                onFocus={() => setVisible(true)}
                onBlur={() => setVisible(false)}
                aria-label="Más información"
            >
                <Info className="w-3.5 h-3.5" />
            </button>
            {visible && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-xl leading-relaxed">
                    {text}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </span>
            )}
        </span>
    )
}

// ─── Section header ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 flex-shrink-0">
                {icon}
            </div>
            <div>
                <h3 className="text-sm font-bold text-gray-800">{title}</h3>
                <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
        </div>
    )
}

// ─── KPI 1: Ticket Promedio ──────────────────────────────────────────────────

function TicketCard({ stats }: { stats: AdvancedStats }) {
    const pctTable = stats.avgTicketPerTableYesterday > 0
        ? ((stats.avgTicketPerTable - stats.avgTicketPerTableYesterday) / stats.avgTicketPerTableYesterday) * 100
        : null
    const pctClient = stats.avgTicketPerClientYesterday > 0
        ? ((stats.avgTicketPerClient - stats.avgTicketPerClientYesterday) / stats.avgTicketPerClientYesterday) * 100
        : null

    const PctBadge = ({ pct }: { pct: number | null }) => {
        if (pct === null) return <span className="text-xs text-gray-400">Sin datos de ayer</span>
        const isUp = pct >= 0
        return (
            <span className={`text-xs font-semibold ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                {isUp ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}% vs ayer
            </span>
        )
    }

    return (
        <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ticket Promedio</p>
                <InfoTooltip text="Gasto promedio por mesa y por cliente. Permite saber si los meseros están vendiendo bien y si el menú tiene precios adecuados." />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50 rounded-xl p-3">
                    <p className="text-lg font-black text-gray-900">{formatCurrency(stats.avgTicketPerTable)}</p>
                    <p className="text-xs text-gray-500 mb-1">Por mesa</p>
                    <PctBadge pct={pctTable} />
                </div>
                <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-lg font-black text-gray-900">{formatCurrency(stats.avgTicketPerClient)}</p>
                    <p className="text-xs text-gray-500 mb-1">Por cliente</p>
                    <PctBadge pct={pctClient} />
                </div>
            </div>
            <div className="pt-2 border-t border-gray-50 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <p className="text-[10px] text-gray-400">
                    Contexto: 1 ticket promedio hoy equivale a <strong className="text-gray-600">{ (stats.avgTicketPerTable / COL_MIN_WAGE_DAILY).toFixed(1) } días</strong> de salario mínimo ($1.750.905).
                </p>
            </div>
        </div>
    )
}

// ─── KPI 2: Rotación de Mesas ────────────────────────────────────────────────

function TableRotationCard({ stats }: { stats: AdvancedStats }) {
    return (
        <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Rotación de Mesas</p>
                <InfoTooltip text="Cuántas veces cada mesa fue ocupada y liberada hoy. Mesas con < 2 rotaciones o tiempo promedio > 90 min pueden estar perdiendo ingresos." />
            </div>
            <div className="overflow-x-auto -mx-1">
                <table className="w-full text-xs min-w-[380px]">
                    <thead>
                        <tr className="text-gray-400 font-semibold">
                            <th className="text-left pb-2 pl-1">Mesa</th>
                            <th className="text-center pb-2">Rot. hoy</th>
                            <th className="text-center pb-2">Tiempo prom.</th>
                            <th className="text-center pb-2">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {stats.tableRotation.length === 0 ? (
                            <tr><td colSpan={4} className="text-center text-gray-400 py-4">Sin datos hoy</td></tr>
                        ) : (
                            stats.tableRotation.map(row => {
                                const isSlow = row.avgOccupancyMins > 90
                                return (
                                    <tr key={row.tableNumber} className={isSlow ? 'bg-red-50' : ''}>
                                        <td className="py-1.5 pl-1 font-semibold text-gray-800">Mesa {row.tableNumber}</td>
                                        <td className="py-1.5 text-center font-bold text-gray-700">{row.rotations}</td>
                                        <td className={`py-1.5 text-center font-semibold ${isSlow ? 'text-red-600' : 'text-gray-600'}`}>
                                            {row.avgOccupancyMins > 0 ? `${Math.round(row.avgOccupancyMins)} min` : '—'}
                                            {isSlow && ' ⚠️'}
                                        </td>
                                        <td className="py-1.5 text-center">
                                            <span className={`badge ${row.currentStatus === 'occupied' ? 'badge-danger' : row.currentStatus === 'reserved' ? 'badge-warning' : 'badge-success'}`}>
                                                {row.currentStatus === 'occupied' ? 'Ocupada' : row.currentStatus === 'reserved' ? 'Reservada' : 'Libre'}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ─── KPI 3: Heatmap de Horas Pico ───────────────────────────────────────────

function HeatmapCard({ stats }: { stats: AdvancedStats }) {
    const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number; count: number; revenue: number } | null>(null)

    const maxCount = Math.max(...stats.heatmap.map(h => h.count), 1)

    function getOpacity(count: number) {
        if (count === 0) return 0.03
        return 0.15 + (count / maxCount) * 0.82
    }

    return (
        <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Horas Pico (últimos 30 días)</p>
                <InfoTooltip text="Concentración de órdenes por hora y día de la semana. Úsalo para ajustar turnos y anticipar demanda." />
            </div>
            <div className="relative">
                {/* Y axis labels */}
                <div className="flex">
                    <div className="flex flex-col justify-around pr-2" style={{ width: 28 }}>
                        {DAYS.map(d => (
                            <div key={d} className="text-xs text-gray-400 text-right" style={{ fontSize: 10 }}>{d}</div>
                        ))}
                    </div>
                    {/* Grid */}
                    <div className="flex-1 overflow-x-auto">
                        <div style={{ minWidth: 340 }}>
                            {/* X axis labels */}
                            <div className="flex mb-1">
                                {HOURS.map(h => (
                                    <div key={h} className="flex-1 text-center text-gray-400" style={{ fontSize: 9 }}>{h}h</div>
                                ))}
                            </div>
                            {/* Cells */}
                            {DAYS.map((_, dayIdx) => (
                                <div key={dayIdx} className="flex gap-0.5 mb-0.5">
                                    {HOURS.map(hour => {
                                        const cell = stats.heatmap.find(h => h.day === dayIdx && h.hour === hour)
                                        const count = cell?.count ?? 0
                                        const revenue = cell?.revenue ?? 0
                                        return (
                                            <div
                                                key={hour}
                                                className="flex-1 rounded cursor-pointer transition-all hover:scale-110 hover:z-10 relative"
                                                style={{
                                                    height: 20,
                                                    backgroundColor: `rgba(249, 115, 22, ${getOpacity(count)})`,
                                                    outline: hoveredCell?.day === dayIdx && hoveredCell?.hour === hour ? '2px solid #f97316' : 'none'
                                                }}
                                                onMouseEnter={() => setHoveredCell({ day: dayIdx, hour, count, revenue })}
                                                onMouseLeave={() => setHoveredCell(null)}
                                            />
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Tooltip */}
                {hoveredCell && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 shadow-xl whitespace-nowrap z-20 pointer-events-none">
                        <strong>{DAYS[hoveredCell.day]}</strong> {hoveredCell.hour}:00 — {hoveredCell.count} órdenes / {formatCurrency(hoveredCell.revenue)}
                    </div>
                )}
                {/* Legend */}
                <div className="flex items-center gap-1.5 mt-3 justify-end">
                    <span className="text-xs text-gray-400">Bajo</span>
                    {[0.05, 0.25, 0.5, 0.75, 1.0].map(op => (
                        <div key={op} className="w-4 h-3 rounded-sm" style={{ backgroundColor: `rgba(249,115,22,${op})` }} />
                    ))}
                    <span className="text-xs text-gray-400">Alto</span>
                </div>
            </div>
        </div>
    )
}

// ─── KPI 4: Tiempo Promedio de Atención ─────────────────────────────────────

function ServiceTimeCard({ stats }: { stats: AdvancedStats }) {
    const maxMins = Math.max(...stats.waiterServiceTime.map(w => w.avgMins), stats.restaurantAvgMins, 1)

    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload?.length) return null
        return (
            <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
                <p className="font-semibold text-gray-800">{payload[0].payload.name}</p>
                <p className="text-orange-600 font-bold">{payload[0].value} min</p>
            </div>
        )
    }

    return (
        <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tiempo Promedio de Atención</p>
                <InfoTooltip text="Tiempo desde que se crea una orden hasta que se cierra, por mesero. Identifica cuellos de botella en cocina o atención." />
            </div>
            <p className="text-xs text-gray-400 mb-3">Promedio del restaurante hoy: <strong className="text-gray-700">{Math.round(stats.restaurantAvgMins)} min</strong></p>
            {stats.waiterServiceTime.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-6">Sin datos suficientes hoy</div>
            ) : (
                <ResponsiveContainer width="100%" height={Math.max(stats.waiterServiceTime.length * 42, 120)}>
                    <BarChart data={stats.waiterServiceTime} layout="vertical" margin={{ top: 0, right: 50, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                        <XAxis type="number" domain={[0, maxMins * 1.1]} hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            width={90}
                            tickFormatter={val => val.length > 12 ? val.substring(0, 12) + '…' : val}
                        />
                        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <ReferenceLine x={stats.restaurantAvgMins} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Prom.', position: 'top', fontSize: 10, fill: '#94a3b8' }} />
                        <Bar dataKey="avgMins" name="Minutos prom." radius={[0, 4, 4, 0]}
                            fill="#f97316"
                            label={{ position: 'right', fontSize: 10, fill: '#6b7280', formatter: (v: number) => `${Math.round(v)}m` }}
                        >
                            {stats.waiterServiceTime.map((entry, i) => (
                                <rect key={i} fill={entry.avgMins > stats.restaurantAvgMins ? '#ef4444' : '#10b981'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    )
}

// ─── KPI 5: Ventas por Mesero ────────────────────────────────────────────────

function WaiterSalesCard({ stats }: { stats: AdvancedStats }) {
    const [view, setView] = useState<'ventas' | 'ordenes'>('ventas')

    const data = stats.waiterSales.map(w => ({
        name: w.name.split(' ')[0],
        fullName: w.name,
        value: view === 'ventas' ? w.total : w.orders,
        ticket: w.tickets,
    }))

    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload?.length) return null
        const d = payload[0].payload
        return (
            <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs space-y-1">
                <p className="font-semibold text-gray-800">{d.fullName}</p>
                {view === 'ventas' ? (
                    <>
                        <p className="text-emerald-600 font-bold">{formatCurrency(d.value)}</p>
                        <p className="text-gray-500">Ticket prom: {formatCurrency(d.ticket)}</p>
                    </>
                ) : (
                    <p className="text-blue-600 font-bold">{d.value} órdenes</p>
                )}
            </div>
        )
    }

    return (
        <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ventas por Mesero</p>
                    <InfoTooltip text="Ingreso total generado por cada mesero. Un mesero puede tener pocas órdenes pero mesas de alto ticket." />
                </div>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button
                        className={`px-2 py-1 rounded-md text-xs font-semibold transition-all ${view === 'ventas' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}
                        style={{ minHeight: 'unset' }}
                        onClick={() => setView('ventas')}
                    >
                        Ventas
                    </button>
                    <button
                        className={`px-2 py-1 rounded-md text-xs font-semibold transition-all ${view === 'ordenes' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}
                        style={{ minHeight: 'unset' }}
                        onClick={() => setView('ordenes')}
                    >
                        Órdenes
                    </button>
                </div>
            </div>
            {data.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-6">Sin datos hoy</div>
            ) : (
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                            tickFormatter={v => view === 'ventas' ? `$${(v / 1000).toFixed(0)}k` : String(v)}
                        />
                        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                        {view === 'ventas' && (
                            <ReferenceLine 
                                y={COL_MIN_WAGE_DAILY} 
                                stroke="#f87171" 
                                strokeDasharray="3 3" 
                                label={{ value: 'Salario Mín Día', position: 'right', fill: '#f87171', fontSize: 9, fontWeight: 'bold' }} 
                            />
                        )}
                        <Bar dataKey="value" name={view === 'ventas' ? 'Ventas' : 'Órdenes'} fill="#3b82f6" radius={[4, 4, 0, 0]}>
                            <LabelList
                                dataKey={view === 'ventas' ? 'ticket' : 'value'}
                                position="top"
                                style={{ fontSize: 9, fill: '#9ca3af', fontWeight: '600' }}
                                formatter={(v: number) => view === 'ventas' ? `$${(v / 1000).toFixed(0)}k tk` : `${v}`}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    )
}

// ─── KPI 6: Ocupación & RevPASH ──────────────────────────────────────────────

function OccupancyRevpashCard({ stats }: { stats: AdvancedStats }) {
    const pct = Math.round(stats.occupancyPct)
    const gaugeColor = pct >= 80 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'

    // SVG gauge
    const r = 52
    const circ = 2 * Math.PI * r
    const offset = circ - (pct / 100) * circ * 0.75  // 270° arc

    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload?.length) return null
        return (
            <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
                <p className="font-semibold text-gray-600">{payload[0].payload.hour}</p>
                <p className="text-orange-600 font-bold">{formatCurrency(payload[0].value)}/mesa</p>
            </div>
        )
    }

    return (
        <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ocupación & RevPASH</p>
                <InfoTooltip text="Ocupación actual de mesas y Revenue Per Available Seat Hour — eficiencia de ingresos por mesa disponible por hora." />
            </div>
            <div className="grid grid-cols-2 gap-3 items-center mb-4">
                {/* Gauge */}
                <div className="flex flex-col items-center">
                    <svg width={130} height={100} viewBox="0 0 130 100">
                        {/* background arc */}
                        <circle
                            cx={65} cy={80} r={r}
                            fill="none"
                            stroke="#f3f4f6"
                            strokeWidth={12}
                            strokeDasharray={`${circ * 0.75} ${circ}`}
                            strokeDashoffset={0}
                            strokeLinecap="round"
                            transform="rotate(135 65 80)"
                        />
                        {/* progress arc */}
                        <circle
                            cx={65} cy={80} r={r}
                            fill="none"
                            stroke={gaugeColor}
                            strokeWidth={12}
                            strokeDasharray={`${circ * 0.75 * (pct / 100)} ${circ}`}
                            strokeDashoffset={0}
                            strokeLinecap="round"
                            transform="rotate(135 65 80)"
                            style={{ transition: 'stroke-dasharray 0.8s ease' }}
                        />
                        <text x={65} y={78} textAnchor="middle" className="font-black" style={{ fontSize: 22, fill: gaugeColor, fontWeight: 800 }}>
                            {pct}%
                        </text>
                        <text x={65} y={94} textAnchor="middle" style={{ fontSize: 9, fill: '#9ca3af' }}>
                            {stats.occupiedTables}/{stats.totalTables} mesas
                        </text>
                    </svg>
                    <p className="text-xs text-gray-500 -mt-1">Ocupación actual</p>
                </div>
                {/* RevPASH line chart */}
                <div>
                    <p className="text-xs text-gray-400 mb-1 font-semibold">RevPASH por hora</p>
                    {stats.revpashByHour.length > 0 ? (
                        <ResponsiveContainer width="100%" height={90}>
                            <LineChart data={stats.revpashByHour} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
                                <XAxis dataKey="hour" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="revpash" stroke="#f97316" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-gray-400 text-xs py-6">Sin datos hoy</div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export function AdvancedStatsModal({ restaurantId, onClose }: { restaurantId: string; onClose: () => void }) {
    const supabase = createClient()
    const [stats, setStats] = useState<AdvancedStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        return d
    })

    // Date nav helpers
    const dateLabel = selectedDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    const isToday = selectedDate.toDateString() === new Date().toDateString()

    function shiftDate(days: number) {
        setSelectedDate(prev => {
            const d = new Date(prev)
            d.setDate(d.getDate() + days)
            d.setHours(0, 0, 0, 0)
            return d
        })
    }

    const loadStats = useCallback(async () => {
        setLoading(true)

        const dayStart = new Date(selectedDate)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(selectedDate)
        dayEnd.setHours(23, 59, 59, 999)

        const yesterday = new Date(dayStart)
        yesterday.setDate(yesterday.getDate() - 1)
        const ystEnd = new Date(yesterday)
        ystEnd.setHours(23, 59, 59, 999)

        const thirtyDaysAgo = new Date(dayStart)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

        const [todayOrdersRes, ystOrdersRes, tablesRes, heatmapOrdersRes] = await Promise.all([
            supabase
                .from('orders')
                .select('id, table_id, waiter_id, total, guests, status, created_at, closed_at, waiter:profiles(full_name), table:tables(number)')
                .eq('restaurant_id', restaurantId)
                .gte('created_at', dayStart.toISOString())
                .lte('created_at', dayEnd.toISOString()),

            supabase
                .from('orders')
                .select('id, total, guests, status, created_at, closed_at')
                .eq('restaurant_id', restaurantId)
                .gte('created_at', yesterday.toISOString())
                .lte('created_at', ystEnd.toISOString())
                .in('status', ['delivered', 'closed']),

            supabase
                .from('tables')
                .select('id, number, status')
                .eq('restaurant_id', restaurantId),

            supabase
                .from('orders')
                .select('created_at, closed_at, total, status')
                .eq('restaurant_id', restaurantId)
                .gte('created_at', thirtyDaysAgo.toISOString())
                .lte('created_at', dayEnd.toISOString())
                .in('status', ['delivered', 'closed'])
        ])

        const todayOrders: Order[] = (todayOrdersRes.data || []) as any
        const ystOrders = ystOrdersRes.data || []
        const tables: Table[] = (tablesRes.data || []) as any
        const heatmapOrders = heatmapOrdersRes.data || []

        const closedToday = todayOrders.filter(o => ['delivered', 'closed'].includes(o.status))
        const totalSalesToday = closedToday.reduce((s, o) => s + (o.total ?? 0), 0)
        const totalClientsToday = closedToday.reduce((s, o) => s + (o.guests ?? 1), 0)

        // KPI 1
        const avgTicketPerTable = closedToday.length > 0 ? totalSalesToday / closedToday.length : 0
        const avgTicketPerClient = totalClientsToday > 0 ? totalSalesToday / totalClientsToday : 0

        const ystTotal = ystOrders.reduce((s: number, o: any) => s + (o.total ?? 0), 0)
        const ystTables = ystOrders.length
        const ystClients = ystOrders.reduce((s: number, o: any) => s + (o.guests ?? 1), 0)
        const avgTicketPerTableYesterday = ystTables > 0 ? ystTotal / ystTables : 0
        const avgTicketPerClientYesterday = ystClients > 0 ? ystTotal / ystClients : 0

        // KPI 2 - table rotation
        const tableRotation = tables.map(t => {
            const tableOrders = closedToday.filter(o => o.table_id === t.id)
            const rotations = tableOrders.length
            const totalMins = tableOrders.reduce((sum, o) => {
                if (!o.closed_at) return sum
                const diff = (new Date(o.closed_at).getTime() - new Date(o.created_at).getTime()) / 60000
                return sum + diff
            }, 0)
            const avgOccupancyMins = rotations > 0 ? totalMins / rotations : 0
            return { tableNumber: t.number, rotations, avgOccupancyMins, currentStatus: t.status }
        }).sort((a, b) => a.rotations - b.rotations)

        // KPI 3 - heatmap (30 days)
        const heatmapMap: Record<string, { count: number; revenue: number }> = {}
        heatmapOrders.forEach((o: any) => {
            const d = new Date(o.created_at)
            const day = d.getDay()
            const hour = d.getHours()
            const key = `${day}-${hour}`
            if (!heatmapMap[key]) heatmapMap[key] = { count: 0, revenue: 0 }
            heatmapMap[key].count++
            heatmapMap[key].revenue += o.total ?? 0
        })
        const heatmap = Object.entries(heatmapMap).map(([k, v]) => {
            const [day, hour] = k.split('-').map(Number)
            return { day, hour, ...v }
        })

        // KPI 4 - service time by waiter
        const waiterTimeMap: Record<string, { total: number; count: number }> = {}
        closedToday.forEach(o => {
            if (!o.closed_at) return
            const mins = (new Date(o.closed_at).getTime() - new Date(o.created_at).getTime()) / 60000
            const name = (o as any).waiter?.full_name || 'Desconocido'
            if (!waiterTimeMap[name]) waiterTimeMap[name] = { total: 0, count: 0 }
            waiterTimeMap[name].total += mins
            waiterTimeMap[name].count++
        })
        const waiterServiceTime = Object.entries(waiterTimeMap)
            .map(([name, { total, count }]) => ({ name, avgMins: count > 0 ? total / count : 0 }))
            .sort((a, b) => b.avgMins - a.avgMins)

        const restaurantAvgMins = waiterServiceTime.length > 0
            ? waiterServiceTime.reduce((s, w) => s + w.avgMins, 0) / waiterServiceTime.length
            : 0

        // KPI 5 - sales by waiter
        const waiterSalesMap: Record<string, { total: number; orders: number }> = {}
        closedToday.forEach(o => {
            const name = (o as any).waiter?.full_name || 'Desconocido'
            if (!waiterSalesMap[name]) waiterSalesMap[name] = { total: 0, orders: 0 }
            waiterSalesMap[name].total += o.total ?? 0
            waiterSalesMap[name].orders++
        })
        const waiterSales = Object.entries(waiterSalesMap)
            .map(([name, { total, orders }]) => ({ name, total, orders, tickets: orders > 0 ? total / orders : 0 }))
            .sort((a, b) => b.total - a.total)

        // KPI 6 - occupancy & RevPASH
        const occupiedTables = tables.filter(t => t.status === 'occupied').length
        const totalTables = tables.length
        const occupancyPct = totalTables > 0 ? (occupiedTables / totalTables) * 100 : 0

        const revpashMap: Record<number, number> = {}
        closedToday.forEach(o => {
            if (!o.closed_at) return
            const h = new Date(o.created_at).getHours()
            revpashMap[h] = (revpashMap[h] ?? 0) + (o.total ?? 0)
        })
        const revpashByHour = Object.entries(revpashMap)
            .map(([h, total]) => ({
                hour: `${h}h`,
                revpash: totalTables > 0 ? total / totalTables : 0
            }))
            .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))

        setStats({
            avgTicketPerTable, avgTicketPerClient,
            avgTicketPerTableYesterday, avgTicketPerClientYesterday,
            tableRotation, heatmap,
            waiterServiceTime, restaurantAvgMins,
            waiterSales,
            occupancyPct, totalTables, occupiedTables,
            revpashByHour
        })
        setLoading(false)
    }, [restaurantId, selectedDate, supabase])

    useEffect(() => {
        loadStats()
    }, [loadStats])

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col bg-gray-50 animate-fade-in"
            style={{ overflowY: 'auto' }}
        >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
                <button
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
                    style={{ minHeight: 'unset' }}
                    aria-label="Cerrar"
                >
                    <X className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h2 className="text-base font-bold text-gray-900">Estadísticas Avanzadas</h2>
                    <p className="text-xs text-gray-400">6 KPIs de alto impacto</p>
                </div>
                {/* Date picker */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl px-2 py-1">
                    <button
                        onClick={() => shiftDate(-1)}
                        className="p-1 rounded-lg hover:bg-white transition-colors"
                        style={{ minHeight: 'unset' }}
                        aria-label="Día anterior"
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <div className="flex items-center gap-1 px-1">
                        <Calendar className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-xs font-semibold text-gray-700 capitalize" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isToday ? 'Hoy' : selectedDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                        </span>
                    </div>
                    <button
                        onClick={() => shiftDate(1)}
                        className="p-1 rounded-lg hover:bg-white transition-colors disabled:opacity-40"
                        style={{ minHeight: 'unset' }}
                        disabled={isToday}
                        aria-label="Día siguiente"
                    >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : !stats ? null : (
                <div className="px-4 py-5 space-y-6 pb-20 max-w-2xl mx-auto w-full">

                    {/* ── Sección 1: Rendimiento financiero ── */}
                    <div>
                        <SectionHeader
                            icon={<TrendingUp className="w-4 h-4" />}
                            title="Rendimiento Financiero"
                            subtitle="Ticket promedio · Ventas por mesero · Ocupación"
                        />
                        <div className="space-y-4">
                            <TicketCard stats={stats} />
                            <WaiterSalesCard stats={stats} />
                            <OccupancyRevpashCard stats={stats} />
                        </div>
                    </div>

                    {/* ── Sección 2: Eficiencia operativa ── */}
                    <div>
                        <SectionHeader
                            icon={<BarChart2 className="w-4 h-4" />}
                            title="Eficiencia Operativa"
                            subtitle="Rotación · Tiempo de atención · Horas pico"
                        />
                        <div className="space-y-4">
                            <TableRotationCard stats={stats} />
                            <ServiceTimeCard stats={stats} />
                            <HeatmapCard stats={stats} />
                        </div>
                    </div>

                </div>
            )}
        </div>
    )
}
