import { useState } from "react";
import { saveFeedback } from "../utils/helpers";

const CATEGORIES = [
  { id: "bug", label: "🐛 Hata Bildirimi" },
  { id: "balance", label: "⚖️ Hayvan Denge Şikayeti" },
  { id: "general", label: "💬 Genel Yorum" },
  { id: "suggestion", label: "💡 Öneri" },
];

export default function FeedbackScreen({ onClose, user }) {
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    saveFeedback({ category, message }, user?.uid);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setMessage("");
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-3xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white">💬 Geri Bildirim</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all ${
                category === c.id
                  ? "bg-white text-black border-white"
                  : "bg-white/5 text-white border-white/10 hover:bg-white/10"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Düşüncelerini yaz..."
          className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm resize-none outline-none focus:border-white/30 placeholder-gray-500"
        />

        {sent ? (
          <div className="text-center text-green-400 font-bold py-3">✅ Gönderildi, teşekkürler!</div>
        ) : (
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="w-full py-4 bg-white text-black rounded-2xl font-black text-sm disabled:opacity-30 hover:scale-105 transition-all active:scale-95"
          >
            GÖNDER 🚀
          </button>
        )}
      </div>
    </div>
  );
}