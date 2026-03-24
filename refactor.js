const fs = require('fs');
const path = require('path');

const appPath = path.join('c:', 'Users', 'bayra', 'Desktop', 'OyunProjem', 'src', 'App.js');
const text = fs.readFileSync(appPath, 'utf8');

const stateStart = text.indexOf('export default function App() {');
const stateEnd = text.indexOf('  if (gameMode === "versus" && versusPhase === "lobby") {');

const importsText = text.slice(0, stateStart);
const stateText = text.slice(stateStart, stateEnd);
const jsxText = text.slice(stateEnd);

const exportsSet = new Set();
let match;

const reg1 = /const\s+\[([a-zA-Z0-9_]+),\s*([a-zA-Z0-9_]+)\]/g;
while ((match = reg1.exec(stateText)) !== null) {
  exportsSet.add(match[1]);
  exportsSet.add(match[2]);
}

const reg2 = /const\s+([a-zA-Z0-9_]+)\s*=\s*use(?:Ref|Callback|State|Effect)/g;
while ((match = reg2.exec(stateText)) !== null) {
  exportsSet.add(match[1]);
}

const reg3 = /const\s+([a-zA-Z0-9_]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/g;
while ((match = reg3.exec(stateText)) !== null) {
  exportsSet.add(match[1]);
}

const reg4 = /const\s+\{\s*([^}]+)\}\s*=\s*use(?:Battle|Shop|Auth|Arena|EndTurn|Music)/g;
while ((match = reg4.exec(stateText)) !== null) {
  const vars = match[1].split(',');
  for(let v of vars) {
    const clean = v.trim();
    if (clean) exportsSet.add(clean);
  }
}

const reg5 = /const\s+([a-zA-Z0-9_]+)\s*=\s*(?:Math|DIFFICULTY_CONFIGS|parseFloat|loadStats)/g;
while ((match = reg5.exec(stateText)) !== null) {
  exportsSet.add(match[1]);
}

exportsSet.add("turnRef2");
exportsSet.add("maxT");
exportsSet.add("currentDiffConfig");
exportsSet.add("diffMult");
exportsSet.add("difficulty");
exportsSet.add("teamSlots");
exportsSet.add("shopSlots");
exportsSet.add("empty");
exportsSet.add("hasR");
exportsSet.add("isBossTurn");

const validIdentifiers = [];
for (let item of exportsSet) {
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(item)) {
    validIdentifiers.push(item);
  }
}
validIdentifiers.sort();
const exportStr = validIdentifiers.join(',\n    ');

// GameContext Clean Imports
let ctxImports = importsText.replace(/"\.\//g, '"../');
ctxImports = ctxImports.replace(/import \{ useState, useEffect, useRef, useCallback \} from "react";/, '');

const gameContextCode = `import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
${ctxImports}

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
${stateText.replace('export default function App() {', '')}
  const empty = team.filter((x) => x === null).length;
  const hasR = rewards.length > 0;

  return (
    <GameContext.Provider value={{
        ${exportStr}
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => useContext(GameContext);
`;

const ctxDir = path.join('c:', 'Users', 'bayra', 'Desktop', 'OyunProjem', 'src', 'context');
if (!fs.existsSync(ctxDir)) {
  fs.mkdirSync(ctxDir, { recursive: true });
}
fs.writeFileSync(path.join(ctxDir, 'GameContext.js'), gameContextCode, 'utf8');

let routerImports = importsText.replace(/import "\.\/styles\.css";/, '');
routerImports = routerImports.replace(/"\.\/components\//g, '"./');
routerImports = routerImports.replace(/"\.\/hooks\//g, '"../hooks/');
routerImports = routerImports.replace(/"\.\/utils\//g, '"../utils/');
routerImports = routerImports.replace(/"\.\/data\//g, '"../data/');
routerImports = routerImports.replace(/"\.\/firebase"/g, '"../firebase"');

const routerCode = `import React from "react";
import { useGameContext } from "../context/GameContext";
${routerImports}

export default function GameRouter() {
  const context = useGameContext();
  const {
    ${exportStr}
  } = context;

${jsxText}
`;

fs.writeFileSync(path.join('c:', 'Users', 'bayra', 'Desktop', 'OyunProjem', 'src', 'components', 'GameRouter.jsx'), routerCode, 'utf8');

const appCode = `import React from "react";
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
`;
fs.writeFileSync(appPath, appCode, 'utf8');

console.log("REFACTORING COMPLETED");
