/* ============================================================================
 * A tiny, dependency-free YAML reader — just enough for this site's content.
 * Shared by tools/build-i18n.mjs and tools/build-workshop.mjs.
 *
 * Supports the friendly subset we actually author:
 *   - nested maps (indent children by 2 spaces)
 *   - lists  ( "- item"  or  "- key: value" mapping items )
 *   - plain and "quoted" scalars
 *   - block scalars:  |  keeps line breaks,  >  folds them into spaces
 *   - # comments and blank lines
 *
 * It is NOT a full YAML implementation — keep the content files simple.
 * ========================================================================== */

function indentOf(line) {
  return line.length - line.replace(/^ +/, "").length;
}

function stripQuotes(v) {
  if (v.length >= 2 && /^(".*"|'.*')$/.test(v)) return v.slice(1, -1);
  return v;
}

function nextSignificant(lines, i) {
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === "" || t.startsWith("#")) { i++; continue; }
    return i;
  }
  return -1;
}

// Collect a "|" / ">" block scalar. ctx.i points at the first body line.
function readBlock(lines, ctx, keyIndent, fold) {
  const body = [];
  while (ctx.i < lines.length) {
    const bl = lines[ctx.i];
    if (bl.trim() !== "" && indentOf(bl) <= keyIndent) break;
    body.push(bl);
    ctx.i++;
  }
  const nonEmpty = body.filter((l) => l.trim() !== "");
  const base = nonEmpty.length ? Math.min(...nonEmpty.map(indentOf)) : 0;
  const cleaned = body.map((l) => (l.trim() === "" ? "" : l.slice(base)));
  while (cleaned.length && cleaned[cleaned.length - 1] === "") cleaned.pop();

  if (!fold) return cleaned.join("\n");
  let out = "";
  for (const cur of cleaned) {
    if (cur === "") out += "\n";
    else out += (out && !out.endsWith("\n") ? " " : "") + cur;
  }
  return out;
}

const MAP_ITEM = /^[^\s:][^:]*:(\s|$)/; // "key:" or "key: value"

// Parse a map or list whose entries all sit at `indent`. Type is inferred
// from the first entry ("- " → list, otherwise map).
function parseContainer(lines, ctx, indent) {
  let result = null;

  while (true) {
    const i = nextSignificant(lines, ctx.i);
    if (i === -1) { ctx.i = lines.length; break; }
    const ind = indentOf(lines[i]);
    if (ind < indent) break; // belongs to an ancestor container
    ctx.i = i;
    const content = lines[i].trim();

    if (content === "-" || content.startsWith("- ")) {
      if (result === null) result = [];
      const after = content === "-" ? "" : content.slice(2);
      const itemIndent = ind + 2;
      if (after === "") {
        ctx.i = i + 1;
        result.push(parseContainer(lines, ctx, itemIndent));
      } else if (MAP_ITEM.test(after)) {
        // Drop the "- " so the first key lines up under itemIndent, then
        // parse the item as a normal map (this line + its continuations).
        lines[i] = lines[i].replace(/^(\s*)-\s/, "$1  ");
        result.push(parseContainer(lines, ctx, itemIndent));
      } else {
        result.push(stripQuotes(after));
        ctx.i = i + 1;
      }
      continue;
    }

    // Mapping entry: "key: value"
    if (result === null) result = {};
    const colon = content.indexOf(":");
    if (colon === -1) { ctx.i = i + 1; continue; }
    const key = content.slice(0, colon).trim();
    const value = content.slice(colon + 1).trim();
    const block = value.match(/^([|>])([+-]?)$/);

    if (block) {
      ctx.i = i + 1;
      result[key] = readBlock(lines, ctx, ind, block[1] === ">");
    } else if (value === "") {
      ctx.i = i + 1;
      const j = nextSignificant(lines, ctx.i);
      if (j !== -1 && indentOf(lines[j]) > ind) {
        result[key] = parseContainer(lines, ctx, indentOf(lines[j]));
      } else {
        result[key] = "";
      }
    } else {
      result[key] = stripQuotes(value);
      ctx.i = i + 1;
    }
  }

  return result === null ? {} : result;
}

export function parseYaml(text) {
  const lines = text.replace(/^﻿/, "").replace(/\r\n/g, "\n").split("\n");
  return parseContainer(lines, { i: 0 }, 0);
}

// Flatten nested groups into dotted keys (e.g. about.title). Lists are left
// as-is (i18n has none; workshop uses its nested shape directly).
export function flatten(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? prefix + "." + k : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}
