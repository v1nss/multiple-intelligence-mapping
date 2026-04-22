/**
 * Display percent for strand/career scores — matches Results.jsx and Dashboard.jsx.
 */
export function displayPercent(score) {
  if (score == null || Number.isNaN(Number(score))) return null;
  return Math.round(Number(score) * 100);
}

function topTwoTieByDisplayPercent(items, scoreKey = 'score') {
  if (!Array.isArray(items) || items.length < 2) return false;
  const a = displayPercent(items[0]?.[scoreKey]);
  const b = displayPercent(items[1]?.[scoreKey]);
  if (a == null || b == null) return false;
  return a === b;
}

export function hasTopTwoStrandTie(strandRanking) {
  return topTwoTieByDisplayPercent(strandRanking, 'score');
}

export function hasTopTwoCareerTie(careerSuggestions) {
  return topTwoTieByDisplayPercent(careerSuggestions, 'score');
}
