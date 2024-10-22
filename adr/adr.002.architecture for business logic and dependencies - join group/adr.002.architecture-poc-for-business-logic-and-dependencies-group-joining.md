# ADR-002: Create Architectural Basis - Refactoring for Group Joining Feature

## Status

AGREED

## Date

- **Proposed**: 2024-09-30
- **Decided**: 2024-10-01
- **Work Began**: 2024-09-26
- **Work Completed**: [To be filled after completion]

## Context

During our team offsite in UNDISCLOSED LOCATION from 
**September 
23rd to 27th, 2024**, we discussed opportunities to improve our application's architecture. Michael, a new team member, brings experience in implementing patterns that increase testability and separate business logic from UI, enhancing code robustness. He also introduced a pattern for controlling dependencies and side effects in applications.

Given the potential benefits, the mobile team **verbally agreed** that this was a good use of our time. However, since the proof of concept is estimated to take **2-4 weeks**, Naomi and Michael felt it was important to document the deliverables, provide a high-level overview of the pattern, and discuss alternatives, despite prior agreements on the approach during the offsite.

Notably, although this ADR is numbered **002**, it was actually our first ADR. Subsequently, we created ADR-001 to establish a precedent for future ADRs. This document aims to match the quality and detail of ADR-001, ensuring consistency in our documentation.

## Proposal

We will refactor the group joining feature using patterns inspired by the **Composable Architecture**, adapting them for JavaScript and React Native. This refactoring will involve:

1. Implementing a **state machine** for group joining logic using **XState**.
2. Introducing a **dependency control pattern** to manage side effects and external dependencies.
3. Developing an **event-driven testing framework**.
4. Integrating with existing **Zustand** and **React Query** logic.
5. Implementing key behavioral flows with complete test coverage.

## Considered Options

1. **Maintain current architecture and focus on bug fixing**
2. **Refactor using Composable Architecture-inspired patterns**

## Pros and Cons of the Options

### Option 1: Maintain current architecture and focus on bug fixing

_Good, because:_

- Requires minimal changes to existing code.
- Quickest solution in the short term.

_Bad, because:_

- Does not address underlying architectural issues.
- Does not improve testability or maintainability.
- Potential for scalability issues as the codebase grows.

### Option 2: Refactor using Composable Architecture-inspired patterns

_Good, because:_

- Improves testability and maintainability.
- Separates business logic from UI, enhancing code robustness.
- Introduces consistent patterns for feature development.
- Michael has prior experience successfully implementing these patterns.

_Bad, because:_

- Requires learning and adapting new patterns (learning curve for the team).
- May temporarily slow down development during the transition.
- Potential for introducing new bugs during refactoring (mitigated by comprehensive testing).

## Proposed Option: Option 2 - Refactor using Composable Architecture-inspired patterns

We chose this option because it offers a balance between improving our architecture and maintaining continuity with our existing codebase. It allows us to incrementally enhance testability and maintainability without requiring a complete rewrite. The patterns from the Composable Architecture have proven effective in similar contexts and can be adapted to our JavaScript/React Native environment.

## Implementation Details

### 1. State Machine for Group Joining Logic

- Utilize **XState** to implement a state machine that manages the group joining process.
- Define all possible states and transitions to handle various scenarios (e.g., joining, already a member, errors).

### 2. Dependency Control Pattern

- Introduce a pattern to control dependencies and side effects, similar to the **Composable Architecture**.
- Implement a **Group Joining Client** that encapsulates all external interactions required by the feature.
- Ensure that business logic can be tested in isolation by mocking dependencies.

### 3. Event-Driven Testing Framework

- Develop tests that simulate events and verify state transitions.
- Use **XState's testing utilities** to cover key behavioral flows with complete test coverage.
- Ensure tests are deterministic and cover both happy paths and edge cases.

### 4. Integration with Existing Systems

- Seamlessly integrate the new state machine with existing **Zustand** stores and **React Query** logic.
- Ensure that the refactored feature works cohesively within the current application architecture.

### 5. Documentation and Knowledge Sharing

- Update documentation to reflect architectural changes.
- Provide team training sessions to familiarize everyone with the new patterns.

## Consequences

### Positive

- **Improved Testability**: Business logic separated from UI allows for comprehensive testing.
- **Enhanced Maintainability**: Consistent patterns make the codebase easier to understand and modify.
- **Scalability**: A robust architecture that can handle future growth and complexity.
- **Stakeholder Visibility**: State machines provide clear diagrams that can be shared with non-technical stakeholders.

### Negative

- **Learning Curve**: Team members need to learn new patterns and tools (e.g., XState).
- **Temporary Slowdown**: Development velocity may decrease during the transition period.
- **Risk of Bugs**: Refactoring may introduce new issues, but this risk is mitigated by thorough testing.

## Migration Plan

### Phase 1: Preparation

- **Team Alignment**: Communicate the plan and ensure all team members understand the new patterns.
- **Tooling Setup**: Install and configure **XState** and related dependencies.

### Phase 2: Implementation

- **Develop State Machine**: Create the state machine for the group joining feature.
- **Implement Dependency Control**: Introduce the dependency control pattern and refactor code accordingly.

### Phase 3: Testing

- **Write Tests**: Develop comprehensive tests covering all state transitions and scenarios.
- **Quality Assurance**: Perform thorough testing to identify and fix any bugs.

### Phase 4: Integration

- **Integrate with Existing Systems**: Ensure the refactored feature works seamlessly with **Zustand** and **React Query**.
- **Code Review**: Conduct code reviews to maintain code quality and consistency.

### Phase 5: Documentation and Training

- **Update Documentation**: Reflect all changes in the project's documentation.
- **Team Training**: Conduct workshops or sessions to train the team on the new architecture.

## Related Decisions

- **ADR-001: Feature-Based Folder Structure**: Aligns with the decision to organize code by features, which will facilitate the implementation of the new patterns.
- **Future ADR**: Pattern for consuming **Zustand** imperatively in plain TypeScript.
- **Future ADR**: Pattern for consuming **React Query** imperatively in plain TypeScript.

## References

- [Composable Architecture Documentation](https://pointfreeco.github.io/swift-composable-architecture/)
- [XState Documentation](https://xstate.js.org/docs/)
- [Michael's Demo of Dependency Pattern](https://github.com/ephemeraHQ/mobile-architecture-patterns-demo/tree/main/Dependencies)
- [Michael's Demo of React Native Business Logic](https://github.com/ephemeraHQ/mobile-architecture-patterns-demo/tree/main/toyExample)
- [GitHub Commit Related to Work Began on September 26](https://github.com/ephemeraHQ/converse-app/commit/f57e515ae9c9a6afcf43f70cdb290310a9be2edd)

## Notes on Inconsistencies

- **ADR Numbering**: Although this document is ADR-002, it was actually the first ADR we created. We created ADR-001 subsequently to establish a precedent for documentation quality and structure.
- **Dates**: Work on this refactoring began on **September 26, 2024**, as per the linked commit. The proposal date is **September 30, 2024**, and the offsite where agreements were made occurred from **September 23rd to 27th, 2024**.
- **Branching and Documentation**: Initially, ADR-002 was our first ADR. However, due to branching and the creation of ADR-001 later, the numbering may seem inconsistent. Going forward, we should ensure ADRs are numbered sequentially based on their creation date to avoid confusion.

---

By adopting these patterns, we aim to enhance the robustness and scalability of our application, making it easier to maintain and extend features. This approach aligns with our goal of improving the overall architecture while facilitating future development.
