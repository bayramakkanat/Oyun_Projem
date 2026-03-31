import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import StarField from "./StarField";

export default function VersusLobby({ user, onRoomReady, onCancel, autoJoin }) {
  const [mode, setMode] = useState(null); // "create" | "join"
  useEffect(() => {
  if (!autoJoin || !user) return;
  if (autoJoin.role === "host") {
    setMode("create");
    createRoomWithCode(autoJoin.roomCode);
  } else {
    setMode("join");
    joinRoomWithCode(autoJoin.roomCode);
  }
}, [autoJoin, user]);
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [unsubscribe, setUnsubscribe] = useState(null);
  const timeoutRef = useRef(null);

  const userName = user?.displayName || user?.email?.split("@")[0] || "Oyuncu";

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 5; i++)
      code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };
  const createRoomWithCode = async (code) => {
  setRoomCode(code);
  setStatus("Oda oluşturuluyor...");
  try {
    await setDoc(doc(db, "versus_rooms", code), {
      code,
      host: { uid: user.uid, name: userName },
      guest: null,
      status: "waiting",
      disconnected: null,
      createdAt: serverTimestamp(),
    });
    setStatus("Oda hazır! Arkadaşın kabul etmesi bekleniyor...");
    const unsub = onSnapshot(doc(db, "versus_rooms", code), (snap) => {
      const data = snap.data();
      if (!data) return;
      if (data.status === "ready") {
        unsub();
        onRoomReady({ code, role: "host", roomData: data });
      }
    });
    setUnsubscribe(() => unsub);
  } catch (err) {
    setError("Oda oluşturulamadı: " + err.message);
  }
};

