import { useState, useEffect, useRef } from "react";

export default function GlobalNotifications({ friendsData, onChallengeAccept }) {
  const {
    incomingRequests,
    incomingChallenges,
    acceptChallenge,
    rejectChallenge,
    acceptFriendRequest,
    rejectFriendRequest,
  } = friendsData || {};

  const [toasts, setToasts] = useState([]);
  const seenRequestsRef = useRef(new Set());
  const seenChallengesRef = useRef(new Set());

  // ── Arkadaşlık isteği toast'ı ──────────────────────────────────────────
  useEffect(() => {
    if (!incomingRequests?.length) return;
    incomingRequests.forEach((r) => {
      if (seenRequestsRef.current.has(r.uid)) return;
      seenRequestsRef.current.add(r.uid);
      const id = Date.now() + r.uid;
      setToasts((prev) => [...prev, { id, type: "friend", data: r }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6000);
    });
  }, [incomingRequests]);

  // ── Meydan okuma popup'ı ───────────────────────────────────────────────
  const pendingChallenge = incomingChallenges?.find(
    (c) => !seenChallengesRef.current.has(c.uid)
  ) || null;

  if (pendingChallenge) {
    return (
      <>
        {/* Meydan okuma popup */}
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
          <div
            className="bg-gray-900 border-2 border-orange-500 rounded-3xl p-8 text-center max-w-sm w-full mx-4 shadow-2xl"
            style={{ animation: "slideInUp 0.3s ease-out" }}
          >
            <div className="text-5xl mb-3">⚔️</div>
            <div className="text-white font-black text-xl mb-1">Meydan Okuma!</div>
            <div className="text-orange-300 font-bold text-lg mb-1">
              {pendingChallenge.displayName}
            </div>
            <div className="text-gray-400 text-sm mb-6">
              seni savaşa davet etti
            </div>
            <div className="bg-yellow-900/40 border border-yellow-600/40 rounded-xl p-3 mb-6 text-xs text-yellow-300">
              ⚠️ Kabul edersen mevcut oyun ilerlemen lokale kaydedilir, daha sonra kaldığın yerden devam edebilirsin.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  seenChallengesRef.current.add(pendingChallenge.uid);
                  acceptChallenge(pendingChallenge, (roomCode) => {
                    if (onChallengeAccept) onChallengeAccept(roomCode);
                  });
                }}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-2xl font-black text-white transition-all"
              >
                ✅ Kabul Et
              </button>
              <button
                onClick={() => {
                  seenChallengesRef.current.add(pendingChallenge.uid);
                  rejectChallenge(pendingChallenge.uid);
                }}
                className="flex-1 py-3 bg-red-800 hover:bg-red-700 rounded-2xl font-black text-white transition-all"
              >
                ❌ Reddet
              </button>
            </div>
          </div>
        </div>

        {/* Toast'lar arkada görünsün */}
        <ToastList toasts={toasts} setToasts={setToasts}
          acceptFriendRequest={acceptFriendRequest}
          rejectFriendRequest={rejectFriendRequest} />
      </>
    );
  }

  return (
    <ToastList
      toasts={toasts}
      setToasts={setToasts}
      acceptFriendRequest={acceptFriendRequest}
      rejectFriendRequest={rejectFriendRequest}
    />
  );
}

function ToastList({ toasts, setToasts, acceptFriendRequest, rejectFriendRequest }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9998] flex flex-col gap-2 w-full max-w-sm px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-gray-900 border border-blue-500/60 rounded-2xl p-4 shadow-2xl flex items-center gap-3"
          style={{ animation: "slideInDown 0.3s ease-out" }}
        >
          <div className="text-2xl">👥</div>
          <div className="flex-1">
            <div className="text-white font-black text-sm">Arkadaşlık İsteği</div>
            <div className="text-blue-300 text-xs">{toast.data.displayName} seni arkadaş olarak ekledi</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                acceptFriendRequest(toast.data);
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
              }}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-black transition-all"
            >
              ✅
            </button>
            <button
              onClick={() => {
                rejectFriendRequest(toast.data.uid);
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
              }}
              className="px-3 py-1.5 bg-red-800 hover:bg-red-700 rounded-lg text-xs font-black transition-all"
            >
              ❌
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}