<script setup lang="ts">
import { computed, ref, reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useEventListener } from "@vueuse/core";
import { debounce } from "@pureadmin/utils";
import type { FormInstance } from "element-plus";
import Motion from "./utils/motion";
import { loginRules } from "./utils/rule";
import { message } from "@/utils/message";
import { useNav } from "@/layout/hooks/useNav";
import { useLayout } from "@/layout/hooks/useLayout";
import { useTranslationLang } from "@/layout/hooks/useTranslationLang";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { useUserStoreHook } from "@/store/modules/user";
import { initRouter, getTopMenu } from "@/router/utils";
import { $t, transformI18n } from "@/plugins/i18n";
import { ReImageVerify } from "@/components/ReImageVerify";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import loginBackground from "@/assets/login/kirameku-bg.webp";

import Check from "~icons/ep/check";
import User from "~icons/ri/user-3-fill";
import Lock from "~icons/ri/lock-fill";
import Keyhole from "~icons/ri/shield-keyhole-line";
import Sun from "~icons/lucide/sun";
import Moon from "~icons/lucide/moon";
import Languages from "~icons/lucide/languages";
import Sparkles from "~icons/lucide/sparkles";
import LogIn from "~icons/lucide/log-in";

defineOptions({ name: "Login" });

const router = useRouter();
const { t } = useI18n();
const { initStorage } = useLayout();
const { title, getDropdownItemStyle, getDropdownItemClass } = useNav();
const { locale, translationCh, translationEn } = useTranslationLang();
const { dataTheme, themeMode, dataThemeChange } = useDataThemeChange();

initStorage();
dataThemeChange(themeMode.value);

const imgCode = ref("");
const loginDay = ref(7);
const loading = ref(false);
const checked = ref(false);
const disabled = ref(false);
const ruleFormRef = ref<FormInstance>();

const ruleForm = reactive({
  username: "admin",
  password: "admin123",
  verifyCode: ""
});

const themeToggleLabel = computed(() =>
  dataTheme.value ? "切换到浅色模式" : "切换到深色模式"
);

function toggleTheme() {
  dataTheme.value = !dataTheme.value;
  dataThemeChange(dataTheme.value ? "dark" : "light");
}

const onLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(valid => {
    if (!valid) return;

    loading.value = true;
    useUserStoreHook()
      .loginByUsername({
        username: ruleForm.username,
        password: ruleForm.password
      })
      .then(async () => {
        await initRouter();
        disabled.value = true;
        router.push(getTopMenu(true).path).then(() => {
          message(t("login.pureLoginSuccess"), { type: "success" });
        });
      })
      .catch(() => {
        message(t("login.pureLoginFail"), { type: "error" });
      })
      .finally(() => {
        disabled.value = false;
        loading.value = false;
      });
  });
};

const immediateDebounce: any = debounce(
  formRef => onLogin(formRef),
  1000,
  true
);

useEventListener(document, "keydown", ({ code }) => {
  if (
    ["Enter", "NumpadEnter"].includes(code) &&
    !disabled.value &&
    !loading.value
  ) {
    immediateDebounce(ruleFormRef.value);
  }
});

watch(imgCode, value => {
  useUserStoreHook().SET_VERIFYCODE(value);
});

watch(checked, bool => {
  useUserStoreHook().SET_ISREMEMBERED(bool);
});

watch(loginDay, value => {
  useUserStoreHook().SET_LOGINDAY(value);
});
</script>

