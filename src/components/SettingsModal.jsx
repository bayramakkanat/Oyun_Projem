export default function SettingsModal({
  user,
  settingsUsername,
  setSettingsUsername,
  settingsAvatar,
  setSettingsAvatar,
  soundEnabled,
  setSoundEnabled,
  handleUpdateProfile,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div
        className="bg-black border-2 border-white/10 w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl"
        style={{ animation: "slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black tracking-tighter">⚙️ AYARLAR</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="space-y-6">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">
                Kayıtlı Mail
              </div>
              <div className="text-sm text-gray-300 font-bold">
                {user?.email || "Google ile giriş yapıldı"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">
                Kullanıcı Adı
              </div>
              <input
                type="text"
                placeholder="YENİ KULLANICI ADI"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:border-white outline-none transition-all placeholder:text-gray-700"
                value={settingsUsername}
                onChange={(e) => setSettingsUsername(e.target.value)}
              />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">
                Avatar
              </div>
              <div className="grid grid-cols-6 gap-2">
                {[
                  "🐺",
                  "🦁",
                  "🐻",
                  "🦊",
                  "🐯",
                  "🦅",
                  "🐉",
                  "🦋",
                  "🐬",
                  "🦈",
                  "🦖",
                  "🐸",
                ].map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSettingsAvatar(av)}
                    className={`text-2xl p-2 rounded-xl transition-all ${
                      settingsAvatar === av
                        ? "bg-white/20 scale-110"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">
                Ses
              </div>
              <button
                onClick={() => setSoundEnabled((s) => !s)}
                className={`w-full py-3 rounded-2xl font-black text-sm transition-all border ${
                  soundEnabled
                    ? "bg-green-500/20 border-green-500/50 text-green-400"
                    : "bg-white/5 border-white/10 text-gray-400"
                }`}
              >
                {soundEnabled ? "🔊 SES AÇIK" : "🔇 SES KAPALI"}
              </button>
            </div>
            <button
              onClick={handleUpdateProfile}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-sm tracking-widest transition-all shadow-xl"
            >
              KAYDET →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
