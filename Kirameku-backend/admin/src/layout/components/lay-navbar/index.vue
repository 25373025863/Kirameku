<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useNav } from "@/layout/hooks/useNav";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import LaySearch from "../lay-search/index.vue";
import LayNotice from "../lay-notice/index.vue";
import LayNavMix from "../lay-sidebar/NavMix.vue";
import { useTranslationLang } from "@/layout/hooks/useTranslationLang";
import LaySidebarFullScreen from "../lay-sidebar/components/SidebarFullScreen.vue";
import LaySidebarBreadCrumb from "../lay-sidebar/components/SidebarBreadCrumb.vue";
import LaySidebarTopCollapse from "../lay-sidebar/components/SidebarTopCollapse.vue";
import { getMine } from "@/api/user";
import { useUserStoreHook } from "@/store/modules/user";

import GlobalizationIcon from "@/assets/svg/globalization.svg?component";
import AccountSettingsIcon from "~icons/ri/user-settings-line";
import LogoutCircleRLine from "~icons/ri/logout-circle-r-line";
import Setting from "~icons/ri/settings-3-line";
import Check from "~icons/ep/check";
import Sun from "~icons/lucide/sun";
import Moon from "~icons/lucide/moon";

// 页面加载时从 API 刷新用户信息（解决改昵称后导航栏不同步的问题）
onMounted(async () => {
  try {
    const { code, data } = await getMine();
    if (code === 0) {
      useUserStoreHook().SET_NICKNAME(data.nickname);
      useUserStoreHook().SET_AVATAR(data.avatar);
    }
  } catch {}
});

const {
  layout,
  device,
  logout,
  onPanel,
  pureApp,
  username,
  userAvatar,
  avatarsStyle,
  toggleSideBar,
  toAccountSettings,
  getDropdownItemStyle,
  getDropdownItemClass
} = useNav();

const { t, locale, translationCh, translationEn } = useTranslationLang();
const { dataTheme, dataThemeChange } = useDataThemeChange();

const themeToggleLabel = computed(() =>
  dataTheme.value ? "切换到浅色模式" : "切换到深色模式"
);

function toggleTheme() {
  dataTheme.value = !dataTheme.value;
  dataThemeChange(dataTheme.value ? "dark" : "light");
}
</script>

