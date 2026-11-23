import { ref } from "vue";
import { ANNOUNCEMENT_STORAGE_KEY, APP_VERSION } from "../constants/release.js";

/**
 * 公告弹窗的共享可见状态。
 * 模块级单例，避免同一页面多次调用 useAnnouncement 时出现多个弹窗。
 */
const visible = ref(false);

/** 统一把存储值/版本号归一为字符串，缺失视为空字符串。 */
export function normalizeAnnouncementVersion(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * 记录的值与当前版本不一致（含未记录）时展示公告。
 * @param {string|null|undefined} storageValue 已记录的公告版本
 * @param {string} version 当前应用版本
 * @returns {boolean} 是否需要展示公告
 */
export function shouldShowAnnouncement(storageValue, version) {
  const current = normalizeAnnouncementVersion(version);
  if (!current) return false;
  return normalizeAnnouncementVersion(storageValue) !== current;
}

/**
 * 读取已记录的公告版本；存储不可用时返回空字符串。
 * @param {{ getItem: (key: string) => string | null } | null | undefined} storage
 * @returns {string} 已记录的公告版本（缺失或异常时为空字符串）
 */
export function readAnnouncementVersion(storage) {
  if (!storage || typeof storage.getItem !== "function") return "";
  try {
    return normalizeAnnouncementVersion(
      storage.getItem(ANNOUNCEMENT_STORAGE_KEY),
    );
  } catch {
    return "";
  }
}

/**
 * 把当前版本写入存储，表示“本次更新永不显示”。
 * @param {{ setItem: (key: string, value: string) => void } | null | undefined} storage
 * @param {string} version 当前应用版本
 * @returns {boolean} 是否写入成功
 */
export function dismissAnnouncement(storage, version) {
  if (!storage || typeof storage.setItem !== "function") return false;
  const current = normalizeAnnouncementVersion(version);
  if (!current) return false;
  try {
    storage.setItem(ANNOUNCEMENT_STORAGE_KEY, current);
    return true;
  } catch {
    return false;
  }
}

/** 安全获取浏览器 localStorage，隐私模式/禁用存储时返回 null。 */
function resolveDefaultStorage() {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * 公告弹窗组合式入口。
 * @param {{ storage?: object | null }} [options] 可注入存储（默认 window.localStorage）
 */
export function useAnnouncement(options = {}) {
  const storage =
    options.storage === undefined ? resolveDefaultStorage() : options.storage;

  visible.value = shouldShowAnnouncement(
    readAnnouncementVersion(storage),
    APP_VERSION,
  );

  /** 只关闭本次弹窗，不写入存储。 */
  function close() {
    visible.value = false;
  }

  /** 写入当前版本并关闭，后续同版本不再提示。 */
  function dismissForever() {
    dismissAnnouncement(storage, APP_VERSION);
    visible.value = false;
  }

  /** 依据存储重新判断是否展示（通常无需手动调用）。 */
  function refresh() {
    visible.value = shouldShowAnnouncement(
      readAnnouncementVersion(storage),
      APP_VERSION,
    );
  }

  return {
    visible,
    close,
    dismissForever,
    refresh,
  };
}
