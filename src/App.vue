<template>
  <n-config-provider :theme="naiveTheme" :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-loading-bar-provider>
        <n-notification-provider>
          <n-dialog-provider>
            <div id="app">
              <router-view />
              <GameWorkspace
                v-if="gameWorkspaceVisited"
                :active="gamePageActive"
              />
              <AppAnnouncement />
              <AboutFooter v-if="showFooter" />
            </div>
          </n-dialog-provider>
        </n-notification-provider>
      </n-loading-bar-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { darkTheme } from "naive-ui";
import {
  computed,
  defineAsyncComponent,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from "vue";
import { useRoute } from "vue-router";
import AboutFooter from "@/components/AboutFooter.vue";
import AppAnnouncement from "@/components/AppAnnouncement.vue";
import {
  darkThemeOverrides,
  lightThemeOverrides,
  useTheme,
} from "@/composables/useTheme";

const route = useRoute();
const GameWorkspace = defineAsyncComponent(
  () => import("@/components/game/GameWorkspace.vue"),
);
const gameWorkspaceVisited = ref(false);
const gamePageActive = computed(() => route.meta.linkGames === true);
const showFooter = computed(
  () => route.path.startsWith("/admin") && !gamePageActive.value,
);
watch(
  gamePageActive,
  (active) => {
    if (active) gameWorkspaceVisited.value = true;
  },
  { immediate: true },
);

const { isDark, initTheme, setupSystemThemeListener, updateReactiveState } =
  useTheme();

// Naive UI 主题
const naiveTheme = computed(() => {
  return isDark.value ? darkTheme : null;
});

// Kawaii 粘土主题 token 覆盖
const themeOverrides = computed(() => {
  return isDark.value ? darkThemeOverrides : lightThemeOverrides;
});

// 监听主题变化事件
const handleThemeChange = () => {
  // 确保响应式状态同步
  updateReactiveState();
  // 强制重新渲染
  setTimeout(() => {
    updateReactiveState();
  }, 50);
};

onMounted(() => {
  initTheme();
  setupSystemThemeListener();

  // 监听自定义主题变化事件
  window.addEventListener("theme-change", handleThemeChange);

  // 初始化时更新状态
  updateReactiveState();
});

onUnmounted(() => {
  window.removeEventListener("theme-change", handleThemeChange);
});
</script>

<style>
/* 应用外壳：背景/字体/文字色统一由 global.scss 的 :root 变量与 #app 规则提供。
   此处只保留平滑过渡，不再做大面积 !important 覆盖，
   深色适配交给 Naive UI themeOverrides 与 variables.scss 的 [data-theme="dark"]。 */
#app {
  min-height: 100vh;
  font-family: var(--font-family);
  color: var(--text-primary);
  transition:
    background-color var(--transition-normal),
    color var(--transition-normal);
}
</style>
