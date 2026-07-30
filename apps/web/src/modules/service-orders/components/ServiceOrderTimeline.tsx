import React from 'react'
import { CheckCircle2, Clock, PackagePlus, PenTool, Edit3 } from 'lucide-react'
import type { TimelineEvent } from '../types/serviceOrder.types'

interface Props {
  events: TimelineEvent[]
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  STATUS_CHANGE: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  PART_ADDED: <PackagePlus className="w-4 h-4 text-blue-500" />,
  SERVICE_ADDED: <PenTool className="w-4 h-4 text-purple-500" />,
  NOTE_ADDED: <Edit3 className="w-4 h-4 text-amber-500" />
}

export function ServiceOrderTimeline({ events }: Props) {
  if (!events || events.length === 0) {
    return <div className="text-sm text-muted-foreground p-4 text-center">Nenhum evento registrado.</div>
  }

  return (
    <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
      {events.map((event, index) => (
        <div key={event.id || index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
            {EVENT_ICONS[event.type] || <Clock className="w-4 h-4 text-muted-foreground" />}
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm">{event.description}</span>
              <time className="text-xs text-muted-foreground font-mono">{new Date(event.createdAt).toLocaleDateString('pt-BR')} {new Date(event.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time>
            </div>
            <div className="text-xs text-muted-foreground">Por {event.createdBy?.name || 'Sistema'}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
