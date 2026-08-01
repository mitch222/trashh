import { describe, it, expect } from 'vitest';
import { formatMatchData } from './formatMatchData.js';
import { MatchSchema } from '../../shared/schemas/match.schema.js';
import matchRankedNormal from '../__fixtures__/matchRankedNormal.json';
import matchAramUnresolvedPositions from '../__fixtures__/matchAramUnresolvedPositions.json';

describe('formatMatchData', () => {
  const result = formatMatchData(matchRankedNormal);
  const rawParticipants = matchRankedNormal.info.participants;

  it('maps top-level match fields', () => {
    expect(result.id).toBe(matchRankedNormal.metadata.matchId);
    expect(result.duration).toBe(matchRankedNormal.info.gameDuration);
    expect(result.queueId).toBe(matchRankedNormal.info.queueId);
    expect(result.gameMode).toBe(matchRankedNormal.info.gameMode);
    expect(result.participants).toHaveLength(rawParticipants.length);
  });

  it('validates against the normalized MatchSchema', () => {
    expect(() => MatchSchema.parse(result)).not.toThrow();
  });

  it('pins field-by-field mapping so a future edit cannot silently swap stat names', () => {
    result.participants.forEach((p, i) => {
      const raw = rawParticipants[i];
      expect(p.participantId).toBe(raw.participantId);
      expect(p.profileIconId).toBe(raw.profileIcon);
      expect(p.summonerName).toBe(raw.riotIdGameName);
      expect(p.kills).toBe(raw.kills);
      expect(p.deaths).toBe(raw.deaths);
      expect(p.assists).toBe(raw.assists);
      expect(p.visionScore).toBe(raw.visionScore);
      expect(p.timeCCingOthers).toBe(raw.timeCCingOthers);
      expect(p.goldEarned).toBe(raw.goldEarned);
    });
  });

  it('assigns participantIds 1-10 in array order, so team-by-index and participantId agree', () => {
    expect(result.participants.map((p) => p.participantId)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    // MatchItem splits teams by index; the minimap keys off participantId.
    // This pins that those two views cannot disagree about who is on which team.
    expect(result.participants.slice(0, 5).every((p) => p.teamId === 100)).toBe(true);
    expect(result.participants.slice(5).every((p) => p.teamId === 200)).toBe(true);
  });

  it('maps healingDoneToAllies from Riot totalHealsOnTeammates (ally-only healing)', () => {
    result.participants.forEach((p, i) => {
      expect(p.healingDoneToAllies).toBe(rawParticipants[i].totalHealsOnTeammates);
    });
  });

  it('maps totalHealSelfInclusive from Riot totalHeal, and never reuses it as healingDoneToAllies', () => {
    const support = result.participants.find((p) => p.teamPosition === 'UTILITY' && p.teamId === 100);
    const rawSupport = rawParticipants.find((p) => p.teamPosition === 'UTILITY' && p.teamId === 100);

    expect(support.totalHealSelfInclusive).toBe(rawSupport.totalHeal);
    // Guards against the original bug: these two must stay independent.
    expect(support.totalHealSelfInclusive).not.toBe(support.healingDoneToAllies);
  });

  it('forwards teamPosition and individualPosition (needed for support detection)', () => {
    result.participants.forEach((p, i) => {
      expect(p.teamPosition).toBe(rawParticipants[i].teamPosition);
      expect(p.individualPosition).toBe(rawParticipants[i].individualPosition);
    });
  });

  it('still forwards legacy role/lane as a fallback even when unmapped', () => {
    const aramResult = formatMatchData(matchAramUnresolvedPositions);
    const supportLike = aramResult.participants.find((p) => p.role === 'DUO_SUPPORT');
    expect(supportLike).toBeDefined();
    expect(supportLike.teamPosition).toBe('');
  });
});
