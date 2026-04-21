import { useState, useEffect } from "react";
import {
  collection, doc, setDoc, getDoc, getDocs,
  deleteDoc, onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";
import { playSound } from "./useSound";
import { TTL_DURATIONS, getExpiryDate } from "../utils/ttl";

/**
 * useFriends — Arkadaş sistemi
 *
 * Firebase koleksiyonları:
 *  - friend_requests/{toUid}/incoming/{fromUid}  → gelen istekler
 *  - friends/{uid}/list/{friendUid}              → arkadaş listesi
 *  - challenge_invites/{toUid}/invites/{fromUid} → meydan okuma bildirimleri
 */
export function useFriends({ user, onChallengeAccepted }) {
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [incomingChallenges, setIncomingChallenges] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  // ── Arkadaş listesini dinle ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const ref = collection(db, "friends", user.uid, "list");
    const unsub = onSnapshot(ref, (snap) => {
      setFriends(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  // ── Gelen arkadaşlık isteklerini dinle ──────────────────────────────────
  // DÜZELTME: Daha önce callback içinde ikinci bir onSnapshot açılıyordu.
  // Her state değişiminde yeni listener birikip bellek sızıntısına yol açıyordu.
  // Şimdi tek listener var; ses bildirimi de burada yönetiliyor.
  useEffect(() => {
    if (!user) return;
    const ref = collection(db, "friend_requests", user.uid, "incoming");
    const unsub = onSnapshot(ref, (snap) => {
      const newCount = snap.docs.length;
      setIncomingRequests(prev => {
        if (newCount > prev.length) playSound("friend_request");
        return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      });
    });
    return () => unsub();
  }, [user]);

  // ── Gelen meydan okumalarını dinle ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const ref = collection(db, "challenge_invites", user.uid, "invites");
    const unsub = onSnapshot(ref, (snap) => {
      setIncomingChallenges(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  // ── Kullanıcı adıyla ara ─────────────────────────────────────────────────
  // DÜZELTME: Önceki versiyonda snap.empty kontrolü iki kez yazılmıştı;
  // ilk daldan erken return yapılmasına rağmen aynı kontrol tekrar ediyordu.
  // Şimdi akış tek bir yoldan ilerliyor: tam eşleşme → prefix arama → bulunamadı.
 const searchUser = async (username) => {
  if (!username.trim()) return;
  setSearchLoading(true);
  setSearchError("");
  setSearchResult(null);
  try {
    const raw = username.trim();
    const withoutEmoji = raw.replace(/^\p{Emoji}\s*/u, "").trim();
    const searchTerm = withoutEmoji.toLowerCase();
    const directDoc = await getDoc(doc(db, "usernames", searchTerm));
    const resultDoc = directDoc.exists() ? directDoc : null;

    if (!resultDoc) {
      setSearchError("Kullanıcı bulunamadı.");
      return;
    }

    const data = resultDoc.data();
    if (data.uid === user.uid) {
      setSearchError("Kendinize istek gönderemezsiniz.");
      return;
    }

    const alreadyFriend = friends.some(f => f.uid === data.uid);
    setSearchResult({ ...data, alreadyFriend, requestSent: false });
  } catch (e) {
    setSearchError("Hata: " + e.message);
  } finally {
    setSearchLoading(false);
  }
};

  // ── Arkadaşlık isteği gönder ─────────────────────────────────────────────
  const sendFriendRequest = async (toUser) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "friend_requests", toUser.uid, "incoming", user.uid), {
        uid: user.uid,
        displayName: user.displayName || user.email,
        sentAt: serverTimestamp(),
        expiresAt: getExpiryDate(TTL_DURATIONS.friendRequest),
      });
      setSearchResult(prev => ({ ...prev, requestSent: true }));
    } catch (e) {
      alert("İstek gönderilemedi: " + e.message);
    }
  };

  // ── Arkadaşlık isteğini kabul et ────────────────────────────────────────
  const acceptFriendRequest = async (fromUser) => {
    if (!user) return;
    try {
      // Her ikisinin listesine de ekle
      await setDoc(doc(db, "friends", user.uid, "list", fromUser.uid), {
        uid: fromUser.uid,
        displayName: fromUser.displayName,
        addedAt: serverTimestamp(),
      });
      await setDoc(doc(db, "friends", fromUser.uid, "list", user.uid), {
        uid: user.uid,
        displayName: user.displayName || user.email,
        addedAt: serverTimestamp(),
      });
      // İsteği sil
      await deleteDoc(doc(db, "friend_requests", user.uid, "incoming", fromUser.uid));
    } catch (e) {
      alert("İstek kabul edilemedi: " + e.message);
    }
  };

  // ── Arkadaşlık isteğini reddet ───────────────────────────────────────────
  const rejectFriendRequest = async (fromUid) => {
    if (!user) return;
    await deleteDoc(doc(db, "friend_requests", user.uid, "incoming", fromUid));
  };

  // ── Arkadaşı sil ────────────────────────────────────────────────────────
  const removeFriend = async (friendUid) => {
    if (!user) return;
    await deleteDoc(doc(db, "friends", user.uid, "list", friendUid));
    await deleteDoc(doc(db, "friends", friendUid, "list", user.uid));
  };

  // ── Meydan oku ──────────────────────────────────────────────────────────
  const challengeFriend = async (friendUid, roomCode) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "challenge_invites", friendUid, "invites", user.uid), {
        uid: user.uid,
        displayName: user.displayName || user.email,
        roomCode,
        status: "pending",
        sentAt: serverTimestamp(),
        expiresAt: getExpiryDate(TTL_DURATIONS.challengeInvite),
      });
    } catch (e) {
      alert("Meydan okuma gönderilemedi: " + e.message);
    }
  };

  // ── Meydan okumayı kabul et ──────────────────────────────────────────────
  const acceptChallenge = async (challenge, onAccepted) => {
    if (!user) return;
    try {
      // Kendi davetini sil
      await deleteDoc(doc(db, "challenge_invites", user.uid, "invites", challenge.uid));
      // Karşı tarafın davetini de sil
      await deleteDoc(doc(db, "challenge_invites", challenge.uid, "invites", user.uid));
      onAccepted(challenge.roomCode);
    } catch (e) {
      alert("Kabul edilemedi: " + e.message);
    }
  };

  // ── Meydan okumayı reddet ────────────────────────────────────────────────
  const rejectChallenge = async (fromUid) => {
    if (!user) return;
    await deleteDoc(doc(db, "challenge_invites", user.uid, "invites", fromUid));
  };

  return {
    friends,
    incomingRequests,
    incomingChallenges,
    searchResult,
    searchLoading,
    searchError,
    searchUser,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    challengeFriend,
    acceptChallenge,
    rejectChallenge,
    setSearchResult,
    setSearchError,
  };
}
