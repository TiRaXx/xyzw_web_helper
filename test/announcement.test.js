import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  dismissAnnouncement,
  readAnnouncementVersion,
  shouldShowAnnouncement,
} from "../src/composables/useAnnouncement.js";
import {
  ANNOUNCEMENT_STORAGE_KEY,
  APP_VERSION,
} from "../src/constants/release.js";

function createStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
  };
}

test("无存储记录时展示公告", () => {
  const storage = createStorage();
  assert.equal(
    shouldShowAnnouncement(readAnnouncementVersion(storage), APP_VERSION),
    true,
  );
});

test("记录的是旧版本时展示公告", () => {
  const storage = createStorage({ [ANNOUNCEMENT_STORAGE_KEY]: "0.1.0" });
  assert.equal(
    shouldShowAnnouncement(readAnnouncementVersion(storage), APP_VERSION),
    true,
  );
});

test("记录的是当前版本时不展示公告", () => {
  const storage = createStorage({ [ANNOUNCEMENT_STORAGE_KEY]: APP_VERSION });
  assert.equal(
    shouldShowAnnouncement(readAnnouncementVersion(storage), APP_VERSION),
    false,
  );
});

test("dismissAnnouncement 写入当前版本并关闭", () => {
  const storage = createStorage();
  assert.equal(dismissAnnouncement(storage, APP_VERSION), true);
  assert.equal(storage.getItem(ANNOUNCEMENT_STORAGE_KEY), APP_VERSION);
  assert.equal(
    shouldShowAnnouncement(readAnnouncementVersion(storage), APP_VERSION),
    false,
  );
});

test("版本升级后即使上次永不显示也会再次展示", () => {
  const storage = createStorage();
  dismissAnnouncement(storage, APP_VERSION);
  const nextVersion = `${APP_VERSION}-next`;
  assert.equal(
    shouldShowAnnouncement(readAnnouncementVersion(storage), nextVersion),
    true,
  );
});

test("存储异常时不抛出且安全降级", () => {
  const broken = {
    getItem() {
      throw new Error("storage disabled");
    },
    setItem() {
      throw new Error("storage disabled");
    },
  };
  assert.doesNotThrow(() => readAnnouncementVersion(broken));
  assert.equal(readAnnouncementVersion(broken), "");
  assert.equal(dismissAnnouncement(broken, APP_VERSION), false);
  assert.equal(
    shouldShowAnnouncement(readAnnouncementVersion(broken), APP_VERSION),
    true,
  );
});

test("存储对象缺失时视为没有记录", () => {
  assert.equal(readAnnouncementVersion(null), "");
  assert.equal(readAnnouncementVersion(undefined), "");
  assert.equal(dismissAnnouncement(null, APP_VERSION), false);
  assert.equal(shouldShowAnnouncement(null, APP_VERSION), true);
});

test("公告版本与 package.json 版本保持同步", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(APP_VERSION, pkg.version);
});

test("App.vue 只挂载一次公告，且公告提供两个关闭选项", () => {
  const app = readFileSync(new URL("../src/App.vue", import.meta.url), "utf8");
  const component = readFileSync(
    new URL("../src/components/AppAnnouncement.vue", import.meta.url),
    "utf8",
  );
  assert.equal((app.match(/<AppAnnouncement\s*\/>/g) || []).length, 1);
  assert.match(component, /关闭/);
  assert.match(component, /本次更新永不显示/);
});
