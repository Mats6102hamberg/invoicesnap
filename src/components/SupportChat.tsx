import { useState, useRef, useEffect } from 'react';
import { API_URL } from '../config';

interface SupportChatProps {
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imagePreview?: string;
}

const QUICK_ACTIONS = ["Can't sign in", 'Create invoice', 'Technical issue', 'Report a bug'];

export default function SupportChat({ onClose }: SupportChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ base64: string; mime: string; preview: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 4 * 1024 * 1024) { alert('Image too large (max 4 MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => { const b = reader.result as string; setPendingImage({ base64: b, mime: file.type, preview: b }); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) { loadImage(file); }
        return;
      }
    }
  };

  const loadImage = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 4 * 1024 * 1024) { alert('Image too large (max 4 MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => { const b = reader.result as string; setPendingImage({ base64: b, mime: file.type, preview: b }); };
    reader.readAsDataURL(file);
  };

  const sendMessage = async (text: string) => {
    if ((!text.trim() && !pendingImage) || loading) return;
    const userMsg: Message = { id: String(Date.now()), role: 'user', content: text.trim() || (pendingImage ? 'What does this mean?' : ''), imagePreview: pendingImage?.preview };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    const imageData = pendingImage;
    setPendingImage(null);

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${API_URL}/api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          action: 'boris.chat',
          payload: {
            message: userMsg.content,
            language: 'en',
            context: 'support',
            ...(imageData ? { image: imageData.base64, imageMimeType: imageData.mime } : {}),
          },
        }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { id: String(Date.now() + 1), role: 'assistant', content: data.ok ? (data.answer || data.reply) : 'Sorry, something went wrong. Please email support@invoicesnap.co.uk' }]);
    } catch {
      setMessages(prev => [...prev, { id: String(Date.now() + 1), role: 'assistant', content: 'Connection error. Please email support@invoicesnap.co.uk' }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-red-500 rounded-t-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold text-white">B</div>
            <div>
              <h3 className="text-white font-bold text-sm">Boris Support</h3>
              <p className="text-blue-100 text-xs">How can I help? (screenshots welcome!)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl font-bold">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-600 text-sm mb-2">Hello! I'm Boris. Describe your issue or send a screenshot.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_ACTIONS.map(a => (
                  <button key={a} onClick={() => sendMessage(a)} className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">{a}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                {msg.imagePreview && <img src={msg.imagePreview} alt="Screenshot" className="rounded-lg mb-2 max-h-40 w-auto" />}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-3 py-2 flex gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" /><div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /><div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {pendingImage && (
          <div className="px-3 pt-2 flex items-center gap-2">
            <img src={pendingImage.preview} alt="Preview" className="h-12 rounded-lg border" />
            <button onClick={() => setPendingImage(null)} className="text-red-500 text-xs font-semibold">Remove</button>
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="p-3 border-t flex gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="text-gray-400 hover:text-blue-600 text-xl px-1" title="Send screenshot">📷</button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onPaste={handlePaste} placeholder={pendingImage ? 'What would you like to know?' : 'Type or paste screenshot (Ctrl+V)...'} disabled={loading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:border-blue-500 focus:outline-none" />
          <button type="submit" disabled={loading || (!input.trim() && !pendingImage)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">Send</button>
        </form>
      </div>
    </div>
  );
}
