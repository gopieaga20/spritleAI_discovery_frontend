import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../api/client.js'

export default function ConfigEditor() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [parseError, setParseError] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['config'],
    queryFn: () => apiClient.get('/config/').then((r) => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => apiClient.put('/config/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] })
      setEditing(false)
      setParseError('')
    },
    onError: (err) => {
      setParseError(err.response?.data?.detail || 'Save failed.')
    },
  })

  const startEdit = () => {
    setDraft(JSON.stringify(data, null, 2))
    setParseError('')
    setEditing(true)
  }

  const handleSave = () => {
    try {
      const parsed = JSON.parse(draft)
      saveMutation.mutate(parsed)
    } catch {
      setParseError('Invalid JSON — please fix syntax errors before saving.')
    }
  }

  if (isLoading) return <div className="text-slate-400 text-sm p-4 animate-pulse">Loading config…</div>
  if (isError) return <div className="text-red-400 text-sm p-4">Failed to load config.</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Platform Configuration</h2>
        {!editing ? (
          <button
            onClick={startEdit}
            className="px-4 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(false); setParseError('') }}
              className="px-4 py-2 text-xs rounded-lg border border-white/15 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="px-4 py-2 text-xs rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold transition-colors"
            >
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {parseError && (
        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {parseError}
        </p>
      )}

      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
          rows={30}
          className="w-full rounded-xl bg-[#0b0e17] border border-white/10 px-4 py-3 text-xs text-green-300 font-mono resize-y focus:outline-none focus:border-blue-500"
        />
      ) : (
        <pre className="w-full overflow-x-auto rounded-xl bg-[#0b0e17] border border-white/10 px-4 py-3 text-xs text-slate-300 font-mono max-h-[60vh]">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}
