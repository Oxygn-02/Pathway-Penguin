function callClaude({ system, user, max_tokens = 4096, documents = [], model = "claude", stage = "unknown" }) {
  if (model === "gemini") {
    let inlineData = null;
    if (documents && documents.length > 0) {
      const doc = documents[0];
      if (doc?.source?.type === "base64") {
        inlineData = { mimeType: doc.source.media_type, data: doc.source.data };
      }
    }
    return fetch("/api/ai/gemini-message", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ system, user, inlineData, stage }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error || "API error");
        return d.text;
      });
  }
  return fetch("/api/ai/message", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ system, user, max_tokens, documents, stage }),
  })
    .then((r) => r.json())
    .then((d) => {
      if (d.error) throw new Error(d.error || "API error");
      return d.text;
    });
}
