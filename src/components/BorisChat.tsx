import { useState, useRef, useEffect } from 'react';
import { API_URL } from '../config';
import { useSubscriptionContext } from '../context/SubscriptionContext';

interface BorisChatProps {
  context?: string;
  title?: string;
  greeting?: string;
  quickQuestions?: { label: string; text: string }[];
  onBack?: () => void;
  voiceEnabled?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const DEFAULT_QUICK_QUESTIONS = [
  { label: 'VAT rate', text: 'Which VAT rate should I use for my services?' },
  { label: 'Invoice requirements', text: 'What are the mandatory details on a UK invoice?' },
  { label: 'Flat rate scheme', text: 'What is the VAT flat rate scheme and am I eligible?' },
  { label: 'Reverse charge', text: 'When do I need to apply the reverse charge on my invoice?' },
  { label: 'Payment terms', text: 'What are standard payment terms for invoices in the UK?' },
  { label: 'Late payment', text: 'What are my rights under the Late Payment Act?' },
];

function useSpeechRecognition(lang: string) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const start = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      setTranscript(event.results[0][0].transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const supported = !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );

  return { isListening, transcript, start, stop, supported, clearTranscript: () => setTranscript('') };
}

export default function BorisChat({
  context = 'business',
  title = 'Boris - Your AI Assistant',
  greeting,
  quickQuestions = DEFAULT_QUICK_QUESTIONS,
  onBack,
  voiceEnabled = true,
}: BorisChatProps) {
  const { canAskBoris } = useSubscriptionContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speech = useSpeechRecognition('en-GB');

  const defaultGreeting = greeting || 'Hello! I\'m Boris, your AI assistant. I\'m happy to help with questions about VAT, invoicing, the flat rate scheme and other business topics in the UK.';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (speech.transcript) {
      setInput(speech.transcript);
      speech.clearTranscript();
    }
  }, [speech.transcript]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: String(Date.now()), role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${API_URL}/api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'boris.chat',
          payload: { message: text.trim(),
            language: 'en', appId: 'invoicesnap',
            context: context === 'business' ? 'invoicesnap' : context,
        }),
      });

      const data = await response.json();

      const assistantMsg: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: data.ok ? (data.answer || data.reply) : 'Sorry, something went wrong. Please try again.',
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: 'Connection error. Please check your internet connection.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="bg-white border-2 border-blue-300 text-gray-700 px-4 py-2 rounded-xl font-semibold hover:border-blue-500 transition-all"
            >
              ← Back
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-red-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">B</div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{title}</h1>
              <p className="text-xs text-gray-500">Your invoicing assistant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-red-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-700 mx-auto mb-4">B</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Hello! I'm Boris.</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {defaultGreeting}
              </p>

              {!canAskBoris ? (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 max-w-md mx-auto">
                  <p className="text-orange-800 font-semibold">Boris limit reached</p>
                  <p className="text-orange-700 text-sm mt-1">Upgrade for more Boris questions.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-2xl mx-auto">
                  {quickQuestions.map(q => (
                    <button
                      key={q.label}
                      onClick={() => sendMessage(q.text)}
                      className="bg-white border border-blue-200 rounded-xl p-3 text-left hover:border-blue-400 hover:shadow transition-all"
                    >
                      <div className="text-sm font-semibold text-gray-900">{q.label}</div>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-4 max-w-md mx-auto text-left">
                <div className="text-sm font-semibold text-gray-700 mb-2">Please note</div>
                <p className="text-xs text-gray-600">
                  Boris is an AI assistant and does not replace professional tax advice.
                  For binding advice, always consult your accountant or HMRC.
                </p>
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 bg-gradient-to-r from-blue-100 to-red-100 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-700">B</div>
                    <span className="text-xs font-semibold text-blue-700">Boris</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-r from-blue-100 to-red-100 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-700">B</div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-blue-100 px-4 py-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3">
          {voiceEnabled && speech.supported && (
            <button
              type="button"
              onClick={speech.isListening ? speech.stop : speech.start}
              className={`px-3 py-3 rounded-xl border-2 transition-all ${
                speech.isListening
                  ? 'border-red-400 bg-red-50 text-red-600'
                  : 'border-gray-300 text-gray-600 hover:border-blue-400'
              }`}
            >
              {speech.isListening ? '⏹' : '🎙'}
            </button>
          )}
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask Boris a question..."
            disabled={loading || !canAskBoris}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !canAskBoris}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
