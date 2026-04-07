import { useEffect, useState } from "react";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  setDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { logError, loadStats, setCollectionCache } from "../utils/helpers";

export function useAuth({
  authMode,
  authEmail,
  authPass,
  authUsername,
  authAvatar,
  settingsUsername,
  settingsAvatar,
  setUser,
  setShowAuthModal,
  setStats,
  setDisplayName,
  setShowSettingsModal,
}) {
  const [authReady, setAuthReady] = useState(false);

  // ─── Firebase Auth gözlemcisi ─────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthReady(true);
      if (u) {
        setShowAuthModal(false);
        const base = loadStats(u.uid);
        setStats(base);

        // Firebase'den achievements yükle ve local cache ile birleştir
        try {
          const { doc: fsDoc, getDoc } = await import("firebase/firestore");
          const { db: fsDb }           = await import("../firebase");
          const profileSnap = await getDoc(fsDoc(fsDb, "user_profiles", u.uid));
          if (profileSnap.exists()) {
            const profileData    = profileSnap.data();
            const fbAchievements = profileData.achievements || [];
            setStats((prev) => ({ ...prev, achievements: fbAchievements }));
            // Local cache'i güncelle (unlockAchievement kontrolü için)
            const { saveStats } = await import("../utils/helpers");
            await saveStats({ ...base, achievements: fbAchievements }, u.uid);
            // Koleksiyon verisini belleğe al
            if (profileData.collection) {
              setCollectionCache(profileData.collection);
            }
          }
        } catch (err) {
          logError(err, "useAuth:loadAchievements");
        }
      } else {
        setStats(loadStats(null));
      }
    });
    return () => unsub();
  }, []);

  // ─── Google ile giriş ─────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const u      = result.user;

      const existing = await getDocs(
        query(collection(db, "usernames"), where("uid", "==", u.uid))
      );

      if (!existing.empty) {
        // Mevcut kullanici: kaydedilmis displayName'i Firebase Auth'a geri yaz
        const savedDisplayName = existing.docs[0].data().displayName;
        if (savedDisplayName && u.displayName !== savedDisplayName) {
          await updateProfile(u, { displayName: savedDisplayName });
          await u.reload();
          setUser(auth.currentUser);
        }
      } else {
        // Yeni kullanici: Gmail adindan username turet ve kaydet
        const username = (u.displayName || u.email.split("@")[0])
          .toLowerCase()
          .replace(/\s+/g, "_");
        const newDisplayName = "🐺 " + username;
        await updateProfile(u, { displayName: newDisplayName });
        await setDoc(doc(db, "usernames", username), {
          username,
          uid:         u.uid,
          displayName: newDisplayName,
        });
        await u.reload();
        setUser(auth.currentUser);
      }
    } catch (err) {
      logError(err, "Google Login");
      alert("Giris yapilamadi: " + err.message);
    }
  };

  // ─── E-posta ile giriş / kayıt ────────────────────────────────────────────
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, authEmail, authPass);
      } else {
        const usernameToCheck = (authUsername || authEmail.split("@")[0]).trim();
        const usernameDoc = await getDocs(
          query(
            collection(db, "usernames"),
            where("username", "==", usernameToCheck.toLowerCase())
          )
        );
        if (!usernameDoc.empty) {
          alert("Bu kullanıcı adı zaten alınmış, başka bir isim dene.");
          return;
        }
        const userCred = await createUserWithEmailAndPassword(auth, authEmail, authPass);
        await updateProfile(userCred.user, {
          displayName: `${authAvatar} ${usernameToCheck}`,
        });
        await setDoc(doc(db, "usernames", usernameToCheck.toLowerCase()), {
          username:    usernameToCheck.toLowerCase(),
          uid:         userCred.user.uid,
          displayName: `${authAvatar} ${usernameToCheck}`,
        });
      }
    } catch (err) {
      logError(err, "Email Auth");
      alert("İşlem başarısız: " + err.message);
    }
  };

  // ─── Çıkış ───────────────────────────────────────────────────────────────
  const handleLogout = () => signOut(auth);

  // ─── Profil güncelle ─────────────────────────────────────────────────────
  const handleUpdateProfile = async () => {
    const liveUser = auth.currentUser;
    if (!liveUser) return;

    const currentUsername = (liveUser.displayName || "").split(" ").slice(1).join(" ");
    const finalUsername   = settingsUsername.trim() || currentUsername;

    try {
      // Kullanıcı adı değiştiyse çakışma kontrolü yap
      if (finalUsername.toLowerCase() !== currentUsername.toLowerCase()) {
        const usernameDoc = await getDocs(
          query(
            collection(db, "usernames"),
            where("username", "==", finalUsername.toLowerCase())
          )
        );
        if (!usernameDoc.empty) {
          alert("Bu kullanıcı adı zaten alınmış, başka bir isim dene.");
          return;
        }

        // Eski kullanıcı adını koleksiyondan gerçekten sil
        if (currentUsername) {
          await deleteDoc(doc(db, "usernames", currentUsername.toLowerCase()));
        }
      }

      const newDisplayName = `${settingsAvatar} ${finalUsername}`;
      const liveUser = auth.currentUser;
      await updateProfile(liveUser, { displayName: newDisplayName });
      await setDoc(doc(db, "usernames", finalUsername.toLowerCase()), {
        username:    finalUsername.toLowerCase(),
        uid:         liveUser.uid,
        displayName: newDisplayName,
      });

      await liveUser.reload();
      setUser(auth.currentUser);
      setDisplayName(newDisplayName);
      alert("Profil güncellendi!");
      setShowSettingsModal(false);
    } catch (err) {
      logError(err, "Update Profile");
      alert("Güncelleme başarısız: " + err.message);
    }
  };

  return { authReady, handleGoogleLogin, handleEmailAuth, handleLogout, handleUpdateProfile };
}
