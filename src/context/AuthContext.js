import React, { createContext, useContext, useState } from "react";

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

  return (
    <AuthContext.Provider value={{
      user, setUser,
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
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);