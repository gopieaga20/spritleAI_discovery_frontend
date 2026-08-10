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

export default function OtpModal({ onVerified }) {
  const [step, setStep] = useState('email') // 'email' | 'otp'
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
    onSuccess: () => {
      setStep('otp')
      setError('')
    },
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0f172a] p-8 shadow-2xl">
        {step === 'email' ? (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">Almost there!</h2>
            <p className="text-slate-400 text-sm mb-6">
              Enter your details to receive your AI readiness report. We'll send a one-time code to your email.
            </p>
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Mobile Number <span className="text-slate-600">(optional)</span></label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="rounded-lg bg-white/5 border border-white/10 px-2 py-3 text-white text-sm focus:outline-none focus:border-blue-500 w-28 shrink-0"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-[#0f172a]">{c.label}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={requestMutation.isPending}
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 text-sm transition-colors"
              >
                {requestMutation.isPending ? 'Sending…' : 'Send verification code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">Check your inbox</h2>
            <p className="text-slate-400 text-sm mb-6">
              We sent a 6-digit code to <span className="text-blue-400">{email}</span>. Enter it below to view your results.
            </p>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Verification code</label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white text-2xl tracking-widest text-center focus:outline-none focus:border-blue-500"
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              {resent && <p className="text-green-400 text-xs">A new code was sent to {email}.</p>}
              <button
                type="submit"
                disabled={verifyMutation.isPending || otp.length < 6}
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 text-sm transition-colors"
              >
                {verifyMutation.isPending ? 'Verifying…' : 'Verify & see results'}
              </button>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={requestMutation.isPending}
                  className="text-slate-500 text-xs hover:text-blue-400 disabled:opacity-40 transition-colors"
                >
                  {requestMutation.isPending ? 'Sending…' : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(''); setError(''); setResent(false) }}
                  className="text-slate-500 text-xs hover:text-slate-300 transition-colors"
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
