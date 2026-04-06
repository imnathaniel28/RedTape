/**
 * Estimated time (in minutes) for each bureaucratic task WITHOUT help.
 * Includes: researching requirements, finding forms, traveling to offices,
 * waiting in lines, filling out forms, making phone calls, follow-ups.
 *
 * WITH RedTape: forms are identified instantly, pre-filled,
 * dependencies are tracked, deadlines are auto-calculated.
 */

const EVENT_TIME_ESTIMATES: Record<
  string,
  { without_minutes: number; with_minutes: number; pain_points: string[] }
> = {
  moving_to_new_state: {
    without_minutes: 720, // 12 hours
    with_minutes: 90,
    pain_points: [
      "Researching which agencies to notify",
      "Visiting DMV in person (average 2+ hour wait)",
      "Figuring out voter registration for new state",
      "Coordinating USPS, IRS, and SSA address changes separately",
    ],
  },
  having_a_baby: {
    without_minutes: 600, // 10 hours
    with_minutes: 75,
    pain_points: [
      "Navigating hospital birth registration process",
      "Applying for SSN separately from birth certificate",
      "Understanding FMLA eligibility and paperwork",
      "Finding the 60-day insurance enrollment window",
    ],
  },
  getting_married: {
    without_minutes: 480, // 8 hours
    with_minutes: 60,
    pain_points: [
      "Updating name across 4+ agencies in the right order",
      "Two separate DMV visits if SSN isn't updated first",
      "Passport name change has different rules based on issue date",
      "Figuring out new W-4 withholding as married",
    ],
  },
  death_of_family_member: {
    without_minutes: 1440, // 24 hours
    with_minutes: 180,
    pain_points: [
      "Ordering enough death certificate copies (most people order too few)",
      "Navigating probate court requirements while grieving",
      "Filing final tax return as executor",
      "Determining survivor benefit eligibility",
    ],
  },
  starting_a_small_business: {
    without_minutes: 960, // 16 hours
    with_minutes: 120,
    pain_points: [
      "Choosing between LLC, S-Corp, sole prop without legal advice",
      "State registration requirements vary wildly",
      "Sales tax permit rules differ by state",
      "Multiple agencies at federal, state, and local levels",
    ],
  },
  buying_a_house: {
    without_minutes: 540, // 9 hours
    with_minutes: 70,
    pain_points: [
      "Homestead exemption deadlines vary by county",
      "Coordinating utilities, insurance, and address changes around closing",
      "IRS address change processed separately from USPS",
      "Missing the homestead deadline means waiting another year",
    ],
  },
  getting_divorced: {
    without_minutes: 1200, // 20 hours
    with_minutes: 150,
    pain_points: [
      "Navigating court filing requirements by state",
      "QDRO paperwork for retirement account division",
      "Updating name across multiple agencies post-divorce",
      "Child custody documentation requirements",
    ],
  },
  retiring: {
    without_minutes: 720, // 12 hours
    with_minutes: 90,
    pain_points: [
      "Timing Social Security application (4 months before desired start)",
      "Medicare enrollment windows and late penalties",
      "Coordinating pension, 401(k), and Social Security",
      "Understanding Medicare Part B enrollment periods",
    ],
  },
  immigration_green_card: {
    without_minutes: 2400, // 40 hours
    with_minutes: 300,
    pain_points: [
      "I-485 is 20+ pages with complex eligibility rules",
      "Concurrent filing of I-765 and I-131 to avoid delays",
      "Affidavit of Support income requirements",
      "Processing times of 12-24+ months with limited status visibility",
    ],
  },
  child_starting_school: {
    without_minutes: 360, // 6 hours
    with_minutes: 45,
    pain_points: [
      "Immunization requirements vary by state and school",
      "Enrollment deadlines differ by district",
      "Gathering proof of residency documents",
      "Special education evaluation request process",
    ],
  },
};

export interface TimeEstimate {
  withoutMinutes: number;
  withMinutes: number;
  savedMinutes: number;
  savedPercent: number;
  painPoints: string[];
}

export function getTimeEstimate(lifeEvent: string): TimeEstimate {
  const est = EVENT_TIME_ESTIMATES[lifeEvent];
  if (!est) {
    return {
      withoutMinutes: 480,
      withMinutes: 60,
      savedMinutes: 420,
      savedPercent: 88,
      painPoints: [],
    };
  }
  const saved = est.without_minutes - est.with_minutes;
  return {
    withoutMinutes: est.without_minutes,
    withMinutes: est.with_minutes,
    savedMinutes: saved,
    savedPercent: Math.round((saved / est.without_minutes) * 100),
    painPoints: est.pain_points,
  };
}

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  if (remaining === 0) return `${hours} hr${hours !== 1 ? "s" : ""}`;
  return `${hours} hr${hours !== 1 ? "s" : ""} ${remaining} min`;
}

export function getAllTimeEstimates(): Record<string, TimeEstimate> {
  const result: Record<string, TimeEstimate> = {};
  for (const key of Object.keys(EVENT_TIME_ESTIMATES)) {
    result[key] = getTimeEstimate(key);
  }
  return result;
}
