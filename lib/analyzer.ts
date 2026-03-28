import { getAllLifeEvents, type LifeEvent } from "./form-registry";

interface AnalysisResult {
  matched_events: LifeEvent[];
  confidence: number;
}

const EVENT_KEYWORDS: Record<string, string[]> = {
  moving_to_new_state: [
    "moving", "relocat", "new state", "moving to", "new address",
    "transfer", "out of state", "across state",
  ],
  having_a_baby: [
    "baby", "pregnant", "birth", "newborn", "child born",
    "expecting", "due date", "maternity", "paternity",
    "had a baby", "having a baby",
  ],
  getting_married: [
    "married", "marriage", "wedding", "engaged", "engagement",
    "spouse", "fiancé", "fiancee", "tying the knot",
  ],
  death_of_family_member: [
    "death", "died", "passed away", "deceased", "funeral",
    "loss of", "passing", "bereavement", "probate",
    "mom passed", "dad passed", "mother passed", "father passed",
  ],
  starting_a_small_business: [
    "business", "llc", "startup", "entrepreneur", "self-employed",
    "freelanc", "company", "incorporation", "ein", "sole proprietor",
    "start a", "start an", "starting a", "starting an",
  ],
  buying_a_house: [
    "buying a house", "home purchase", "new home", "homeowner",
    "mortgage", "closing", "real estate", "property",
  ],
  getting_divorced: [
    "divorce", "separation", "custody", "splitting up",
    "dissolv", "marital", "alimony",
  ],
  retiring: [
    "retir", "retiring", "pension", "social security", "medicare",
    "401k", "golden years", "stopping work",
  ],
  immigration_green_card: [
    "immigrat", "green card", "visa", "uscis", "citizenship",
    "permanent resident", "i-485", "naturali",
  ],
  child_starting_school: [
    "school", "kindergarten", "enroll", "first grade",
    "preschool", "education", "school age",
  ],
};

export function analyzeLifeEvent(text: string): AnalysisResult {
  const lower = text.toLowerCase();
  const allEvents = getAllLifeEvents();
  const scores: { event: LifeEvent; score: number }[] = [];

  for (const event of allEvents) {
    const keywords = EVENT_KEYWORDS[event.event] ?? [];
    let score = 0;

    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        score += 1;
      }
    }

    // Also check the event label and description
    const labelWords = event.label.toLowerCase().split(/\s+/);
    for (const word of labelWords) {
      if (word.length > 3 && lower.includes(word)) {
        score += 0.5;
      }
    }

    if (score > 0) {
      scores.push({ event, score });
    }
  }

  scores.sort((a, b) => b.score - a.score);

  const matched = scores.filter((s) => s.score > 0).map((s) => s.event);
  const topScore = scores[0]?.score ?? 0;
  const confidence = Math.min(topScore / 3, 1);

  return { matched_events: matched, confidence };
}
