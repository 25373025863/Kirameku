<script setup lang="ts">
import { getTopMenu } from "@/router/utils";
import { useNav } from "@/layout/hooks/useNav";
import Sparkles from "~icons/lucide/sparkles";

defineProps({
  collapse: Boolean
});

const { title } = useNav();
</script>

<template>
  <div class="sidebar-logo-container" :class="{ collapses: collapse }">
    <transition name="sidebarLogoFade">
      <router-link
        key="brand"
        :title="title"
        :aria-label="title"
        class="sidebar-logo-link"
        :to="getTopMenu()?.path ?? '/'"
      >
        <span class="sidebar-brand-mark" aria-hidden="true">
          <IconifyIconOffline :icon="Sparkles" />
        </span>
        <span class="sidebar-brand-copy">
          <span class="sidebar-title">{{ title }}</span>
          <span class="sidebar-kicker">ADMIN</span>
        </span>
      </router-link>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 48px;
  overflow: hidden;

  .sidebar-logo-link {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    height: 100%;
    gap: 10px;
    padding: 0 10px;

    .sidebar-brand-mark {
      display: inline-flex;
      flex: 0 0 32px;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      color: #fff;
      background: var(--kira-primary);
      border-radius: var(--kira-radius);
      box-shadow: 0 6px 14px rgb(14 165 233 / 20%);
    }

    .sidebar-brand-copy {
      display: flex;
      min-width: 0;
      overflow: hidden;
      flex-direction: column;
      justify-content: center;
      transition:
        width var(--pure-transition-duration),
        opacity var(--kira-transition);

      .sidebar-title {
        overflow: hidden;
        color: var(--kira-text);
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: "Noto Serif SC", "Songti SC", serif;
        font-size: 16px;
        font-weight: 700;
        line-height: 19px;
      }

      .sidebar-kicker {
        color: var(--kira-text-muted);
        font-size: 9px;
        font-weight: 700;
        line-height: 11px;
      }
    }
  }

  &.collapses .sidebar-brand-copy {
    width: 0;
    opacity: 0;
  }
}
</style>
