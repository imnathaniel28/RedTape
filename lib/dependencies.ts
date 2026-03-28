/**
 * Form dependency rules per life event.
 *
 * Each key is a form_name; its value is an array of form_names that must
 * be completed (status === "completed") before work on it can begin.
 *
 * If a form is not listed, it has no dependencies and can be started immediately.
 */

const DEPENDENCY_RULES: Record<string, Record<string, string[]>> = {
  getting_married: {
    "State Driver's License Name Change": [
      "Application for a Social Security Card (SS-5) — Name Change",
    ],
    "U.S. Passport Name Change (DS-5504)": [
      "Application for a Social Security Card (SS-5) — Name Change",
    ],
    "IRS Form W-4 — Update Filing Status": ["Marriage License Application"],
    "Application for a Social Security Card (SS-5) — Name Change": [
      "Marriage License Application",
    ],
  },

  moving_to_new_state: {
    "New State Driver's License": [
      "USPS Change of Address (PS Form 3575)",
    ],
    "Vehicle Registration Transfer": ["New State Driver's License"],
  },

  having_a_baby: {
    "Application for a Social Security Card (SS-5) — Newborn": [
      "Birth Certificate Application",
    ],
    "IRS Form W-4 — Update Withholding for New Dependent": [
      "Application for a Social Security Card (SS-5) — Newborn",
    ],
    "Health Insurance Marketplace Special Enrollment": [
      "Birth Certificate Application",
    ],
  },

  death_of_family_member: {
    "SSA Death Notification": ["Death Certificate Request"],
    "IRS Form 1040 — Final Tax Return": [
      "IRS Form 56 — Notice Concerning Fiduciary Relationship",
    ],
    "IRS Form 56 — Notice Concerning Fiduciary Relationship": [
      "Probate Court Filing",
    ],
    "Probate Court Filing": ["Death Certificate Request"],
  },

  starting_a_small_business: {
    "State Business Registration": [
      "IRS Form SS-4 — Application for Employer Identification Number",
    ],
    "DBA / Fictitious Business Name Filing": ["State Business Registration"],
    "State Sales Tax Permit": ["State Business Registration"],
    "Business License Application": ["State Business Registration"],
  },

  buying_a_house: {
    "Homestead Exemption Application": [
      "Homeowners Insurance Application",
    ],
    "USPS Change of Address (PS Form 3575)": [],
    "IRS Form 8822 — Change of Address": [],
  },

  getting_divorced: {
    "Application for a Social Security Card (SS-5) — Name Change": [
      "Divorce Petition / Filing",
    ],
    "Child Custody / Parenting Plan": ["Divorce Petition / Filing"],
    "QDRO — Qualified Domestic Relations Order": [
      "Divorce Petition / Filing",
    ],
  },

  retiring: {
    "CMS-40B Application for Enrollment in Medicare Part B": [
      "SSA-1 — Application for Retirement Benefits",
    ],
  },

  immigration_green_card: {
    "USCIS Form I-765 — Application for Employment Authorization": [
      "USCIS Form I-485 — Application to Register Permanent Residence",
    ],
    "USCIS Form I-131 — Application for Travel Document": [
      "USCIS Form I-485 — Application to Register Permanent Residence",
    ],
    "Application for a Social Security Card (SS-5)": [
      "USCIS Form I-765 — Application for Employment Authorization",
    ],
  },

  child_starting_school: {},
};

export interface FormDependency {
  formName: string;
  dependsOn: string[];
  isBlocked: boolean;
  blockedBy: string[]; // names of incomplete prerequisite forms
}

export function getDependenciesForEvent(
  lifeEvent: string
): Record<string, string[]> {
  return DEPENDENCY_RULES[lifeEvent] ?? {};
}

export function analyzeDependencies(
  lifeEvent: string,
  forms: Array<{ form_name: string; status: string }>
): FormDependency[] {
  const rules = DEPENDENCY_RULES[lifeEvent] ?? {};
  const statusMap = new Map(forms.map((f) => [f.form_name, f.status]));

  return forms.map((form) => {
    const dependsOn = rules[form.form_name] ?? [];
    const blockedBy = dependsOn.filter(
      (dep) => statusMap.get(dep) !== "completed"
    );

    return {
      formName: form.form_name,
      dependsOn,
      isBlocked: blockedBy.length > 0,
      blockedBy,
    };
  });
}

/**
 * Returns forms sorted so that dependencies come before dependents.
 * Forms with no deps come first; blocked forms come after their prerequisites.
 */
export function sortByDependencyOrder<T extends { form_name: string }>(
  lifeEvent: string,
  forms: T[]
): T[] {
  const rules = DEPENDENCY_RULES[lifeEvent] ?? {};
  const formNames = new Set(forms.map((f) => f.form_name));

  // Topological sort via Kahn's algorithm
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const f of forms) {
    inDegree.set(f.form_name, 0);
    adj.set(f.form_name, []);
  }

  for (const [dependent, deps] of Object.entries(rules)) {
    if (!formNames.has(dependent)) continue;
    for (const dep of deps) {
      if (!formNames.has(dep)) continue;
      adj.get(dep)!.push(dependent);
      inDegree.set(dependent, (inDegree.get(dependent) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [name, deg] of inDegree) {
    if (deg === 0) queue.push(name);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    for (const next of adj.get(current) ?? []) {
      const newDeg = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, newDeg);
      if (newDeg === 0) queue.push(next);
    }
  }

  // Any remaining forms (cycles or missing) go at the end
  for (const f of forms) {
    if (!order.includes(f.form_name)) order.push(f.form_name);
  }

  const orderMap = new Map(order.map((name, idx) => [name, idx]));
  return [...forms].sort(
    (a, b) => (orderMap.get(a.form_name) ?? 999) - (orderMap.get(b.form_name) ?? 999)
  );
}
