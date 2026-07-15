import type { StageSegment } from '../lib/types';
import PostStageMetrics from './post/PostStageMetrics';
import SleepTimelineBar from './SleepTimelineBar';

/** Sample overnight matching a typical good night (~7h 12m asleep). */
const HOME_DEMO_SEGMENTS: StageSegment[] = [
  { type: 'CORE', minutes: 28 },
  { type: 'DEEP', minutes: 42 },
  { type: 'CORE', minutes: 36 },
  { type: 'REM', minutes: 48 },
  { type: 'AWAKE', minutes: 7 },
  { type: 'CORE', minutes: 40 },
  { type: 'DEEP', minutes: 32 },
  { type: 'CORE', minutes: 34 },
  { type: 'REM', minutes: 44 },
  { type: 'AWAKE', minutes: 5 },
  { type: 'CORE', minutes: 46 },
  { type: 'DEEP', minutes: 14 },
  { type: 'CORE', minutes: 36 },
  { type: 'REM', minutes: 32 },
];

const HOME_DEMO_STAGES = {
  coreMinutes: 220,
  deepMinutes: 88,
  remMinutes: 124,
  awakeMinutes: 12,
  awakeEvents: 2,
} as const;

export default function HomeHypnogram() {
  return (
    <div className="home-hypnogram">
      <SleepTimelineBar
        segments={HOME_DEMO_SEGMENTS}
        bedtime="10:42 PM"
        wakeTime="6:31 AM"
        variant="card"
      />
      <div className="home-hypno-breakdown">
        <p className="home-hypno-asleep"><strong>7h 12m</strong> asleep</p>
        <PostStageMetrics data={HOME_DEMO_STAGES} scrollable />
      </div>
    </div>
  );
}
