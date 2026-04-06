'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

interface BillingStatus {
  plan: string
  searches_used: number
  searches_limit: number
  searches_remaining: number
  autofill_credits: number
  period_start: string | null
}

function BillingContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const success = searchParams.get('success') === 'true'
  const canceled = searchParams.get('canceled') === 'true'

  useEffect(() => {
    fetch('/api/billing/status')
      .then(r => r.json())
      .then(data => {
        if (data.success) setStatus(data.data)
        else setError(data.error)
      })
      .catch(() => setError('Failed to load billing status'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCheckout(type: 'pro' | 'autofill') {
    setActionLoading(type)
    setError(null)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to start checkout')
      }
    } catch {
      setError('Failed to start checkout')
    } finally {
      setActionLoading(null)
    }
  }

  async function handlePortal() {
    setActionLoading('portal')
    setError(null)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to open billing portal')
      }
    } catch {
      setError('Failed to open billing portal')
    } finally {
      setActionLoading(null)
    }
  }

  const isPro = status?.plan === 'pro'
  const searchPct = status
    ? Math.min(100, Math.round((status.searches_used / status.searches_limit) * 100))
    : 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1a365d' }}>Billing & Plan</h1>
        <p className="mt-1" style={{ color: '#718096' }}>
          Manage your RedTape subscription and usage.
        </p>
      </div>

      {/* Success / canceled banners */}
      {success && (
        <div className="mb-4 rounded-md px-4 py-3 text-sm font-medium"
          style={{ background: '#c6f6d5', color: '#276749' }}>
          Payment successful! Your plan has been updated.
        </div>
      )}
      {canceled && (
        <div className="mb-4 rounded-md px-4 py-3 text-sm font-medium"
          style={{ background: '#fed7d7', color: '#9b2c2c' }}>
          Checkout canceled. No charges were made.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md px-4 py-3 text-sm font-medium"
          style={{ background: '#fed7d7', color: '#9b2c2c' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl p-8 text-center" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
          <p style={{ color: '#718096' }}>Loading billing info...</p>
        </div>
      ) : status ? (
        <div className="flex flex-col gap-4">
          {/* Current plan card */}
          <div className="rounded-xl p-6" style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: '#1a365d' }}>Current Plan</h2>
              <span
                className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide"
                style={isPro
                  ? { background: '#1a365d', color: '#fff' }
                  : { background: '#e2e8f0', color: '#4a5568' }
                }
              >
                {isPro ? 'Pro' : 'Free'}
              </span>
            </div>

            {/* Search usage */}
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1" style={{ color: '#4a5568' }}>
                <span>Searches used this year</span>
                <span className="font-medium">{status.searches_used} / {status.searches_limit}</span>
              </div>
              <div className="w-full rounded-full h-2" style={{ background: '#e2e8f0' }}>
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${searchPct}%`,
                    background: searchPct >= 100 ? '#e53e3e' : searchPct >= 80 ? '#d69e2e' : '#1a365d',
                  }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: '#718096' }}>
                {status.searches_remaining} search{status.searches_remaining !== 1 ? 'es' : ''} remaining
              </p>
            </div>

            {/* Autofill credits (Free only) */}
            {!isPro && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #e2e8f0' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#4a5568' }}>Autofill credits</span>
                  <span className="text-sm font-semibold" style={{ color: '#1a365d' }}>
                    {status.autofill_credits} credit{status.autofill_credits !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: '#718096' }}>
                  Each credit lets you auto-fill one PDF form.
                </p>
              </div>
            )}
            {isPro && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #e2e8f0' }}>
                <p className="text-sm" style={{ color: '#38a169' }}>
                  Unlimited autofill included with Pro.
                </p>
              </div>
            )}
          </div>

          {/* Action card */}
          <div className="rounded-xl p-6" style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {isPro ? (
              <>
                <h2 className="text-lg font-semibold mb-1" style={{ color: '#1a365d' }}>Manage Subscription</h2>
                <p className="text-sm mb-4" style={{ color: '#718096' }}>
                  Update payment method, view invoices, or cancel your plan.
                </p>
                <button
                  onClick={handlePortal}
                  disabled={actionLoading === 'portal'}
                  className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
                  style={{ background: '#1a365d', color: '#fff' }}
                >
                  {actionLoading === 'portal' ? 'Loading...' : 'Manage Subscription'}
                </button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-1" style={{ color: '#1a365d' }}>Upgrade Your Plan</h2>
                <p className="text-sm mb-4" style={{ color: '#718096' }}>
                  Get more searches and unlimited autofill.
                </p>

                {/* Pro plan */}
                <div className="rounded-lg p-4 mb-3" style={{ background: '#ebf4ff', border: '1px solid #bee3f8' }}>
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <span className="font-semibold text-sm" style={{ color: '#1a365d' }}>Pro Plan</span>
                      <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: '#1a365d', color: '#fff' }}>
                        $4.99/year
                      </span>
                    </div>
                  </div>
                  <ul className="text-xs mt-2 space-y-1" style={{ color: '#2a4a7f' }}>
                    <li>15 searches per year</li>
                    <li>Unlimited PDF autofill</li>
                    <li>Priority support</li>
                  </ul>
                  <button
                    onClick={() => handleCheckout('pro')}
                    disabled={actionLoading === 'pro'}
                    className="mt-3 w-full py-2 px-4 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
                    style={{ background: '#1a365d', color: '#fff' }}
                  >
                    {actionLoading === 'pro' ? 'Loading...' : 'Upgrade to Pro'}
                  </button>
                </div>

                {/* Autofill credit */}
                <div className="rounded-lg p-4" style={{ background: '#f7fafc', border: '1px solid #e2e8f0' }}>
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <span className="font-semibold text-sm" style={{ color: '#1a365d' }}>Autofill Credit</span>
                      <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: '#e2e8f0', color: '#4a5568' }}>
                        $1.99 one-time
                      </span>
                    </div>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#718096' }}>
                    One credit to auto-fill a single PDF form with your profile data.
                  </p>
                  <button
                    onClick={() => handleCheckout('autofill')}
                    disabled={actionLoading === 'autofill'}
                    className="mt-3 w-full py-2 px-4 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
                    style={{ background: '#e2e8f0', color: '#1a365d' }}
                  >
                    {actionLoading === 'autofill' ? 'Loading...' : 'Buy Autofill Credit ($1.99)'}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Plan comparison */}
          <div className="rounded-xl p-6" style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 className="text-base font-semibold mb-3" style={{ color: '#1a365d' }}>Plan Comparison</h2>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th className="text-left pb-2 font-medium" style={{ color: '#718096' }}>Feature</th>
                  <th className="text-center pb-2 font-medium" style={{ color: '#718096' }}>Free</th>
                  <th className="text-center pb-2 font-medium" style={{ color: '#1a365d' }}>Pro</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Searches per year', '5', '15'],
                  ['PDF Autofill', '$1.99/credit', 'Unlimited'],
                  ['Price', 'Free', '$4.99/year'],
                ].map(([feature, free, pro]) => (
                  <tr key={feature} style={{ borderBottom: '1px solid #f7fafc' }}>
                    <td className="py-2" style={{ color: '#4a5568' }}>{feature}</td>
                    <td className="py-2 text-center" style={{ color: '#718096' }}>{free}</td>
                    <td className="py-2 text-center font-medium" style={{ color: '#1a365d' }}>{pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="rounded-xl p-8 text-center" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
          <p style={{ color: '#718096' }}>Loading...</p>
        </div>
      </div>
    }>
      <BillingContent />
    </Suspense>
  )
}
