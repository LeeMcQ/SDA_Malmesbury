export type StanzaKind = "verse" | "chorus" | "refrain" | "bridge";

export type Stanza = {
  kind: StanzaKind;
  n?: number;
  lines: string[];
};

export type Collection = "numbered" | "additional";

export type Song = {
  id: string;
  number: number;
  title: string;
  collection: Collection;
  tags: string[];
  stanzas: Stanza[];
};
