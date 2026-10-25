import { describe, it, expect } from "vitest";
import { processJson, positionToLineCol } from "../lib/json";
import { jsonToCsv, csvToJson, parseCsv } from "../lib/csv";
import { encodeBase64, decodeBase64 } from "../lib/base64";
import { diffLines, diffTokens, unifiedText } from "../lib/diff";
import { stats, transforms } from "../lib/text";
import { runRegex } from "../lib/regex";
import { hashText } from "../lib/hash";
import { buildDocument } from "../lib/playground";

describe("json", () => {
  it("formats and minifies", () => {
    expect(processJson('{"a":1,"b":[1,2]}', "format")).toEqual({ ok: true, output: '{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}' });
    expect(processJson('{ "a" : 1 }', "minify")).toEqual({ ok: true, output: '{"a":1}' });
  });
  it("reports errors with line/column", () => {
    const r = processJson('{\n  "a": 1,\n  "b": }', "format");
    expect(r.ok).toBe(false);
    if (!r.ok) { expect(r.line).toBe(3); expect(r.column).toBeGreaterThan(1); }
  });
  it("empty input", () => expect(processJson("  ", "format").ok).toBe(false));
  it("line/col", () => expect(positionToLineCol("ab\ncd", 4)).toEqual({ line: 2, column: 2 }));
});

describe("csv", () => {
  it("json -> csv quoting", () => {
    const { csv } = jsonToCsv(JSON.stringify([{ a: 'he said "hi"', b: "x,y", c: "line1\nline2" }]));
    expect(csv).toBe('a,b,c\r\n"he said ""hi""","x,y","line1\nline2"');
  });
  it("flattens nested with note", () => {
    const r = jsonToCsv(JSON.stringify([{ a: { b: 1 }, t: [1, 2] }]));
    expect(r.csv.split("\r\n")[0]).toBe("a.b,t.0,t.1");
    expect(r.notes.length).toBe(1);
  });
  it("union of headers", () => expect(jsonToCsv('[{"a":1},{"b":2}]').csv).toBe("a,b\r\n1,\r\n,2"));
  it("rejects primitives", () => expect(() => jsonToCsv("5")).toThrow());
  it("parses quoted newlines and escaped quotes", () => {
    expect(parseCsv('a,b\r\n"x\ny","q""q"\n')).toEqual([["a", "b"], ["x\ny", 'q"q']]);
  });
  it("csv -> json round trip", () => {
    const src = [{ a: 'he said "hi"', b: "x,y", c: "l1\nl2" }];
    expect(JSON.parse(csvToJson(jsonToCsv(JSON.stringify(src)).csv))).toEqual(src);
  });
  it("type inference", () => expect(JSON.parse(csvToJson("n,b\n1.5,true", ",", true))).toEqual([{ n: 1.5, b: true }]));
  it("unterminated quote", () => expect(() => parseCsv('a\n"oops')).toThrow(/Unterminated/));
  it("semicolon delimiter", () => expect(parseCsv("a;b\n1;2", ";")).toEqual([["a", "b"], ["1", "2"]]));
});

describe("base64", () => {
  it("utf-8 round trip", () => {
    for (const s of ["hello", "مرحبا", "Žiga čšž", "emoji 🚀👩‍💻", ""]) expect(decodeBase64(encodeBase64(s))).toBe(s);
  });
  it("known vector", () => { expect(encodeBase64("Man")).toBe("TWFu"); expect(encodeBase64("€")).toBe("4oKs"); });
  it("url safe", () => expect(decodeBase64(encodeBase64("??>>", true))).toBe("??>>"));
  it("invalid char", () => expect(() => decodeBase64("ab$c")).toThrow(/Invalid Base64 character/));
  it("binary not utf8", () => expect(() => decodeBase64("/w==")).toThrow(/UTF-8/));
});

