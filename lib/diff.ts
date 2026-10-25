export type Op = { type: "equal" | "insert" | "delete"; value: string };

/** Myers O(ND) diff over arrays of tokens. */
export function diffTokens(a: string[], b: string[]): Op[] {
  const n = a.length, m = b.length, max = n + m;
  const v = new Map<number, number>(); v.set(1, 0);
  const trace: Map<number, number>[] = [];
  outer: for (let d = 0; d <= max; d++) {
    trace.push(new Map(v));
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && (v.get(k - 1) ?? -1) < (v.get(k + 1) ?? -1)) ? v.get(k + 1)! : v.get(k - 1)! + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) { x++; y++; }
      v.set(k, x);
      if (x >= n && y >= m) break outer;
    }
  }
  const ops: Op[] = [];
  let x = n, y = m;
  for (let d = trace.length - 1; d >= 0 && (x > 0 || y > 0); d--) {
    const vv = trace[d], k = x - y;
    const prevK = k === -d || (k !== d && (vv.get(k - 1) ?? -1) < (vv.get(k + 1) ?? -1)) ? k + 1 : k - 1;
    const px = vv.get(prevK) ?? 0, py = px - prevK;
    while (x > px && y > py) { ops.push({ type: "equal", value: a[--x] }); y--; }
    if (d > 0) { if (x === px) ops.push({ type: "insert", value: b[--y] }); else ops.push({ type: "delete", value: a[--x] }); }
  }
  ops.reverse();
  const merged: Op[] = [];
  for (const o of ops) merged.push(o);
  return merged;
}

export type LineRow = { type: "equal" | "insert" | "delete" | "change"; left?: string; right?: string; leftNo?: number; rightNo?: number; inline?: { left: Op[]; right: Op[] } };

export const tokenizeWords = (s: string) => s.match(/\s+|[A-Za-z0-9_]+|[^\sA-Za-z0-9_]/g) ?? [];

export function diffLines(a: string, b: string): { rows: LineRow[]; added: number; removed: number } {
  const A = a.split(/\r?\n/), B = b.split(/\r?\n/);
  const ops = diffTokens(A, B);
  const rows: LineRow[] = [];
  let ln = 1, rn = 1, added = 0, removed = 0;
  for (let i = 0; i < ops.length; i++) {
    const o = ops[i];
    if (o.type === "equal") { rows.push({ type: "equal", left: o.value, right: o.value, leftNo: ln++, rightNo: rn++ }); continue; }
    const dels: string[] = [], ins: string[] = [];
    while (i < ops.length && ops[i].type !== "equal") { (ops[i].type === "delete" ? dels : ins).push(ops[i].value); i++; }
    i--;
    removed += dels.length; added += ins.length;
    const pairs = Math.min(dels.length, ins.length);
    for (let j = 0; j < pairs; j++) {
      const w = diffTokens(tokenizeWords(dels[j]), tokenizeWords(ins[j]));
      rows.push({ type: "change", left: dels[j], right: ins[j], leftNo: ln++, rightNo: rn++, inline: { left: w.filter((x) => x.type !== "insert"), right: w.filter((x) => x.type !== "delete") } });
    }
    for (let j = pairs; j < dels.length; j++) rows.push({ type: "delete", left: dels[j], leftNo: ln++ });
    for (let j = pairs; j < ins.length; j++) rows.push({ type: "insert", right: ins[j], rightNo: rn++ });
  }
  return { rows, added, removed };
}

export function unifiedText(rows: LineRow[]): string {
  return rows.flatMap((r) =>
    r.type === "equal" ? [`  ${r.left}`] : r.type === "delete" ? [`- ${r.left}`] : r.type === "insert" ? [`+ ${r.right}`] : [`- ${r.left}`, `+ ${r.right}`]
  ).join("\n");
}
