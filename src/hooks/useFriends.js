import { useState, useEffect } from "react";
import {
  collection, doc, setDoc, getDoc, getDocs,
  deleteDoc, onSnapshot, query, where,
  serverTimestamp, orderBy
} from "firebase/firestore";
import { db } from "../firebase";

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
  useEffect(() => {
    if (!user) return;
    const ref = collection(db, "friend_requests", user.uid, "incoming");
    const unsub = onSnapshot(ref, (snap) => {
      setIncomingRequests(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
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
  const searchUser = async (username) => {
    if (!username.trim()) return;
    setSearchLoading(true);
    setSearchError("");
    setSearchResult(null);
    try {
      const searchTerm = username.toLowerCase().trim();
const snap = await getDocs(
  query(collection(db, "usernames"), where("username", "==", searchTerm))
);
if (snap.empty) {
  // displayName ile de dene
 const snap2 = await getDocs(
  query(collection(db, "usernames"), where("username", ">=", searchTerm), where("username", "<=", searchTerm + "\uf8ff"))
);
  if (snap2.empty) {
    setSearchError("Kullanıcı bulunamadı.");
    setSearchLoading(false);
    return;
  }
  // snap2 ile devam et
  const data = snap2.docs[0].data();
  if (data.uid === user.uid) {
    setSearchError("Kendinize istek gönderemezsiniz.");
    setSearchLoading(false);
    return;
  }
  const alreadyFriend = friends.some(f => f.uid === data.uid);
  const reqSnap = await getDoc(doc(db, "friend_requests", data.uid, "incoming", user.uid));
  setSearchResult({ ...data, alreadyFriend, requestSent: reqSnap.exists() });
  setSearchLoading(false);
  return;
}
      if (snap.empty) {
        setSearchError("Kullanıcı bulunamadı.");
      } else {
        const data = snap.docs[0].data();
        if (data.uid === user.uid) {
          setSearchError("Kendinize istek gönderemezsiniz.");
        } else {
          // Zaten arkadaş mı?
          const alreadyFriend = friends.some(f => f.uid === data.uid);
          // Zaten istek gönderilmiş mi?
          const reqSnap = await getDoc(doc(db, "friend_requests", data.uid, "incoming", user.uid));
          setSearchResult({
            ...data,
            alreadyFriend,
            requestSent: reqSnap.exists(),
          });
        }
      }
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
      });
    } catch (e) {
      alert("Meydan okuma gönderilemedi: " + e.message);
    }
  };

 // ── Meydan okumayı kabul et ──────────────────────────────────────────────
  const acceptChallenge = async (challenge, onAccepted) => {
    if (!user) return;
    try {
      // Sadece kendi invite'ını sil, karşıya yazma — döngüyü önler
      await deleteDoc(doc(db, "challenge_invites", user.uid, "invites", challenge.uid));
      // Karşı taraftaki orijinal invite'ı da sil
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
