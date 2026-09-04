export interface goldenSetInterface {
  input: string
  mustInclude: string[]
  mustExclude: string[]
  expectBehavior?: string
}

export const goldenSet: goldenSetInterface[] = [
  // PATTERN 1 — field + funding level + international eligibility
  {
    input: "fully funded CS programs for international students",
    mustInclude: ["Global Futures"], // CS master's, fully funded, international
    mustExclude: ["Heartland", "Rural Nursing"], // US-only; filtered out before generation
  },

  // PATTERN 2 — topic/field match (no funding or deadline constraints)
  {
    input: "graduate funding for mental health or counseling",
    mustInclude: ["Compassion in Care"], // clinical psychology / counseling
    mustExclude: [],
  },

  // PATTERN 3 — no relevant match; model should refuse rather than hallucinate
  {
    input: "scholarships for undergraduate marine biology in Australia",
    mustInclude: [], // no corpus entry matches undergrad marine bio or Australia
    mustExclude: ["Global Futures", "Compassion in Care"], // closest semantic hits must not be cited as fits
    expectBehavior: "should say no scholarships match",
  },

  // PATTERN 4 — fine-grained field distinction (HCI/product design vs computer science)
  {
    input:
      "Fully funded including tuition for students pursuing HCI or product design for international applicants",
    mustInclude: ["Silicon Valley Product Design"], // HCI / UX / product management
    mustExclude: ["Global Futures"], // CS/AI/data science, not design
  },

  // PATTERN 5 — stacked constraints: funded + deadline after March + international
  {
    input:
      "Funded scholarships with deadlines after March for international students in one academicy year",
    mustInclude: ["Silicon Valley Product Design"], // intl + funded; Apr 1 satisfies "after March"
    mustExclude: ["Open Source Science", "Global Futures", "Future Educators"], // no fixed / Feb deadlines; partial or wrong fit
  },

  // PATTERN 6 — funding level filter: fully funded only (excludes partial awards)
  {
    input: "Fully funded scholarship for graduate international students ",
    mustInclude: [
      "Global Futures Fellowship",
      "Silicon Valley Product Design",
      "Emerging Markets Business",
    ], // full tuition + stipend or allowance
    mustExclude: ["Compassion in Care", "Future Educators Bursary"], // partial tuition only
  },

  // PATTERN 7 — fully funded + international + deadline after March (narrows pattern 6)
  {
    input:
      "Fully funded scholarship for graduate international students with deadlines after March in one academicy year",
    mustInclude: ["Silicon Valley Product Design"], // Apr 1 satisfies deadline constraint
    mustExclude: ["Global Futures Fellowship"], // Feb 15 deadline
  },

  // PATTERN 8 — business/MBA field match
  {
    input: "Funding for MBA or business students",
    mustInclude: ["Emerging Markets Business"], // MBA and business analytics
    mustExclude: ["Open Source Science", "Future Educators"], // STEM research; education
  },

  // PATTERN 9 — education/teaching field match
  {
    input: "Scholarships for future teachers",
    mustInclude: ["Future Educators"], // master's in education / teaching credentials
    mustExclude: ["Compassion in Care"], // mental health, not K–12 teaching
  },

  // PATTERN 10 — STEM research fields (supplemental grant, not a full ride)
  {
    input: "Research funding for biology or physics grad students",
    mustInclude: ["Open Source Science"], // physics, chemistry, biology
    mustExclude: ["Future Educators", "Silicon Valley Product Design"], // education; design/HCI
  },

  // PATTERN 11 — deadline matched to a specific calendar month
  {
    input: "Scholarships with deadlines in January",
    mustInclude: ["Compassion in Care"], // Jan 20
    mustExclude: ["Emerging Markets", "Silicon Valley"], // Dec 1 and Apr 1
  },

  // PATTERN 12 — field match where partial funding is acceptable
  {
    input: "Any funding for psychology, full or partial",
    mustInclude: ["Compassion in Care"], // clinical psychology ($18k partial)
    mustExclude: ["Future Educators", "Global Futures"], // education; CS
  },

  // PATTERN 13 — US-only query; international filter leaves no eligible nursing match
  {
    input: "US-only nursing scholarships",
    mustInclude: [], // Rural Nursing is domestic-only and excluded by the intl filter
    mustExclude: ["Rural Nursing"], // must not cite the US-only nursing award as a fit
  },

  // PATTERN 14 — vague/broad query; surface most international graduate options
  {
    input: "Help me find money for grad school",
    mustInclude: [], // international-eligible graduate awards
    mustExclude: [], // US-only; never in retrieval context
    expectBehavior:
      "asks clarifying questions (field, country, level) instead of guessing",
  },
]
