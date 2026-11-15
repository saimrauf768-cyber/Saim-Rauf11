import { FormEvent, useState } from 'react';
import { CheckCircle2, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function ContactPage() {
  const { submitInquiry } = useStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSending(true);
    try {
      await submitInquiry({ name, email, phone, subject, message });
      setSent(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to send inquiry right now.'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12">
      <div className="pb-8 border-b border-zinc-800">
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
          Concierge &amp; Ateliers
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#F4F4F5] mt-2">
          Contact SAIM CLOTHES
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-10 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#111114] border border-zinc-800 rounded-lg p-7 space-y-5">
            <h2 className="font-display text-2xl font-semibold text-[#F4F4F5]">
              Direct Concierge
            </h2>

            <div className="space-y-4 text-sm text-zinc-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#D4AF37] mt-1 shrink-0" />
                <div>
                  <p className="font-medium text-zinc-100">Lahore Flagship Atelier</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    MM Alam Road, Gulberg III, Lahore, Pakistan
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#D4AF37] mt-1 shrink-0" />
                <div>
                  <p className="font-medium text-zinc-100">Client Care Line</p>
                  <p className="text-xs text-zinc-400 mt-0.5 tabular-nums">
                    +92 300 1234567 (Mon–Sat, 11 AM – 9 PM PKT)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#D4AF37] mt-1 shrink-0" />
                <div>
                  <p className="font-medium text-zinc-100">Atelier Desk</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    saimrauf768@gmail.com
                  </p>
                </div>
              </div>
            </div>

            <a
              href="https://wa.me/923001234567?text=Assalam-o-Alaikum%20SAIM%20CLOTHES%2C%20I%20have%20a%20sizing%20or%20order%20question."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-[#D4AF37] hover:bg-[#E2C258] text-[#09090B] text-xs font-semibold rounded-md inline-flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Message on WhatsApp
            </a>
          </div>
        </div>

        <div className="lg:col-span-7 bg-[#111114] border border-zinc-800 rounded-lg p-7 sm:p-9">
          <h2 className="font-display text-2xl font-semibold text-[#F4F4F5] mb-5">
            Send an Inquiry
          </h2>

          {sent ? (
            <div className="p-6 bg-[#09090B] border border-[#D4AF37]/40 rounded-md flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#D4AF37] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-zinc-100">
                  Inquiry Received
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Thank you for contacting SAIM CLOTHES. Our concierge team will respond via email or WhatsApp shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-4 text-xs text-[#D4AF37] underline"
                >
                  Send another message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Bilal Ahmed"
                    className="w-full px-3.5 py-2.5 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full px-3.5 py-2.5 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03XX-XXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Custom Tailoring / Order Assistance"
                    className="w-full px-3.5 py-2.5 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  Message *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your sizing questions, bulk order inquiry, or delivery details..."
                  className="w-full px-3.5 py-2.5 bg-[#09090B] border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-red-400">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="px-6 py-3 bg-[#D4AF37] hover:bg-[#E2C258] text-[#09090B] text-xs font-semibold rounded-md disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Inquiry'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
