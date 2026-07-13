<script setup lang="ts">
import { useRouter } from "vue-router";
import Profile from "./components/Profile.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import leftLine from "~icons/ri/arrow-left-line";

defineOptions({
  name: "AccountSettings"
});

const router = useRouter();
</script>

<template>
  <div class="account-profile-page">
    <header class="profile-header">
      <el-button
        class="back-button"
        circle
        plain
        title="返回"
        aria-label="返回"
        :icon="useRenderIcon(leftLine)"
        @click="router.go(-1)"
      />
      <h2>个人资料</h2>
    </header>

    <main class="profile-content">
      <Profile />
    </main>
  </div>
</template>

<style scoped>
.account-profile-page {
  min-height: 100%;
  padding: 24px 32px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.profile-header h2 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 600;
  line-height: 32px;
}

.back-button {
  width: 44px;
  min-width: 44px;
  height: 44px;
}

.profile-content {
  padding-top: 24px;
}

@media (max-width: 767px) {
  .account-profile-page {
    padding: 16px;
  }

  .profile-content {
    padding-top: 20px;
  }
}
</style>
