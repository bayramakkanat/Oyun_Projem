const pwr = (a) => {
  if (!a) return 1;
  if (a.lvl === 3) return 3;
  if (a.lvl === 2) return 2;
  return 1;
};

export const getDesc = (a, lvlOverride) => {
  const m = lvlOverride || pwr(a);
  if (a.ability === "faint_buff") return `Ölünce: Rastgele dosta +${m}/+${m}`;
  if (a.ability === "none") return "Yetenek yok";
  if (a.ability === "start_buff") return `Savaş başı: Kendine +${m} atk`;
  if (a.ability === "end_heal_one")
    return `Tur sonu: Rastgele dosta +${m} hp kalıcı`;
  if (a.ability === "faint_gold") return `Ölünce: +${m} altın`;
  if (a.ability === "sell_gold") return `Satınca: +${m} altın`;
  if (a.ability === "buy_buff_random")
    return `Hayvan alınca: Rastgele dosta +${m}/+${m} kalıcı`;
  if (a.ability === "start_team_shield") return `Savaş başı: Takıma +${m} hp`;
  if (a.ability === "levelup_buff_self")
    return `Seviye atlayınca: Kendine +${m * 2}/+${m * 2} kalıcı`;
  if (a.ability === "friend_levelup_buff")
    return `Dost seviye atlayınca: Kendine +${m}/+${m} kalıcı`;
  if (a.ability === "faint_copy") {
    const pct = m === 1 ? 25 : m === 2 ? 50 : 100;
    return `Ölünce: Rastgele dosta %${pct} stat`;
  }
  if (a.ability === "start_dmg")
    return `Savaş başı: Rastgele düşmana ${2 * m} hasar`;
  if (a.ability === "atk_buff") return `Her vuruşta: Kendine +${m} atk`;
  if (a.ability === "faint_dmg") return `Ölünce: Tüm düşmanlara ${m * 2} hasar`;
  if (a.ability === "start_poison")
    return `Savaş başı: Ön düşmana -${m * 2} atk`;
  if (a.ability === "friend_summon")
    return `Dost ölünce: ${m * 2} atk/${m * 3} hp yavru çağır (max 3)`;
  if (a.ability === "sell_buff_friend")
    return `Satınca: Rastgele ${m} dosta +${m}/+${m} kalıcı`;
  if (a.ability === "shop_discount")
    return `Alınca: Sonraki yenilemede tüm hayvanlara -${m} altın indirim`;
  if (a.ability === "faint_shield") return `Ölünce: Tüm dostlara +${2 * m} hp`;
  if (a.ability === "start_snipe")
    return `Savaş başı: Arka düşmana ${3 * m} hasar`;
  if (a.ability === "friend_faint") return `Dost ölünce: Kendine +${2 * m}/+${2 * m}`;
  if (a.ability === "end_team_buff")
    return `Tur sonu: Arkadaki 2 dosta +${m * 2}/+${m * 2} kalıcı`;
  if (a.ability === "start_charge")
    return `Savaş başı: Kendine +${2 * m} hp | Her saldırıda: Kendine +${2 * m} atk`;
  if (a.ability === "sell_heal_team")
    return `Satınca: Tüm takıma +${m * 2} hp kalıcı`;
  if (a.ability === "buy_buff_behind")
    return `Hayvan alınca: Arkadakine +${m}/+${m} kalıcı`;
  if (a.ability === "hurt_weaken_attacker")
    return `Hasar alınca: Saldıran -%${m === 1 ? 33 : m === 2 ? 66 : 99} atk`;
  if (a.ability === "kill_buff") return `Öldürünce: Kendine +${3 * m}/+${3 * m}`;
  if (a.ability === "faint_summon")
    return `Ölünce: ${4 * m} atk/${4 * m} hp yavru çağır`;
  if (a.ability === "start_all_perm")
    return `Savaş başı: Tüm takıma +${2 * m} atk kalıcı`;
  if (a.ability === "start_all") return `Savaş başı: Tüm takıma +${2 * m} atk`;
  if (a.ability === "hurt_buff") return `Hasar alınca: Kendine +${4 * m} atk`;
  if (a.ability === "end_all")
    return `Tur sonu: Tüm takıma +${m * 3} hp kalıcı`;
  if (a.ability === "start_tank") return `Savaş başı: Kendine +${3 * m} hp`;
  if (a.ability === "hurt_team_buff")
    return `Hasar alınca: Takıma +${3 * m}/+${3 * m}`;
  if (a.ability === "end_buff_ahead")
    return `Tur sonu: Öndeki 3'e +${m * 2}/+${m * 2} kalıcı`;
  if (a.ability === "buy_discount_next")
    return `Mağazada: Hayvanlara -${m} altın indirim`;
  if (a.ability === "end_self_buff")
    return `Tur sonu: Kendine +${m * 3}/+${m * 3} kalıcı`;
  if (a.ability === "start_fear")
    return `Savaş başı: Ön 2 düşmana -${10 * m} atk`;
  if (a.ability === "hurt_dmg")
    return `Hasar alınca: Rastgele düşmana ${9 * m} hasar`;
  if (a.ability === "start_trample")
    return `Savaş başı: Kendine +${5 * m} atk | Fazla hasar arka düşmana geçer`;
  if (a.ability === "faint_rage")
    return `Ölünce: Tüm takıma +${8 * m}/+${8 * m}`;
  if (a.ability === "start_triple")
    return `Savaş başı: İlk ${m} saldırı 3x hasar`;
  if (a.ability === "kill_fear_all")
    return `Öldürünce: Tüm düşmanlara -${5 * m} atk / -${5 * m} hp`;
  if (a.ability === "start_freeze_enemy")
    return `Savaş başı: Ön ve arka düşmana -%${33 * m} atk`;
  if (a.ability === "end_gain_gold") return `Tur sonu: +${m} altın`;
  if (a.ability === "start_fire")
    return `Savaş başı: Tüm düşmanlara ${6 * m} hasar | Kendine +${4 * m} atk kalıcı`;
  if (a.ability === "stag_combo")
    return `Savaş başı: Takıma +${2 * m}/+${2 * m} kalıcı | Ölünce: Takıma +${2 * m}/+${2 * m} kalıcı (Dodo tetikleyemez)`;
  if (a.ability === "devour")
    return `Öldürünce: Düşmanın %${30 + 10 * m} statını al`;
  if (a.ability === "faint_wave")
    return `Ölünce: Tüm düşmanlara ${9 * m} hasar`;
  if (a.ability === "double") return `Tüm saldırılar: 2x hasar`;
  if (a.ability === "weaken_strong")
    return `Savaş başı: En güçlü düşmana -%${25 * m} atk/hp`;
  if (a.ability === "kill_heal_team")
    return `Öldürünce: Takıma +${3 * m}/+${3 * m} kalıcı`;
  if (a.ability === "start_multi_snipe")
    return `Savaş başı: ${m + 1} düşmana ${8 * m} hasar | Hayatta kalırsa: Kendine +${m * 5}/+${m * 5} kalıcı`;
  if (a.ability === "faint_duplicate")
    return `Ölünce: Rastgele dostu kopyala (Dodo tetikleyemez)`;
  if (a.ability === "faint_buff_self")
    return `Ölünce (tur sonu): Kendine +${2 * m}/+${2 * m} kalıcı`;
  if (a.ability === "sell_buff_shop")
    return `Satınca: Mağazadaki hayvanlara +${m}/+${m} kalıcı`;
  if (a.ability === "summon_buff")
    return `Savaşta çıkan yavruya +${5 * m}/+${5 * m} verir`;
  if (a.ability === "summon_retrigger")
    return `Dost ölünce: Ölüm efekti ve yavru güçlendirmesini ${m} kez tekrarlar`;
  if (a.ability === "cheetah_faint")
    return `Ölünce: Tüm takıma +${8 * m}/+${8 * m}`;
  if (a.ability === "buy_target_buff") {
  const buffAmount = m === 1 ? 1 : m === 2 ? 2 : 4;
  return `Satın alınınca: Seçilen dosta +${buffAmount}/+${buffAmount} kalıcı`;
}
if (a.ability === "faint_weaken_all") {
  const debuff = m === 1 ? 3 : m === 2 ? 5 : 8;
  return `Ölünce: Tüm düşmanlara -${debuff}/-${debuff}`;
}
if (a.ability === "hurt_reflect") {
  const pct = m === 1 ? 33 : m === 2 ? 50 : 75;
  return `Hasar alınca: Saldırana aldığının %${pct}'ini geri yansıt`;
}
  return "";
};