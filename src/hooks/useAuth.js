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
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setShowAuthModal(false);
      setStats(loadStats(u?.uid));
    });
    return () => unsub();
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
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
