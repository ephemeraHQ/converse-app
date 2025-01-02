/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce single function per file",
    },
    schema: [],
    messages: {
      singleFunction: "Only one function per file allowed.",
    },
  },

  create(context) {
    let functionCount = 0;

    return {
      "FunctionDeclaration, ArrowFunctionExpression"(node) {
        functionCount++;

        if (functionCount > 1) {
          context.report({
            node,
            messageId: "singleFunction",
          });
        }
      },

      "Program:exit"() {
        functionCount = 0;
      },
    };
  },
};
