<script setup lang="ts">
import { getConfig } from "@/config";

const TITLE = getConfig("Title");
</script>

<template>
  <footer class="layout-footer">
    <span>{{ TITLE }}</span>
    <span class="footer-divider" aria-hidden="true" />
    <span>内容管理</span>
  </footer>
</template>

<style lang="scss" scoped>
.layout-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0 0 8px;
  color: var(--kira-text-muted);
  font-size: 14px;

  .footer-divider {
    width: 3px;
    height: 3px;
    margin: 0 8px;
    background: var(--kira-primary);
    border-radius: 50%;
  }
}
</style>
