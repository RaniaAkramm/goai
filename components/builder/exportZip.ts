import { zipProject, slugify } from "@/lib/builder/export";
import { getAsset } from "@/lib/builder/db";
import type { Project } from "@/lib/builder/types";
import { download } from "../ui";
export async function exportZip(p: Project, backend = p.backend) {
  const assets: { name: string; data: Uint8Array }[] = [];
  for (const a of p.assets) { const b = await getAsset(p.id, a.id); if (b) assets.push({ name: a.name, data: new Uint8Array(await b.arrayBuffer()) }); }
  const zip = zipProject(p, assets, backend);
  download(`${slugify(p.name)}.zip`, new Blob([zip as BlobPart], { type: "application/zip" }));
}
