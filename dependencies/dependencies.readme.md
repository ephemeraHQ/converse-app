# Dependency Management Pattern: Controlled Dependencies

## Table of Contents

1. [Introduction](#introduction)
2. [How It Works](#how-it-works)
3. [Step-by-Step Guide](#step-by-step-guide-controlling-your-dependencies)
4. [Benefits & Trade-offs](#benefits--trade-offs)
5. [Philosophy](#philosophy-why-mocking-isnt-always-the-answer)
6. [Real-World Usage](#real-world-usage)
7. [Key Concepts](#key-concepts)

## Introduction

This pattern consolidates complex behaviors into a global
singleton object, enhancing testability, flexibility, and
maintainability.

## How It Works

We use a central `Controlled` object to hold major
dependencies:

    export let Controlled: Environment = {
      date: DateClient.live(),
      networkMonitorClient: NetworkMonitorClient.live(),
      appStateClient: AppStateClient.live(),
      // ... other dependencies
    };

Each dependency has multiple implementations:

- `live()`: Real-world implementation
- `unimplemented()`: Throws an error if used unexpectedly
  in tests
- Various mock implementations for testing/QA

### Dependency Matrix

| Flavor  | Platform         | NetworkMonitorClient |
| ------- | ---------------- | -------------------- |
| Dev     | iOS Simulator    | Satisfied            |
| QA      | iOS Simulator    | Satisfied            |
| Dev     | Android Emulator | Satisfied            |
| QA      | Android Emulator | Satisfied            |
| Dev     | iOS Device       | Live                 |
| QA      | iOS Device       | Live                 |
| Dev     | Android Device   | Live                 |
| QA      | Android Device   | Live                 |
| Prod    | iOS Device       | Live                 |
| Prod    | Android Device   | Live                 |
| Jest    | N/A              | Unimplemented        |
| Detox   | iOS Simulator    | Live                 |
| Detox   | Android Emulator | Live                 |
| Unknown | Any              | Unimplemented        |

## Step-by-Step Guide: Controlling Your Dependencies

1. Identify the dependency
2. Create a client
3. Create a live implementation
4. Create static instances
5. Create a custom implementation
6. Create an unimplemented version
7. Add to Environment

## Benefits & Trade-offs

Benefits:

- Centralized control
- Enhanced testability
- Flexibility
- Reduced mocking
- Consistency

Trade-offs:

- Global singleton (mitigated by avoiding state in
  dependencies)
- Potential for misuse (mitigated by future lint rules)
- Learning curve (mitigated by documentation and
  education)

## Philosophy: Why Mocking Isn't Always the Answer

Our pattern focuses on controlling dependencies, aligning
more closely with production code. This allows for:

- Testing with near-production configurations
- Easy simulation of different environments
- Avoiding complexity and inaccuracies of mocks

## Real-World Usage

Search for `Controlled.` in the codebase to see where
this
pattern is used.

## Key Concepts

- Dependency Injection
- Singleton
- Observable Pattern
