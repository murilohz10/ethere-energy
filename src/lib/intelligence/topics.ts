import type { UIMessage } from "ai";

/** Keep retired market content out of locally restored conversations. */
export function excludeRetiredMarketMessages(messages: UIMessage[]): UIMessage[] {
  const retired = /t[eé]rmic|thermal/i;
  let excludeReply = false;
  return messages.filter((message) => {
    const containsRetiredTopic = retired.test(JSON.stringify(message.parts));
    if (message.role === "user") {
      excludeReply = containsRetiredTopic;
      return !containsRetiredTopic;
    }
    return !excludeReply && !containsRetiredTopic;
  });
}