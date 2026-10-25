import type { Project } from "./types";
const DB = "goai-builder", VER = 1;
let dbp: Promise<IDBDatabase> | null = null;
function open(): Promise<IDBDatabase> {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    const r = indexedDB.open(DB, VER);
    r.onupgradeneeded = () => { const d = r.result; d.createObjectStore("projects", { keyPath: "id" }); d.createObjectStore("assets"); };
    r.onsuccess = () => res(r.result); r.onerror = () => { dbp = null; rej(r.error); };
  });
  return dbp;
}
function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest | void): Promise<T> {
  return open().then((d) => new Promise<T>((res, rej) => {
    const t = d.transaction(store, mode); const s = t.objectStore(store); const req = fn(s);
    t.oncomplete = () => res(req ? (req.result as T) : (undefined as T)); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
  }));
}
export const listProjects = () => tx<Project[]>("projects", "readonly", (s) => s.getAll()).then((l) => l.sort((a, b) => b.updatedAt - a.updatedAt));
export const getProject = (id: string) => tx<Project | undefined>("projects", "readonly", (s) => s.get(id));
export const saveProject = (p: Project) => tx<void>("projects", "readwrite", (s) => { s.put(p); });
export const assetKey = (pid: string, aid: string) => `${pid}/${aid}`;
export const putAsset = (pid: string, aid: string, blob: Blob) => tx<void>("assets", "readwrite", (s) => { s.put(blob, assetKey(pid, aid)); });
export const getAsset = (pid: string, aid: string) => tx<Blob | undefined>("assets", "readonly", (s) => s.get(assetKey(pid, aid)));
export const deleteAsset = (pid: string, aid: string) => tx<void>("assets", "readwrite", (s) => { s.delete(assetKey(pid, aid)); });
export async function deleteProject(p: Project) {
  for (const a of p.assets) await deleteAsset(p.id, a.id);
  await tx<void>("projects", "readwrite", (s) => { s.delete(p.id); });
}
export async function clearAll() {
  await tx<void>("projects", "readwrite", (s) => { s.clear(); });
  await tx<void>("assets", "readwrite", (s) => { s.clear(); });
}
