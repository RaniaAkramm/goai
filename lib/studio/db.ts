import type { Msg } from "./prompts";
export type Chat = { id: string; title: string; model: string; createdAt: number; updatedAt: number; messages: Msg[] };
const DB = "goai-studio", VER = 1;
let dbp: Promise<IDBDatabase> | null = null;
function open(): Promise<IDBDatabase> {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    const r = indexedDB.open(DB, VER);
    r.onupgradeneeded = () => { r.result.createObjectStore("chats", { keyPath: "id" }); };
    r.onsuccess = () => res(r.result); r.onerror = () => { dbp = null; rej(r.error); };
  });
  return dbp;
}
function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest | void): Promise<T> {
  return open().then((d) => new Promise<T>((res, rej) => {
    const t = d.transaction("chats", mode); const req = fn(t.objectStore("chats"));
    t.oncomplete = () => res(req ? (req.result as T) : (undefined as T)); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
  }));
}
export const listChats = () => tx<Chat[]>("readonly", (s) => s.getAll()).then((l) => l.sort((a, b) => b.updatedAt - a.updatedAt));
export const getChat = (id: string) => tx<Chat | undefined>("readonly", (s) => s.get(id));
export const saveChat = (c: Chat) => tx<void>("readwrite", (s) => { s.put(c); });
export const deleteChat = (id: string) => tx<void>("readwrite", (s) => { s.delete(id); });
export const clearChats = () => tx<void>("readwrite", (s) => { s.clear(); });
