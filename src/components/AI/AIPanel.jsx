import { useState, useEffect, useRef } from 'react'
import {
  Sparkle, CircleNotch, CheckSquare, Clock, Tag,
  ChartBar, ArrowsClockwise, CaretDown, CaretUp
} from '@phosphor-icons/react'
import { useNotesStore } from '../../store/notesStore'
import { generateInsights, detectTasks } from '../../services/aiService'
import { formatDate, getWordCount, getCharCount } from '../../utils/helpers'
import TagInput from '../common/TagInput'

export default function AIPanel({ noteId }) {
  const note = useNotesStore(s => s.notes[noteId])
  const updateNote = useNotesStore(s => s.updateNote)

  const [insights, setInsights] = useState(null)
  const [tasks, setTasks] = useState(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(true)
  const [tasksOpen, setTasksOpen] = useState(true)
  const [infoOpen, setInfoOpen] = useState(true)
  const debounceRef = useRef(null)

  useEffect(() => {
    setInsights(null)
    setTasks(null)
  }, [noteId])

  if (!note) return null

  const wordCount = getWordCount(note.content)
  const charCount = getCharCount(note.content)

  const fetchInsights = async () => {
    if (!note.content || wordCount < 10) return
    setLoadingInsights(true)
    try {
      const data = await generateInsights(note.content)
      setInsights(data)
    } catch {
      setInsights({ error: true })
    } finally {
      setLoadingInsights(false)
    }
  }

  const fetchTasks = async () => {
    if (!note.content) return
    setLoadingTasks(true)
    try {
      const data = await detectTasks(note.content)
      setTasks(data)
    } catch {
      setTasks({ error: true })
    } finally {
      setLoadingTasks(false)
    }
  }

  const sentimentColor = {
    positive: 'text-green-500',
    neutral: 'text-gray-400',
    negative: 'text-red-400',
  }

  return (
    <div className="h-full flex flex-col overflow-hidden w-[268px]">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <Sparkle className="w-4 h-4 text-brown-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Assistant</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">

        {/* Note Info */}
        <Section
          title="Note Info"
          icon={ChartBar}
          open={infoOpen}
          onToggle={() => setInfoOpen(!infoOpen)}
        >
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Words" value={wordCount} />
            <Stat label="Characters" value={charCount} />
            <Stat label="Created" value={formatDate(note.createdAt)} />
            <Stat label="Updated" value={formatDate(note.updatedAt)} />
          </div>
        </Section>

        {/* Tags */}
        <Section
          title="Tags"
          icon={Tag}
          open={true}
          onToggle={() => {}}
          showToggle={false}
        >
          <TagInput
            tags={note.tags || []}
            onChange={tags => updateNote(note.id, { tags })}
            placeholder="Add tag…"
          />
        </Section>

        {/* AI Insights */}
        <Section
          title="AI Insights"
          icon={Sparkle}
          open={insightsOpen}
          onToggle={() => setInsightsOpen(!insightsOpen)}
          action={
            <button
              onClick={fetchInsights}
              disabled={loadingInsights}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-brown-500 transition-colors"
              title="Generate insights"
            >
              {loadingInsights
                ? <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                : <ArrowsClockwise className="w-3.5 h-3.5" />}
            </button>
          }
        >
          {!insights ? (
            <button
              onClick={fetchInsights}
              disabled={loadingInsights || wordCount < 10}
              className="w-full text-xs text-brown-500 hover:text-brown-600 disabled:opacity-40 disabled:cursor-not-allowed text-left"
            >
              {wordCount < 10 ? 'Write more to get insights' : '✦ Analyze note with AI'}
            </button>
          ) : insights.error ? (
            <p className="text-xs text-red-400">AI not available. Add OPENAI_API_KEY to .env</p>
          ) : (
            <div className="space-y-2">
              {insights.summary && (
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{insights.summary}</p>
              )}
              {insights.sentiment && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Tone:</span>
                  <span className={`text-xs font-medium capitalize ${sentimentColor[insights.sentiment] || 'text-gray-500'}`}>
                    {insights.sentiment}
                  </span>
                </div>
              )}
              {insights.topics?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {insights.topics.map(t => (
                    <span key={t} className="text-xs px-1.5 py-0.5 bg-brown-50 dark:bg-brown-950/50 text-brown-600 dark:text-brown-400 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {insights.suggestions?.length > 0 && (
                <div className="space-y-1">
                  {insights.suggestions.map((s, i) => (
                    <p key={i} className="text-xs text-gray-500 dark:text-gray-500 flex gap-1.5">
                      <span className="text-brown-400 flex-shrink-0">→</span>
                      {s}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Task Detection */}
        <Section
          title="Action Items"
          icon={CheckSquare}
          open={tasksOpen}
          onToggle={() => setTasksOpen(!tasksOpen)}
          action={
            <button
              onClick={fetchTasks}
              disabled={loadingTasks}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-brown-500 transition-colors"
              title="Detect tasks"
            >
              {loadingTasks
                ? <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                : <ArrowsClockwise className="w-3.5 h-3.5" />}
            </button>
          }
        >
          {!tasks ? (
            <button
              onClick={fetchTasks}
              disabled={loadingTasks}
              className="text-xs text-brown-500 hover:text-brown-600 text-left"
            >
              ◎ Detect tasks &amp; reminders
            </button>
          ) : tasks.error ? (
            <p className="text-xs text-red-400">AI not available</p>
          ) : (
            <div className="space-y-2">
              {tasks.tasks?.length > 0 && (
                <div className="space-y-1">
                  {tasks.tasks.map((t, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <CheckSquare className="w-3 h-3 text-brown-400 flex-shrink-0 mt-0.5" />
                      {t}
                    </div>
                  ))}
                </div>
              )}
              {tasks.reminders?.length > 0 && (
                <div className="space-y-1">
                  {tasks.reminders.map((r, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <Clock className="w-3 h-3 text-orange-400 flex-shrink-0 mt-0.5" />
                      {r.text} {r.date && <span className="text-orange-400 ml-1">({r.date})</span>}
                    </div>
                  ))}
                </div>
              )}
              {!tasks.tasks?.length && !tasks.reminders?.length && (
                <p className="text-xs text-gray-400 dark:text-gray-600">No action items found</p>
              )}
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, open, onToggle, children, action, showToggle = true }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{title}</span>
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {action}
          {showToggle && (
            open
              ? <CaretUp className="w-3.5 h-3.5 text-gray-400" />
              : <CaretDown className="w-3.5 h-3.5 text-gray-400" />
          )}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3">
          {children}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="text-center py-1.5 bg-white dark:bg-gray-800 rounded-lg">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-600">{label}</p>
    </div>
  )
}
