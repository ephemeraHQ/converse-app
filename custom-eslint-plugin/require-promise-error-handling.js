module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce error handling for Promise-based function calls in React components",
      category: "Best Practices",
      recommended: true,
    },
    schema: [],
    messages: {
      missingErrorHandling:
        "Promise-based function calls in React components must be wrapped in try-catch or use .catch()",
    },
  },
  create(context) {
    // Track if we're inside a React component
    let insideComponent = false
    // Track if we're inside a try block
    let insideTryBlock = 0

    return {
      // Detect React component function declarations
      "FunctionDeclaration[id.name=/[A-Z].*/]"(node) {
        insideComponent = true
      },
      // Detect React component arrow functions
      "VariableDeclarator[id.name=/[A-Z].*/] > ArrowFunctionExpression"(node) {
        insideComponent = true
      },
      "FunctionDeclaration:exit"(node) {
        insideComponent = false
      },
      "ArrowFunctionExpression:exit"(node) {
        insideComponent = false
      },
      // Track try blocks
      TryStatement(node) {
        insideTryBlock++
      },
      "TryStatement:exit"(node) {
        insideTryBlock--
      },
      // Check await expressions
      AwaitExpression(node) {
        if (!insideComponent) return

        // Skip if we're inside a try block
        if (insideTryBlock > 0) return

        // Check if the await expression is followed by a .catch()
        const parent = node.parent
        if (parent.type === "MemberExpression" && parent.property.name === "catch") {
          return
        }

        // Report error if no error handling is found
        context.report({
          node,
          messageId: "missingErrorHandling",
        })
      },
      // Check Promise.then() calls
      "CallExpression[callee.property.name='then']"(node) {
        if (!insideComponent) return

        // Skip if we're inside a try block
        if (insideTryBlock > 0) return

        // Check if .then() is followed by .catch()
        const parent = node.parent
        if (parent.type === "MemberExpression" && parent.property.name === "catch") {
          return
        }

        // Report error if no error handling is found
        context.report({
          node,
          messageId: "missingErrorHandling",
        })
      },
    }
  },
}
