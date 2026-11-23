<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="isDark ? '切换到浅色主题' : '切换到深色主题'"
    :title="isDark ? '切换到浅色主题' : '切换到深色主题'"
    @click="toggleTheme"
  >
    <n-icon :size="20" class="theme-toggle__icon">
      <Sunny v-if="isDark" />
      <Moon v-else />
    </n-icon>
  </button>
</template>

<script setup>
import { Moon, Sunny } from "@vicons/ionicons5";
import { useTheme } from "@/composables/useTheme";

const { isDark, toggleTheme } = useTheme();
</script>

<style scoped lang="scss">
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  color: var(--primary-color);
  cursor: pointer;
  background: var(--bg-secondary);
  border: var(--clay-border);
  border-radius: var(--radius-circle);
  box-shadow: var(--clay-shadow-sm);
  transition:
    transform var(--transition-normal),
    background-color var(--transition-fast),
    color var(--transition-fast),
    box-shadow var(--transition-normal);

  &:hover {
    color: var(--primary-color-hover);
    background: var(--bg-tertiary);
    box-shadow: var(--clay-shadow);
    // Q 弹：轻微上浮 + 放大
    transform: translateY(-2px) scale(1.08);
  }

  &:active {
    box-shadow: var(--clay-shadow-inset);
    transform: scale(0.92);
    transition-duration: 0.1s;
  }

  &__icon {
    transition: transform var(--transition-normal);
  }

  &:hover &__icon {
    transform: rotate(-12deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .theme-toggle,
  .theme-toggle__icon {
    transition: none;
  }

  .theme-toggle:hover,
  .theme-toggle:active,
  .theme-toggle:hover .theme-toggle__icon {
    transform: none;
  }
}
</style>
