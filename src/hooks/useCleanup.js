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
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { logError } from "../utils/helpers";

// Her tur yaklaşık 1.5–2 dk olduğu varsayılırsa 30 dk yeterli bir aralık.
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000; // 30 dakika

// localStorage anahtarı — fazla sık çalışmayı önlemek için son zamanı saklar.
const LS_KEY = "petgame_last_cleanup";

// Firestore batch başına maksimum 500 işlem desteklenir.
const BATCH_LIMIT = 500;

// Belirtilen sürenin dolup dolmadığını kontrol eder.
const isExpired = (expiresAt) => {
  if (!expiresAt) return false;
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

// Belirli bir alt koleksiyondaki süresi dolmuş dokümanları batch ile siler.
// Tek tek deleteDoc yerine writeBatch kullanmak hem daha hızlı hem daha az
// Firestore write birimi tüketir.
const deleteExpiredDocs = async (collRef, label) => {
  try {
    const snap = await getDocs(collRef);
    const expired = snap.docs.filter((d) => isExpired(d.data().expiresAt));
    if (expired.length === 0) return;

    // 500'lük gruplara böl (Firestore batch limiti)
    for (let i = 0; i < expired.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      expired.slice(i, i + BATCH_LIMIT).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    logError(err, `useCleanup:${label}`);
  }
};

// Son `keepMonths` ayı koruyarak daha eski ay key'lerini döndürür.
const getOldLeaderboardKeys = (keepMonths = 2) => {
  const keys = [];
  const now = new Date();
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

      const lastRun = parseInt(localStorage.getItem(LS_KEY) || "0", 10);
      if (now - lastRun < CLEANUP_INTERVAL_MS) return;

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

      // 3. Kendi versus odaları (host olduğun, süresi dolmuş) — batch ile
      try {
        const roomsSnap = await getDocs(
          query(collection(db, "versus_rooms"), where("host.uid", "==", uid))
        );
        const expiredRooms = roomsSnap.docs.filter((d) =>
          isExpired(d.data().expiresAt)
        );
        if (expiredRooms.length > 0) {
          const batch = writeBatch(db);
          expiredRooms.forEach((d) =>
            batch.delete(doc(db, "versus_rooms", d.id))
          );
          await batch.commit();
        }
      } catch (err) {
        logError(err, "useCleanup:versus_rooms");
      }

      // 4. Eski ay liderboard satırları (son 2 ay hariç) — batch ile
      try {
        const oldKeys = getOldLeaderboardKeys(2);
        const batch = writeBatch(db);
        oldKeys.forEach((key) => batch.delete(doc(db, key, uid)));
        await batch.commit();
      } catch {
        // Var olmayan dokümanlar için hata fırlatılır — önemli değil, geç.
      }

      // 5. Arena takımları (uid_ prefix'li, süresi dolmuş) — batch ile
      try {
        const arenaSnap = await getDocs(
          query(collection(db, "arena_teams"), where("uid", "==", uid))
        );
        const expiredArena = arenaSnap.docs.filter((d) =>
          isExpired(d.data().expiresAt)
        );
        if (expiredArena.length > 0) {
          const batch = writeBatch(db);
          expiredArena.forEach((d) =>
            batch.delete(doc(db, "arena_teams", d.id))
          );
          await batch.commit();
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
  }, [user?.uid]);
}
