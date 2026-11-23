<template>
  <div class="not-found-page">
    <div class="container">
      <div class="error-content">
        <div class="error-visual">
          <div class="error-number">404</div>
          <div class="error-icon">
            <n-icon size="120">
              <Search />
            </n-icon>
          </div>
        </div>

        <div class="error-text">
          <h1>页面未找到</h1>
          <p>抱歉，这个页面不存在或已被移除 (´･ω･`)</p>
          <p class="error-hint">回到首页，继续用战魂小助手吧～</p>
        </div>

        <div class="error-actions">
          <n-button type="primary" size="large" @click="router.push('/')">
            返回首页
          </n-button>
          <n-button size="large" @click="router.back()"> 返回上一页 </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Search } from "@vicons/ionicons5";
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<style scoped lang="scss">
.not-found-page {
  min-height: 100vh;
  background:/n    radial-gradient(circle at 12% 12%, rgba(255, 143, 177, 0.12), transparent 34%),
    radial-gradient(circle at 88% 8%, rgba(199, 184, 234, 0.12), transparent 30%),
    var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
}

/* 深色主题下背景 */
[data-theme="dark"] .not-found-page {
  background: linear-gradient(135deg, #0f172a 0%, #1f2937 100%);
}

.error-content {
  text-align: center;
  color: white;
  max-width: 600px;
}

.error-visual {
  position: relative;
  margin-bottom: var(--spacing-xl);
}

.error-number {
  font-size: 12rem;
  font-weight: var(--font-weight-bold);
  opacity: 0.1;
  line-height: 1;
}

.error-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.6;
}

.error-text {
  margin-bottom: var(--spacing-2xl);

  h1 {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-md);
  }

  p {
    font-size: var(--font-size-lg);
    opacity: 0.9;
    margin: 0;
  }
}

.error-hint {
  margin-top: var(--spacing-sm) !important;
  font-size: var(--font-size-md) !important;
  opacity: 0.75 !important;
}

.error-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

@media (max-width: 640px) {
  .error-number {
    font-size: 8rem;
  }

  .error-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>
