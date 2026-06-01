import { Badge } from '../types';

export const BADGES: Badge[] = [
  { id: 'first_step',   name: 'First Step',   emoji: '🗺️',  description: 'Explored your first street',       requiredStreets: 1    },
  { id: 'explorer',     name: 'Explorer',     emoji: '🧭',  description: 'Explored 10 different streets',    requiredStreets: 10   },
  { id: 'wanderer',     name: 'Wanderer',     emoji: '🌿',  description: 'Explored 50 different streets',    requiredStreets: 50   },
  { id: 'city_roamer',  name: 'City Roamer',  emoji: '🏙️', description: 'Explored 100 different streets',   requiredStreets: 100  },
  { id: 'urban_nomad',  name: 'Urban Nomad',  emoji: '🌍',  description: 'Explored 500 different streets',   requiredStreets: 500  },
  { id: 'legend',       name: 'Legend',       emoji: '⭐',  description: 'Explored 1,000 different streets', requiredStreets: 1000 },
];

export function getEarnedBadges(totalStreets: number): Badge[] {
  return BADGES.filter((b) => totalStreets >= b.requiredStreets);
}

// Returns badges newly earned after this run (prev → new total)
export function getNewlyEarnedBadges(prevTotal: number, newTotal: number): Badge[] {
  return BADGES.filter(
    (b) => newTotal >= b.requiredStreets && prevTotal < b.requiredStreets
  );
}

export function getNextBadge(totalStreets: number): Badge | null {
  return BADGES.find((b) => totalStreets < b.requiredStreets) ?? null;
}
