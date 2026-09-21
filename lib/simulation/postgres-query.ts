import type { ScenarioDatabaseColumn, ScenarioDatabaseGrant, ScenarioDatabaseTable } from "./scenarios/types";

export type PostgresDatabase = {
  database: string;
  schemas: Array<{ name: string; tables: ScenarioDatabaseTable[] }>;
  identities: Array<{ username: string; grants: ScenarioDatabaseGrant[] }>;
};

export type PostgresQueryResult =
  | { ok: false; error: string }
  | { ok: true; columns: string[]; rows: string[][]; tables: string[] };

type BoundTable = {
  schema: string;
  table: ScenarioDatabaseTable;
  alias: string;
  grant: ScenarioDatabaseGrant;
};

type RowContext = Record<string, Record<string, string>>;

const IDENTIFIER = "[A-Za-z_][A-Za-z0-9_]*";
const RELATION = `${IDENTIFIER}(?:\\.${IDENTIFIER})?`;
const REFERENCE = `${IDENTIFIER}(?:\\.${IDENTIFIER})?`;

function relationParts(value: string) {
  const parts = value.split(".");
  return parts.length === 2 ? { schema: parts[0], table: parts[1] } : { schema: "public", table: parts[0] };
}

function syntaxError(input: string) {
  const token = input.trim().split(/\s+/)[0]?.replace(/;$/, "") || "end of input";
  return `ERROR:  syntax error at or near "${token}"\nLINE 1: ${input}\n        ^`;
}

function bindTable(database: PostgresDatabase, username: string, relation: string, alias?: string): BoundTable | string {
  const { schema, table } = relationParts(relation);
  const declared = database.schemas.find((entry) => entry.name.toLowerCase() === schema.toLowerCase())
    ?.tables.find((entry) => entry.name.toLowerCase() === table.toLowerCase());
  if (!declared) return `ERROR:  relation "${relation}" does not exist`;
  const grant = database.identities.find((identity) => identity.username === username)?.grants.find((entry) => entry.schema.toLowerCase() === schema.toLowerCase() && entry.table.toLowerCase() === table.toLowerCase());
  if (!grant) return `ERROR:  permission denied for table ${table}`;
  return { schema, table: declared, alias: alias ?? table, grant };
}

function columnDefinition(bound: BoundTable, column: string): ScenarioDatabaseColumn | undefined {
  return bound.table.columns.find((entry) => entry.name.toLowerCase() === column.toLowerCase());
}

function canSelect(bound: BoundTable, column: string) {
  return bound.grant.select === "*" || bound.grant.select.some((entry) => entry.toLowerCase() === column.toLowerCase());
}

function resolveReference(reference: string, tables: BoundTable[]): { table: BoundTable; column: ScenarioDatabaseColumn } | string {
  const parts = reference.split(".");
  if (parts.length === 2) {
    const table = tables.find((entry) => entry.alias.toLowerCase() === parts[0].toLowerCase() || entry.table.name.toLowerCase() === parts[0].toLowerCase());
    if (!table) return `ERROR:  missing FROM-clause entry for table "${parts[0]}"`;
    const column = columnDefinition(table, parts[1]);
    if (!column) return `ERROR:  column ${reference} does not exist`;
    if (!canSelect(table, column.name)) return `ERROR:  permission denied for column ${column.name}`;
    return { table, column };
  }
  const matches = tables.flatMap((table) => {
    const column = columnDefinition(table, parts[0]);
    return column ? [{ table, column }] : [];
  });
  if (!matches.length) return `ERROR:  column "${parts[0]}" does not exist`;
  if (matches.length > 1) return `ERROR:  column reference "${parts[0]}" is ambiguous`;
  if (!canSelect(matches[0].table, matches[0].column.name)) return `ERROR:  permission denied for column ${matches[0].column.name}`;
  return matches[0];
}

function valueFor(context: RowContext, resolved: { table: BoundTable; column: ScenarioDatabaseColumn }) {
  return context[resolved.table.alias]?.[resolved.column.name] ?? "";
}

function parseLiteral(value: string) {
  const trimmed = value.trim();
  if (/^'.*'$/.test(trimmed)) return trimmed.slice(1, -1).replace(/''/g, "'");
  if (/^-?\d+$/.test(trimmed)) return trimmed;
  return undefined;
}

