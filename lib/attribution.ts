const E3_CHANNELS = new Set([
  "agentpacks",
  "mcpmarket",
  "mcpize",
  "smithery",
  "mcpso",
  "mcpmarketplaceio",
]);

export type Attribution = {
  experiment: "e1" | "e3";
  channel: string;
};

export function resolveAttribution(rawSource: string | null | undefined): Attribution {
  const source = (rawSource ?? "").trim().toLowerCase();
  if (source.startsWith("e3-")) {
    const channel = source.slice(3);
    if (E3_CHANNELS.has(channel)) {
      return { experiment: "e3", channel };
    }
  }
  return { experiment: "e1", channel: "own-page" };
}
