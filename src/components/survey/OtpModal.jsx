import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import apiClient from '../../api/client.js'

const COUNTRY_CODES = [
  { code: '+91', label: 'IN +91' },
  { code: '+1',  label: 'US +1' },
  { code: '+44', label: 'UK +44' },
  { code: '+971', label: 'AE +971' },
  { code: '+65', label: 'SG +65' },
  { code: '+61', label: 'AU +61' },
  { code: '+49', label: 'DE +49' },
  { code: '+33', label: 'FR +33' },
  { code: '+81', label: 'JP +81' },
  { code: '+86', label: 'CN +86' },
]

export default function OtpModal({ onVerified, onClose }) {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)

  const requestMutation = useMutation({
    mutationFn: (data) => apiClient.post('/otp/request/', data),
    onSuccess: () => { setStep('otp'); setError('') },
    onError: (err) => {
      setError(err.response?.data?.detail || 'Failed to send OTP. Please try again.')
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (data) => apiClient.post('/otp/verify/', data),
    onSuccess: () => {
      setError('')
      onVerified({ email, company_name: company, full_name: name })
    },
    onError: (err) => {
      setError(err.response?.data?.detail || 'Invalid or expired code. Please try again.')
    },
  })

  const handleRequestOtp = (e) => {
    e.preventDefault()
    setError('')
    setResent(false)
    const phoneNumber = phone.trim() ? `${countryCode}${phone.trim()}` : ''
    requestMutation.mutate({ email, full_name: name, company_name: company, phone_number: phoneNumber })
  }

  const handleResend = () => {
    setError('')
    setResent(false)
    const phoneNumber = phone.trim() ? `${countryCode}${phone.trim()}` : ''
    requestMutation.mutate(
      { email, full_name: name, company_name: company, phone_number: phoneNumber },
      { onSuccess: () => { setOtp(''); setResent(true) } },
    )
  }

  const handleVerifyOtp = (e) => {
    e.preventDefault()
    setError('')
    verifyMutation.mutate({ email, otp_code: otp })
  }

  return (
    <div
      className="no-print"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(22,35,43,0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, padding: 16,
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 440,
          background: 'var(--ds-card)',
          border: '1px solid var(--ds-line)',
          borderRadius: 14,
          padding: 32,
          fontFamily: "'IBM Plex Sans', sans-serif",
          color: 'var(--ds-ink)',
          position: 'relative',
        }}
      >
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: 14, right: 14,
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: '1px solid var(--ds-line)',
              color: 'var(--ds-ink-faint)', fontSize: 16, cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ds-ink)'; e.currentTarget.style.borderColor = 'var(--ds-ink-soft)'; e.currentTarget.style.background = 'var(--ds-paper)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ds-ink-faint)'; e.currentTarget.style.borderColor = 'var(--ds-line)'; e.currentTarget.style.background = 'none' }}
          >
            ✕
          </button>
        )}
        {step === 'email' ? (
          <>
            <h2
              className="font-newsreader"
              style={{ fontSize: 26, fontWeight: 500, margin: '0 0 8px' }}
            >
              Almost there!
            </h2>
            <p style={{ fontSize: 14, color: 'var(--ds-ink-soft)', margin: '0 0 24px', lineHeight: 1.6 }}>
              Enter your details to receive your AI readiness report. We'll send a one-time code to your email.
            </p>

            <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="ds-label">Full Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith" className="ds-input" />
              </div>
              <div>
                <label className="ds-label">Work Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com" className="ds-input" />
              </div>
              <div>
                <label className="ds-label">Company Name</label>
                <input type="text" required value={company} onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Corp" className="ds-input" />
              </div>
              <div>
                <label className="ds-label">
                  Mobile Number{' '}
                  <span style={{ color: 'var(--ds-ink-faint)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="ds-select"
                    style={{ width: 110, flexShrink: 0 }}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210" className="ds-input" style={{ flex: 1 }} />
                </div>
              </div>

              {error && (
                <p style={{ fontSize: 13, color: '#c0392b', margin: 0 }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={requestMutation.isPending}
                className="ds-btn ds-btn-solid"
                style={{ justifyContent: 'center', marginTop: 4 }}
              >
                {requestMutation.isPending ? 'Sending…' : 'Send verification code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2
              className="font-newsreader"
              style={{ fontSize: 26, fontWeight: 500, margin: '0 0 8px' }}
            >
              Check your inbox
            </h2>
            <p style={{ fontSize: 14, color: 'var(--ds-ink-soft)', margin: '0 0 24px', lineHeight: 1.6 }}>
              We sent a 6-digit code to{' '}
              <span style={{ color: 'var(--ds-teal)', fontWeight: 600 }}>{email}</span>.
              {' '}Enter it below to view your results.
            </p>

            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="ds-label">Verification code</label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="font-plex-mono ds-input"
                  style={{ fontSize: 28, letterSpacing: '0.35em', textAlign: 'center', padding: '14px 16px' }}
                />
              </div>

              {error && <p style={{ fontSize: 13, color: '#c0392b', margin: 0 }}>{error}</p>}
              {resent && (
                <p style={{ fontSize: 13, color: 'var(--ds-teal)', margin: 0 }}>
                  A new code was sent to {email}.
                </p>
              )}

              <button
                type="submit"
                disabled={verifyMutation.isPending || otp.length < 6}
                className="ds-btn ds-btn-solid"
                style={{ justifyContent: 'center', marginTop: 4 }}
              >
                {verifyMutation.isPending ? 'Verifying…' : 'Verify & see results'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4 }}>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={requestMutation.isPending}
                  style={{
                    fontSize: 13, color: 'var(--ds-ink-faint)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    fontFamily: 'inherit', transition: 'color 0.15s',
                  }}
                >
                  {requestMutation.isPending ? 'Sending…' : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(''); setError(''); setResent(false) }}
                  style={{
                    fontSize: 13, color: 'var(--ds-ink-faint)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    fontFamily: 'inherit', transition: 'color 0.15s',
                  }}
                >
                  Use a different email
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
