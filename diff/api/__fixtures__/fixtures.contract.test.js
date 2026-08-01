import { describe, it, expect } from 'vitest';
import { RiotMatchDtoSchema } from '../../shared/schemas/riotMatch.schema.js';
import matchRankedNormal from './matchRankedNormal.json';
import matchAramUnresolvedPositions from './matchAramUnresolvedPositions.json';
import matchNoPositionDataAtAll from './matchNoPositionDataAtAll.json';

// These fixtures stand in for real Riot match-v5 responses. If one of
// them stops validating against RiotMatchDtoSchema, either the fixture
// drifted from Riot's real shape or the schema is wrong — either way,
// every other test built on top of these fixtures would be testing
// against a lie, so this is a hard requirement, not a nice-to-have.
describe('fixtures match the Riot match-v5 raw schema', () => {
  it('matchRankedNormal.json is a valid raw Riot match', () => {
    expect(() => RiotMatchDtoSchema.parse(matchRankedNormal)).not.toThrow();
  });

  it('matchAramUnresolvedPositions.json is a valid raw Riot match', () => {
    expect(() => RiotMatchDtoSchema.parse(matchAramUnresolvedPositions)).not.toThrow();
  });

  it('matchNoPositionDataAtAll.json is a valid raw Riot match', () => {
    expect(() => RiotMatchDtoSchema.parse(matchNoPositionDataAtAll)).not.toThrow();
  });

  it('matchRankedNormal.json has distinguishable totalHeal vs totalHealsOnTeammates for the support', () => {
    const support = matchRankedNormal.info.participants.find((p) => p.teamPosition === 'UTILITY');
    expect(support).toBeDefined();
    expect(support.totalHeal).not.toBe(support.totalHealsOnTeammates);
  });
});
