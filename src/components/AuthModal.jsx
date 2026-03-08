export default function AuthModal({
  authMode,
  setAuthMode,
  authEmail,
  setAuthEmail,
  authPass,
  setAuthPass,
  authUsername,
  setAuthUsername,
  authAvatar,
  setAuthAvatar,
  handleEmailAuth,
  handleGoogleLogin,
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
            <h2 className="text-3xl font-black tracking-tighter">
              {authMode === "login" ? "GİRİŞ YAP" : "KAYDOL"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white"
            >
              ✕
            </button>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-4 bg-white text-black rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-95 mb-6"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg"
              alt="g"
              className="w-6 h-6"
            />
            GOOGLE İLE BAĞLAN
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-white/5 flex-1"></div>
            <span className="text-[10px] text-gray-600 font-bold tracking-widest">
              VEYA
            </span>
            <div className="h-px bg-white/5 flex-1"></div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {authMode === "signup" && (
              <>
                <input
                  type="text"
                  placeholder="KULLANICI ADI"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:border-white outline-none transition-all placeholder:text-gray-700"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  required
                />
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
                      onClick={() => setAuthAvatar(av)}
                      className={`text-2xl p-2 rounded-xl transition-all ${
                        authAvatar === av
                          ? "bg-white/20 scale-110"
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </>
            )}
            <input
              type="email"
              placeholder="E-POSTA ADRESİ"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:border-white outline-none transition-all placeholder:text-gray-700"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="ŞİFRE"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:border-white outline-none transition-all placeholder:text-gray-700"
              value={authPass}
              onChange={(e) => setAuthPass(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-sm tracking-widest transition-all shadow-xl"
            >
              DEVAM ET →
            </button>
          </form>

          <button
            onClick={() =>
              setAuthMode(authMode === "login" ? "signup" : "login")
            }
            className="mt-8 w-full text-center text-[10px] font-black tracking-widest text-gray-500 hover:text-white transition-colors"
          >
            {authMode === "login"
              ? "HESABIN YOK MU? KAYDOL"
              : "ZATEN HESABIN VAR MI? GİRİŞ YAP"}
          </button>
        </div>
      </div>
    </div>
  );
}
