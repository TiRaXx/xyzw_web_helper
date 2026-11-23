<template>
  <div class="about-page">
    <div class="about-container">
      <header class="about-hero">
        <span class="about-badge">{{ APP_VERSION_LABEL }}</span>
        <h1 class="about-title">关于战魂小助手 ✦</h1>
        <p class="about-lead">咸鱼之王俱乐部 · 多窗口游戏与 Token 管理工具</p>
      </header>

      <!-- 产品简介 -->
      <section class="about-card">
        <h2 class="card-title">🌸 产品简介</h2>
        <p>
          战魂小助手面向俱乐部日常使用：在同一个页面并排打开多个账号，
          统一管理游戏脚本与 Token，减少来回切换的重复操作。
        </p>
        <p>
          Token 与配置默认保存在本机浏览器（localStorage / IndexedDB），
          备份文件由你自行导出与保管。
        </p>
      </section>

      <!-- v0.2 更新亮点 -->
      <section class="about-card">
        <h2 class="card-title">✨ {{ CURRENT_ANNOUNCEMENT.label }} 更新亮点</h2>
        <p class="card-desc">{{ CURRENT_ANNOUNCEMENT.intro }}</p>
        <ul class="highlight-list">
          <li
            v-for="item in CURRENT_ANNOUNCEMENT.items"
            :key="item.title"
            class="highlight-item"
          >
            <span class="highlight-icon">{{ item.icon }}</span>
            <div class="highlight-body">
              <h3 class="highlight-title">{{ item.title }}</h3>
              <p class="highlight-text">{{ item.text }}</p>
            </div>
          </li>
        </ul>
        <router-link class="text-link" to="/changelog">
          查看完整更新日志 →
        </router-link>
      </section>

      <!-- 原项目与协议 -->
      <section class="about-card">
        <h2 class="card-title">📄 原项目与协议</h2>
        <p>
          本项目基于
          <a
            class="text-link"
            :href="ORIGINAL_PROJECT.url"
            target="_blank"
            rel="noopener noreferrer"
            >{{ ORIGINAL_PROJECT.name }}</a
          >
          二次开发，原作者（FF Team）署名保留。
        </p>
        <p>
          遵循
          <a
            class="text-link"
            :href="ORIGINAL_PROJECT.licenseUrl"
            target="_blank"
            rel="noopener noreferrer"
            >{{ ORIGINAL_PROJECT.license }}</a
          >
          协议：允许署名分享与相同方式共享，禁止商业用途，修改需标注。
        </p>
        <p class="version-line">
          当前版本：{{ APP_VERSION_LABEL }}（{{ APP_VERSION }}）
        </p>
      </section>

      <!-- 联系小雪 -->
      <section class="about-card contact-card">
        <h2 class="card-title">💬 有问题联系小雪</h2>
        <p class="card-desc">
          首次使用卡住了、Token 导入失败，或想反馈问题，都可以来找小雪～
        </p>
        <div class="contact-box">
          <span class="contact-label">{{ CONTACT_XIAOXUE_LABEL }}</span>
          <span class="contact-value">{{ CONTACT_XIAOXUE }}</span>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { CONTACT_XIAOXUE, CONTACT_XIAOXUE_LABEL } from "@/constants/contact";
import {
  APP_VERSION,
  APP_VERSION_LABEL,
  CURRENT_ANNOUNCEMENT,
  ORIGINAL_PROJECT,
} from "@/constants/release";
</script>

<style scoped lang="scss">
.about-page {
  min-height: 100%;
  padding: var(--spacing-xl) var(--spacing-md);
  background: var(--bg-primary);
  color: var(--text-primary);
}

.about-container {
  max-width: 900px;
  margin: 0 auto;
}

.about-hero {
  margin-bottom: var(--spacing-xl);
  text-align: center;
}

.about-badge {
  display: inline-block;
  margin-bottom: var(--spacing-sm);
  padding: 2px var(--spacing-md);
  border-radius: var(--radius-pill, 999px);
  background: var(--primary-color-light);
  color: var(--primary-color);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.about-title {
  margin: 0 0 var(--spacing-sm);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
}

.about-lead {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-lg);
}

.about-card {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  border: var(--clay-border);
  border-radius: var(--radius-card, var(--border-radius-xl));
  box-shadow: var(--clay-shadow-sm, var(--shadow-light));
  line-height: var(--line-height-relaxed);

  p {
    margin: 0 0 var(--spacing-sm);
    color: var(--text-secondary);
  }

  p:last-child {
    margin-bottom: 0;
  }
}

.card-title {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.card-desc {
  margin-bottom: var(--spacing-md);
}

.text-link {
  color: var(--primary-color);
  text-decoration: none;
  word-break: break-all;
}

.text-link:hover {
  color: var(--primary-color-hover);
  text-decoration: underline;
}

.highlight-list {
  display: grid;
  gap: var(--spacing-md);
  margin: 0 0 var(--spacing-md);
  padding: 0;
  list-style: none;
}

.highlight-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
}

.highlight-icon {
  font-size: var(--font-size-xl);
  line-height: 1.2;
}

.highlight-title {
  margin: 0 0 2px;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.highlight-text {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.version-line {
  margin-top: var(--spacing-md) !important;
  color: var(--text-tertiary) !important;
  font-size: var(--font-size-sm);
}

.contact-card {
  border-color: var(--primary-color);
}

.contact-box {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--primary-color-light);
  border-radius: var(--border-radius-medium);
}

.contact-label {
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
}

.contact-value {
  color: var(--primary-color);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  word-break: break-all;
}

@media (max-width: 640px) {
  .about-page {
    padding: var(--spacing-lg) var(--spacing-sm);
  }

  .about-card {
    padding: var(--spacing-lg);
  }

  .about-title {
    font-size: var(--font-size-2xl);
  }
}
</style>
