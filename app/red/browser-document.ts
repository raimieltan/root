export type BrowserLink = { label: string; target: string };
export type BrowserField = {
  name: string;
  label: string;
  type: "text" | "password" | "select";
  options: Array<{ label: string; value: string }>;
};
export type BrowserForm = { method: "GET" | "POST"; action: string; submitLabel: string; fields: BrowserField[] };
export type BrowserDocument = { text: string; links: BrowserLink[]; forms: BrowserForm[] };

function attribute(source: string, name: string) {
  return source.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1]
    ?? source.match(new RegExp(`${name}\\s*=\\s*([^\\s>]+)`, "i"))?.[1];
}

function plainText(source: string) {
  return source
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}
function fieldLabel(formBody: string, fieldAttributes: string, name: string) {
  const id = attribute(fieldAttributes, "id");
  for (const label of formBody.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/gi)) {
    const labelFor = attribute(label[1], "for");
    const nestedControl = label[2].match(/<(?:input|select)\b([^>]*)>/i)?.[1];
    if ((id && labelFor === id) || (nestedControl && attribute(nestedControl, "name") === name)) {
      const text = plainText(label[2]);
      if (text) return text;
    }
  }
  return name.replace(/[_-]+/g, " ").replace(/^./, (character) => character.toUpperCase());
}

export function resolveBrowserTarget(currentUrl: string, target: string) {
  try {
    const base = new URL(`http://${currentUrl.replace(/^https?:\/\//i, "")}`);
    const resolved = new URL(target, base);
    if (resolved.protocol !== "http:" || resolved.host !== base.host) return undefined;
    return `${resolved.host}${resolved.pathname}${resolved.search}`;
  } catch {
    return undefined;
  }
}

export function parseBrowserDocument(body: string, currentUrl: string): BrowserDocument {
  const links: BrowserLink[] = [];
  for (const match of body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = attribute(match[1], "href");
    const target = href ? resolveBrowserTarget(currentUrl, href) : undefined;
    if (target) links.push({ label: plainText(match[2]) || target, target });
  }

  const forms: BrowserForm[] = [];
  for (const match of body.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)) {
    const actionValue = attribute(match[1], "action") ?? currentUrl;
    const action = resolveBrowserTarget(currentUrl, actionValue);
    if (!action) continue;
    const method = attribute(match[1], "method")?.toUpperCase() === "POST" ? "POST" : "GET";
    const fields: BrowserField[] = [];
    for (const input of match[2].matchAll(/<input\b([^>]*)>/gi)) {
      const name = attribute(input[1], "name");
      if (!name) continue;
      const type = attribute(input[1], "type")?.toLowerCase() === "password" ? "password" : "text";
      fields.push({ name, label: fieldLabel(match[2], input[1], name), type, options: [] });
    }
    for (const select of match[2].matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/gi)) {
      const name = attribute(select[1], "name");
      if (!name) continue;
      const options = [...select[2].matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi)].map((option) => ({
        label: plainText(option[2]),
        value: attribute(option[1], "value") ?? plainText(option[2]),
      }));
      fields.push({ name, label: fieldLabel(match[2], select[1], name), type: "select", options });
    }
    const submitLabel = plainText(match[2].match(/<button\b[^>]*>([\s\S]*?)<\/button>/i)?.[1] ?? "Submit") || "Submit";
    forms.push({ method, action, submitLabel, fields });
  }

  return { text: plainText(body), links, forms };
}
