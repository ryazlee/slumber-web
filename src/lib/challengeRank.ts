export type RankedRow<T> = T & {
  place: number;
  tied: boolean;
};

export function rankBySleepProgress<T extends {
  userId: string;
  accruedMinutes: number;
  nightsLogged: number;
}>(rows: T[]): RankedRow<T>[] {
  const sorted = [...rows].sort((a, b) => {
    if (b.accruedMinutes !== a.accruedMinutes) return b.accruedMinutes - a.accruedMinutes;
    return b.nightsLogged - a.nightsLogged;
  });

  const ranked: RankedRow<T>[] = [];
  let place = 0;
  let i = 0;

  while (i < sorted.length) {
    place += 1;
    const mins = sorted[i].accruedMinutes;
    const nights = sorted[i].nightsLogged;
    const group: T[] = [];

    while (
      i < sorted.length
      && sorted[i].accruedMinutes === mins
      && sorted[i].nightsLogged === nights
    ) {
      group.push(sorted[i]);
      i += 1;
    }

    const tied = group.length > 1;
    for (const row of group) {
      ranked.push({ ...row, place, tied });
    }
  }

  return ranked;
}

export function formatChallengePlace(place: number, tied = false): string {
  const suffix = place === 1 ? 'st' : place === 2 ? 'nd' : place === 3 ? 'rd' : 'th';
  return tied ? `T-${place}${suffix}` : `${place}${suffix}`;
}

const PLACE_COLORS: Record<1 | 2 | 3, string> = {
  1: '#D4AF37',
  2: '#A8B0BD',
  3: '#CD7F32',
};

export function challengePlaceColor(place: number, fallback = 'var(--text-dim)'): string {
  if (place === 1 || place === 2 || place === 3) return PLACE_COLORS[place];
  return fallback;
}