<template>
  <div class="navbar admin-navbar">
    <LaySidebarTopCollapse
      v-if="device === 'mobile'"
      class="hamburger-container"
      :is-active="pureApp.sidebar.opened"
      @toggleClick="toggleSideBar"
    />

    <LaySidebarBreadCrumb
      v-if="layout !== 'mix' && device !== 'mobile'"
      class="breadcrumb-container"
    />

    <LayNavMix v-if="layout === 'mix'" />

    <div v-if="layout === 'vertical'" class="vertical-header-right">
      <!-- 菜单搜索 -->
      <LaySearch id="header-search" class="header-search" />
      <!-- 国际化 -->
      <el-dropdown
        id="header-translation"
        class="header-action-desktop"
        trigger="click"
      >
        <div
          class="globalization-icon navbar-bg-hover hover:[&>svg]:animate-scale-bounce"
        >
          <IconifyIconOffline :icon="GlobalizationIcon" />
        </div>
        <template #dropdown>
          <el-dropdown-menu class="translation">
            <el-dropdown-item
              :style="getDropdownItemStyle(locale, 'zh')"
              :class="['dark:text-white!', getDropdownItemClass(locale, 'zh')]"
              @click="translationCh"
            >
              <IconifyIconOffline
                v-show="locale === 'zh'"
                class="check-zh"
                :icon="Check"
              />
              简体中文
            </el-dropdown-item>
            <el-dropdown-item
              :style="getDropdownItemStyle(locale, 'en')"
              :class="['dark:text-white!', getDropdownItemClass(locale, 'en')]"
              @click="translationEn"
            >
              <span v-show="locale === 'en'" class="check-en">
                <IconifyIconOffline :icon="Check" />
              </span>
              English
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <!-- 全屏 -->
      <LaySidebarFullScreen id="full-screen" class="header-action-desktop" />
      <!-- 消息通知 -->
      <LayNotice id="header-notice" class="header-action-desktop" />
      <!-- 明暗主题 -->
      <button
        type="button"
        class="navbar-action"
        :title="themeToggleLabel"
        :aria-label="themeToggleLabel"
        @click="toggleTheme"
      >
        <IconifyIconOffline :icon="dataTheme ? Sun : Moon" />
      </button>
      <!-- 退出登录 -->
      <el-dropdown class="user-dropdown" trigger="click">
        <span class="el-dropdown-link navbar-bg-hover select-none">
          <img :src="userAvatar" :style="avatarsStyle" />
          <p v-if="username" class="user-name">{{ username }}</p>
        </span>
        <template #dropdown>
          <el-dropdown-menu class="logout">
            <el-dropdown-item @click="toAccountSettings">
              <IconifyIconOffline
                :icon="AccountSettingsIcon"
                style="margin: 5px"
              />
              {{ t("buttons.pureAccountSettings") }}
            </el-dropdown-item>
            <el-dropdown-item @click="logout">
              <IconifyIconOffline
                :icon="LogoutCircleRLine"
                style="margin: 5px"
              />
              {{ t("buttons.pureLoginOut") }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <button
        type="button"
        class="set-icon navbar-action"
        :title="t('buttons.pureOpenSystemSet')"
        :aria-label="t('buttons.pureOpenSystemSet')"
        @click="onPanel"
      >
        <IconifyIconOffline :icon="Setting" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.navbar {
  display: flex;
  align-items: center;
  width: 100%;
  height: 48px;
  overflow: hidden;

  .hamburger-container {
    float: left;
    height: 100%;
    line-height: 48px;
    cursor: pointer;
  }

  .vertical-header-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 280px;
    height: 48px;
    margin-left: auto;
    gap: 2px;
    color: var(--kira-text);

    .navbar-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 0;
      color: var(--kira-text-muted);
      cursor: pointer;
      background: transparent;
      border: 0;
      border-radius: var(--kira-radius);
      transition:
        color var(--kira-transition),
        background-color var(--kira-transition),
        transform var(--kira-transition);

      &:hover {
        color: var(--kira-text);
        background: rgb(148 163 184 / 12%);
      }

      &:active {
        transform: scale(0.96);
      }
    }

    .el-dropdown-link {
      display: flex;
      align-items: center;
      justify-content: space-around;
      height: 48px;
      gap: 8px;
      padding: 8px 10px;
      color: var(--kira-text);
      cursor: pointer;

      p {
        font-size: 14px;
      }

      img {
        width: 28px;
        height: 28px;
        object-fit: cover;
        border: 1px solid var(--kira-border-strong);
        border-radius: 50%;
      }
    }
  }

  .breadcrumb-container {
    float: left;
    margin-left: 16px;
  }
}

@media (width <= 760px) {
  .navbar {
    .breadcrumb-container {
      display: none;
    }

    .vertical-header-right {
      min-width: 0;
      margin-left: auto;

      .header-action-desktop {
        display: none;
      }

      .el-dropdown-link {
        width: 40px;
        padding: 6px;

        .user-name {
          display: none;
        }

        img {
          margin-right: 0 !important;
        }
      }
    }
  }
}

.translation {
  :deep(.el-dropdown-menu__item) {
    padding: 5px 40px;
  }

  .check-zh {
    position: absolute;
    left: 20px;
  }

  .check-en {
    position: absolute;
    left: 20px;
  }
}

.logout {
  width: 120px;

  :deep(.el-dropdown-menu__item) {
    display: inline-flex;
    flex-wrap: wrap;
    min-width: 100%;
  }
}
</style>
