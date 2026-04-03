const fs = require('fs');

const constantsDef = `import { AB, ABILITY_MULTIPLIERS } from "../data/gameData";
// const AM = ABILITY_MULTIPLIERS;
`;

function replaceMagicNumbers(content) {
  let c = content;
  
  if (!c.includes('ABILITY_MULTIPLIERS')) {
    c = c.replace(/import \{ AB \} from "\.\.\/data\/gameData";/, 'import { AB, ABILITY_MULTIPLIERS as AM } from "../data/gameData";');
  }

  // Tırtıl (START_BUFF_ATK = 1, zaten m) 
  // Salyangoz (START_TEAM_SHIELD_HP = 1, zaten m)
  // Baykuş
  c = c.replace(/3 \* m(?=.*hasar|.*SNIPE|.*\/\/\s*Baykuş)/g, 'AM.START_SNIPE_DMG * m');
  // Kertenkele
  c = c.replace(/2 \* m(?=.*hasar|.*DMG|.*\/\/\s*Kertenkele)/g, 'AM.START_DMG * m');
  // Aslan
  c = c.replace(/10 \* m(?=.*ATK|.*FEAR|.*Aslan)/g, 'AM.START_FEAR_ATK_RED * m');
  // Ejderha
  c = c.replace(/6 \* m(?=.*hasar|.*FIRE)/g, 'AM.START_FIRE_DMG * m');
  c = c.replace(/4 \* m(?=.*ATK KALICI)/g, 'AM.START_FIRE_ATK_BUFF * m');
  // Gergedan
  c = c.replace(/5 \* m(?=.*ATK|.*çiğneme|.*TRAMPLE)/g, 'AM.START_TRAMPLE_ATK * m');
  // Yaban Domuzu
  c = c.replace(/2 \* m(?=.*HP|.*CHARGE)/g, 'AM.START_CHARGE_HP * m');
  // Yengeç (tank)
  c = c.replace(/3 \* m(?=.*HP|.*TANK)/g, 'AM.START_TANK_HP * m');
  // Yılan
  c = c.replace(/m \* 2(?=.*ATK|.*POISON)/g, 'AM.START_POISON_ATK_RED * m');
  // Mamut
  c = c.replace(/m \* 30(?=.*yavaşlattı|.*FREEZE)/g, 'AM.START_FREEZE_PERC * m');
  // Penguen
  c = c.replace(/25 \* m(?=.*zayıflattı|.*WEAKEN_STRONG)/g, 'AM.WEAKEN_STRONG_PERC * m');
  // Kalamar
  c = c.replace(/8 \* m(?=.*hasar|.*MULTI_SNIPE)/g, 'AM.START_MULTI_SNIPE_DMG * m');
  
  // Geyik
  c = c.replace(/2 \* m(?=.*KALICI|.*STAG_COMBO)/g, 'AM.STAG_COMBO_AMT * m');

  return c;
}

const files = [
  'src/utils/battleUtils.js',
  'src/utils/battleStartPhase.js',
  'src/utils/battleTurnPhase.js'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    const original = fs.readFileSync(f, 'utf8');
    const newContent = replaceMagicNumbers(original);
    fs.writeFileSync(f, newContent);
    console.log(`Updated ${f}`);
  }
});
