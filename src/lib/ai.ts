import { createServerFn } from "@tanstack/react-start";
import { AI_CATALOG } from "@/lib/songs";

export type AiPick = { id: string; reason: string };
export type AiResult =
  | { ok: true; title: string; notes: string; picks: AiPick[] }
  | { ok: false; error: string };

export const recommendSongs = createServerFn({ method: "POST" })
  .validator((input: { query: string }) => {
    const query = String(input?.query ?? "").trim().slice(0, 400);
    if (!query) throw new Error("Please describe the moment or theme.");
    return { query };
  })
  .handler(async ({ data }): Promise<AiResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false, error: "Song finder is unavailable in this environment." };
    }

    const catalog = AI_CATALOG.map((song) => {
      const num = `${song.number}. `;
      return `${song.id} | ${num}${song.title} | ${song.tags.join(", ")} | ${song.firstLine}`;
    }).join("\n");

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.4,
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content:
              "You are the song finder for Malmesbury SDA Church Women's Ministries. Recommend songs ONLY from the provided catalog. Return strict JSON: {\"title\": string, \"notes\": string, \"picks\": [{\"id\": string, \"reason\": string}]}. 3 to 5 picks. Use exact catalog ids. Keep reasons to one short sentence. Notes: one warm sentence about the suggested flow.",
          },
          {
            role: "user",
            content: `Catalog:\n${catalog}\n\nRequest: ${data.query}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `Could not reach the song finder (${res.status}).` };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = body.choices?.[0]?.message?.content ?? "";
    const jsonText = raw.replace(/^```json\s*|\s*```$/g, "").trim();

    try {
      const parsed = JSON.parse(jsonText) as {
        title?: string;
        notes?: string;
        picks?: { id?: string; reason?: string }[];
      };
      const allowed = new Set(AI_CATALOG.map((song) => song.id));
      const picks = (parsed.picks ?? [])
        .filter((pick) => pick.id && allowed.has(pick.id))
        .slice(0, 5)
        .map((pick) => ({ id: pick.id!, reason: String(pick.reason ?? "").slice(0, 180) }));
      if (!picks.length) {
        return { ok: false, error: "No matching songs were returned. Try another theme." };
      }
      return {
        ok: true,
        title: String(parsed.title ?? "Suggested songs").slice(0, 80),
        notes: String(parsed.notes ?? "").slice(0, 280),
        picks,
      };
    } catch {
      return { ok: false, error: "The song finder returned an unexpected answer." };
    }
  });
