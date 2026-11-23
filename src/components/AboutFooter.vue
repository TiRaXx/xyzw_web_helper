<template>
  <footer class="about-footer">
    <div class="about-footer-inner">
      <div class="footer-main">
        <div class="footer-brand">✦ 战魂小助手</div>
        <p class="footer-desc">咸鱼之王俱乐部 · 多窗口游戏与 Token 管理</p>
        <p class="footer-meta">
          &copy; 2026 战魂小助手 · 基于
          <a
            class="footer-link"
            :href="ORIGINAL_PROJECT.url"
            target="_blank"
            rel="noopener noreferrer"
            >{{ ORIGINAL_PROJECT.name }}</a
          >
          二次开发
        </p>
        <p class="footer-meta">
          原作者：FF Team · 原项目作者署名保留 · 遵循
          <a
            class="footer-link"
            :href="ORIGINAL_PROJECT.licenseUrl"
            target="_blank"
            rel="noopener noreferrer"
            >{{ ORIGINAL_PROJECT.license }}</a
          >
          协议
        </p>
      </div>

      <div class="footer-side">
        <span class="footer-version">{{ APP_VERSION_LABEL }}</span>
        <router-link class="footer-link" to="/admin/about">关于</router-link>
        <span class="footer-contact">💬 有问题联系小雪</span>
        <span class="footer-contact-detail">
          {{ CONTACT_XIAOXUE_LABEL }}：{{ CONTACT_XIAOXUE }}
        </span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { CONTACT_XIAOXUE, CONTACT_XIAOXUE_LABEL } from "@/constants/contact";
import { APP_VERSION_LABEL, ORIGINAL_PROJECT } from "@/constants/release";
</script>

<style scoped>
.about-footer {
  padding: var(--spacing-xl) var(--spacing-md);
}

.about-footer-inner {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  justify-content: space-between;
  align-items: flex-start;
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  border: var(--clay-border);
  border-radius: var(--radius-card, var(--border-radius-xl));
  box-shadow: var(--clay-shadow-sm, var(--shadow-light));
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
}

.footer-brand {
  margin-bottom: var(--spacing-xs);
  color: var(--text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.footer-desc {
  margin: 0 0 var(--spacing-sm);
  color: var(--text-secondary);
}

.footer-meta {
  margin: 0;
  color: var(--text-tertiary);
}

.footer-link {
  color: var(--primary-color);
  text-decoration: none;
}

.footer-link:hover {
  color: var(--primary-color-hover);
  text-decoration: underline;
}

.footer-side {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  align-items: flex-start;
}

.footer-version {
  display: inline-block;
  padding: 2px var(--spacing-sm);
  border-radius: var(--radius-pill, 999px);
  background: var(--primary-color-light);
  color: var(--primary-color);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.footer-contact {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.footer-contact-detail {
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
  word-break: break-all;
}

@media (max-width: 640px) {
  .about-footer-inner {
    flex-direction: column;
    padding: var(--spacing-lg);
  }
}
</style>
