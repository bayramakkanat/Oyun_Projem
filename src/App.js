import React from "react";
import "./styles.css";
import { GameProvider } from "./context/GameContext";
import GameRouter from "./components/GameRouter";

export default function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}
