export default function OpenText({ value, onChange, placeholder = 'Type your answer...' }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      placeholder={placeholder}
      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-blue-500 leading-relaxed"
    />
  )
}
