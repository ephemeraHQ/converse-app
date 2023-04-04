import { faker } from "@faker-js/faker";
import { execSync } from "child_process";
import * as ethers from "ethers";
import fs from "fs";
import { nanoid } from "nanoid";
import path from "path";
// @ts-ignore
import { argv } from "process";

import dataSource from "./datasource";
import { Conversation } from "./entities/conversation";
import { Message } from "./entities/message";

const ethAddress = (): string => {
  const wallet = ethers.Wallet.createRandom();
  return wallet.address;
};

const randomItem = (items: any[]) => {
  return items[Math.floor(Math.random() * items.length)];
};

const username = (): string => {
  return faker.internet.userName().replace(/\./g, "").toLowerCase();
};

const lensHandle = (): string => {
  return `@${username()}.lens`;
};

const ensName = (): string => {
  return `${username()}.eth`;
};

const exec = (command: string) => {
  try {
    const result = execSync(command);
    const trimmed = result.toString().trim();
    if (trimmed) {
      console.log(trimmed);
    }
  } catch (e: any) {
    throw new Error(
      `Error in command: ${e.stdout?.toString()} ${e.stderr?.toString()}`
    );
  }
};

const commands = {
  sync: () => {
    const appEntitiesPath = path.join(__dirname, "../../data/db/entities");
    const nodeEntitiesPath = path.join(__dirname, "./entities");
    console.log("Copying entities...");
    exec(
      `rm -rf ${nodeEntitiesPath} && cp -r ${appEntitiesPath} ${nodeEntitiesPath}`
    );
    const entities = fs.readdirSync(nodeEntitiesPath);
    entities.forEach((entity) => {
      console.log(`Transforming entity ${entity}...`);
      exec(
        `sed -i '' 's/typeorm\\/browser/typeorm/g' ${path.join(
          nodeEntitiesPath,
          entity
        )}`
      );
      exec(`sed -i '' '/@ts-ignore/d' ${path.join(nodeEntitiesPath, entity)}`);
      exec(
        `sed -i '' '/public static name/d' ${path.join(
          nodeEntitiesPath,
          entity
        )}`
      );
    });
  },
  initialize: async () => {
    console.log("Initializing db...");
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
  },
  fixtures: async () => {
    commands.sync();
    commands.initialize();
    console.log("Inserting fixtures...");
    const myAddress = ethAddress();
    for (
      let conversationIndex = 0;
      conversationIndex < 3;
      conversationIndex++
    ) {
      const topic = `topic-${nanoid()}`;
      const peerAddress = ethAddress();
      await dataSource.getRepository(Conversation).insert({
        topic,
        peerAddress,
        createdAt: new Date().getTime(),
        lensHandle: lensHandle(),
        ensName: ensName(),
        handlesUpdatedAt: new Date().getTime(),
      });

      for (let messageIndex = 0; messageIndex < 10; messageIndex++) {
        await dataSource.getRepository(Message).insert([
          {
            conversationId: topic,
            id: nanoid(),
            senderAddress: randomItem([myAddress, peerAddress]),
            sent: new Date().getTime(),
            content: `SAMPLE MESSAGE - ${nanoid()}`,
          },
        ]);
      }
    }
    console.log("Done!");
  },
  reset: async () => {
    try {
      exec(`rm ${path.join(__dirname, "converse-sample.sqlite")}`);
    } catch (e) {
      console.log(e);
    }
    commands.sync();
    await commands.initialize();
    const result = await dataSource.runMigrations();
    console.log("Done!", result);
    commands.fixtures();
  },
  migrate: async () => {
    commands.sync();
    await commands.initialize();
    console.log("Running migrations...");
    const result = await dataSource.runMigrations();
    console.log("Done!", result);
  },
  generateMigration: async (migrationName: string) => {
    // Sync files
    commands.sync();
    // Run migrations if needed
    await commands.initialize();
    console.log("Generating migration...");
    exec(
      `./node_modules/typeorm/cli-ts-node-commonjs.js migration:generate -d scripts/migrations/datasource.ts data/db/migrations/${migrationName}`
    );
  },
};

const go = async () => {
  const command = argv[2];
  const args = argv.slice(3);

  if (typeof (commands as any)[command] !== "function") {
    console.log(`Command ${command} does not exist`);
    return;
  }

  console.log(`Running ${command}...`);
  if (command === "sync") {
    commands.sync();
  } else if (command === "migrate") {
    await commands.migrate();
  } else if (command === "generateMigration") {
    if (args[0]) {
      await commands.generateMigration(args[0]);
    } else {
      console.log("Missing migration name");
    }
  } else if (command === "reset") {
    await commands.reset();
  } else {
    console.log("Command not configured");
  }
};

go();
