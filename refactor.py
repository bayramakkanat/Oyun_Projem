import os
import re

app_path = r"c:\Users\bayra\Desktop\OyunProjem\src\App.js"
with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

state_start = text.find("export default function App() {")
state_end = text.find('  if (gameMode === "versus" && versusPhase === "lobby") {')

imports_text = text[:state_start]
state_text = text[state_start:state_end]
jsx_text = text[state_end:]

exports = set()
for m in re.finditer(r"const\s+\[([a-zA-Z0-9_]+),\s*([a-zA-Z0-9_]+)\]", state_text):
    exports.add(m.group(1))
    exports.add(m.group(2))

for m in re.finditer(r"const\s+([a-zA-Z0-9_]+)\s*=\s*(?:useRef|useCallback|useState|useEffect)", state_text):
    exports.add(m.group(1))

for m in re.finditer(r"const\s+([a-zA-Z0-9_]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>", state_text):
    exports.add(m.group(1))

for m in re.finditer(r"const\s+\{\s*([^}]+)\}\s*=\s*use(?:Battle|Shop|Auth|Arena|EndTurn|Music)", state_text):
    vars = m.group(1).split(",")
    for v in vars:
        clean = v.strip()
        if clean:
            exports.add(clean)

for m in re.finditer(r"const\s+([a-zA-Z0-9_]+)\s*=\s*(?:Math|DIFFICULTY_CONFIGS|parseFloat|loadStats)", state_text):
    exports.add(m.group(1))

exports.add("turnRef2")
exports.add("maxT")
exports.add("currentDiffConfig")
exports.add("diffMult")
exports.add("difficulty")
exports.add("teamSlots")
exports.add("shopSlots")
exports.add("empty")
exports.add("hasR")
exports.add("isBossTurn")

valid_identifiers = []
for export_item in exports:
    if re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", export_item):
        valid_identifiers.append(export_item)

export_str = ",\n    ".join(sorted(valid_identifiers))

# Clean imports for GameContext (it goes to src/context/)
ctx_imports = imports_text.replace('"./', '"../')
ctx_imports = ctx_imports.replace('import { useState, useEffect, useRef, useCallback } from "react";', '')

game_context_code = f"""import React, {{ createContext, useContext, useState, useEffect, useRef, useCallback }} from "react";
{ctx_imports}

export const GameContext = createContext();

export const GameProvider = ({{ children }}) => {{
{state_text.replace('export default function App() {', '')}
  const empty = team.filter((x) => x === null).length;
  const hasR = rewards.length > 0;

  return (
    <GameContext.Provider value={{{{
        {export_str}
    }}}}>
      {{children}}
    </GameContext.Provider>
  );
}};

export const useGameContext = () => useContext(GameContext);
"""

os.makedirs(r"c:\Users\bayra\Desktop\OyunProjem\src\context", exist_ok=True)
with open(r"c:\Users\bayra\Desktop\OyunProjem\src\context\GameContext.js", "w", encoding="utf-8") as f:
    f.write(game_context_code)

# Clean imports for GameRouter (it goes to src/components/)
router_imports = imports_text.replace('import "./styles.css";', '')
router_imports = router_imports.replace('"./components/', '"./')
router_imports = router_imports.replace('"./hooks/', '"../hooks/')
router_imports = router_imports.replace('"./utils/', '"../utils/')
router_imports = router_imports.replace('"./data/', '"../data/')
router_imports = router_imports.replace('"./firebase"', '"../firebase"')

router_code = f"""import React from "react";
import {{ useGameContext }} from "../context/GameContext";
{router_imports}

export default function GameRouter() {{
  const context = useGameContext();
  const {{
    {export_str}
  }} = context;

{jsx_text}
"""

with open(r"c:\Users\bayra\Desktop\OyunProjem\src\components\GameRouter.jsx", "w", encoding="utf-8") as f:
    f.write(router_code)

app_code = """import React from "react";
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
"""
with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_code)

print("REFACTORING COMPLETED")
