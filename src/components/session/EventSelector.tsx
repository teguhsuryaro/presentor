import { useState, useEffect } from 'react'
import { Select, Input, Button } from '../ui'
import { getEvents, createEvent } from '../../services/session.service'
import { useAuth } from '../../context/AuthContext'
import { Plus } from 'lucide-react'

interface EventSelectorProps {
  value: string | undefined
  onChange: (value: string | undefined) => void
  disabled?: boolean
}

export function EventSelector({ value, onChange, disabled }: EventSelectorProps) {
  const [events, setEvents] = useState<any[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [newEventName, setNewEventName] = useState('')
  const [newEventYear, setNewEventYear] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const data = await getEvents()
      setEvents(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreate = async () => {
    if (!newEventName.trim() || !user) return
    setIsLoading(true)
    try {
      const newEvent = await createEvent({
        name: newEventName,
        academic_year: newEventYear || undefined
      }, user.id)
      
      await fetchEvents()
      onChange(newEvent.id)
      setIsCreating(false)
      setNewEventName('')
      setNewEventYear('')
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const options = [
    { value: '', label: '-- Tidak Terikat Event --' },
    ...events.map(e => ({ value: e.id, label: e.name + (e.academic_year ? ` (${e.academic_year})` : '') }))
  ]

  if (isCreating) {
    return (
      <div className="space-y-3 p-3 border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-bg)]">
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Buat Event Baru</h4>
        <Input 
          label="Nama Event *"
          value={newEventName}
          onChange={(e) => setNewEventName(e.target.value)}
          placeholder="Misal: OSPEK 2026"
          disabled={isLoading}
        />
        <Input 
          label="Tahun Ajaran"
          value={newEventYear}
          onChange={(e) => setNewEventYear(e.target.value)}
          placeholder="Misal: 2026/2027"
          disabled={isLoading}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={isLoading || !newEventName.trim()} isLoading={isLoading}>
            Simpan
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Select
        label="Event / Kegiatan"
        value={value || ''}
        onChange={(val) => onChange(val === '' ? undefined : val)}
        options={options}
        disabled={disabled || isLoading}
      />
      <Button 
        variant="ghost" 
        size="sm" 
        leftIcon={<Plus size={16} />}
        onClick={() => setIsCreating(true)}
        disabled={disabled}
        className="w-full text-[var(--color-text-secondary)] justify-start border border-dashed border-[var(--color-border)]"
      >
        Buat Event Baru
      </Button>
    </div>
  )
}
