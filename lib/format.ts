export function formatPlayCount(plays: number) {
  if (plays >= 1_000_000) {
    return `${(plays / 1_000_000).toFixed(plays >= 10_000_000 ? 0 : 1)}M`;
  }

  if (plays >= 1_000) {
    return `${(plays / 1_000).toFixed(plays >= 10_000 ? 0 : 1)}K`;
  }

  return plays.toLocaleString('en-US');
}

export function formatRating(rating: number) {
  return rating.toFixed(1);
}

export function formatPlayCountLabel(plays: number) {
  return plays > 0 ? `${formatPlayCount(plays)} plays` : 'Just launched';
}

export function formatRatingLabel(rating: number) {
  return rating > 0 ? `${formatRating(rating)} rating` : 'No ratings yet';
}

export function formatPlayedAt(playedAt: string) {
  const timestamp = new Date(playedAt).getTime();

  if (Number.isNaN(timestamp)) {
    return 'Recently';
  }

  const diffInSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);

  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `${diffInHours} hr ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);

  return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
}

export function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}
