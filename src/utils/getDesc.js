const pwr = (a) => {
  if (!a) return 1;
  if (a.lvl === 3) return 3;
  if (a.lvl === 2) return 2;
  return 1;
};

export const getDesc = (a, lvlOverride) => {
  const m = lvlOverride || pwr(a);
  if (a.ability === "faint_buff") return `Olunce: Rastgele dosta +${m}/+${m}`;
  if (a.ability === "none") return "Yetenek yok";
  if (a.ability === "start_buff") return `Savas basi: Kendine +${m} atk`;
  if (a.ability === "end_heal_one")
    return `Tur sonu: Rastgele dosta +${m} hp kalici`;
  if (a.ability === "faint_gold") return `Olunce: +${m} altin`;
  if (a.ability === "sell_gold") return `Satinca: +${m} altin`;
  if (a.ability === "buy_buff_random")
    return `Hayvan alinca: Rastgele dosta +${m}/+${m} kalici`;
  if (a.ability === "start_team_shield") return `Savas basi: Takima +${m} hp`;
  if (a.ability === "levelup_buff_self")
    return `Seviye atlayinca: Kendine +${m * 2}/+${m * 2} kalici`;
  if (a.ability === "friend_levelup_buff")
    return `Dost seviye atlayinca: Kendine +${m}/+${m} kalici`;
  if (a.ability === "faint_copy") {
    const pct = m === 1 ? 25 : m === 2 ? 50 : 100;
    return `Olunce: Rastgele dosta %${pct} stat`;
  }
  if (a.ability === "start_dmg")
    return `Savas basi: Rastgele dusmana ${2 * m} hasar`;
  if (a.ability === "atk_buff") return `Her vurusta: Kendine +${m} atk`;
  if (a.ability === "faint_dmg") return `Olunce: Tum dusmanlara ${m * 2} hasar`;
  if (a.ability === "start_poison")
    return `Savas basi: On dusmana -${m * 2} atk`;
  if (a.ability === "friend_summon")
    return `Dost olunce: ${m * 2} atk/${m * 3} hp yavru cagir (max 3)`;
  if (a.ability === "sell_buff_friend")
    return `Satinca: Rastgele ${m} dosta +${m}/+${m} kalici`;
  if (a.ability === "shop_discount")
    return `Alinca: Sonraki yenilemede tum hayvanlara ${m} altin indirim`;
  if (a.ability === "faint_shield") return `Olunce: Tum dostlara +${2 * m} hp`;
  if (a.ability === "start_snipe")
    return `Savas basi: Arka dusmana ${3 * m} hasar`;
  if (a.ability === "friend_faint")
    return `Dost olunce: Kendine +${2 * m}/+${2 * m}`;
  if (a.ability === "end_team_buff")
    return `Tur sonu: Arkadaki 2 dosta +${m * 2}/+${m * 2} kalici`;
  if (a.ability === "start_charge")
    return `Savas basi: Kendine +${2 * m} hp | Her saldirida: Kendine +${2 * m} atk`;
  if (a.ability === "sell_heal_team")
    return `Satinca: Tum takima +${m * 2} hp kalici`;
  if (a.ability === "buy_buff_behind")
    return `Hayvan alinca: Arkadakine +${m}/+${m} kalici`;
  if (a.ability === "hurt_weaken_attacker")
    return `Hasar alinca: Saldiran -%${m === 1 ? 33 : m === 2 ? 66 : 99} atk`;
  if (a.ability === "kill_buff") return `Oldurunce: Kendine +${3 * m}/+${3 * m}`;
  if (a.ability === "faint_summon")
    return `Olunce: ${4 * m} atk/${4 * m} hp yavru cagir`;
  if (a.ability === "start_all_perm")
    return `Savas basi: Tum takima +${2 * m} atk kalici`;
  if (a.ability === "start_all") return `Savas basi: Tum takima +${2 * m} atk`;
  if (a.ability === "hurt_buff") return `Hasar alinca: Kendine +${4 * m} atk`;
  if (a.ability === "end_all")
    return `Tur sonu: Tum takima +${m * 3} hp kalici`;
  if (a.ability === "start_tank") return `Savas basi: Kendine +${3 * m} hp`;
  if (a.ability === "hurt_team_buff")
    return `Hasar alinca: Takima +${3 * m}/+${3 * m}`;
  if (a.ability === "end_buff_ahead")
    return `Tur sonu: Ondeki 3'e +${m * 2}/+${m * 2} kalici`;
  if (a.ability === "buy_discount_next")
    return `Magazada: Hayvanlara -${m} altin indirim`;
  if (a.ability === "end_self_buff")
    return `Tur sonu: Kendine +${m * 3}/+${m * 3} kalici`;
  if (a.ability === "start_fear")
    return `Savas basi: On 2 dusmana -${10 * m} atk`;
  if (a.ability === "hurt_dmg")
    return `Hasar alinca: Rastgele dusmana ${9 * m} hasar`;
  if (a.ability === "start_trample")
    return `Savas basi: Kendine +${5 * m} atk | Fazla hasar arka dusmana gecer`;
  if (a.ability === "faint_rage")
    return `Olunce: Tum takima +${8 * m}/+${8 * m}`;
  if (a.ability === "start_triple")
    return `Savas basi: Ilk ${m} saldiri 3x hasar`;
  if (a.ability === "kill_fear_all")
    return `Oldurunce: Tum dusmanlara -${5 * m} atk / -${5 * m} hp`;
  if (a.ability === "start_freeze_enemy")
    return `Savas basi: On ve arka dusmana -%${33 * m} atk`;
  if (a.ability === "end_gain_gold") return `Tur sonu: +${m} altin`;
  if (a.ability === "start_fire")
    return `Savas basi: Tum dusmanlara ${6 * m} hasar | Kendine +${4 * m} atk kalici`;
  if (a.ability === "stag_combo")
    return `Savas basi: Takima +${2 * m}/+${2 * m} kalici | Olunce: Takima +${2 * m}/+${2 * m} kalici (Dodo tetikleyemez)`;
  if (a.ability === "devour")
    return `Oldurunce: Dusmanin %${30 + 10 * m} statini al`;
  if (a.ability === "faint_wave")
    return `Olunce: Tum dusmanlara ${9 * m} hasar`;
  if (a.ability === "double") return `Tum saldirilar: 2x hasar`;
  if (a.ability === "weaken_strong")
    return `Savas basi: En guclu dusmana -%${25 * m} atk/hp`;
  if (a.ability === "kill_heal_team")
    return `Oldurunce: Takima +${3 * m}/+${3 * m} kalici`;
  if (a.ability === "start_multi_snipe")
    return `Savas basi: ${m + 1} dusmana ${8 * m} hasar | Hayatta kalirsa: Kendine +${m * 5}/+${m * 5} kalici`;
  if (a.ability === "faint_duplicate")
    return `Olunce: Rastgele dostu kopyala (Dodo tetikleyemez)`;
  if (a.ability === "faint_buff_self")
    return `Olunce (tur sonu): Kendine +${2 * m}/+${2 * m} kalici`;
  if (a.ability === "sell_buff_shop")
    return `Satinca: Magazadaki hayvanlara +${m}/+${m} kalici`;
  if (a.ability === "summon_buff")
    return `Savasta cikan yavruya +${5 * m}/+${5 * m} verir`;
  if (a.ability === "summon_retrigger")
    return `Dost olunce: Olum efekti ve yavru guclendirmesini ${m} kez tekrarlar`;
  if (a.ability === "cheetah_faint")
    return `Olunce: Tum takima +${8 * m}/+${8 * m}`;
  if (a.ability === "buy_target_buff") {
    const buffAmount = m === 1 ? 1 : m === 2 ? 2 : 4;
    return `Satin alininca: Secilen dosta +${buffAmount}/+${buffAmount} kalici`;
  }
  if (a.ability === "faint_weaken_all") {
    const debuff = m === 1 ? 3 : m === 2 ? 5 : 8;
    return `Olunce: Tum dusmanlara -${debuff}/-${debuff}`;
  }
  if (a.ability === "hurt_reflect") {
    const pct = m === 1 ? 33 : m === 2 ? 66 : 99;
    return `Hasar alinca: Saldirana aldiginin %${pct}'ini geri yansit`;
  }
  return "";
};
