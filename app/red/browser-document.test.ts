import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseBrowserDocument, resolveBrowserTarget } from "./browser-document";

describe("Browser document controls", () => {
  it("extracts same-host links and login fields without rendering arbitrary HTML", () => {
    const document = parseBrowserDocument([
      "<h2>Client Application</h2>",
      "<script>window.bad = true</script>",
      "<a href=\"/account\">Commissioning account</a>",
      "<a href=\"https://outside.invalid/phish\">Outside</a>",
      "<form method=\"POST\" action=\"/login\">",
      "<label>Username <input name=\"username\" type=\"text\"></label>",
      "<label>Password <input name=\"password\" type=\"password\"></label>",
      "<button>Log in</button>",
      "</form>",
    ].join("\n"), "newapp.nodeline.test");

    assert.deepEqual(document.links, [{ label: "Commissioning account", target: "newapp.nodeline.test/account" }]);
    assert.equal(document.forms[0].action, "newapp.nodeline.test/login");
    assert.equal(document.forms[0].method, "POST");
    assert.deepEqual(document.forms[0].fields.map((field) => [field.name, field.type]), [["username", "text"], ["password", "password"]]);
    assert.deepEqual(document.forms[0].fields.map((field) => field.label), ["Username", "Password"]);
    assert.equal(document.forms[0].submitLabel, "Log in");
    assert.doesNotMatch(document.text, /window\.bad/);
  });

  it("extracts bounded select options and rejects cross-host or script targets", () => {
    const document = parseBrowserDocument('<form method="POST" action="/legacy-upload"><select name="upload"><option value="archive">Archive</option></select><button>Submit</button></form>', "portal.meridian.test/path");
    assert.deepEqual(document.forms[0].fields[0].options, [{ label: "Archive", value: "archive" }]);
    assert.equal(resolveBrowserTarget("portal.meridian.test/path", "javascript:alert(1)"), undefined);
    assert.equal(resolveBrowserTarget("portal.meridian.test/path", "https://other.test/path"), undefined);
    assert.equal(resolveBrowserTarget("portal.meridian.test/path", "../account"), "portal.meridian.test/account");
  });
});
