import { XmtpMessage } from "../data/store/xmtpReducer";
import { sentryTrackMessage } from "./sentry";

type MessageReaction = {
  action: "added" | "removed";
  content: string;
  senderAddress: string;
  sent: number;
  schema: "unicode" | "shortcode" | "custom";
};

type MessageReactions = { [reactionId: string]: MessageReaction };

export const getMessageReactions = (message: XmtpMessage) => {
  // Returns the last reaction for each sender
  try {
    if (!message.reactions || message.reactions === "[]") return {};
    const reactions = JSON.parse(message.reactions) as MessageReactions;
    const sortedReactions = Object.values(reactions).sort(
      (a, b) => a.sent - b.sent
    );

    const reactionsBySender: {
      [senderAddress: string]: { [reactionContent: string]: MessageReaction };
    } = {};
    // We get all reactions for each sender, there might be multiple
    // but we'll only show one!
    sortedReactions.forEach((reaction) => {
      if (
        reaction.action === "removed" &&
        reactionsBySender[reaction.senderAddress]?.[reaction.content]
      ) {
        delete reactionsBySender[reaction.senderAddress][reaction.content];
      } else if (reaction.action === "added") {
        reactionsBySender[reaction.senderAddress] =
          reactionsBySender[reaction.senderAddress] || {};
        reactionsBySender[reaction.senderAddress][reaction.content] = reaction;
      }
    });

    const lastReactionBySender: {
      [senderAddress: string]: MessageReaction;
    } = {};

    for (const senderAddress in reactionsBySender) {
      const reactions = Object.values(reactionsBySender[senderAddress]).sort(
        (a, b) => b.sent - a.sent
      );
      if (reactions.length > 0) {
        lastReactionBySender[senderAddress] = reactions[0];
      }
    }

    return lastReactionBySender;
  } catch (error) {
    const data = { error, reactions: message.reactions };
    console.log(data);
    sentryTrackMessage("REACTIONS_PARSING_ERROR", data);
    return {};
  }
};

export const RECENT_EMOJI_STORAGE_KEY = "RECENT_EMOJI_STORAGE_KEY";

export const DEFAULT_EMOJIS = `[{"emoji":"👍","name":"thumbs up","v":"0.6","toneEnabled":true,"keywords":["thumbs_up","thumbsup","yes","awesome","good","agree","accept","cool","hand","like","+1"]},{"emoji":"❤️","name":"red heart","v":"0.6","toneEnabled":false,"keywords":["red_heart","love","like","valentines"]},{"emoji":"😂","name":"face with tears of joy","v":"0.6","toneEnabled":false,"keywords":["face_with_tears_of_joy","face","cry","tears","weep","happy","happytears","haha"]},{"emoji":"😮","name":"face with open mouth","v":"1.0","toneEnabled":false,"keywords":["face_with_open_mouth","face","surprise","impressed","wow","whoa",":O"]},{"emoji":"😢","name":"crying face","v":"0.6","toneEnabled":false,"keywords":["crying_face","face","tears","sad","depressed","upset",":'("]},{"emoji":"🙏","name":"folded hands","v":"0.6","toneEnabled":true,"keywords":["folded_hands","please","hope","wish","namaste","highfive","pray","thank you","thanks","appreciate"]},{"emoji":"🔵","name":"blue circle","v":"0.6","toneEnabled":false,"keywords":["blue_circle","shape","icon","button"]},{"emoji":"🔴","name":"red circle","v":"0.6","toneEnabled":false,"keywords":["red_circle","shape","error","danger"]},{"emoji":"🌿","name":"herb","v":"0.6","toneEnabled":false,"keywords":["herb","vegetable","plant","medicine","weed","grass","lawn"]},{"emoji":"🌈","name":"rainbow","v":"0.6","toneEnabled":false,"keywords":["rainbow","nature","happy","unicorn_face","photo","sky","spring"]},{"emoji":"🦊","keywords":["fox","animal","nature","face"],"name":"fox","toneEnabled":false,"v":"3.0"},{"emoji":"👉","keywords":["backhand_index_pointing_right","fingers","hand","direction","right"],"name":"backhand index pointing right","toneEnabled":true,"v":"0.6"},{"emoji":"👈","keywords":["backhand_index_pointing_left","direction","fingers","hand","left"],"name":"backhand index pointing left","toneEnabled":true,"v":"0.6"}]`;
