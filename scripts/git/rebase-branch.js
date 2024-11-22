const { spawn } = require("child_process");
const prompts = require("prompts");

async function rebaseBranch() {
  const response = await prompts([
    {
      type: "text",
      name: "baseBranch",
      message:
        "Enter the base branch (the earlier branch in history, example release/previous)",
    },
    {
      type: "text",
      name: "branch",
      message:
        "Enter the branch to rebase (your branch, feature branch, or release/next)",
    },
  ]);

  const { baseBranch, branch } = response;

  try {
    await executeCommand("git", ["fetch", "origin"]);
    await executeCommand("git", ["checkout", branch]);
    await executeCommand("git", ["pull", "origin", branch, "--ff-only"]);

    // If dry-run is successful, perform the actual rebase
    console.log("Proceeding with the rebase...");
    await executeCommand("git", ["rebase", `origin/${baseBranch}`]);

    // Push the rebased branch to origin
    await executeCommand("git", [
      "push",
      "origin",
      branch,
      "--force-with-lease",
    ]);

    console.log(
      `Branch '${branch}' has been successfully rebased onto '${baseBranch}' and pushed.`
    );
  } catch (error) {
    console.error(
      "An error occurred during the rebase process:",
      error.message
    );

    // Check if the error is due to conflicts
    if (
      error.message.includes("CONFLICT") ||
      error.message.includes("Merge conflict")
    ) {
      console.error("Conflicts were detected during the rebase.");

      // Abort the rebase to return to a clean state
      await executeCommand("git", ["rebase", "--abort"]);

      // Optionally, list the conflicted files
      console.log("Listing conflicted files:");
      await executeCommand("git", ["diff", "--name-only", "--diff-filter=U"]);
    }

    // Exit the script with a non-zero exit code
    process.exit(1);
  }
}

function executeCommand(command, args) {
  return new Promise((resolve, reject) => {
    const cmd = spawn(command, args, { stdio: "inherit", shell: true });

    cmd.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `Command "${command} ${args.join(" ")}" failed with exit code ${code}`
          )
        );
      }
    });

    cmd.on("error", (error) => {
      reject(error);
    });
  });
}

rebaseBranch().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
