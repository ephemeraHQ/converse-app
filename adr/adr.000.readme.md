# What's an ADR?

ADR stands for Architecture Decision Record, but as Michael likes to call them, "Any Decision Record." These represent any decision that we've discussed as a team and made some kind of decision about. They don't always have to be things that we agreed to do, but could also record things that we decided against.

The reason to keep them in source control is to be able to easily refer to how our decisions have evolved over time.

# How to write an ADR?

An ADR is a Markdown file with specific sections. Copy the template below and fill it out for each decision.

---

# ADR-[NUMBER]: [TITLE]

## Status
[PROPOSED | ACCEPTED | REJECTED | DEPRECATED | 
SUPERSEDED by [ADR-XXXX](adr.xyz.some cool decision.md)]

## Date
- **Proposed**: [YYYY-MM-DD]
- **Agreed**: [YYYY-MM-DD]

## Context
[Provide a brief description of the issue at hand, including any relevant background information.]

## Decision
[State the decision that was made.]

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

```
[Example code or pseudocode]
```

## Consequences
[Describe the resulting context after applying the decision, including both positive and negative consequences]

* e.g. what becomes easier or more difficult to do because of this change

## Related Decisions
[List any related decisions or ADRs]

## References
- Meeting Transcriptions:
  1. [Meeting 1 Date] - [Brief description or link]
  2. [Meeting 2 Date] - [Brief description or link]
- Other relevant documents or resources:
  1. [Resource 1]
  2. [Resource 2]
