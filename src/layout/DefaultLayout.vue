<template>
  <div class="default-layout">
    <!-- 顶部导航 -->
    <nav class="dashboard-nav">
      <div class="nav-container">
        <div class="nav-brand">
          <img src="/icons/xiaoyugan.png" alt="战魂小助手" class="brand-logo" />
          <span class="brand-text">战魂小助手</span>
          <button
            type="button"
            class="brand-menu"
            aria-label="打开导航菜单"
            @click="isMobileMenuOpen = true"
          >
            <n-icon>
              <Menu />
            </n-icon>
          </button>
        </div>

        <div class="nav-menu">
          <router-link
            to="/admin/dashboard"
            class="nav-item"
            active-class="active"
          >
            <n-icon>
              <Home />
            </n-icon>
            <span>首页</span>
          </router-link>
          <router-link
            to="/admin/game-features"
            class="nav-item"
            active-class="active"
          >
            <n-icon>
              <Cube />
            </n-icon>
            <span>游戏功能</span>
          </router-link>
          <router-link to="/tokens" class="nav-item" active-class="active">
            <n-icon>
              <PersonCircle />
            </n-icon>
            <span>Token管理</span>
          </router-link>
          <router-link
            to="/admin/batch-daily-tasks"
            class="nav-item"
            active-class="active"
          >
            <n-icon>
              <Layers />
            </n-icon>
            <span>批量日常</span>
          </router-link>
          <router-link
            to="/admin/PushingLevels"
            class="nav-item"
            active-class="active"
          >
            <n-icon>
              <ArrowUpCircle />
            </n-icon>
            <span>主线推关</span>
          </router-link>
          <router-link
            to="/admin/Link-Games"
            class="nav-item"
            active-class="active"
          >
            <n-icon><GameController /></n-icon>
            <span>在线游戏</span>
          </router-link>
          <router-link
            to="/admin/message-test"
            class="nav-item"
            active-class="active"
          >
            <n-icon>
              <ChatbubbleEllipsesSharp />
            </n-icon>
            <span>消息测试</span>
          </router-link>
          <router-link
            to="/admin/nightmare-lab"
            class="nav-item"
            active-class="active"
          >
            <n-icon>
              <ArrowUpCircle />
            </n-icon>
            <span>十殿组队</span>
          </router-link>
          <!-- Full backup / restore entry -->
          <router-link
            to="/admin/backup"
            class="nav-item"
            active-class="active"
          >
            <n-icon>
              <Archive />
            </n-icon>
            <span>备份恢复</span>
          </router-link>
          <router-link
            to="/admin/legion-war"
            class="nav-item"
            active-class="active"
            v-if="isNowInLegionWarTime()"
          >
            <n-icon>
              <LockOpen />
            </n-icon>
            <span>实时盐场</span>
          </router-link>
        </div>

        <div class="nav-user">
          <!-- 联系小雪：宽屏展示，窄屏收进抽屉 -->
          <div class="contact-chip" :title="`${contactLabel}：${contactValue}`">
            <span class="contact-chip__emoji">💬</span>
            <span class="contact-chip__text">联系小雪</span>
          </div>

          <!-- 主题切换按钮 -->
          <ThemeToggle />

          <n-dropdown :options="userMenuOptions" @select="handleUserAction">
            <div class="user-info">
              <n-avatar
                :src="selectedToken?.avatar || '/icons/xiaoyugan.png'"
                size="medium"
                fallback-src="/icons/xiaoyugan.png"
              />
              <span class="username">{{
                selectedToken?.name || "未选择Token"
              }}</span>
              <n-icon>
                <ChevronDown />
              </n-icon>
            </div>
          </n-dropdown>
        </div>
      </div>
    </nav>
    <n-drawer
      v-model:show="isMobileMenuOpen"
      placement="left"
      style="width: 260px"
    >
      <div class="drawer-menu">
        <router-link
          to="/admin/dashboard"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon>
            <Home />
          </n-icon>
          <span>首页</span>
        </router-link>
        <router-link
          to="/admin/game-features"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon>
            <Cube />
          </n-icon>
          <span>游戏功能</span>
        </router-link>
        <router-link
          to="/tokens"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon>
            <PersonCircle />
          </n-icon>
          <span>Token管理</span>
        </router-link>
        <router-link
          to="/admin/daily-tasks"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon>
            <Settings />
          </n-icon>
          <span>任务管理</span>
        </router-link>
        <router-link
          to="/admin/batch-daily-tasks"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon>
            <Layers />
          </n-icon>
          <span>批量日常</span>
        </router-link>
        <router-link
          to="/admin/PushingLevels"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon>
            <ArrowUpCircle />
          </n-icon>
          <span>主线推关</span>
        </router-link>
        <router-link
          to="/admin/Link-Games"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon><GameController /></n-icon>
          <span>在线游戏</span>
        </router-link>
        <router-link
          to="/admin/message-test"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon>
            <ChatbubbleEllipsesSharp />
          </n-icon>
          <span>消息测试</span>
        </router-link>
        <router-link
          to="/admin/nightmare-lab"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon>
            <ArrowUpCircle />
          </n-icon>
          <span>十殿组队</span>
        </router-link>
        <router-link
          to="/admin/backup"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon>
            <Archive />
          </n-icon>
          <span>备份恢复</span>
        </router-link>
        <router-link
          to="/admin/legion-war"
          class="nav-item"
          active-class="active"
          v-if="isNowInLegionWarTime()"
        >
          <n-icon>
            <LockOpen />
          </n-icon>
          <span>实时盐场</span>
        </router-link>
        <router-link
          to="/admin/profile"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon>
            <Settings />
          </n-icon>
          <span>个人设置</span>
        </router-link>

        <!-- 💬 有问题联系小雪（占位值集中在 @/constants/contact） -->
        <div class="drawer-contact">
          <span class="drawer-contact__emoji">💬</span>
          <div class="drawer-contact__body">
            <span class="drawer-contact__title">有问题联系小雪</span>
            <span class="drawer-contact__meta">{{ contactLabel }}</span>
            <span class="drawer-contact__value">{{ contactValue }}</span>
          </div>
        </div>
      </div>
    </n-drawer>
    <div class="main">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup>
