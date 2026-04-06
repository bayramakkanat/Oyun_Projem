// src/hooks/useCleanup.js
//
// Otomatik Firebase TTL temizleyici.
//
// Strateji:
//   - Kullanıcı giriş yaptığında bir kez çalışır (login cleanup).
//   - Sonrasında her CLEANUP_INTERVAL_MS'de bir periyodik çalışır.
//   - Her cleanup işlemi kendi koleksiyonunu temizler, başkasının
//     verisine dokunmaz (Firestore güvenlik kurallarıyla uyumlu).
//
// Temizlenen koleksiyonlar:
//   1. friend_requests/{uid}/incoming   → süresi dolmuş gelen istekler
//   2. challenge_invites/{uid}/invites  → süresi dolmuş meydan okumalar
//   3. versus_rooms                     → host'u kullanıcı olan süresi dolmuş odalar
//   4. arena_teams                      → kullanıcıya ait süresi dolmuş takımlar
//   5. arena_leaderboard_{ay}           → son 2 aydan eski koleksiyonlardaki kendi satırı

import { useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { logError } from "../utils/helpers";

// Her tur yaklaşık 1.5–2 dk olduğu varsayılırsa 30 dk yeterli bir aralık.
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000; // 30 dakika

// localStorage anahtarı — fazla sık çalışmayı önlemek için son zamanı saklar.
const LS_KEY = "petgame_last_cleanup";

// Belirtilen sürenin dolup dolmadığını kontrol eder.
const isExpired = (expiresAt) => {
  if (!expiresAt) return false; // expiresAt yoksa dokunma
  // Firestore Timestamp veya JS Date veya number olabilir
  const ts =
    typeof expiresAt.toMillis === "function"
      ? expiresAt.toMillis()
      : expiresAt instanceof Date
      ? expiresAt.getTime()
      : typeof expiresAt === "number"
      ? expiresAt
      : null;
  if (ts === null) return false;
  return ts < Date.now();
};

// Belirli bir alt koleksiyondaki süresi dolmuş dokümanları siler.
// Firestore'da alt koleksiyonlarda where("expiresAt", "<", now) çalışmaz
// (composite index gerektirir), bu yüzden istemci tarafında filtreleriz.
const deleteExpiredDocs = async (collRef, label) => {
  try {
    const snap = await getDocs(collRef);
    let deleted = 0;
    for (const d of snap.docs) {
      if (isExpired(d.data().expiresAt)) {
        await deleteDoc(d.ref);
        deleted++;
      }
    }
    if (deleted > 0) {
    }
  } catch (err) {
    logError(err, `useCleanup:${label}`);
  }
};

// Son `keepMonths` ayı koruyarak daha eski ay key'lerini döndürür.
// Örnek çıktı (keepMonths=2, bugün 2025-04):
//   ["arena_leaderboard_2025_02", "arena_leaderboard_2025_01",
//    "arena_leaderboard_2024_12", ... (12 ay geriye kadar)]
const getOldLeaderboardKeys = (keepMonths = 2) => {
  const keys = [];
  const now = new Date();
  // Geriye toplam 14 ay tara (2 korunan + 12 silinecek potansiyel)
  for (let i = keepMonths; i < keepMonths + 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    keys.push(`arena_leaderboard_${year}_${month}`);
  }
  return keys;
};

export function useCleanup({ user }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const runCleanup = async () => {
      const now = Date.now();

      // Son cleanup zamanını kontrol et
      const lastRun = parseInt(localStorage.getItem(LS_KEY) || "0", 10);
      if (now - lastRun < CLEANUP_INTERVAL_MS) return; // Henüz erken

      localStorage.setItem(LS_KEY, String(now));

      const uid = user.uid;

      // 1. Gelen arkadaşlık istekleri
      await deleteExpiredDocs(
        collection(db, "friend_requests", uid, "incoming"),
        "friend_requests/incoming"
      );

      // 2. Gelen meydan okumalar
      await deleteExpiredDocs(
        collection(db, "challenge_invites", uid, "invites"),
        "challenge_invites/invites"
      );

      // 3. Kendi versus odaları (host olduğun, süresi dolmuş)
      //    Güvenlik kuralları: host.uid === kendi UID → silme yetkisi var.
      try {
        const roomsSnap = await getDocs(
          query(
            collection(db, "versus_rooms"),
            where("host.uid", "==", uid)
          )
        );
        let deletedRooms = 0;
        for (const d of roomsSnap.docs) {
          if (isExpired(d.data().expiresAt)) {
            await deleteDoc(doc(db, "versus_rooms", d.id));
            deletedRooms++;
          }
        }
        if (deletedRooms > 0) {
        }
      } catch (err) {
        logError(err, "useCleanup:versus_rooms");
      }

      // 4. Eski ay liderboard satırları (son 2 ay hariç)
      //    Güvenlik kuralı: leaderboardCol.matches('arena_leaderboard_.*') && isOwner(uid)
      try {
        const oldKeys = getOldLeaderboardKeys(2); // son 2 ay korunur
        for (const key of oldKeys) {
          const ref = doc(db, key, uid);
          try {
            await deleteDoc(ref);
          } catch {
            // Doküman zaten yoksa hata fırlatır — önemli değil, geç.
          }
        }
      } catch (err) {
        logError(err, "useCleanup:leaderboard");
      }

      // 5. Arena takımları (uid_ prefix'li, süresi dolmuş)
      //    Güvenlik kuralı: docId.matches(uid + '_turn.*') → yazma yetkisi var.
      try {
        const arenaSnap = await getDocs(
          query(
            collection(db, "arena_teams"),
            where("uid", "==", uid)
          )
        );
        let deletedArena = 0;
        for (const d of arenaSnap.docs) {
          if (isExpired(d.data().expiresAt)) {
            await deleteDoc(doc(db, "arena_teams", d.id));
            deletedArena++;
          }
        }
        if (deletedArena > 0) {
        }
      } catch (err) {
        logError(err, "useCleanup:arena_teams");
      }
    };

    // Giriş yapılır yapılmaz ilk cleanup
    runCleanup();

    // Sonrasında periyodik cleanup
    timerRef.current = setInterval(runCleanup, CLEANUP_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user?.uid]); // user değişince (login/logout) yeniden bağlan
}
