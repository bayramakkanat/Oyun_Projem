const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const TTL_DURATIONS = {
  versusRoom: 2 * HOUR_MS,
  challengeInvite: 24 * HOUR_MS,
  friendRequest: 7 * DAY_MS,
  arenaTeam: 14 * DAY_MS,
};

export const getExpiryDate = (durationMs) => new Date(Date.now() + durationMs);
