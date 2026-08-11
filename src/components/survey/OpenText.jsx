export default function OpenText({ value, onChange, placeholder = 'Type your answer…' }) {
  return (
    <textarea
      className="ds-textarea"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={5}
      placeholder={placeholder}
    />
  )
}
