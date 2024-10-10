# ADR-001: Refactoring for Group Joining Feature

## Status
PROPOSED

## Date
- **Proposed**: 2024-09-30
- **Agreed**: [To be filled after agreement]

## Context
During our week-long offsite in Nashville from September 23rd to 27th, 2024, we discussed exciting opportunities with our newly expanded team. Michael, a recent addition, brings experience from his previous role where he implemented patterns to increase testability and separate business logic from UI, enhancing code robustness. He also introduced a pattern for controlling dependencies and side effects in applications.

Given the potential benefits, the mobile team verbally 
agreed that this was a good use of our time. However, 
since the proof of concept is estimated to take 2-4 
weeks, Naomi and Michael felt it was important to 
document the deliverables, provide a high-level 
overview of the pattern, and discuss alternatives, 
despite prior agreements on the approach during the 
offsite.

This document also serves as our first Architecture Decision Record (ADR). Michael suggests using ADRs to record our team's decision-making process in source control, allowing us to review and improve it over time.

## Decision
We have decided to refactor the group joining feature using patterns inspired by the Composable Architecture, adapting them for JavaScript and React Native. This refactoring will involve:

1. Implementing a state machine for group joining logic
2. Introducing a dependency control pattern
3. Developing an event-driven testing framework
4. Integrating with existing Zustand and React Query logic
5. Implementing key behavioral flows with complete test coverage

## Considered Options
1. Maintain current architecture and focus on bug fixing
3. Refactor using Composable Architecture-inspired patterns

## Pros and Cons of the Options

### Option 1: Maintain current architecture and focus on bug fixing

* Good, because it requires minimal changes to existing code
* Good, because it's the quickest solution in the short term
* Bad, because it doesn't address underlying architectural issues
* Bad, because it doesn't improve testability or maintainability

### Option 3: Refactor using Composable Architecture-inspired patterns

* Good, because it improves testability and maintainability
* Good, because Michael has already successfully 
  implemented these patterns at his previous job
* Good, because it introduces consistent patterns for feature development
* Good, because it can be done incrementally without a complete rewrite
* Bad, because it requires learning and adapting new patterns
* Bad, because it may temporarily slow down development during the transition

## Chosen Option: Option 3 - Refactor using Composable Architecture-inspired patterns

We chose this option because it offers a balance between improving our architecture and maintaining continuity with our existing codebase. It allows us to incrementally improve testability and maintainability without requiring a complete rewrite. The patterns from the Composable Architecture have proven effective in similar contexts and can be adapted to our JavaScript/React Native environment.

## Implementation Details
The refactoring will involve the following key components:

1. State Machine for Group Joining Logic
2. Dependency Control Pattern
   a. Group Joining Client
   b. Any other clients that the group joining feature depends on
3. Event-Driven Testing of Key Behavioral Flows

## Consequences
Positive:
- Improved testability of the group joining feature
- More consistent patterns for feature development across the application
- Better separation of business logic from UI
- Easier to reason about and debug complex flows
- Prepares the path for sharing our key business logic 
  effectively across React on various different 
  platforms such as web (React), mobile (React Native), 
  and desktop (Electron)
- Simulatable business logic allows for 
  non-programming stakeholders to understand and find 
  high level bugs in the business logic
- State Charts will be automatically derived from the 
  state machine definition and can be paired with 
  Figma designs to further add color to the various 
  states the application can be in and how it will 
  handle them.

Negative:
- Initial learning curve for the team to understand 
  and implement new patterns/xstate
- Temporary slowdown in development velocity during 
  the refactoring process (leading to increased 
  productivity and quality in the longer term)
- Potential for introducing new bugs during the refactoring (mitigated by comprehensive testing)

## Related Decisions
- [Future ADR] Pattern for consuming Zustand 
  imperatively in plain TypeScript
- [Future ADR] Pattern for consuming React Query 
  imperatively in plain TypeScript

## References
- https://pointfreeco.github.io/swift-dependencies/main/documentation/dependencies
- https://www.pointfree.co/
- [Demo TypeScript of Dependency Pattern](https://github.com/ephemeraHQ/mobile-architecture-patterns-demo/tree/main/Dependencies)
- [Demo React Native / Business Logic Toy Example](https://github.com/ephemeraHQ/mobile-architecture-patterns-demo/tree/main/toyExample)
- [pointfree.co](https://www.pointfree.co) - Resour
