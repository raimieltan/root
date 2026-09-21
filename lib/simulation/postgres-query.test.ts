import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { executePostgresSelect, type PostgresDatabase } from "./postgres-query";

const database: PostgresDatabase = {
  database: "finance",
  schemas: [{
    name: "public",
    tables: [
      {
        name: "projects",
        columns: [{ name: "id", type: "integer" }, { name: "name", type: "text" }],
        rows: [{ id: "17", name: "ATLAS" }, { id: "22", name: "REPORTING" }],
      },
      {
        name: "documents",
        columns: [{ name: "filename", type: "text" }, { name: "project_id", type: "integer" }, { name: "classification", type: "text" }],
        rows: [{ filename: "ATLAS.pdf", project_id: "17", classification: "CONFIDENTIAL" }, { filename: "Q3.pdf", project_id: "22", classification: "INTERNAL" }],
      },
    ],
  }],
  identities: [
    { username: "analyst", grants: [{ schema: "public", table: "projects", select: "*" }, { schema: "public", table: "documents", select: "*" }] },
    { username: "limited", grants: [{ schema: "public", table: "documents", select: ["filename"] }] },
  ],
};

describe("bounded PostgreSQL SELECT evaluator", () => {
  it("joins scenario-declared tables and filters rows", () => {
    const result = executePostgresSelect(database, "analyst", "SELECT d.filename, p.name AS project FROM documents AS d INNER JOIN projects AS p ON d.project_id = p.id WHERE d.classification = 'CONFIDENTIAL';");
    assert.deepEqual(result, {
      ok: true,
      columns: ["filename", "project"],
      rows: [["ATLAS.pdf", "ATLAS"]],
      tables: ["public.documents", "public.projects"],
    });
  });

  it("reports relation, column, ambiguity, permission, and syntax failures", () => {
    const failures = [
      ["analyst", "SELECT filename FROM missing;", /relation "missing" does not exist/],
      ["analyst", "SELECT missing FROM documents;", /column "missing" does not exist/],
      ["analyst", "SELECT id FROM projects AS p INNER JOIN projects AS q ON p.id = q.id;", /column reference "id" is ambiguous/],
      ["limited", "SELECT filename FROM projects;", /permission denied for table projects/],
      ["analyst", "DELETE FROM documents;", /syntax error at or near "DELETE"/],
    ] as const;
    for (const [username, query, expected] of failures) {
      const result = executePostgresSelect(database, username, query);
      assert.equal(result.ok, false);
      if (!result.ok) assert.match(result.error, expected);
    }
  });

  it("enforces column-level grants", () => {
    const result = executePostgresSelect(database, "limited", "SELECT classification FROM documents;");
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /permission denied for column classification/);
  });
});
