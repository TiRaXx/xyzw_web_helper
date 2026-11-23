<template>
  <Teleport to="body">
    <Transition name="announce">
      <div v-if="visible" class="announcement-overlay">
        <section
          ref="cardRef"
          class="announcement-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-announcement-title"
          aria-describedby="app-announcement-intro"
          tabindex="-1"
        >
          <div class="announcement-deco" aria-hidden="true">
            <span class="deco deco--primary" />
            <span class="deco deco--secondary" />
            <span class="deco deco--dot" />
          </div>

          <header class="announcement-header">
            <span class="version-pill">{{ announcement.label }}</span>
            <h2 id="app-announcement-title" class="announcement-title">
              {{ announcement.title }}
            </h2>
            <p id="app-announcement-intro" class="announcement-intro">
              {{ announcement.intro }}
            </p>
          </header>

          <ul class="announcement-list">
            <li
              v-for="item in announcement.items"
              :key="item.title"
              class="announcement-item"
            >
              <span class="item-icon" aria-hidden="true">{{ item.icon }}</span>
              <div class="item-body">
                <h3 class="item-title">{{ item.title }}</h3>
                <p class="item-text">{{ item.text }}</p>
              </div>
            </li>
          </ul>

          <p class="announcement-note">{{ announcement.note }}</p>

          <footer class="announcement-actions">
            <button
              class="announcement-btn announcement-btn--primary"
              type="button"
              @click="handleClose"
            >
              关闭
            </button>
            <button
              class="announcement-btn announcement-btn--ghost"
              type="button"
              @click="handleDismissForever"
            >
              本次更新永不显示
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useAnnouncement } from "../composables/useAnnouncement.js";
import { CURRENT_ANNOUNCEMENT } from "../constants/release.js";

defineOptions({ name: "AppAnnouncement" });

const announcement = CURRENT_ANNOUNCEMENT;
const { visible, close, dismissForever } = useAnnouncement();
const cardRef = ref(null);

let previousBodyOverflow = "";
let scrollLocked = false;
let lastFocusedElement = null;

function lockScroll() {
  if (scrollLocked || typeof document === "undefined") return;
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  scrollLocked = true;
}

function unlockScroll() {
  if (!scrollLocked || typeof document === "undefined") return;
  document.body.style.overflow = previousBodyOverflow;
  scrollLocked = false;
}

function restoreFocus() {
  const target = lastFocusedElement;
  lastFocusedElement = null;
  if (!target || typeof target.focus !== "function") return;
  if (typeof target.isConnected === "boolean" && !target.isConnected) return;
  target.focus();
}

function handleClose() {
  close();
}

function handleDismissForever() {
  dismissForever();
}

function handleKeydown(event) {
  if (event.key !== "Escape") return;
  event.preventDefault();
  close();
}

watch(
  visible,
  async (open) => {
    if (typeof window === "undefined") return;
    if (open) {
      if (typeof document !== "undefined") {
        lastFocusedElement = document.activeElement;
      }
      lockScroll();
      window.addEventListener("keydown", handleKeydown);
      await nextTick();
      cardRef.value?.focus();
    } else {
      window.removeEventListener("keydown", handleKeydown);
      unlockScroll();
      restoreFocus();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", handleKeydown);
  }
  unlockScroll();
});
</script>

<style scoped>
.announcement-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  overflow: hidden;
  background: var(--bg-overlay, rgba(48, 40, 82, 0.42));
  backdrop-filter: blur(10px) saturate(130%);
  -webkit-backdrop-filter: blur(10px) saturate(130%);
}

