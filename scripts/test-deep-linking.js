const { spawn } = require("child_process")
const prompts = require("prompts")

const DEV_URL = "convos-dev://"
const PREVIEW_URL = "convos-preview://"
const PROD_URL = "convos://"

async function openDeepLink() {
  const questions = [
    {
      type: "select",
      name: "environment",
      message: "Choose an environment:",
      choices: [
        { title: "Development", value: "dev" },
        { title: "Preview", value: "preview" },
        { title: "Production", value: "prod" },
      ],
    },
    {
      type: "select",
      name: "platform",
      message: "Choose a platform:",
      choices: [
        { title: "iOS", value: "ios" },
        { title: "Android", value: "android" },
      ],
    },
  ]

  const { environment, platform } = await prompts(questions)

  if (!environment || !platform) {
    console.log("Operation cancelled.")
    process.exit(1)
  }

  let baseUrl
  switch (environment) {
    case "dev":
      baseUrl = DEV_URL
      break
    case "preview":
      baseUrl = PREVIEW_URL
      break
    case "prod":
      baseUrl = PROD_URL
      break
  }

  const { destination } = await prompts({
    type: "select",
    name: "destination",
    message: "Choose a destination:",
    choices: [
      { title: "Chat", value: "/" },
      { title: "Conversation", value: "conversation" },
      { title: "New Conversation", value: "newConversation" },
      { title: "Profile", value: "profile" },
      { title: "Group", value: "group" },
      { title: "Group Link", value: "groupLink" },
      { title: "Group Invite", value: "groupInvite" },
      { title: "Share Profile", value: "shareProfile" },
      { title: "Webview Preview", value: "webviewPreview" },
    ],
  })

  if (!destination) {
    console.log("Operation cancelled.")
    process.exit(1)
  }

  baseUrl = `${baseUrl}${destination}`

  let params = []
  let addMoreParams = true

  while (addMoreParams) {
    const { wantToAddParam } = await prompts({
      type: "confirm",
      name: "wantToAddParam",
      message: "Want to add parameters?",
      initial: true,
    })

    if (!wantToAddParam) {
      addMoreParams = false
      break
    }

    const { key, value } = await prompts([
      {
        type: "text",
        name: "key",
        message: "Enter parameter key:",
      },
      {
        type: "text",
        name: "value",
        message: "Enter parameter value:",
      },
    ])

    if (key && value) {
      params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    }
  }

  const fullUrl = params.length > 0 ? `${baseUrl}?${params.join("&")}` : baseUrl

  try {
    await executeCommand("npx", ["uri-scheme", "open", fullUrl, `--${platform}`])
  } catch (error) {
    console.error("Error opening deep link:", error)
  }
}

function executeCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { stdio: "inherit" })

    process.on("close", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed with exit code ${code}`))
      }
    })

    process.on("error", (error) => {
      reject(error)
    })
  })
}

openDeepLink()
