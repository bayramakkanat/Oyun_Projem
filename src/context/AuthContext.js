import { loadStats } from "../utils/helpers";
import React, { createContext, useContext, useState } from "react";
import { useAuth } from "../hooks/useAuth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authAvatar, setAuthAvatar] = useState("🐺");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsUsername, setSettingsUsername] = useState("");
  const [settingsAvatar, setSettingsAvatar] = useState("🐺");
  const [displayName, setDisplayName] = useState("");
  const [stats, setStats] = useState(loadStats);

  const {
    authReady,
    handleGoogleLogin,
    handleEmailAuth,
    handleLogout,
    handleUpdateProfile,
  } = useAuth({
    authMode,
    authEmail,
    authPass,
    authUsername,
    authAvatar,
    settingsUsername,
    settingsAvatar,
    setUser,
    setShowAuthModal,
    setDisplayName,
    setShowSettingsModal,
    setStats,
  });

  return (
    <AuthContext.Provider value={{
      user, setUser,
      authReady,
      showAuthModal, setShowAuthModal,
      authEmail, setAuthEmail,
      authPass, setAuthPass,
      authMode, setAuthMode,
      authUsername, setAuthUsername,
      authAvatar, setAuthAvatar,
      showSettingsModal, setShowSettingsModal,
      settingsUsername, setSettingsUsername,
      settingsAvatar, setSettingsAvatar,
      displayName, setDisplayName,
      stats, setStats,
      handleGoogleLogin,
      handleEmailAuth,
      handleLogout,
      handleUpdateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
