const stopWords = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'beyond', 'build', 'by', 'can', 'for',
  'from', 'in', 'into', 'is', 'it', 'of', 'on', 'or', 'our', 'should', 'that', 'the',
  'their', 'this', 'to', 'with', 'within',
]);

const synonymMap = new Map([
  ['ml', 'machine learning'],
  ['ai', 'artificial intelligence'],
  ['nlp', 'natural language processing'],
  ['embeddings', 'vector retrieval'],
  ['semantic search', 'contextual relevance'],
  ['search relevance', 'ranking models'],
  ['recommender systems', 'candidate matching'],
  ['node.js', 'javascript'],
  ['express', 'api design'],
  ['fastapi', 'api design'],
  ['hr-tech', 'recruiter workflows'],
  ['talent analytics', 'candidate signals'],
]);

const requiredConcepts = [
  'machine learning',
  'semantic search',
  'ranking models',
  'vector retrieval',
  'api design',
  'data pipelines',
  'candidate matching',
  'recruiter workflows',
  'explainable ai',
];

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9.+#\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value) {
  return normalize(value)
    .split(' ')
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function expandTerms(terms) {
  const expanded = new Set(terms.map(normalize));
  for (const term of terms) {
    const normalized = normalize(term);
    if (synonymMap.has(normalized)) {
      expanded.add(synonymMap.get(normalized));
    }
  }
  return [...expanded];
}

function candidateText(candidate) {
  return [
    candidate.headline,
    candidate.current_role,
    candidate.industry,
    ...(candidate.skills || []),
    ...(candidate.career_metadata?.companies || []),
    candidate.career_metadata?.role_progression,
  ].join(' ');
}

function overlapScore(jobTerms, candidateTerms) {
  const candidateSet = new Set(candidateTerms);
  const matched = jobTerms.filter((term) => candidateSet.has(term));
  return {
    score: jobTerms.length ? matched.length / jobTerms.length : 0,
    matched,
  };
}

function conceptScore(candidate) {
  const text = normalize(candidateText(candidate));
  const matched = requiredConcepts.filter((concept) => {
    const expanded = expandTerms([concept]);
    return expanded.some((term) => text.includes(term));
  });

  return {
    score: Math.min(matched.length / 5, 1),
    matched,
  };
}

function seniorityScore(candidate) {
  const years = Number(candidate.experience_years || 0);
  const progression = normalize(candidate.career_metadata?.role_progression);
  const yearsScore = Math.min(years / 8, 1);
  const progressionBoost = progression.includes('lead') ? 1 : progression.includes('senior') ? 0.9 : 0.65;
  return (yearsScore * 0.65) + (progressionBoost * 0.35);
}

function behaviorScore(candidate) {
  const signals = candidate.behavioral_signals || {};
  return (
    (Number(signals.profile_completeness || 0) * 0.2) +
    (Number(signals.response_rate || 0) * 0.3) +
    (Number(signals.recent_project_activity || 0) * 0.3) +
    (Number(signals.job_change_intent || 0) * 0.2)
  ) / 100;
}

function recencyScore(candidate) {
  const days = Number(candidate.career_metadata?.last_active_days ?? 90);
  return Math.max(0, 1 - Math.min(days, 45) / 45);
}

function availabilityScore(candidate) {
  return candidate.career_metadata?.open_to_work ? 1 : Number(candidate.behavioral_signals?.job_change_intent || 0) / 100;
}

export function rankCandidates(jobDescription, candidates, options = {}) {
  const limit = Number(options.limit || 10);
  const jobTokens = tokenize(jobDescription);
  const expandedJobTerms = expandTerms([...jobTokens, ...requiredConcepts]);

  const ranked = candidates
    .map((candidate) => {
      const terms = expandTerms(tokenize(candidateText(candidate)));
      const lexical = overlapScore(expandedJobTerms, terms);
      const concepts = conceptScore(candidate);
      const seniority = seniorityScore(candidate);
      const behavior = behaviorScore(candidate);
      const recency = recencyScore(candidate);
      const availability = availabilityScore(candidate);

      const component_scores = {
        contextual_relevance: Math.round(((lexical.score * 0.3) + (concepts.score * 0.7)) * 100),
        skill_signal: Math.round(concepts.score * 100),
        seniority_fit: Math.round(seniority * 100),
        behavioral_signal: Math.round(behavior * 100),
        activity_recency: Math.round(recency * 100),
        availability_intent: Math.round(availability * 100),
      };

      const score =
        (component_scores.contextual_relevance * 0.34) +
        (component_scores.skill_signal * 0.21) +
        (component_scores.seniority_fit * 0.15) +
        (component_scores.behavioral_signal * 0.15) +
        (component_scores.activity_recency * 0.08) +
        (component_scores.availability_intent * 0.07);

      const matchedSignals = [...new Set([...concepts.matched, ...lexical.matched.slice(0, 8)])];
      return {
        candidate_id: candidate.candidate_id,
        name: candidate.name,
        rank: 0,
        score: Number(score.toFixed(2)),
        recommendation: score >= 72 ? 'Strong shortlist' : score >= 55 ? 'Review shortlist' : 'Backup pool',
        component_scores,
        matched_signals: matchedSignals,
        rationale: buildRationale(candidate, component_scores, matchedSignals),
        profile_snapshot: {
          headline: candidate.headline,
          current_role: candidate.current_role,
          experience_years: candidate.experience_years,
          industry: candidate.industry,
          location: candidate.career_metadata?.location,
        },
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));

  return {
    job_id: options.jobId || 'JOB-TALENT-AI-001',
    generated_at: options.generatedAt || new Date().toISOString(),
    methodology: {
      contextual_relevance: 'Expanded token and synonym overlap with job description.',
      skill_signal: 'Coverage of required hiring-intelligence concepts.',
      seniority_fit: 'Experience years and progression metadata.',
      behavioral_signal: 'Profile completeness, response rate, project activity, and job-change intent.',
      activity_recency: 'Recent platform activity.',
      availability_intent: 'Open-to-work flag and inferred intent.',
    },
    ranked_candidates: ranked,
  };
}

function buildRationale(candidate, scores, matchedSignals) {
  const strongest = matchedSignals.slice(0, 4).join(', ') || 'adjacent backend and data signals';
  return `${candidate.name} ranks highly because of ${strongest}. Component scores show ${scores.contextual_relevance}/100 contextual relevance, ${scores.behavioral_signal}/100 behavioral signal, and ${scores.seniority_fit}/100 seniority fit.`;
}
