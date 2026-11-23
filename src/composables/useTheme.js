import { onMounted, onUnmounted, ref } from "vue";
import { listenForThemeChanges } from "@/utils/themeListener.js";

// 全局响应式主题状态
const isDark = ref(false);

// ============================================================================
// Kawaii 粘土主题：Naive UI 全局 token 覆盖
// 仅使用 Naive UI 真实存在的 token，避免出现无效配置。
// ============================================================================
const FONT_FAMILY =
  '"LXGW WenKai", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"';

export const lightThemeOverrides = {
  common: {
    primaryColor: "#FF8FB1",
    primaryColorHover: "#FF7AA5",
    primaryColorPressed: "#F06C97",
    primaryColorSuppl: "#FF7AA5",

    successColor: "#7FD8A4",
    successColorHover: "#6FCE97",
    successColorPressed: "#5FBE88",
    warningColor: "#FFC966",
    warningColorHover: "#F7BE55",
    warningColorPressed: "#E9AF44",
    errorColor: "#FF8A9B",
    errorColorHover: "#F77A8C",
    errorColorPressed: "#E96A7D",
    infoColor: "#A5C9FF",
    infoColorHover: "#93BBFB",
    infoColorPressed: "#81ADF2",

    textColorBase: "#4A3B45",
    textColor1: "#4A3B45",
    textColor2: "#5E4E58",
    textColor3: "#9C8A93",
    textColorDisabled: "#CBBFC4",

    bodyColor: "#FFF8F0",
    cardColor: "#FFFFFF",
    modalColor: "#FFFFFF",
    popoverColor: "#FFFFFF",
    inputColor: "#FFFDFB",
    actionColor: "#FFF5F7",
    hoverColor: "rgba(255, 143, 177, 0.12)",

    borderColor: "rgba(255, 143, 177, 0.28)",
    dividerColor: "rgba(255, 143, 177, 0.18)",

    borderRadius: "16px",
    borderRadiusSmall: "12px",
    fontFamily: FONT_FAMILY,
    fontSize: "15px",
    lineHeight: "1.6",
    boxShadow1: "4px 4px 10px rgba(180, 130, 150, 0.16)",
    boxShadow2: "8px 8px 16px rgba(180, 130, 150, 0.18)",
    boxShadow3: "10px 12px 22px rgba(180, 130, 150, 0.22)",
  },
  Button: {
    borderRadiusTiny: "14px",
    borderRadiusSmall: "16px",
    borderRadiusMedium: "20px",
    borderRadiusLarge: "22px",
    fontWeight: "600",
    fontWeightStrong: "700",
    paddingMedium: "0 20px",
    heightMedium: "38px",
  },
  Card: {
    borderRadius: "24px",
    color: "#FFFFFF",
    colorModal: "#FFFFFF",
    colorPopover: "#FFFFFF",
    borderColor: "rgba(255, 143, 177, 0.18)",
    titleTextColor: "#4A3B45",
    textColor: "#4A3B45",
    titleFontWeight: "700",
    paddingMedium: "20px 22px",
  },
  Input: {
    borderRadius: "16px",
    color: "#FFFDFB",
    colorFocus: "#FFFFFF",
    border: "1px solid rgba(255, 143, 177, 0.28)",
    borderHover: "1px solid rgba(255, 143, 177, 0.5)",
    borderFocus: "1px solid #FF8FB1",
    boxShadowFocus: "0 0 0 3px rgba(255, 143, 177, 0.16)",
    textColor: "#4A3B45",
    placeholderColor: "#B5A6AE",
    caretColor: "#FF8FB1",
  },
  Dialog: {
    borderRadius: "28px",
    color: "#FFFFFF",
    titleTextColor: "#4A3B45",
    textColor: "#4A3B45",
    titleFontWeight: "700",
  },
};

