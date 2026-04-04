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
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
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
