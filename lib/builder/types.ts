export type AssetMeta = { id: string; name: string; type: string; size: number };
export type Project = {
  id: string; name: string; template: string; createdAt: number; updatedAt: number;
  pages: string[];               // ordered list of html file paths; pages[0] is shown first in nav order
  files: Record<string, string>; // text files: path -> content
  assets: AssetMeta[];           // binary assets stored separately (IndexedDB), exported under assets/
  backend: boolean;              // include Express + SQLite scaffold on export
};