export const darkThemeOverrides = {
  common: {
    primaryColor: "#FF9BC0",
    primaryColorHover: "#FFB3D0",
    primaryColorPressed: "#F087AC",
    primaryColorSuppl: "#FFB3D0",

    successColor: "#7FD8A4",
    successColorHover: "#8FE0B0",
    successColorPressed: "#6FCB95",
    warningColor: "#FFC966",
    warningColorHover: "#FFD37A",
    warningColorPressed: "#EFB955",
    errorColor: "#FF8A9B",
    errorColorHover: "#FF9FAE",
    errorColorPressed: "#EF7A8C",
    infoColor: "#9DBCF5",
    infoColorHover: "#AECBFB",
    infoColorPressed: "#8CACEC",

    textColorBase: "#F5EDEF",
    textColor1: "#F5EDEF",
    textColor2: "#E4D9DF",
    textColor3: "#B3A3B0",
    textColorDisabled: "#6F6070",

    bodyColor: "#251E30",
    cardColor: "#3A3045",
    modalColor: "#3A3045",
    popoverColor: "#453A52",
    inputColor: "#312839",
    actionColor: "#453A52",
    hoverColor: "rgba(255, 155, 192, 0.16)",

    borderColor: "rgba(255, 255, 255, 0.14)",
    dividerColor: "rgba(255, 255, 255, 0.08)",

    borderRadius: "16px",
    borderRadiusSmall: "12px",
    fontFamily: FONT_FAMILY,
    fontSize: "15px",
    lineHeight: "1.6",
    boxShadow1: "4px 4px 10px rgba(0, 0, 0, 0.35)",
    boxShadow2: "8px 8px 16px rgba(0, 0, 0, 0.35)",
    boxShadow3: "10px 12px 22px rgba(0, 0, 0, 0.42)",
  },
  Button: {
    borderRadiusTiny: "14px",
    borderRadiusSmall: "16px",
    borderRadiusMedium: "20px",
    borderRadiusLarge: "22px",
    fontWeight: "600",
    fontWeightStrong: "700",
    paddingMedium: "0 20px",
    heightMedium: "38px",
  },
  Card: {
    borderRadius: "24px",
    color: "#3A3045",
    colorModal: "#3A3045",
    colorPopover: "#453A52",
    borderColor: "rgba(255, 255, 255, 0.08)",
    titleTextColor: "#F5EDEF",
    textColor: "#F5EDEF",
    titleFontWeight: "700",
    paddingMedium: "20px 22px",
  },
  Input: {
    borderRadius: "16px",
    color: "#312839",
    colorFocus: "#3A3045",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    borderHover: "1px solid rgba(255, 155, 192, 0.45)",
    borderFocus: "1px solid #FF9BC0",
    boxShadowFocus: "0 0 0 3px rgba(255, 155, 192, 0.2)",
    textColor: "#F5EDEF",
    placeholderColor: "#93838F",
    caretColor: "#FF9BC0",
  },
  Dialog: {
    borderRadius: "28px",
    color: "#3A3045",
    titleTextColor: "#F5EDEF",
    textColor: "#F5EDEF",
    titleFontWeight: "700",
  },
};

// 检查当前主题状态
const checkCurrentTheme = () => {
  return (
    document.documentElement.classList.contains("dark") ||
    document.documentElement.getAttribute("data-theme") === "dark"
  );
};

// 更新响应式状态
const updateReactiveState = () => {
  isDark.value = checkCurrentTheme();
};

/**
 * Share reactive theme state while owning each instance's DOM and media listeners.
 * @returns {object} Theme state, setters, initialization and listener setup functions.
 */
export function useTheme() {
  let mutationObserver = null;
  let removeSystemThemeListener = null;

  // 初始化主题
  const initTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setDarkTheme();
    } else {
      setLightTheme();
    }

    // 立即更新响应式状态
    updateReactiveState();
  };

  // 设置深色主题
  const setDarkTheme = () => {
    document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-theme", "dark");
    document.body.classList.add("dark");
    document.body.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");

    // 立即更新响应式状态
    isDark.value = true;

    // 触发主题更新事件
    window.dispatchEvent(
      new CustomEvent("theme-change", { detail: { isDark: true } }),
    );
  };

  // 设置浅色主题
  const setLightTheme = () => {
    document.documentElement.classList.remove("dark");
    document.documentElement.removeAttribute("data-theme");
    document.body.classList.remove("dark");
    document.body.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");

    // 立即更新响应式状态
    isDark.value = false;

    // 触发主题更新事件
    window.dispatchEvent(
      new CustomEvent("theme-change", { detail: { isDark: false } }),
    );
  };

  // 切换主题
  const toggleTheme = () => {
    if (isDark.value) {
      setLightTheme();
    } else {
      setDarkTheme();
    }
  };

  // 监听系统主题变化
  /** Register one system-theme listener per composable instance. */
  const setupSystemThemeListener = () => {
    removeSystemThemeListener?.();
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!localStorage.getItem("theme")) initTheme();
    };
    removeSystemThemeListener = listenForThemeChanges(mediaQuery, onChange);
  };

  // 设置DOM变化监听器（确保响应式状态同步）
  const setupDOMObserver = () => {
    if (typeof window !== "undefined") {
      mutationObserver = new MutationObserver(() => {
        updateReactiveState();
      });

      // 监听documentElement和body的变化
      mutationObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      });

      mutationObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      });
    }
  };

  // 清理监听器
  const cleanup = () => {
    removeSystemThemeListener?.();
    removeSystemThemeListener = null;
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
  };

  // 获取当前主题
  const getCurrentTheme = () => {
    return isDark.value ? "dark" : "light";
  };

  // 组件挂载时初始化
  onMounted(() => {
    setupDOMObserver();
    updateReactiveState();
  });

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup();
  });

  return {
    isDark,
    initTheme,
    toggleTheme,
    setDarkTheme,
    setLightTheme,
    setupSystemThemeListener,
    getCurrentTheme,
    updateReactiveState,
  };
}