export function executePostgresSelect(database: PostgresDatabase, username: string, input: string): PostgresQueryResult {
  const statement = input.trim().replace(/;\s*$/, "");
  const select = statement.match(new RegExp(`^SELECT\\s+(.+?)\\s+FROM\\s+(${RELATION})(?:\\s+AS\\s+(${IDENTIFIER}))?(.*)$`, "i"));
  if (!select) return { ok: false, error: syntaxError(input) };

  const first = bindTable(database, username, select[2], select[3]);
  if (typeof first === "string") return { ok: false, error: first };
  const tables: BoundTable[] = [first];
  const joins: Array<{ left: string; right: string }> = [];
  let remainder = select[4].trim();
  while (/^(?:INNER\s+)?JOIN\s+/i.test(remainder)) {
    const join = remainder.match(new RegExp(`^(?:INNER\\s+)?JOIN\\s+(${RELATION})(?:\\s+AS\\s+(${IDENTIFIER}))?\\s+ON\\s+(${REFERENCE})\\s*=\\s*(${REFERENCE})(.*)$`, "i"));
    if (!join) return { ok: false, error: syntaxError(input) };
    const bound = bindTable(database, username, join[1], join[2]);
    if (typeof bound === "string") return { ok: false, error: bound };
    if (tables.some((entry) => entry.alias.toLowerCase() === bound.alias.toLowerCase())) return { ok: false, error: `ERROR:  table name "${bound.alias}" specified more than once` };
    tables.push(bound);
    joins.push({ left: join[3], right: join[4] });
    remainder = join[5].trim();
  }

  let where: { reference: string; literal: string } | undefined;
  if (remainder) {
    const match = remainder.match(new RegExp(`^WHERE\\s+(${REFERENCE})\\s*=\\s*(.+)$`, "i"));
    const literal = match ? parseLiteral(match[2]) : undefined;
    if (!match || literal === undefined) return { ok: false, error: syntaxError(input) };
    where = { reference: match[1], literal };
  }

  const resolvedJoins: Array<{ left: { table: BoundTable; column: ScenarioDatabaseColumn }; right: { table: BoundTable; column: ScenarioDatabaseColumn } }> = [];
  for (const join of joins) {
    const left = resolveReference(join.left, tables);
    if (typeof left === "string") return { ok: false, error: left };
    const right = resolveReference(join.right, tables);
    if (typeof right === "string") return { ok: false, error: right };
    resolvedJoins.push({ left, right });
  }

  const projectionParts = select[1].split(",").map((entry) => entry.trim());
  const projections: Array<{ label: string; resolved: { table: BoundTable; column: ScenarioDatabaseColumn } }> = [];
  if (projectionParts.length === 1 && projectionParts[0] === "*") {
    for (const table of tables) for (const column of table.table.columns) {
      if (canSelect(table, column.name)) projections.push({ label: column.name, resolved: { table, column } });
    }
  } else {
    for (const part of projectionParts) {
      const projection = part.match(new RegExp(`^(${REFERENCE})(?:\\s+AS\\s+(${IDENTIFIER}))?$`, "i"));
      if (!projection) return { ok: false, error: syntaxError(input) };
      const resolved = resolveReference(projection[1], tables);
      if (typeof resolved === "string") return { ok: false, error: resolved };
      projections.push({ label: projection[2] ?? resolved.column.name, resolved });
    }
  }

  let resolvedWhere: { resolved: { table: BoundTable; column: ScenarioDatabaseColumn }; literal: string } | undefined;
  if (where) {
    const resolved = resolveReference(where.reference, tables);
    if (typeof resolved === "string") return { ok: false, error: resolved };
    resolvedWhere = { resolved, literal: where.literal };
  }

  let contexts: RowContext[] = first.table.rows.map((row) => ({ [first.alias]: row }));
  for (let index = 1; index < tables.length; index += 1) {
    const table = tables[index];
    contexts = contexts.flatMap((context) => table.table.rows.map((row) => ({ ...context, [table.alias]: row })));
  }
  contexts = contexts.filter((context) => resolvedJoins.every((join) => valueFor(context, join.left) === valueFor(context, join.right)));
  if (resolvedWhere) contexts = contexts.filter((context) => valueFor(context, resolvedWhere.resolved) === resolvedWhere.literal);

  return {
    ok: true,
    columns: projections.map((entry) => entry.label),
    rows: contexts.map((context) => projections.map((entry) => valueFor(context, entry.resolved))),
    tables: tables.map((entry) => `${entry.schema}.${entry.table.name}`),
  };
}
