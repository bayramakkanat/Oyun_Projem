import { AB } from "../data/gameData";
const pwr = (a) => {
  if (!a) return 1;
  if (a.lvl === 3) return 3;
  if (a.lvl === 2) return 2;
  return 1;
};

export const getDesc = (a, lvlOverride) => {
  const m = lvlOverride || pwr(a);
  if (a.ability === AB.FAINT_BUFF) return `Olunce: Rastgele dosta +${m}/+${m}`;
  if (a.ability === AB.NONE) return "Yetenek yok";
  if (a.ability === AB.START_BUFF) return `Savas basi: Kendine +${m} atk`;
  if (a.ability === AB.END_HEAL_ONE)
    return `Tur sonu: Rastgele dosta +${m} hp kalici`;
  if (a.ability === AB.FAINT_GOLD) return `Olunce: +${m} altin`;
  if (a.ability === AB.SELL_GOLD) return `Satinca: +${m} altin`;
  if (a.ability === AB.BUY_BUFF_RANDOM)
    return `Hayvan alinca: Rastgele dosta +${m}/+${m} kalici`;
  if (a.ability === AB.START_TEAM_SHIELD) return `Savas basi: Takima +${m} hp`;
  if (a.ability === AB.LEVELUP_BUFF_SELF)
    return `Seviye atlayinca: Kendine +${m * 2}/+${m * 2} kalici`;
  if (a.ability === AB.FRIEND_LEVELUP_BUFF)
    return `Dost seviye atlayinca: Kendine +${m}/+${m} kalici`;
  if (a.ability === AB.FAINT_COPY) {
    const pct = m === 1 ? 25 : m === 2 ? 50 : 100;
    return `Olunce: Rastgele dosta %${pct} stat`;
  }
  if (a.ability === AB.START_DMG)
    return `Savas basi: Rastgele dusmana ${2 * m} hasar`;
  if (a.ability === AB.ATK_BUFF) return `Her vurusta: Kendine +${m} atk`;
  if (a.ability === AB.FAINT_DMG) return `Olunce: Tum dusmanlara ${m * 2} hasar`;
  if (a.ability === AB.START_POISON)
    return `Savas basi: On dusmana -${m * 2} atk`;
  if (a.ability === AB.FRIEND_SUMMON)
    return `Dost olunce: ${m * 2} atk/${m * 3} hp yavru cagir (max 3)`;
  if (a.ability === AB.SELL_BUFF_FRIEND)
    return `Satinca: Rastgele ${m} dosta +${m}/+${m} kalici`;
  if (a.ability === AB.SHOP_DISCOUNT)
    return `Alinca: Sonraki yenilemede tum hayvanlara ${m} altin indirim`;
  if (a.ability === AB.FAINT_SHIELD) return `Olunce: Tum dostlara +${2 * m} hp`;
  if (a.ability === AB.START_SNIPE)
    return `Savas basi: Arka dusmana ${3 * m} hasar`;
  if (a.ability === AB.FRIEND_FAINT)
    return `Dost olunce: Kendine +${2 * m}/+${2 * m}`;
  if (a.ability === AB.END_TEAM_BUFF)
    return `Tur sonu: Arkadaki 2 dosta +${m * 2}/+${m * 2} kalici`;
  if (a.ability === AB.START_CHARGE)
    return `Savas basi: Kendine +${2 * m} hp | Her saldirida: Kendine +${2 * m} atk`;
  if (a.ability === AB.SELL_HEAL_TEAM)
    return `Satinca: Tum takima +${m * 2} hp kalici`;
  if (a.ability === AB.BUY_BUFF_BEHIND)
    return `Hayvan alinca: Arkadakine +${m}/+${m} kalici`;
  if (a.ability === AB.HURT_WEAKEN_ATTACKER)
    return `Hasar alinca: Saldiran -%${m === 1 ? 33 : m === 2 ? 66 : 99} atk`;
  if (a.ability === AB.KILL_BUFF) return `Oldurunce: Kendine +${3 * m}/+${3 * m}`;
  if (a.ability === AB.FAINT_SUMMON)
    return `Olunce: ${4 * m} atk/${4 * m} hp yavru cagir`;
  if (a.ability === AB.START_ALL_PERM)
    return `Savas basi: Tum takima +${2 * m} atk kalici`;
  if (a.ability === AB.START_ALL) return `Savas basi: Tum takima +${2 * m} atk`;
  if (a.ability === AB.HURT_BUFF) return `Hasar alinca: Kendine +${4 * m} atk`;
  if (a.ability === AB.END_ALL)
    return `Tur sonu: Tum takima +${m * 3} hp kalici`;
  if (a.ability === AB.START_TANK) return `Savas basi: Kendine +${3 * m} hp`;
  if (a.ability === AB.HURT_TEAM_BUFF)
    return `Hasar alinca: Takima +${3 * m}/+${3 * m}`;
  if (a.ability === AB.END_BUFF_AHEAD)
    return `Tur sonu: Ondeki 3'e +${m * 2}/+${m * 2} kalici`;
  if (a.ability === AB.BUY_DISCOUNT_NEXT)
    return `Magazada: Hayvanlara -${m} altin indirim`;
  if (a.ability === AB.END_SELF_BUFF)
    return `Tur sonu: Kendine +${m * 3}/+${m * 3} kalici`;
  if (a.ability === AB.START_FEAR)
    return `Savas basi: On 2 dusmana -${10 * m} atk`;
  if (a.ability === AB.HURT_DMG)
    return `Hasar alinca: Rastgele dusmana ${9 * m} hasar`;
  if (a.ability === AB.START_TRAMPLE)
    return `Savas basi: Kendine +${5 * m} atk | Fazla hasar arka dusmana gecer`;
  if (a.ability === AB.FAINT_RAGE)
    return `Olunce: Tum takima +${8 * m}/+${8 * m}`;
  if (a.ability === AB.START_TRIPLE)
    return `Savas basi: Ilk ${m} saldiri 3x hasar`;
  if (a.ability === AB.KILL_FEAR_ALL)
    return `Oldurunce: Tum dusmanlara -${5 * m} atk / -${5 * m} hp`;
  if (a.ability === AB.START_FREEZE_ENEMY)
    return `Savas basi: On ve arka dusmana -%${33 * m} atk`;
  if (a.ability === AB.END_GAIN_GOLD) return `Tur sonu: +${m} altin`;
  if (a.ability === AB.START_FIRE)
    return `Savas basi: Tum dusmanlara ${6 * m} hasar | Kendine +${4 * m} atk kalici`;
  if (a.ability === AB.STAG_COMBO)
    return `Savas basi: Takima +${2 * m}/+${2 * m} kalici | Olunce: Takima +${2 * m}/+${2 * m} kalici (Dodo tetikleyemez)`;
  if (a.ability === AB.DEVOUR)
    return `Oldurunce: Dusmanin %${30 + 10 * m} statini al`;
  if (a.ability === AB.FAINT_WAVE)
    return `Olunce: Tum dusmanlara ${9 * m} hasar`;
  if (a.ability === AB.DOUBLE) return `Tum saldirilar: 2x hasar`;
  if (a.ability === AB.WEAKEN_STRONG)
    return `Savas basi: En guclu dusmana -%${25 * m} atk/hp`;
  if (a.ability === AB.KILL_HEAL_TEAM)
    return `Oldurunce: Takima +${3 * m}/+${3 * m} kalici`;
  if (a.ability === AB.START_MULTI_SNIPE)
    return `Savas basi: ${m + 1} dusmana ${8 * m} hasar | Hayatta kalirsa: Kendine +${m * 5}/+${m * 5} kalici`;
  if (a.ability === AB.FAINT_DUPLICATE)
    return `Olunce: Rastgele dostu kopyala (Dodo tetikleyemez)`;
  if (a.ability === AB.FAINT_BUFF_SELF)
    return `Olunce (tur sonu): Kendine +${2 * m}/+${2 * m} kalici`;
  if (a.ability === AB.SELL_BUFF_SHOP)
    return `Satinca: Magazadaki hayvanlara +${m}/+${m} kalici`;
  if (a.ability === AB.SUMMON_BUFF)
    return `Savasta cikan yavruya +${5 * m}/+${5 * m} verir`;
  if (a.ability === AB.SUMMON_RETRIGGER)
    return `Dost olunce: Olum efekti ve yavru guclendirmesini ${m} kez tekrarlar`;
  if (a.ability === AB.CHEETAH_FAINT)
    return `Olunce: Tum takima +${8 * m}/+${8 * m}`;
  if (a.ability === AB.BUY_TARGET_BUFF) {
    const buffAmount = m === 1 ? 1 : m === 2 ? 2 : 4;
    return `Satin alininca: Secilen dosta +${buffAmount}/+${buffAmount} kalici`;
  }
  if (a.ability === AB.FAINT_WEAKEN_ALL) {
    const debuff = m === 1 ? 3 : m === 2 ? 5 : 8;
    return `Olunce: Tum dusmanlara -${debuff}/-${debuff}`;
  }
  if (a.ability === AB.HURT_REFLECT) {
    const pct = m === 1 ? 33 : m === 2 ? 66 : 99;
    return `Hasar alinca: Saldirana aldiginin %${pct}'ini geri yansit`;
  }
  return "";
};

