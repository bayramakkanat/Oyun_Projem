// src/hooks/useVersusSync.js
//
// useBattle.js'ten ayrıştırıldı (Faz 3 refactor).
// Sorumluluk: Versus modunda Firebase senkronizasyonu
//   - Heartbeat / disconnect yönetimi
//   - Shop reset (her tur başı)
//   - Snapshot listener (hazır durumu, savaş başlatma)

import { useEffect, useRef } from "react";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { TIERS } from "../data/gameData";
import { logError } from "../utils/helpers";

export function useVersusSync({
  gameMode,
  versusRoom,
  versusPhase,
  phase,
  turn,
  turnRef,
  phaseRef,
  team,
  clampStat,
  setOver,
  setVictory,
  setLog,
  setOpponentReady,
  setArenaOpponent,
  startVersusBattle,
  normalizeBattlePet,
  playSound,
  disconnectReportedRef,
  disconnectNoticeShownRef,
  lastBattleIdRef,
}) {
  // ─── Heartbeat & Disconnect ───────────────────────────────────────────────
  useEffect(() => {
    if (gameMode !== "versus") return;
    if (!versusRoom || versusPhase !== "playing") return;

    const { code, role } = versusRoom;
    const myLastSeenField = role === "host" ? "hostLastSeen" : "guestLastSeen";
    let heartbeatTimer = null;
    disconnectReportedRef.current = false;

    const writeHeartbeat = () => {
      updateDoc(doc(db, "versus_rooms", code), {
        [myLastSeenField]: Date.now(),
      }).catch((err) => logError(err, "useVersusSync:heartbeat"));
    };

    const reportDisconnect = () => {
      if (disconnectReportedRef.current) return;
      disconnectReportedRef.current = true;
      updateDoc(doc(db, "versus_rooms", code), {
        disconnected: role,
        [myLastSeenField]: Date.now(),
      }).catch((err) => logError(err, "useVersusSync:reportDisconnect"));
    };

    // Anlık heartbeat + periyodik timer
    writeHeartbeat();
    heartbeatTimer = setInterval(writeHeartbeat, 5000);

    const onPageHide     = () => reportDisconnect();
    const onBeforeUnload = () => reportDisconnect();

    // Mobilde sekme arka plana geçince setInterval throttle edilir.
    // Sekme aktif olunca anında heartbeat at.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") writeHeartbeat();
    };

    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [gameMode, versusRoom?.code, versusRoom?.role, versusPhase]);

  // ─── Shop Reset (her tur başı Firebase'e bildir) ──────────────────────────
  useEffect(() => {
    if (gameMode !== "versus") return;
    if (phase !== "shop" || !versusRoom || versusPhase !== "playing") return;

    const { code, role } = versusRoom;
    const payload = {
      [role === "host" ? "hostReadyTurn" : "guestReadyTurn"]: null,
      [role === "host" ? "hostTeam"      : "guestTeam"     ]: null,
    };

    // Tur sayacını host ortak timestamp ile başlatır
    if (role === "host") {
      payload.shopStartedAt   = Date.now();
      payload.shopStartedTurn = turnRef.current;
    }

    updateDoc(doc(db, "versus_rooms", code), payload)
      .catch((err) => logError(err, "useVersusSync:shopReset"));
  }, [gameMode, phase, versusRoom, versusPhase, turnRef]);

  // ─── Snapshot Listener (iki taraf hazır → savaş başlat) ─────────────────
  useEffect(() => {
    if (gameMode !== "versus") return;
    if (!versusRoom || versusPhase !== "playing") return;

    const { code, role } = versusRoom;
    const allAnimals = Object.values(TIERS).flat();

    const processTeam = (arr) =>
      arr.map((p) => {
        const a = allAnimals.find((a) => a.name === p.name);
        const normalized = normalizeBattlePet(p, a);
        return {
          ...normalized,
          img:  p.img  || a?.img  || null,
          flip: p.flip !== undefined ? p.flip : (a?.flip || false),
        };
      });

    const unsub = onSnapshot(doc(db, "versus_rooms", code), async (snap) => {
      try {
        const data = snap.data();
        if (!data) return;

        // Oyun sonu
        if (data.loser) {
          data.loser === role ? setOver(true) : setVictory(true);
          return;
        }

        // Rakip bağlantısı koptu
        if (data.disconnected && data.disconnected !== role) {
          if (!disconnectNoticeShownRef.current) {
            disconnectNoticeShownRef.current = true;
            playSound("versus_disconnect");
            setLog((l) => [...l, "⚠️ Rakip bağlantısı koptu! Zafer sayılıyor..."]);
          }
          setTimeout(() => setVictory(true), 2000);
          return;
        }

        // Heartbeat stale tespiti (ani kapanma)
        const now          = Date.now();
        const staleMs      = 30000;
        const opponentRole = role === "host" ? "guest" : "host";
        const opponentLastSeen = role === "host" ? data.guestLastSeen : data.hostLastSeen;
        if (!data.disconnected && !data.loser) {
          if (typeof opponentLastSeen === "number" && now - opponentLastSeen > staleMs) {
            updateDoc(doc(db, "versus_rooms", code), { disconnected: opponentRole })
              .catch((err) => logError(err, "useVersusSync:staleDetect"));
          }
        }

        if (phaseRef.current !== "shop") return;

        // Hazır durumu
        const currentTurn = turnRef.current;
        const hostReady   = data.hostReadyTurn === currentTurn;
        const guestReady  = data.guestReadyTurn === currentTurn;
        setOpponentReady(role === "host" ? guestReady : hostReady);

        if (!hostReady || !guestReady)         return;
        if (!data.hostTeam || !data.guestTeam) return;

        // Host, battleId üretir (race condition guard)
        if (role === "host" && !data.battleId) {
          const newId = `${code}_${turnRef.current}_${Date.now()}`;
          try {
            await updateDoc(doc(db, "versus_rooms", code), { battleId: newId });
          } catch (err) {
            logError(err, "useVersusSync:battleId");
          }
          return;
        }
        if (!data.battleId) return;
        if (lastBattleIdRef.current === data.battleId) return;
        lastBattleIdRef.current = data.battleId;

        // Takımları işle ve savaşı başlat
        const myTeam    = processTeam(role === "host" ? data.hostTeam : data.guestTeam);
        const theirTeam = processTeam(role === "host" ? data.guestTeam : data.hostTeam);
        const opponentName = role === "host"
          ? (data.guest?.name || "Rakip")
          : (data.host?.name  || "Rakip");

        setArenaOpponent({ userName: opponentName });
        startVersusBattle(myTeam, theirTeam);

        // Host temizlik yapar
        if (role === "host") {
          setTimeout(() => {
            updateDoc(doc(db, "versus_rooms", code), {
              battleId: null, hostReadyTurn: null, guestReadyTurn: null,
              hostTeam: null, guestTeam: null,
            });
          }, 2000);
        }
      } catch (err) {
        logError(err, "useVersusSync:snapshot");
      }
    });

    return () => unsub();
  }, [gameMode, versusRoom?.code, versusPhase, turn]);
}