const joinRoomWithCode = async (code) => {
  setStatus("Odaya bağlanılıyor...");
  // Oda henüz oluşturulmamış olabilir, 3 kez dene
  let snap = null;
  for (let i = 0; i < 5; i++) {
    const roomRef = doc(db, "versus_rooms", code);
    snap = await getDoc(roomRef);
    if (snap.exists()) break;
    await new Promise(r => setTimeout(r, 800));
  }
  try {
    const roomRef = doc(db, "versus_rooms", code);
    if (!snap || !snap.exists()) { setError("Oda bulunamadı."); setStatus(""); return; }
    const data = snap.data();
    // waiting veya host henüz oluşturuyorsa bekle
    if (data.status !== "waiting") {
      // Eğer zaten ready ise ve guest yoksa, biz katılıyoruz demektir
      if (data.status === "ready" && !data.guest) {
        // devam et
      } else {
        setError("Bu oda artık müsait değil."); setStatus(""); return;
      }
    }
    await setDoc(roomRef, {
      ...data,
      guest: { uid: user.uid, name: userName },
      status: "ready",
      disconnected: null,
    });
    setStatus("Odaya katıldın! Oyun başlıyor...");
    onRoomReady({ code, role: "guest", roomData: { ...data, guest: { uid: user.uid, name: userName }, status: "ready" } });
  } catch (err) {
    setError("Odaya katılınamadı: " + err.message);
  }
};
  const createRoom = async () => {
    const code = generateCode();
    setRoomCode(code);
    setStatus("Oda oluşturuluyor...");
    console.log("Oda oluşturuluyor, kod:", code, "db:", db);
    try {
      console.log("setDoc çağrılıyor...");
     await setDoc(doc(db, "versus_rooms", code), {
        code,
        host: { uid: user.uid, name: userName },
        guest: null,
        status: "waiting",
        disconnected: null,
        createdAt: serverTimestamp(),
      });
      setStatus("Oda hazır! Rakibini bekliyor...");
      timeoutRef.current = setTimeout(() => {
        unsub();
        setMode(null);
        setRoomCode("");
        setStatus("");
        setError("Süre doldu. Kimse katılmadı.");
      }, 120000);

      const unsub = onSnapshot(doc(db, "versus_rooms", code), (snap) => {
        const data = snap.data();
        if (!data) return;
        if (data.guest && data.status === "waiting") {
          setStatus(`${data.guest.name} odaya katıldı! Hazırlanıyor...`);
        }
        if (data.status === "ready") {
          clearTimeout(timeoutRef.current);
          unsub();
          onRoomReady({ code, role: "host", roomData: data });
        }
      });
      setUnsubscribe(() => unsub);
    } catch (err) {
      console.error("HATA:", err);
      setError("Oda oluşturulamadı: " + err.message);
    }
  };

  const joinRoom = async () => {
    if (!inputCode.trim()) return;
    const code = inputCode.trim().toUpperCase();
    setStatus("Odaya bağlanılıyor...");
    setError("");
    try {
      const roomRef = doc(db, "versus_rooms", code);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) {
        setError("Oda bulunamadı. Kodu kontrol et.");
        setStatus("");
        return;
      }
      const data = snap.data();
      if (data.status !== "waiting") {
        setError("Bu oda artık müsait değil.");
        setStatus("");
        return;
      }
      if (data.host.uid === user.uid) {
        setError("Kendi odana katılamazsın.");
        setStatus("");
        return;
      }
     await setDoc(roomRef, {
        ...data,
        guest: { uid: user.uid, name: userName },
        status: "ready",
        disconnected: null,
      });
      setStatus("Odaya katıldın! Oyun başlıyor...");
      onRoomReady({
        code,
        role: "guest",
        roomData: {
          ...data,
          guest: { uid: user.uid, name: userName },
          status: "ready",
        },
      });
    } catch (err) {
      setError("Odaya katılınamadı: " + err.message);
    }
  };

 useEffect(() => {
    return () => {
      if (unsubscribe) unsubscribe();
      clearTimeout(timeoutRef.current);
    };
  }, [unsubscribe]);

  return (
    <div className="min-h-screen animated-bg text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <StarField />
      <div className="relative z-10 max-w-md w-full text-center">
        <div className="text-6xl mb-4">⚡</div>
        <h2 className="text-4xl font-black mb-2 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
          KARŞILAŞMA
        </h2>
        <p className="text-gray-400 text-sm mb-8 uppercase tracking-widest">
          Gerçek Zamanlı 1v1
        </p>

        {!mode && (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                setMode("create");
                createRoom();
              }}
              className="py-5 bg-gradient-to-br from-red-600 to-orange-700 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-xl border border-red-500/50"
            >
              🏠 Oda Oluştur
            </button>
            <button
              onClick={() => setMode("join")}
              className="py-5 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-xl border border-blue-500/50"
            >
              🚪 Odaya Katıl
            </button>
            <button
              onClick={onCancel}
              className="py-3 bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-colors text-sm font-bold"
            >
              ← Geri Dön
            </button>
          </div>
        )}

        {mode === "create" && (
          <div className="flex flex-col items-center gap-4">
            {roomCode && (
              <div className="bg-black/40 border-2 border-red-500/50 rounded-2xl p-6 w-full">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">
                  Oda Kodu
                </div>
                <div className="text-5xl font-black tracking-widest text-red-400 mb-2">
                  {roomCode}
                </div>
                <div className="text-xs text-gray-400">
                  Bu kodu rakibinle paylaş
                </div>
              </div>
            )}
            {status && (
              <div className="flex items-center gap-2 text-yellow-300 text-sm font-bold">
                <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
                {status}
              </div>
            )}
            <button
              onClick={() => {
                if (unsubscribe) unsubscribe();
                setMode(null);
                setRoomCode("");
                setStatus("");
              }}
              className="py-3 px-8 bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-colors text-sm font-bold"
            >
              İptal
            </button>
          </div>
        )}

        {mode === "join" && (
          <div className="flex flex-col gap-4">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                Oda Kodunu Gir
              </div>
              <input
                type="text"
                maxLength={5}
                placeholder="XXXXX"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-center text-2xl font-black tracking-widest focus:border-blue-400 outline-none transition-all uppercase"
              />
            </div>
            {error && (
              <div className="text-red-400 text-sm font-bold">{error}</div>
            )}
            {status && (
              <div className="flex items-center justify-center gap-2 text-yellow-300 text-sm font-bold">
                <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
                {status}
              </div>
            )}
            <button
              onClick={joinRoom}
              disabled={inputCode.length < 5}
              className="py-4 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl font-black text-lg hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Katıl →
            </button>
            <button
              onClick={() => {
                setMode(null);
                setInputCode("");
                setError("");
                setStatus("");
              }}
              className="py-3 bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-colors text-sm font-bold"
            >
              ← Geri Dön
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
