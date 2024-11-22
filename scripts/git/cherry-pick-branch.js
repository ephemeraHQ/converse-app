const { spawn } = require("child_process");
const prompts = require("prompts");

async function cherryPickCommits() {
  const response = await prompts([
    {
      type: "text",
      name: "sourceBranch",
      message: "Enter the source branch (containing commits to cherry-pick)",
    },
    {
      type: "text",
      name: "targetBranch",
      message: "Enter the target branch (branch to apply commits to)",
    },
    {
      type: "confirm",
      name: "selectCommits",
      message: "Do you want to select specific commits to cherry-pick?",
      initial: false,
    },
  ]);

  const { sourceBranch, targetBranch, selectCommits } = response;

  try {
    // Fetch and checkout target branch
    await executeCommand("git", ["fetch", "origin"]);
    await executeCommand("git", ["checkout", targetBranch]);
    await executeCommand("git", ["pull", "origin", targetBranch, "--ff-only"]);

    // Update source branch
    await executeCommand("git", ["fetch", "origin"]);
    await executeCommand("git", ["checkout", sourceBranch]);
    await executeCommand("git", ["pull", "origin", sourceBranch, "--ff-only"]);

    // Get list of commits from source branch not in target branch
    const commitList = await getCommitsNotInTarget(sourceBranch, targetBranch);

    if (commitList.length === 0) {
      console.log("No new commits to cherry-pick.");
      process.exit(0);
    }

    let commitsToCherryPick = commitList;

    if (selectCommits) {
      // Prompt user to select commits
      const commitChoices = commitList.map((commit) => ({
        title: `${commit.hash} ${commit.message}`,
        value: commit.hash,
      }));

      const { selectedCommits } = await prompts({
        type: "multiselect",
        name: "selectedCommits",
        message: "Select commits to cherry-pick",
        choices: commitChoices,
        min: 1,
      });

      commitsToCherryPick = commitList.filter((commit) =>
        selectedCommits.includes(commit.hash)
      );
    }

    // Switch back to target branch
    await executeCommand("git", ["checkout", targetBranch]);

    // Cherry-pick the commits
    for (const commit of commitsToCherryPick) {
      console.log(`Cherry-picking commit ${commit.hash}: ${commit.message}`);
      try {
        await executeCommand("git", ["cherry-pick", commit.hash]);
      } catch (error) {
        console.error(
          `Conflict occurred while cherry-picking commit ${commit.hash}.`
        );
        // Prompt user to resolve conflicts
        const { resolveNow } = await prompts({
          type: "confirm",
          name: "resolveNow",
          message:
            "Do you want to resolve the conflicts now? (If not, the cherry-pick will be aborted.)",
          initial: true,
        });

        if (resolveNow) {
          console.log(
            "Please resolve the conflicts manually, then continue the cherry-pick."
          );
          console.log("After resolving, run: git cherry-pick --continue");
          console.log(
            "If you want to abort the cherry-pick, run: git cherry-pick --abort"
          );
          process.exit(1);
        } else {
          await executeCommand("git", ["cherry-pick", "--abort"]);
          throw new Error(
            `Cherry-pick aborted due to conflicts in commit ${commit.hash}.`
          );
        }
      }
    }

    // Push the updated target branch to origin
    await executeCommand("git", ["push", "origin", targetBranch]);

    console.log(
      `Successfully cherry-picked ${commitsToCherryPick.length} commits onto '${targetBranch}' and pushed to origin.`
    );
  } catch (error) {
    console.error("An error occurred:", error.message);
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
            `Command "${command} ${args.join(" ")}" exited with code ${code}`
          )
        );
      }
    });

    cmd.on("error", (error) => {
      reject(error);
    });
  });
}

async function getCommitsNotInTarget(sourceBranch, targetBranch) {
  // Get commits in sourceBranch not in targetBranch
  const commitsOutput = await executeGitCommand([
    "log",
    `${targetBranch}..${sourceBranch}`,
    "--pretty=format:%H %s",
  ]);

  const commits = commitsOutput
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const [hash, ...messageParts] = line.split(" ");
      return { hash, message: messageParts.join(" ") };
    });

  return commits;
}

function executeGitCommand(args) {
  return new Promise((resolve, reject) => {
    let output = "";
    const cmd = spawn("git", args, { shell: true });

    cmd.stdout.on("data", (data) => {
      output += data.toString();
    });

    cmd.stderr.on("data", (data) => {
      output += data.toString();
    });

    cmd.on("close", (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(
          new Error(
            `Git command "git ${args.join(" ")}" exited with code ${code}`
          )
        );
      }
    });

    cmd.on("error", (error) => {
      reject(error);
    });
  });
}

cherryPickCommits();
