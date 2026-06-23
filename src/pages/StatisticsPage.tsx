import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, Legend } from 'recharts'
import { Card, Skeleton, AnimatedNumber } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { Activity, Calendar } from 'lucide-react'
import {
  getDashboardStatistics,
  getAttendanceBySession,
  getAttendanceTrend,
  getAttendanceByTime,
  type DashboardStats,
  type SessionAttendanceData,
  type TrendData,
  type TimeDistributionData
} from '../services/statistics.service'

const COLORS = {
  accent: '#6C5CE7',
  accentHover: '#5A4BD1',  
  accentSoft: '#F0EDFF',
  border: '#E0E3EB',
  text: '#2D3436',
  textSecondary: '#636E72',
  success: '#00B894'
}

export function StatisticsPage() {
  const { addToast } = useToast()
  
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [sessionData, setSessionData] = useState<SessionAttendanceData[]>([])
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [timeData, setTimeData] = useState<TimeDistributionData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    setIsLoading(true)
    try {
      const [overallStats, bySession, trend, byTime] = await Promise.all([
        getDashboardStatistics(),
        getAttendanceBySession(),
        getAttendanceTrend(),
        getAttendanceByTime()
      ])
      
      setStats(overallStats)
      setSessionData(bySession)
      setTrendData(trend)
      setTimeData(byTime)
    } catch (e: any) {
      addToast({ type: 'error', title: 'Gagal', message: 'Gagal memuat statistik: ' + e.message })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !stats) {
    return (
      <div className="space-y-6 pb-20">
        <h1 className="text-2xl font-bold font-[var(--font-display)]">Statistik & Analisis</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton variant="card" height="120px" />
          <Skeleton variant="card" height="120px" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton variant="card" height="400px" />
          <Skeleton variant="card" height="400px" />
        </div>
      </div>
    )
  }

  // Calculate overall attendance for the donut chart
  const overallDonutData = [
    { name: 'Hadir', value: stats.totalAttended },
    { name: 'Belum Hadir', value: stats.totalParticipants - stats.totalAttended }
  ]

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-[var(--font-display)] text-[var(--color-text-primary)]">
          Statistik & Analisis
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Visualisasi data kehadiran dan tren partisipasi.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Total Sesi</p>
              <div className="mt-1 text-3xl font-bold font-[var(--font-display)] text-[var(--color-text-primary)]">
                <AnimatedNumber value={stats.totalSessions} />
              </div>
            </div>
            <div className="p-3 bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-[var(--radius-md)]">
              <Calendar size={20} strokeWidth={2} />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-[var(--color-accent)]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Rata-rata Hadir</p>
              <div className="mt-1 text-3xl font-bold font-[var(--font-display)] text-[var(--color-accent)]">
                <AnimatedNumber value={Math.round(stats.attendancePercentage)} />%
              </div>
            </div>
            <div className="p-3 bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-[var(--radius-md)]">
              <Activity size={20} strokeWidth={2} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart: Overall Attendance */}
        <Card className="p-6">
          <h2 className="text-lg font-bold font-[var(--font-display)] mb-6 text-[var(--color-text-primary)]">
            Persentase Kehadiran Keseluruhan
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={overallDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell key="cell-0" fill={COLORS.accent} />
                  <Cell key="cell-1" fill={COLORS.border} />
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [new Intl.NumberFormat('id-ID').format(value) + ' Orang', '']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #E0E3EB', backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bar Chart: Comparison between Sessions */}
        <Card className="p-6">
          <h2 className="text-lg font-bold font-[var(--font-display)] mb-6 text-[var(--color-text-primary)]">
            Tingkat Kehadiran Per Sesi
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: COLORS.textSecondary }}
                  tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: COLORS.textSecondary }}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--color-surface-hover)' }}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #E0E3EB', backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'persentase') return [`${value}%`, 'Kehadiran']
                    if (name === 'hadir') return [`${value} Orang`, 'Hadir']
                    return [value, name]
                  }}
                />
                <Bar dataKey="persentase" fill={COLORS.accent} radius={[6, 6, 0, 0]} name="Kehadiran (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Area Chart: Attendance Trend */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-bold font-[var(--font-display)] mb-6 text-[var(--color-text-primary)]">
            Tren Kehadiran
          </h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPersentase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} />
                <XAxis 
                  dataKey="session" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: COLORS.textSecondary }}
                  tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: COLORS.textSecondary }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '10px', border: '1px solid #E0E3EB', backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  labelStyle={{ fontWeight: 'bold', color: COLORS.text, marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="persentase" 
                  stroke={COLORS.accent} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPersentase)" 
                  name="Kehadiran (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Area Chart: Time Distribution */}
        {timeData.length > 0 && (
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-lg font-bold font-[var(--font-display)] mb-6 text-[var(--color-text-primary)]">
              Distribusi Waktu Presensi
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} />
                  <XAxis 
                    dataKey="hour" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: COLORS.textSecondary }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: COLORS.textSecondary }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--color-surface-hover)' }}
                    contentStyle={{ borderRadius: '10px', border: '1px solid #E0E3EB', backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(value: any) => [`${value} Presensi`, 'Jumlah']}
                  />
                  <Bar dataKey="count" fill={COLORS.success} radius={[6, 6, 0, 0]} name="Jumlah Presensi" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mt-4 text-center">
              Grafik ini menunjukkan jam-jam tersibuk saat peserta melakukan presensi.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
