import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const runtimeDir = new URL("../public/game-runtime/", import.meta.url);

function read(name) {
  return readFileSync(new URL(name, runtimeDir), "utf8");
}

test("unified script center replaces the old custom panel", () => {
  assert.equal(existsSync(new URL("script-center.js", runtimeDir)), true);
  assert.equal(existsSync(new URL("custom-script.js", runtimeDir)), false);
});

test("script center has no eval-like execution, innerHTML or external fetch", () => {
  const source = read("script-center.js");
  for (const forbidden of [
    /\beval\s*\(/,
    /new\s+Function\s*\(/,
    /innerHTML/,
    /document\.write/,
    /fetch\s*\(/,
    /XMLHttpRequest/,
    /https?:\/\//,
  ]) {
    assert.doesNotMatch(source, forbidden, `forbidden pattern ${forbidden}`);
  }
  assert.match(source, /new Blob\(/);
  assert.match(source, /URL\.createObjectURL/);
  assert.match(source, /data-xyzw-user-id/);
  assert.match(source, /FileReader/);
  assert.match(source, /indexedDB/);
});

test("script center has no upload size cap and persists large scripts in IndexedDB", () => {
  const source = read("script-center.js");
  assert.doesNotMatch(source, /MAX_SIZE|1\s*\*\s*1024\s*\*\s*1024|1 MiB|1MiB/);
  assert.match(source, /DB_NAME\s*=\s*"xyzw_script_center"/);
  assert.match(source, /DB_STORE\s*=\s*"scripts"/);
  assert.match(source, /readAsText\(file, "utf-8"\)/);
  assert.match(source, /QuotaExceededError/);
});

test("script center merges built-in and custom scripts with enable and unload", () => {
  const source = read("script-center.js");
  for (const file of ["3.js", "5.js", "6.js", "7.js", "8自适应版.js"]) {
    assert.match(source, new RegExp(file.replace(".", "\\.")), `${file} built-in`);
  }
  assert.match(source, /BUILTIN_KEY/);
  assert.match(source, /importFiles/);
  assert.match(source, /uninstallCustom/);
  assert.match(source, /location\.reload/);
  assert.match(source, /__gsjcBridge/);
  assert.match(source, /showConfirm/);
});

test("4.js exposes the bridge and yields its legacy UI to the script center", () => {
  const source = read("4.js");
  assert.match(source, /window\.__gsjcBridge\s*=/);
  assert.match(source, /load:\s*function/);
  assert.match(source, /isLoaded:\s*function/);
  assert.match(source, /__xyzwScriptCenterActive/);
  assert.match(source, /setTimeout\(function \(\) \{/);
});

test("runtime boots the unified center after 4.js and before the engine", () => {
  const source = read("runtime.js");
  assert.match(source, /"script-center\.js"/);
  assert.doesNotMatch(source, /"custom-script\.js"/);
  const boot = source.match(/for \(const src of \[([^\]]+)\]\)/);
  assert.ok(boot, "boot list exists");
  const list = boot[1].split(",").map((item) => item.trim().replace(/^"|"$/g, ""));
  assert.ok(list.indexOf("script-center.js") > list.indexOf("4.js"));
  assert.ok(list.indexOf("script-center.js") < list.indexOf("cocos2d-js-min.js"));
});

test("cache-busting version covers 4.js and the unified center", () => {
  const runtime = read("runtime.js");
  const index = read("index.html");
  assert.match(runtime, /\?v=20261123\.2/);
  assert.match(index, /runtime\.js\?v=20261123\.2/);
});