import {
  Archive,
  ArrowUpCircle,
  ChatbubbleEllipsesSharp,
  ChevronDown,
  Cube,
  GameController,
  Home,
  Layers,
  LockOpen,
  Menu,
  PersonCircle,
  Settings,
} from "@vicons/ionicons5";
import { useMessage } from "naive-ui";
import { ref } from "vue";

import { useRoute, useRouter } from "vue-router";
import ThemeToggle from "@/components/Common/ThemeToggle.vue";
import { CONTACT_XIAOXUE, CONTACT_XIAOXUE_LABEL } from "@/constants/contact";
import { selectedToken, useTokenStore } from "@/stores/tokenStore";
import { isNowInLegionWarTime } from "@/utils/clubBattleUtils";

const tokenStore = useTokenStore();
const router = useRouter();
const route = useRoute();
const message = useMessage();

// 联系方式占位符统一从 constants/contact 读取，替换品牌文案时无需改模板
const contactValue = CONTACT_XIAOXUE;
const contactLabel = CONTACT_XIAOXUE_LABEL;

const isMobileMenuOpen = ref(false);

const userMenuOptions = [
  {
    label: "清除所有Token并退出",
    key: "logout",
  },
];

// 方法
const handleUserAction = async (key) => {
  switch (key) {
    case "logout":
      await tokenStore.clearAllTokens();
      message.success("已清除所有Token");
      router.push("/tokens");
      break;
  }
};
</script>

