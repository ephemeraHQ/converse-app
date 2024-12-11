/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Enforce blank lines before const declarations initializing React hooks like useMemo, useEffect, or useCallback",
    },
    fixable: "whitespace",
    schema: [],
    messages: {
      blankLineBefore:
        "Expected a blank line before this React hook initialization.",
    },
  },

  create(context) {
    return {
      VariableDeclaration(node) {
        if (node.kind !== "const") return;

        const declaration = node.declarations[0];
        if (!declaration || !declaration.init) return;

        const init = declaration.init;

        // Check if the initializer is a call to useMemo, useEffect, or useCallback
        const isReactHookInitialization =
          init.type === "CallExpression" &&
          [
            "useMemo",
            "useEffect",
            "useCallback",
            "useAnimatedStyle",
            "useAnimatedProps",
          ].includes(init.callee.name);

        if (!isReactHookInitialization) return;

        const sourceCode = context.getSourceCode();
        const tokenBefore = sourceCode.getTokenBefore(node, {
          includeComments: true,
        });

        if (!tokenBefore) return;

        // Check if the node is the first statement in the function
        const parentFunction = node.parent;
        if (
          parentFunction.type === "BlockStatement" &&
          parentFunction.body[0] === node
        ) {
          return;
        }

        // Check if there's a comment immediately before the hook
        const commentBefore = sourceCode.getCommentsBefore(node);
        if (commentBefore.length > 0) {
          const lastComment = commentBefore[commentBefore.length - 1];
          if (node.loc.start.line - lastComment.loc.end.line === 1) {
            return;
          }
        }

        const linesBetween = node.loc.start.line - tokenBefore.loc.end.line - 1;

        if (linesBetween === 0) {
          context.report({
            node,
            messageId: "blankLineBefore",
            fix(fixer) {
              return fixer.insertTextBefore(node, "\n");
            },
          });
        }
      },
    };
  },
};
