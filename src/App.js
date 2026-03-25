import React from "react";
import "./styles.css";
import { AuthProvider } from "./context/AuthContext";
import { GameProvider } from "./context/GameContext";
import GameRouter from "./components/GameRouter";

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <GameRouter />
      </GameProvider>
    </AuthProvider>
  );
}