.announcement-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: min(520px, calc(100vw - 32px));
  max-height: calc(100vh - 48px);
  max-height: calc(100dvh - 48px);
  padding: 28px 26px 22px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  color: var(--text-primary, #333);
  border: 1px solid var(--border-light, #e5e7eb);
  border-radius: var(--radius-modal, 28px);
  outline: none;
  background:
    radial-gradient(
      120% 90% at 8% 0%,
      color-mix(in srgb, var(--primary-color, #ff8fb1) 18%, transparent),
      transparent 62%
    ),
    radial-gradient(
      90% 70% at 100% 6%,
      color-mix(in srgb, var(--secondary-color, #c7b8ea) 16%, transparent),
      transparent 58%
    ),
    linear-gradient(
      168deg,
      var(--bg-primary, #ffffff) 0%,
      var(--bg-secondary, #f5f7fa) 100%
    );
  box-shadow:
    0 26px 52px -22px rgba(64, 48, 120, 0.35),
    var(--clay-shadow, inset 0 2px 0 rgba(255, 255, 255, 0.7));
  -webkit-overflow-scrolling: touch;
  animation: announcement-pop 0.34s cubic-bezier(0.22, 1.2, 0.4, 1);
}

.announcement-card::-webkit-scrollbar {
  width: 6px;
}

.announcement-card::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: color-mix(
    in srgb,
    var(--primary-color, #ff8fb1) 35%,
    transparent
  );
}

.announcement-card::-webkit-scrollbar-track {
  background: transparent;
}

.announcement-deco {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
}

.deco {
  position: absolute;
  display: block;
  border-radius: 50%;
  filter: blur(2px);
}

.deco--primary {
  top: -54px;
  right: -38px;
  width: 132px;
  height: 132px;
  opacity: 0.5;
  background: radial-gradient(
    circle at 35% 32%,
    color-mix(in srgb, var(--primary-color, #ff8fb1) 55%, #ffffff),
    color-mix(in srgb, var(--primary-color, #ff8fb1) 18%, transparent)
  );
}

.deco--secondary {
  bottom: -46px;
  left: -34px;
  width: 108px;
  height: 108px;
  opacity: 0.42;
  background: radial-gradient(
    circle at 40% 35%,
    color-mix(in srgb, var(--secondary-color, #c7b8ea) 45%, #ffffff),
    color-mix(in srgb, var(--secondary-color, #c7b8ea) 14%, transparent)
  );
}

.deco--dot {
  top: 24px;
  left: 26px;
  width: 14px;
  height: 14px;
  opacity: 0.35;
  background: var(--primary-color, #ff8fb1);
  box-shadow:
    18px -10px 0 -3px
      color-mix(in srgb, var(--secondary-color, #c7b8ea) 60%, transparent),
    8px 14px 0 -5px
      color-mix(in srgb, var(--primary-color, #ff8fb1) 55%, transparent);
}

.announcement-header {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
}

.version-pill {
  align-self: flex-start;
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.6px;
  color: #ffffff;
  border-radius: 999px;
  background: linear-gradient(
    135deg,
    var(--primary-color, #ff8fb1),
    var(--secondary-color, #c7b8ea)
  );
  box-shadow:
    0 8px 16px -8px
      color-mix(in srgb, var(--primary-color, #ff8fb1) 70%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.announcement-title {
  margin: 0;
  font-family: var(--font-display, inherit);
  font-size: 23px;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: 0.2px;
  color: var(--text-primary, #333);
}

.announcement-intro {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--text-secondary, #666);
}

.announcement-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.announcement-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 14px;
  border: 1px solid
    color-mix(in srgb, var(--border-light, #e5e7eb) 85%, transparent);
  border-radius: 18px;
  background: color-mix(in srgb, var(--bg-secondary, #ffffff) 82%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 10px 18px -16px rgba(74, 58, 130, 0.7);
}

.item-icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 38px;
  height: 38px;
  font-size: 18px;
  line-height: 1;
  border-radius: 13px;
  background: linear-gradient(
    150deg,
    color-mix(
      in srgb,
      var(--primary-color, #ff8fb1) 22%,
      var(--bg-primary, #fff)
    ),
    color-mix(
      in srgb,
      var(--secondary-color, #c7b8ea) 16%,
      var(--bg-secondary, #f5f7fa)
    )
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.65),
    0 6px 10px -8px rgba(74, 58, 130, 0.65);
}

.item-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  color: var(--text-primary, #333);
}

.item-text {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--text-secondary, #666);
}

.announcement-note {
  position: relative;
  margin: 0;
  padding: 10px 14px;
  font-size: 12px;
  line-height: 1.65;
  color: var(--text-tertiary, #999);
  border-radius: 14px;
  background: color-mix(in srgb, var(--primary-color, #ff8fb1) 8%, transparent);
}

.announcement-actions {
  position: relative;
  display: flex;
  flex-direction: row-reverse;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-start;
  padding-top: 2px;
}

.announcement-btn {
  min-height: 42px;
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    filter 0.16s ease;
}

.announcement-btn:active {
  transform: translateY(1px) scale(0.99);
}

.announcement-btn:focus-visible {
  outline: 3px solid
    color-mix(in srgb, var(--primary-color, #ff8fb1) 45%, transparent);
  outline-offset: 3px;
}

.announcement-btn--primary {
  color: #ffffff;
  background: linear-gradient(
    135deg,
    var(--primary-color, #ff8fb1),
    var(--secondary-color, #c7b8ea)
  );
  box-shadow:
    0 12px 22px -12px
      color-mix(in srgb, var(--primary-color, #ff8fb1) 80%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.38);
}

.announcement-btn--primary:hover {
  filter: brightness(1.05);
}

.announcement-btn--ghost {
  color: var(--text-secondary, #666);
  border: 1px solid var(--border-medium, #d1d5db);
  background: color-mix(in srgb, var(--bg-secondary, #f5f7fa) 88%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.announcement-btn--ghost:hover {
  color: var(--text-primary, #333);
  border-color: color-mix(
    in srgb,
    var(--primary-color, #ff8fb1) 40%,
    var(--border-medium, #d1d5db)
  );
}

[data-theme="dark"] .announcement-item,
.dark .announcement-item {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 12px 20px -18px rgba(0, 0, 0, 0.8);
}

[data-theme="dark"] .item-icon,
.dark .item-icon {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.09),
    0 6px 12px -8px rgba(0, 0, 0, 0.8);
}

.announce-enter-active,
.announce-leave-active {
  transition: opacity 0.22s ease;
}

.announce-enter-from,
.announce-leave-to {
  opacity: 0;
}

.announce-leave-active .announcement-card {
  transition: transform 0.18s ease;
  transform: scale(0.97);
}

@keyframes announcement-pop {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.94);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 520px) {
  .announcement-overlay {
    padding: 16px;
  }

  .announcement-card {
    gap: 14px;
    width: calc(100vw - 32px);
    max-height: calc(100vh - 32px);
    max-height: calc(100dvh - 32px);
    padding: 22px 18px 18px;
    border-radius: 24px;
  }

  .announcement-title {
    font-size: 20px;
  }

  .announcement-actions {
    flex-direction: column;
  }

  .announcement-btn {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .announcement-card {
    animation: none;
  }

  .announce-enter-active,
  .announce-leave-active,
  .announce-leave-active .announcement-card,
  .announcement-btn {
    transition: none;
  }
}
</style>