<template>
  <div
    class="login-page select-none"
    :style="{ backgroundImage: `url(${loginBackground})` }"
  >
    <div class="login-backdrop" aria-hidden="true" />

    <header class="login-toolbar">
      <div class="login-brand" :aria-label="title">
        <span class="login-brand-mark" aria-hidden="true">
          <IconifyIconOffline :icon="Sparkles" />
        </span>
        <span class="login-brand-copy">
          <strong>{{ title }}</strong>
          <small>ADMIN</small>
        </span>
      </div>

      <div class="login-toolbar-actions">
        <button
          type="button"
          class="login-icon-button"
          :title="themeToggleLabel"
          :aria-label="themeToggleLabel"
          @click="toggleTheme"
        >
          <IconifyIconOffline :icon="dataTheme ? Sun : Moon" />
        </button>

        <el-dropdown trigger="click">
          <button
            type="button"
            class="login-icon-button"
            title="切换语言"
            aria-label="切换语言"
          >
            <IconifyIconOffline :icon="Languages" />
          </button>
          <template #dropdown>
            <el-dropdown-menu class="translation">
              <el-dropdown-item
                :style="getDropdownItemStyle(locale, 'zh')"
                :class="[
                  'dark:text-white!',
                  getDropdownItemClass(locale, 'zh')
                ]"
                @click="translationCh"
              >
                <IconifyIconOffline
                  v-show="locale === 'zh'"
                  class="language-check"
                  :icon="Check"
                />
                简体中文
              </el-dropdown-item>
              <el-dropdown-item
                :style="getDropdownItemStyle(locale, 'en')"
                :class="[
                  'dark:text-white!',
                  getDropdownItemClass(locale, 'en')
                ]"
                @click="translationEn"
              >
                <IconifyIconOffline
                  v-show="locale === 'en'"
                  class="language-check"
                  :icon="Check"
                />
                English
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <main class="login-main">
      <Motion>
        <section class="login-panel" aria-labelledby="login-title">
          <header class="login-heading">
            <span>WELCOME BACK</span>
            <h1 id="login-title">登录管理后台</h1>
            <p>欢迎回来，继续记录今天的内容。</p>
          </header>

          <el-form
            ref="ruleFormRef"
            :model="ruleForm"
            :rules="loginRules"
            label-position="top"
            size="large"
            class="login-form"
          >
            <el-form-item
              label="用户名"
              :rules="[
                {
                  required: true,
                  message: transformI18n($t('login.pureUsernameReg')),
                  trigger: 'blur'
                }
              ]"
              prop="username"
            >
              <el-input
                v-model.trim="ruleForm.username"
                clearable
                autocomplete="username"
                :placeholder="t('login.pureUsername')"
                :prefix-icon="useRenderIcon(User)"
              />
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input
                v-model="ruleForm.password"
                clearable
                show-password
                autocomplete="current-password"
                :placeholder="t('login.purePassword')"
                :prefix-icon="useRenderIcon(Lock)"
              />
            </el-form-item>

            <el-form-item label="验证码" prop="verifyCode">
              <el-input
                v-model.trim="ruleForm.verifyCode"
                clearable
                autocomplete="off"
                :placeholder="t('login.pureVerifyCode')"
                :prefix-icon="useRenderIcon(Keyhole)"
              >
                <template #append>
                  <ReImageVerify v-model:code="imgCode" />
                </template>
              </el-input>
            </el-form-item>

            <div class="login-options">
              <el-checkbox v-model="checked">保持登录</el-checkbox>
              <el-select
                v-if="checked"
                v-model="loginDay"
                size="small"
                aria-label="保持登录时长"
              >
                <el-option :value="1" label="1 天" />
                <el-option :value="7" label="7 天" />
                <el-option :value="30" label="30 天" />
              </el-select>
            </div>

            <el-button
              class="login-submit"
              size="large"
              type="primary"
              :loading="loading"
              :disabled="disabled"
              @click="onLogin(ruleFormRef)"
            >
              <span>{{ t("login.pureLogin") }}</span>
              <IconifyIconOffline v-if="!loading" :icon="LogIn" />
            </el-button>
          </el-form>
        </section>
      </Motion>
    </main>

    <footer class="login-footer">© 2026 {{ title }}</footer>
  </div>
</template>

<style scoped>
@import url("@/style/login.css");
</style>

<style lang="scss" scoped>
:deep(.el-input-group__append) {
  padding: 0;
  overflow: hidden;
  background: rgb(255 255 255 / 38%);
  border-left: 1px solid var(--kira-border);
}

:deep(.el-form-item__label) {
  height: auto;
  padding: 0 0 7px;
  line-height: 1.3;
}

.translation {
  :deep(.el-dropdown-menu__item) {
    position: relative;
    min-width: 132px;
    padding: 8px 18px 8px 38px;
  }

  .language-check {
    position: absolute;
    left: 16px;
  }
}
</style>