<style scoped lang="scss">
// 导航栏：奶油 / 深梅玻璃拟态
.dashboard-nav {
  background: var(--nav-bg);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  border-bottom: 1px solid var(--border-light);
  box-shadow: 0 6px 18px rgba(180, 130, 150, 0.08);
  padding: 0 var(--spacing-lg);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.nav-container {
  display: flex;
  align-items: center;
  height: 64px;
  max-width: 1680px;
  margin: 0 auto;
  padding: 0 16px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 12px;
}

.brand-logo {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  box-shadow: var(--clay-shadow-sm);
  transition: transform var(--transition-normal);

  &:hover {
    transform: translateY(-2px) scale(1.05);
  }
}

.brand-text {
  font-family: var(--font-display);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.brand-menu {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--primary-color);
  cursor: pointer;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-circle);
  box-shadow: var(--clay-shadow-sm);
  transition:
    transform var(--transition-normal),
    background-color var(--transition-fast);

  &:hover {
    background: var(--bg-tertiary);
    transform: scale(1.06);
  }

  &:active {
    transform: scale(0.94);
  }
}

.nav-menu {
  display: flex;
  align-items: center;
  /* 入口多时靠 padding 撑开，gap 过大会挤到换行 */
  gap: 2px;
  flex: 1;
  min-width: 0;
  justify-content: center;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  white-space: nowrap;
  flex-shrink: 0;
  font-size: 15px;
  border-radius: var(--radius-input);
  color: var(--text-secondary);
  text-decoration: none;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast),
    transform var(--transition-fast);

  &:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    transform: translateY(-1px);
  }

  &.active {
    background: var(--primary-color-light);
    color: var(--primary-color);
    font-weight: var(--font-weight-semibold);
    box-shadow: inset 0 0 0 1px rgba(255, 143, 177, 0.24);
  }
}

.nav-user {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

// 导航区「联系小雪」小胶囊（窄屏隐藏，改由抽屉承载）
.contact-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  cursor: default;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-pill);
  box-shadow: var(--clay-shadow-sm);
  transition:
    transform var(--transition-normal),
    color var(--transition-fast),
    background-color var(--transition-fast);

  &:hover {
    color: var(--primary-color);
    background: var(--bg-tertiary);
    transform: translateY(-2px);
  }

  &__emoji {
    font-size: 14px;
    line-height: 1;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 6px 10px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: background-color var(--transition-fast);

  &:hover {
    background: var(--bg-tertiary);
  }
}

.username {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

@media (max-width: 1500px) {
  .contact-chip {
    padding: 6px 8px;
  }

  .contact-chip__text {
    display: none;
  }
}

@media (max-width: 768px) {
  .contact-chip {
    display: none;
  }
}

@media (max-width: 768px) {
  .nav-item span {
    display: none;
  }

  .nav-menu {
    display: none;
  }

  .nav-item {
    padding: var(--spacing-sm);
    flex: 0 0 auto;
  }

  .nav-container {
    height: 56px;
  }

  .brand-text {
    font-size: var(--font-size-lg);
  }

  .brand-menu {
    display: inline-flex;
  }
}

@media (max-width: 480px) {
  // 小屏给品牌名留出空间：只保留头像
  .username {
    display: none;
  }

  .nav-user {
    gap: var(--spacing-sm);
  }
}

.drawer-menu {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  min-height: 100%;
}

.drawer-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 10px var(--spacing-md);
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-input);
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast),
    transform var(--transition-fast);

  &:hover {
    color: var(--text-primary);
    background: var(--bg-tertiary);
    transform: translateY(-1px);
  }
}

.drawer-item.router-link-active {
  background: var(--primary-color-light);
  color: var(--primary-color);
  font-weight: var(--font-weight-semibold);
}

// 抽屉底部：有问题联系小雪
.drawer-contact {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 14px;
  // 有富余空间时贴到抽屉底部，内容超高时紧跟在列表之后
  margin-top: auto;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-card);
  box-shadow: var(--clay-shadow-sm);

  &__emoji {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    font-size: 15px;
    background: var(--primary-color-light);
    border-radius: var(--radius-circle);
    flex-shrink: 0;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
  }

  &__meta {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
  }

  &__value {
    font-size: var(--font-size-xs);
    color: var(--primary-color);
    overflow-wrap: anywhere;
  }
}

/* 禁用样式：灰化、鼠标禁止、无hover效果 */
.nav-item.disabled {
  background: #cccccc;
  color: #999999;
  cursor: not-allowed; /* 鼠标样式：禁止 */
  pointer-events: none; /* 可选：直接禁用所有鼠标事件（比阻止click更彻底） */
}
</style>
