import { useEffect } from "react";
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
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { logError } from "../utils/helpers";
import { loadStats } from "../utils/helpers";

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

  // Firebase Auth Observer
  useEffect(() => {
   const unsub = onAuthStateChanged(auth, async (u) => {
  setUser(u);
  if (u) {
    setShowAuthModal(false);
    const base = loadStats(u?.uid);
    setStats(base);
    // Firebase'den başarımları yükle
    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase");
      const profileSnap = await getDoc(doc(db, "user_profiles", u.uid));
      if (profileSnap.exists()) {
        const fbAchievements = profileSnap.data().achievements || [];
        setStats(prev => ({ ...prev, achievements: fbAchievements }));
        // Local'e de yaz ki unlockAchievement kontrolü çalışsın
        const updated = { ...base, achievements: fbAchievements };
        const { saveStats } = await import("../utils/helpers");
        saveStats(updated, u.uid);
      }
    } catch (e) {
      console.error("Firebase achievements yüklenemedi:", e);
    }
  } else {
    setStats(loadStats(null));
  }
});
    return () => unsub();
  }, []);

  const handleGoogleLogin = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const u = result.user;
    const username = (u.displayName || u.email.split("@")[0]).toLowerCase().replace(/\s+/g, "_");
    const existing = await getDocs(
      query(collection(db, "usernames"), where("uid", "==", u.uid))
    );
    if (existing.empty) {
      await setDoc(doc(db, "usernames", username), {
        username,
        uid: u.uid,
        displayName: u.displayName || username,
      });
    }
  } catch (err) {
    logError(err, "Google Login");
    alert("Giriş yapılamadı: " + err.message);
  }
};

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, authEmail, authPass);
      } else {
        const usernameToCheck = authUsername || authEmail.split("@")[0];
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
        const userCred = await createUserWithEmailAndPassword(
          auth,
          authEmail,
          authPass
        );
        await updateProfile(userCred.user, {
          displayName: `${authAvatar} ${usernameToCheck}`,
        });
        await setDoc(doc(db, "usernames", usernameToCheck.toLowerCase()), {
          username: usernameToCheck.toLowerCase(),
          uid: userCred.user.uid,
          displayName: `${authAvatar} ${usernameToCheck}`,
        });
      }
    } catch (err) {
      logError(err, "Email Auth");
      alert("İşlem başarısız: " + err.message);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleUpdateProfile = async (user) => {
    if (!user) return;

    const currentUsername = (user.displayName || "")
      .split(" ")
      .slice(1)
      .join(" ");
    const finalUsername = settingsUsername.trim() || currentUsername;

    try {
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
        if (currentUsername) {
          await setDoc(doc(db, "usernames", currentUsername.toLowerCase()), {
            deleted: true,
          });
        }
      }
      const newDisplayName = `${settingsAvatar} ${finalUsername}`;
      await updateProfile(user, { displayName: newDisplayName });
      await setDoc(doc(db, "usernames", finalUsername.toLowerCase()), {
        username: finalUsername.toLowerCase(),
        uid: user.uid,
        displayName: newDisplayName,
      });
      await user.reload();
      setUser(auth.currentUser);
      setDisplayName(newDisplayName);
      alert("Profil güncellendi!");
      setShowSettingsModal(false);
    } catch (err) {
      logError(err, "Update Profile");
      alert("Güncelleme başarısız: " + err.message);
    }
  };

  return {
    handleGoogleLogin,
    handleEmailAuth,
    handleLogout,
    handleUpdateProfile,
  };
}
