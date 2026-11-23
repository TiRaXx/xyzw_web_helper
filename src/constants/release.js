export const APP_VERSION = "0.2.0";
export const APP_VERSION_LABEL = "v0.2";
export const APP_NAME = "战魂小助手";

export const ANNOUNCEMENT_STORAGE_KEY =
  "zhanhun:announcement:dismissed-version";

export const CURRENT_ANNOUNCEMENT = {
  version: APP_VERSION,
  label: APP_VERSION_LABEL,
  title: "战魂小助手 v0.2 全新改版",
  intro:
    "从最初 v0.1 的基础 Token 工具，升级为俱乐部日常使用的多窗口游戏助手。",
  items: [
    {
      icon: "🪟",
      title: "多窗口游戏工作区",
      text: "多个账号可并排游戏，切换角色、查看状态更顺手。",
    },
    {
      icon: "🧩",
      title: "统一脚本中心",
      text: "内置脚本与自定义 JS 合并管理，支持启停、卸载和持久化。",
    },
    {
      icon: "🛡️",
      title: "安全与稳定性",
      text: "Token 日志脱敏、缓存键去明文，资源代理边界更清晰。",
    },
    {
      icon: "🌸",
      title: "Kawaii 粘土拟态界面",
      text: "全新软萌视觉、深浅双主题，操作反馈更轻快。",
    },
    {
      icon: "💬",
      title: "关于与联系入口",
      text: "新增关于页和「有问题联系小雪」入口，反馈更方便。",
    },
  ],
  note:
    "「关闭」只关闭本次弹窗；「本次更新永不显示」仅对 v0.2 生效，后续新版本会再次提示。",
};

export const ORIGINAL_PROJECT = {
  name: "w1249178256/xyzw_web_helper",
  url: "https://github.com/w1249178256/xyzw_web_helper",
  license: "CC BY-NC-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};