describe("diff", () => {
  it("token diff", () => {
    const ops = diffTokens(["a", "b", "c"], ["a", "x", "c"]);
    expect(ops.map((o) => o.type)).toEqual(["equal", "delete", "insert", "equal"]);
  });
  it("line diff counts", () => {
    const r = diffLines("one\ntwo\nthree", "one\n2\nthree\nfour");
    expect(r.added).toBe(2); expect(r.removed).toBe(1);
    expect(r.rows.map((x) => x.type)).toEqual(["equal", "change", "equal", "insert"]);
    expect(unifiedText(r.rows)).toBe("  one\n- two\n+ 2\n  three\n+ four");
  });
  it("identical", () => expect(diffLines("a\nb", "a\nb").added).toBe(0));
  it("inline word changes", () => {
    const r = diffLines("let x = 1;", "let y = 1;");
    expect(r.rows[0].inline!.left.find((o) => o.type === "delete")!.value).toBe("x");
  });
});

describe("text", () => {
  it("stats unicode-safe", () => {
    const s = stats("héllo 👩‍💻 world\nline2");
    expect(s.lines).toBe(2); expect(s.words).toBe(3);
    expect(s.characters).toBe(19);
  });
  it("cases", () => {
    expect(transforms.camel("hello big world")).toBe("helloBigWorld");
    expect(transforms.snake("helloBigWorld")).toBe("hello_big_world");
    expect(transforms.kebab("Hello Big World")).toBe("hello-big-world");
    expect(transforms.pascal("hello world")).toBe("HelloWorld");
    expect(transforms.title("hello wORLD")).toBe("Hello World");
    expect(transforms.sentence("hi. how ARE you")).toBe("Hi. How are you");
    expect(transforms.upper("straße")).toBe("STRASSE");
  });
  it("whitespace", () => {
    expect(transforms.collapseSpaces("  a   b \n\n\n\nc  ")).toBe("a b\n\nc");
    expect(transforms.trimLines("  a \n b")).toBe("a\nb");
    expect(transforms.removeEmptyLines("a\n\n \nb")).toBe("a\nb");
    expect(transforms.reverse("ab👩‍💻")).toBe("👩‍💻ba");
  });
});

describe("regex", () => {
  it("global matches + groups", () => {
    const r = runRegex("(\\w+)@(?<d>\\w+)\\.com", "g", "a@x.com b@y.com");
    expect(r.ok && r.matches.length).toBe(2);
    if (r.ok) { expect(r.matches[1].groups).toEqual(["b", "y"]); expect(r.matches[0].named).toEqual({ d: "x" }); }
  });
  it("non-global one match", () => { const r = runRegex("a", "", "aaa"); expect(r.ok && r.matches.length).toBe(1); });
  it("empty matches don't loop", () => { const r = runRegex("x*", "g", "abc"); expect(r.ok && r.matches.length).toBe(4); });
  it("invalid pattern", () => expect(runRegex("(", "", "").ok).toBe(false));
  it("invalid flag", () => expect(runRegex("a", "z", "").ok).toBe(false));
  it("limit", () => { const r = runRegex(".", "g", "x".repeat(100), 10); expect(r.ok && r.truncated).toBe(true); });
});

describe("hash", () => {
  it("known vectors", async () => {
    expect(await hashText("abc", "SHA-256")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(await hashText("", "SHA-256")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(await hashText("abc", "SHA-384")).toBe("cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7");
    expect(await hashText("abc", "SHA-512")).toBe("ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f");
  });
});

describe("playground", () => {
  it("escapes script close and adds CSP", () => {
    const d = buildDocument("<p>x</p>", "p{}", "console.log('</script>')");
    expect(d).not.toContain("log('</script>')");
    expect(d).toContain("Content-Security-Policy");
  });
});
import { locateError } from "../lib/json";
describe("json locator", () => {
  it("finds positions", () => {
    expect(locateError('{"a":1,}')).toBe(7);
    expect(locateError('[1,2')).toBe(4);
    expect(locateError('{"a":tru}')).toBe(5);
    expect(locateError('{"a":[1,{"b":"x"}]}')).toBeUndefined();
  });
});

import { CHAT_SYSTEM, parseInline } from "../lib/chatPrompt";
describe("chat widget prompt", () => {
  it("lists all 8 tools, studio and builder", () => {
    for (const s of ["/tools/json-formatter", "/tools/hash", "/tools/regex", "/studio", "/builder"]) expect(CHAT_SYSTEM).toContain(s);
  });
  it("parses links", () => { expect(parseInline("see [Regex](/tools/regex) now")[1]).toEqual({ t: "link", v: "Regex", href: "/tools/regex" }); });
});
