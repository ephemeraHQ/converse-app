# What's an ADR?

ADR stands for Architecture Decision Record, or less formally, "Any Decision Record." These represent any decision that we've discussed as a team and made some kind of decision about. They don't always have to be things that we agreed to do, but could also record things that we decided against.

The reason to keep them in source control is to be able to easily refer to how our decisions have evolved over time.

# How to write an ADR?

An ADR is a Markdown file with specific sections. Follow these steps:

1. Create a new folder for your ADR in the `adr` directory. Name it `adr.[NUMBER].[SHORT TITLE]`.

2. In this folder, create a main Markdown file named `adr.[NUMBER].[SHORT TITLE].md`.

3. Copy the template below into this new file and fill it out for your decision.

4. If you have any supporting documentation (diagrams, meeting notes, etc.), add them to this folder as well.

---

# ADR-[NUMBER]: [TITLE]

## Status
[PROPOSED | ACCEPTED | REJECTED | DEPRECATED | SUPERSEDED by [ADR-XXXX](adr.###.some-cool-decision.md)]

## Date
- **Proposed**: [YYYY-MM-DD]
- **Decided**: [YYYY-MM-DD]
- **Work Began**: [YYYY-MM-DD]
- **Work Completed**: [YYYY-MM-DD]

## Context
[Provide a brief description of the issue at hand, including any relevant background information.]

## Proposal
[State the proposal that was made.]

[Include dissenting opinions and why they were disagreed with, if applicable.]

## Considered Options
1. [Option 1]
2. [Option 2]
3. [Option 3]
   ...

## Pros and Cons of the Options

### Option 1

[example | description | pointer to more information | …] <!-- optional -->

* Good, because [argument a]
* Good, because [argument b]
* Bad, because [argument c]
* … <!-- numbers of pros and cons can vary -->

### Option 2

[example | description | pointer to more information | …] <!-- optional -->

* Good, because [argument a]
* Good, because [argument b]
* Bad, because [argument c]
* … <!-- numbers of pros and cons can vary -->

### Option 3

[example | description | pointer to more information | …] <!-- optional -->

* Good, because [argument a]
* Good, because [argument b]
* Bad, because [argument c]
* …

## Chosen Option: [Option X]
[Explain why this option was chosen]

## Implementation Details
[For code-related decisions, include example code or pseudocode here]


## Migration Plan
[Outline the steps required to implement the proposal, especially if it involves significant changes]

## Consequences
[Discuss the positive and negative consequences of the proposed solution]
