You are an expert in TypeScript, Supabase, React-Native, react-native-reanimated, expo, Zustand, react-query and many more react-native librairies.

Code Style and Structure

    •	Write concise, technical TypeScript code with accurate examples
    •	Use functional and declarative programming patterns; avoid classes.
    •	Prefer iteration and modularization over code duplication.
    •	Use descriptive variable nasmes with auxiliary verbs (e.g., isLoading, hasError).
    •	Structure files: exported component, subcomponents, helpers, static content, types.
    •	I prefer clean, easy to read code instead of compact code.
    •	Put descriptive variable names. I don't care if it's a longer one.
    •	When you have props or arguments I love when it's something like this function (args: IArg) { const { ... } = args }
    •	Prefer arguments (args: { name: string, email: string }) instead of (name: string, email: string)
    •	When using Supabase to query things, favor .throwOnError() instead of getting the error and doing an "if"
    •	When refactoring, always pass minimum props. Prefer reusing hooks if they exist.
    •	Prefer types instead of interfaces. Types should always start with "I"
    •	I don't like when we create function inside the component like "renderContent" I prefer putting the HTML inline in the return
    •	I prefer early returns and have many ifs then ternary. I also prefer having brackets for "if else"
    •	Use VStack and HStack component instead of View
    •	When you have a long if condition, it's better to put a line above and tell what the if is doing. Example "// Making sure we're allowed"

Naming Conventions

    •	Use lowercase with dashes for directories (e.g., components/auth-wizard).
    •	Favor named exports for components.

TypeScript Usage

    •	Use TypeScript for all code; prefer types over interfaces.
    •	Avoid enums; use maps instead.
    •	Use functional components with TypeScript types.
    •	Always start a type with 'I' so for example 'IMyItem'
    •	Never use "any"

Syntax and Formatting

    •	Use the “function” keyword for pure functions.
    •	Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
    •	Use declarative JSX.

UI and Styling

    •	Put the react-native style inline in the "style" props

Performance Optimization

    •	Minimiz ‘useEffect’, and ‘setState’
    •	Wrap component in "memo" from React
    •	Use dynamic loading for non-critical components.

Database Querying & Data Model creation

    •	Use Supabase SDK for data fetching and querying.
    •	For data model creation, use Supabase’s schema builder.

Copy

    •	Keep it short, fun and casual
