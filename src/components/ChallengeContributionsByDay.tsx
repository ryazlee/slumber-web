import CollapsibleSection from './CollapsibleSection';
import ChallengeContributionRow from './ChallengeContributionRow';
import { formatChallengeDayLabel, groupContributionsByDay } from '../lib/groupContributionsByDay';
import type { ChallengeContributionPost } from '../lib/types';

type Props = {
  contributions: ChallengeContributionPost[];
  currentUserId: string | null;
  userRolesById?: Map<string, string[]>;
};

export default function ChallengeContributionsByDay({
  contributions,
  currentUserId,
  userRolesById,
}: Props) {
  const groupedPosts = groupContributionsByDay(contributions, currentUserId);

  if (groupedPosts.length === 0) {
    return <p className="app-muted">No contributed sleep posts yet for this challenge window.</p>;
  }

  return (
    <CollapsibleSection title="Logged nights" count={contributions.length} defaultOpen>
      <div className="challenge-contributions-card">
        {groupedPosts.map(([date, dayPosts], dayIndex) => (
          <CollapsibleSection
            key={date}
            title={formatChallengeDayLabel(date)}
            count={dayPosts.length}
            defaultOpen={dayIndex === 0}
            compact
            embedded
            divided={dayIndex > 0}
          >
            <div className="challenge-contribution-day-list">
              {dayPosts.map((post) => {
                const isMe = post.userId === currentUserId;
                const isPrivate = post.isPrivate && !isMe;
                return (
                  <ChallengeContributionRow
                    key={post.postId}
                    post={post}
                    isPrivate={isPrivate}
                    userRoles={userRolesById?.get(post.userId)}
                  />
                );
              })}
            </div>
          </CollapsibleSection>
        ))}
      </div>
    </CollapsibleSection>
  );
}
