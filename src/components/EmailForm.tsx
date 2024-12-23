import { FormEvent, useState, useEffect } from 'react'
import { Mail, Send, Trash2, Loader2 } from 'lucide-react'
import emailjs from '@emailjs/browser'

interface EmailData {
  from: string
  to: string
  subject: string
  message: string
}

const DRAFT_KEY = 'email-draft'

// Replace these with your actual EmailJS credentials from emailjs.com dashboard
const EMAILJS_PUBLIC_KEY = 'hveAkjNykqhXuR5m0'
const EMAILJS_SERVICE_ID = 'service_1a54p2v' // Use 'gmail' if you connected with Gmail
const EMAILJS_TEMPLATE_ID = 'template_8y64inl' // Create a template in EmailJS dashboard

emailjs.init(EMAILJS_PUBLIC_KEY)

async function validateEmail(email: string): Promise<boolean> {
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return false
  }

  // Additional DNS validation - basic check if domain exists
  const domain = email.split('@')[1]
  try {
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`)
    const data = await response.json()
    return data.Answer && data.Answer.length > 0
  } catch {
    // If DNS check fails, fall back to basic validation
    return true
  }
}

export default function EmailForm() {
  const [emailData, setEmailData] = useState<EmailData>({
    from: '',
    to: '',
    subject: '',
    message: ''
  })
  const [status, setStatus] = useState<'idle' | 'validating' | 'sending' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Load draft on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY)
    if (savedDraft) {
      setEmailData(JSON.parse(savedDraft))
    }
  }, [])

  // Save draft whenever emailData changes
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(emailData))
  }, [emailData])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('validating')
    setErrorMessage('')

    try {
      // Validate both email addresses
      const isFromValid = await validateEmail(emailData.from)
      const isToValid = await validateEmail(emailData.to)

      if (!isFromValid) {
        throw new Error('Sender email address appears to be invalid')
      }
      if (!isToValid) {
        throw new Error('Recipient email address appears to be invalid')
      }

      setStatus('sending')

      const templateParams = {
        to_email: emailData.to,
        from_email: emailData.from,
        subject: emailData.subject,
        message: emailData.message,
      }

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      )

      if (response.status === 200) {
        setStatus('success')
        clearDraft()
        
        setTimeout(() => {
          setStatus('idle')
        }, 3000)
      } else {
        throw new Error('Failed to send email. Please check your EmailJS configuration.')
      }
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error 
        ? error.message 
        : 'Failed to send email. Please check your EmailJS configuration and try again.'
      )
    }
  }

  const clearDraft = () => {
    const newEmailData = {
      from: '',
      to: '',
      subject: '',
      message: ''
    }
    setEmailData(newEmailData)
    localStorage.removeItem(DRAFT_KEY)
  }

  const getButtonText = () => {
    switch (status) {
      case 'validating':
        return 'Validating Emails...'
      case 'sending':
        return 'Sending...'
      default:
        return 'Send Email'
    }
  }

  return (
    <div className="w-full max-w-lg space-y-4">
      {status === 'success' && (
        <div className="bg-green-50 text-green-800 p-4 rounded-md mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Email sent successfully!
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-gray-700">
            <Mail className="w-5 h-5" />
            <h1 className="text-2xl font-semibold">Compose Email</h1>
          </div>
          <button
            type="button"
            onClick={clearDraft}
            disabled={status === 'sending' || status === 'validating'}
            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>

        <div className="space-y-2">
          <label htmlFor="from" className="block text-sm font-medium text-gray-700">
            From:
          </label>
          <input
            type="email"
            id="from"
            required
            disabled={status === 'sending' || status === 'validating'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            value={emailData.from}
            onChange={(e) => setEmailData({ ...emailData, from: e.target.value })}
            placeholder="your@email.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="to" className="block text-sm font-medium text-gray-700">
            To:
          </label>
          <input
            type="email"
            id="to"
            required
            disabled={status === 'sending' || status === 'validating'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            value={emailData.to}
            onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
            placeholder="recipient@email.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
            Subject:
          </label>
          <input
            type="text"
            id="subject"
            required
            disabled={status === 'sending' || status === 'validating'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            value={emailData.subject}
            onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
            placeholder="Enter subject"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Message:
          </label>
          <textarea
            id="message"
            required
            disabled={status === 'sending' || status === 'validating'}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            value={emailData.message}
            onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
            placeholder="Type your message here..."
          />
        </div>

        <button
          type="submit"
          disabled={status === 'sending' || status === 'validating'}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
        >
          {(status === 'sending' || status === 'validating') ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {getButtonText()}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {getButtonText()}
            </>
          )}
        </button>
      </form>
    </div>
  )
}
