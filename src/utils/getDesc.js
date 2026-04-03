import { AB, ABILITY_MULTIPLIERS as AM } from "../data/gameData";
const pwr = (a) => {
  if (!a) return 1;
  if (a.lvl === 3) return 3;
  if (a.lvl === 2) return 2;
  return 1;
};

export const getDesc = (a, lvlOverride) => {
  const m = lvlOverride || pwr(a);
  if (a.ability === AB.FAINT_BUFF) return `Ölünce: Rastgele dosta +${m} Atak, +${m} Can verir`;
  if (a.ability === AB.NONE) return "Yetenek yok";
  if (a.ability === AB.START_BUFF) return `Savaş başı: Kendine +${m} Atak verir`;
  if (a.ability === AB.END_HEAL_ONE)
    return `Tur sonu: Rastgele dosta +${m} Can verir (kalıcı)`;
  if (a.ability === AB.FAINT_GOLD) return `Ölünce: +${m} altın`;
  if (a.ability === AB.SELL_GOLD) return `Satınca: +${m} altın`;
  if (a.ability === AB.BUY_BUFF_RANDOM)
    return `Hayvan alınca: Rastgele dosta +${m} Atak, +${m} Can verir (kalıcı)`;
  if (a.ability === AB.START_TEAM_SHIELD) return `Savaş başı: Takıma +${m} Can verir`;
  if (a.ability === AB.LEVELUP_BUFF_SELF)
    return `Seviye atlayınca: +${m * 2} Atak, +${m * 2} Can kazanır (kalıcı).`;
  if (a.ability === AB.FRIEND_LEVELUP_BUFF)
    return `Dost seviye atlayınca: +${m} Atak, +${m} Can kazanır (kalıcı).`;
  if (a.ability === AB.FAINT_COPY) {
    const pct = m === 1 ? 25 : m === 2 ? 50 : 100;
    return `Ölünce: Rastgele dosta %${pct} stat`;
  }
  if (a.ability === AB.START_DMG)
    return `Savaş başı: Rastgele düşmana ${2 * m} hasar`;
  if (a.ability === AB.ATK_BUFF) return `Her vuruşta: Kendine +${m} Atak verir`;
  if (a.ability === AB.FAINT_DMG) return `Ölünce: Tüm düşmanlara ${m * 2} hasar`;
  if (a.ability === AB.START_POISON)
    return `Savaş başı: Ön düşmana -${m * 2} Atak uygular`;
  if (a.ability === AB.FRIEND_SUMMON)
    return `Dost ölünce: ${m * 2} Atak, ${m * 3} Can değerinde yavru çağırır (en fazla 3).`;
  if (a.ability === AB.SELL_BUFF_FRIEND)
    return `Satınca: Rastgele ${m} dosta +${AM.SELL_BUFF_AMT * m} Atak, +${AM.SELL_BUFF_AMT * m} Can verir (kalıcı).`;
  if (a.ability === AB.SHOP_DISCOUNT)
    return `Alınca: Sonraki yenilemede tüm hayvanlara ${m} altın indirim`;
  if (a.ability === AB.FAINT_SHIELD) return `Ölünce: Tüm dostlara +${2 * m} Can verir`;
  if (a.ability === AB.START_SNIPE)
    return `Savaş başı: Arka düşmana ${3 * m} hasar`;
  if (a.ability === AB.FRIEND_FAINT)
    return `Dost ölünce: Kendine +${2 * m} Atak, +${2 * m} Can verir`;
  if (a.ability === AB.END_TEAM_BUFF)
    return `Tur sonu: Arkadaki 2 dosta +${m * 2} Atak, +${m * 2} Can verir (kalıcı).`;
  if (a.ability === AB.START_CHARGE)
    return `Savaş başı: Kendine +${AM.START_CHARGE_AMT * m} Atak ve +${AM.START_CHARGE_AMT * m} Can verir. Her saldırıda +${AM.START_CHARGE_AMT * m} Atak kazanır.`;
  if (a.ability === AB.SELL_HEAL_TEAM)
    return `Satınca: Tüm takıma +${m * 2} Can verir (kalıcı)`;
  if (a.ability === AB.BUY_BUFF_BEHIND)
    return `Hayvan alınca: Arkadakine +${m} Atak, +${m} Can verir (kalıcı)`;
  if (a.ability === AB.HURT_WEAKEN_ATTACKER)
    return `Hasar alınca: Saldıranın Atağı %${m === 1 ? 33 : m === 2 ? 66 : 99} azalır`;
  if (a.ability === AB.KILL_BUFF) return `Öldürünce: Kendine +${3 * m} Atak, +${3 * m} Can verir`;
  if (a.ability === AB.FAINT_SUMMON)
    return `Ölünce: ${AM.FAINT_SUMMON_AMT * m} Atak, ${AM.FAINT_SUMMON_AMT * m} Can değerinde yavru çağırır`;
  if (a.ability === AB.START_ALL_PERM)
    return `Savaş başı: Tüm takıma +${2 * m} Atak verir (kalıcı)`;
  if (a.ability === AB.START_ALL) return `Savaş başı: Tüm takıma +${2 * m} Atak verir`;
  if (a.ability === AB.HURT_BUFF) return `Hasar alınca: Kendine +${4 * m} Atak verir`;
  if (a.ability === AB.END_ALL)
    return `Tur sonu: Tüm takıma +${m * 3} Can verir (kalıcı)`;
  if (a.ability === AB.START_TANK) return `Savaş başı: Kendine +${3 * m} Can verir`;
  if (a.ability === AB.HURT_TEAM_BUFF)
    return `Hasar alınca: Takıma +${3 * m} Atak, +${3 * m} Can verir`;
  if (a.ability === AB.END_BUFF_AHEAD)
    return `Tur sonu: Öndeki 3 dosta +${m * 2} Atak, +${m * 2} Can verir (kalıcı)`;
  if (a.ability === AB.BUY_DISCOUNT_NEXT)
    return `Mağazada: Hayvanlara -${m} altın indirim`;
  if (a.ability === AB.END_SELF_BUFF)
    return `Tur sonu: Kendine +${m * 3} Atak, +${m * 3} Can verir (kalıcı)`;
  if (a.ability === AB.START_FEAR)
    return `Savaş başı: Ön 2 düşmanın Atağını -${10 * m} azaltır`;
  if (a.ability === AB.HURT_DMG)
    return `Hasar alınca: Rastgele düşmana ${9 * m} hasar`;
  if (a.ability === AB.START_TRAMPLE)
    return `Savaş başı: Kendine +${5 * m} Atak verir. Taşan hasar arkadaki düşmana geçer.`;
  if (a.ability === AB.FAINT_RAGE)
    return `Ölünce: Tüm takıma +${8 * m} Atak, +${8 * m} Can verir`;
  if (a.ability === AB.START_TRIPLE)
    return `Savaş başı: İlk ${m} saldırı 3x hasar`;
  if (a.ability === AB.KILL_FEAR_ALL)
    return `Öldürünce: Tüm düşmanlara -${5 * m} Atak, -${5 * m} Can uygular`;
  if (a.ability === AB.START_FREEZE_ENEMY)
    return `Savaş başı: Ön ve arka düşmanın Atağını %${33 * m} azaltır`;
  if (a.ability === AB.END_GAIN_GOLD) return `Tur sonu: +${m} altın`;
  if (a.ability === AB.START_FIRE)
    return `Savaş başı: Tüm düşmanlara ${6 * m} hasar verir. Kendine +${4 * m} Atak kazanır (kalıcı).`;
  if (a.ability === AB.STAG_COMBO)
    return `Savaş başı: Takıma +${AM.STAG_COMBO_AMT * m} Atak, +${AM.STAG_COMBO_AMT * m} Can verir (kalıcı). Ölünce aynı etki tekrar eder.`;
  if (a.ability === AB.DEVOUR)
    return `Öldürünce: Düşmanın statlarının %${30 + 10 * m}'unu alır.`;
  if (a.ability === AB.FAINT_WAVE)
    return `Ölünce: Tüm düşmanlara ${9 * m} hasar`;
  if (a.ability === AB.DOUBLE) return `Tüm saldırılar: 2x hasar`;
  if (a.ability === AB.WEAKEN_STRONG)
    return `Savaş başı: En güçlü düşmanın Atak ve Can değerlerini %${25 * m} azaltır`;
  if (a.ability === AB.KILL_HEAL_TEAM)
    return `Öldürünce: Takıma +${3 * m} Atak, +${3 * m} Can verir (kalıcı)`;
  if (a.ability === AB.START_MULTI_SNIPE)
    return `Savaş başı: ${m + 1} düşmana ${8 * m} hasar verir. Hayatta kalırsa kendine +${m * 5} Atak, +${m * 5} Can verir (kalıcı).`;
  if (a.ability === AB.FAINT_DUPLICATE)
    return `Ölünce: Rastgele bir dostu kopyalar.`;
  if (a.ability === AB.FAINT_BUFF_SELF)
    return `Ölünce (tur sonu): Kendine +${2 * m} Atak, +${2 * m} Can verir (kalıcı)`;
  if (a.ability === AB.SELL_BUFF_SHOP)
    return `Satınca: Mağazadaki hayvanlara +${2 * m} Atak, +${2 * m} Can verir (kalıcı)`;
  if (a.ability === AB.BUY_TARGET_HP)
    return `Satın alınınca: Seçilen dosta +${3 * m} Can verir (kalıcı)`;
  if (a.ability === AB.SUMMON_BUFF)
    return `Savaşta çıkan yavruya +${AM.SUMMON_BUFF_AMT * m} Atak, +${AM.SUMMON_BUFF_AMT * m} Can verir`;
  if (a.ability === AB.SUMMON_RETRIGGER)
    return `Dost ölünce: Ölüm etkisini ve yavru güçlendirmesini ${m} kez tekrarlar.`;
  if (a.ability === AB.CHEETAH_FAINT)
    return `Ölünce: Tüm takıma +${8 * m} Atak, +${8 * m} Can verir`;
  if (a.ability === AB.BUY_TARGET_BUFF) {
    const buffAmount = m === 1 ? 1 : m === 2 ? 2 : 4;
    return `Satın alınınca: Seçilen dosta +${buffAmount} Atak, +${buffAmount} Can verir (kalıcı)`;
  }
  if (a.ability === AB.FAINT_WEAKEN_ALL) {
    const debuff = m === 1 ? 3 : m === 2 ? 5 : 8;
    return `Ölünce: Tüm düşmanlara -${debuff} Atak, -${debuff} Can uygular`;
  }
  if (a.ability === AB.HURT_REFLECT) {
    const pct = m === 1 ? 33 : m === 2 ? 66 : 99;
    return `Hasar alınca: Gelen hasarın %${pct}'ini saldırana geri verir.`;
  }
  return "";
};



