import { ADDITIONAL_SONGS } from "@/data/additional-songs";
import { NUMBERED_SONGS } from "@/data/numbered-songs";
import type { Song, Stanza } from "@/lib/song-types";

export type { Song, Stanza } from "@/lib/song-types";

export const SONGS: Song[] = [...NUMBERED_SONGS, ...ADDITIONAL_SONGS];

export const SONG_BY_ID: Record<string, Song> = Object.fromEntries(
  SONGS.map((song) => [song.id, song]),
);

export function getSong(id: string): Song | undefined {
  return SONG_BY_ID[id];
}

export function firstLine(song: Song): string {
  return song.stanzas[0]?.lines[0] ?? "";
}

export function stanzaLabel(stanza: Stanza): string {
  if (stanza.kind === "chorus") return "Chorus";
  if (stanza.kind === "refrain") return "Refrain";
  if (stanza.kind === "bridge") return "Bridge";
  return stanza.n ? `Verse ${stanza.n}` : "Verse";
}

export function lyricsText(song: Song): string {
  return song.stanzas
    .map((stanza) => `${stanzaLabel(stanza)}\n${stanza.lines.join("\n")}`)
    .join("\n\n");
}

export function displayNumber(song: Song): string {
  return String(song.number).padStart(2, "0");
}

export function songOfTheDay(date = new Date()): Song {
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return SONGS[hash % SONGS.length]!;
}

export function neighbors(id: string): { prev?: Song; next?: Song } {
  const index = SONGS.findIndex((song) => song.id === id);
  if (index < 0) return {};
  return {
    prev: index > 0 ? SONGS[index - 1] : undefined,
    next: index < SONGS.length - 1 ? SONGS[index + 1] : undefined,
  };
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchSongs(query: string): Song[] {
  const q = normalize(query);
  if (!q) return SONGS;
  const terms = q.split(" ").filter(Boolean);

  const scored = SONGS.map((song) => {
    const title = normalize(song.title);
    const number = String(song.number);
    const hay = normalize(
      `${song.title} ${number} ${song.tags.join(" ")} ${song.stanzas.flatMap((s) => s.lines).join(" ")}`,
    );
    let score = 0;
    if (number && q === number) score += 80;
    if (title === q) score += 70;
    if (title.startsWith(q)) score += 40;
    if (title.includes(q)) score += 24;
    for (const term of terms) {
      if (title.includes(term)) score += 12;
      if (song.tags.some((tag) => normalize(tag).includes(term))) score += 8;
      if (hay.includes(term)) score += 3;
    }
    return { song, score };
  });

  return scored
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.song.title.localeCompare(b.song.title))
    .map((row) => row.song);
}

export const AI_CATALOG = SONGS.map((song) => ({
  id: song.id,
  number: song.number,
  title: song.title,
  tags: song.tags,
  firstLine: firstLine(song),
})).slice();
