<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { FormInstance, FormRules, UploadFile } from "element-plus";
import { message as msg } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { uploadImage } from "@/api/album";
import {
  createSiteConfig,
  deleteSiteConfig,
  getAllSiteConfig,
  updateSiteConfig,
  updateSiteConfigBatch
} from "@/api/siteConfig";
import type { SiteConfigItem } from "@/api/siteConfig";

defineOptions({ name: "SiteConfigIndex" });

const PROFILE_KEYS = new Set(["profile_name", "profile_bio", "profile_avatar"]);
const PROFILE_DEFAULTS = {
  name: "树下树",
  bio: "乐乐来了",
  avatar: "/images/lucy.jpg"
};

const activeTab = ref("profile");
const loading = ref(false);
const profileSaving = ref(false);
const avatarUploading = ref(false);
const dataList = ref<SiteConfigItem[]>([]);
const advancedConfigList = computed(() =>
  dataList.value.filter(item => !PROFILE_KEYS.has(item.key))
);

const profileFormRef = ref<FormInstance>();
const profileForm = ref({ ...PROFILE_DEFAULTS });
const profileInitial = computed(() =>
  (profileForm.value.name.trim() || "站").slice(0, 1)
);
const profileRules: FormRules = {
  name: [
    { required: true, message: "请输入展示名字", trigger: "blur" },
    { max: 50, message: "名字不能超过 50 个字符", trigger: "blur" }
  ],
  bio: [{ max: 160, message: "介绍不能超过 160 个字符", trigger: "blur" }]
};

const dialogVisible = ref(false);
const dialogTitle = ref("编辑配置");
const formRef = ref<FormInstance>();
const form = ref({
  key: "",
  value: "",
  description: ""
});
const isEdit = ref(false);

const rules: FormRules = {
  key: [{ required: true, message: "请输入配置键名", trigger: "blur" }],
  value: [{ required: true, message: "请输入配置值", trigger: "blur" }]
};

const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 60 },
  { label: "配置键名", prop: "key", width: 220 },
  {
    label: "配置值",
    prop: "value",
    minWidth: 200,
    slot: "value"
  },
  { label: "说明", prop: "description", minWidth: 160 },
  {
    label: "更新时间",
    prop: "updated_at",
    width: 170,
    formatter: ({ updated_at }: SiteConfigItem) =>
      updated_at ? updated_at.replace("T", " ").slice(0, 19) : ""
  },
  {
    label: "操作",
    fixed: "right",
    width: 160,
    slot: "operation"
  }
];

function readStoredValue(value: string): string {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "string" ? parsed : String(parsed ?? "");
  } catch {
    return value;
  }
}

function syncProfile(rows: SiteConfigItem[]) {
  const getValue = (key: string, fallback: string) => {
    const row = rows.find(item => item.key === key);
    return row ? readStoredValue(row.value) : fallback;
  };

  profileForm.value = {
    name: getValue("profile_name", PROFILE_DEFAULTS.name),
    bio: getValue("profile_bio", PROFILE_DEFAULTS.bio),
    avatar: getValue("profile_avatar", PROFILE_DEFAULTS.avatar)
  };
}

async function onSearch() {
  loading.value = true;
  try {
    const rows = await getAllSiteConfig();
    dataList.value = rows;
    syncProfile(rows);
  } catch (error: any) {
    msg(error?.message ?? "加载站点配置失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

async function handleProfileSave() {
  try {
    await profileFormRef.value?.validate();
  } catch {
    return;
  }

  profileSaving.value = true;
  try {
    await updateSiteConfigBatch({
      profile_name: profileForm.value.name.trim(),
      profile_bio: profileForm.value.bio.trim(),
      profile_avatar: profileForm.value.avatar.trim()
    });
    await onSearch();
    msg("个人资料已保存", { type: "success" });
  } catch (error: any) {
    msg(error?.message ?? "保存个人资料失败", { type: "error" });
  } finally {
    profileSaving.value = false;
  }
}

async function handleAvatarUpload(uploadFile: UploadFile) {
  const file = uploadFile.raw;
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    msg("请选择图片文件", { type: "warning" });
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    msg("图片不能超过 10 MB", { type: "warning" });
    return;
  }

  avatarUploading.value = true;
  try {
    const result = await uploadImage(file);
    profileForm.value.avatar = result.url;
    msg("头像上传成功", { type: "success" });
  } catch (error: any) {
    msg(error?.message ?? "头像上传失败", { type: "error" });
  } finally {
    avatarUploading.value = false;
  }
}

function openAdd() {
  isEdit.value = false;
  dialogTitle.value = "新增配置";
  form.value = { key: "", value: "", description: "" };
  dialogVisible.value = true;
}

function openEdit(row: SiteConfigItem) {
  isEdit.value = true;
  dialogTitle.value = "编辑配置";
  form.value = {
    key: row.key,
    value:
      typeof row.value === "string" ? row.value : JSON.stringify(row.value),
    description: row.description || ""
  };
  dialogVisible.value = true;
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  try {
    if (isEdit.value) {
      await updateSiteConfig(form.value.key, {
        value: form.value.value,
        description: form.value.description
      });
      msg("更新成功", { type: "success" });
    } else {
      await createSiteConfig({
        key: form.value.key,
        value: form.value.value,
        description: form.value.description
      });
      msg("新增成功", { type: "success" });
    }
    dialogVisible.value = false;
    await onSearch();
  } catch (error: any) {
    msg(error?.message ?? "操作失败", { type: "error" });
  }
}

async function handleDelete(row: SiteConfigItem) {
  try {
    await deleteSiteConfig(row.key);
    msg("删除成功", { type: "success" });
    await onSearch();
  } catch (error: any) {
    msg(error?.message ?? "删除失败", { type: "error" });
  }
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

onMounted(onSearch);
</script>

<template>
  <div class="site-config-page p-4">
    <el-card shadow="never" class="site-config-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="个人资料" name="profile">
          <section v-loading="loading" class="tab-content">
            <header class="section-header">
              <h2>首页个人资料</h2>
            </header>

            <div class="profile-editor">
              <div class="avatar-section">
                <div class="avatar-frame">
                  <el-avatar :size="112" :src="profileForm.avatar" fit="cover">
                    {{ profileInitial }}
                  </el-avatar>
                </div>
                <el-upload
                  :show-file-list="false"
                  :auto-upload="false"
                  :on-change="handleAvatarUpload"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                >
                  <el-button
                    type="primary"
                    plain
                    :loading="avatarUploading"
                    :icon="useRenderIcon('ri:upload-2-line')"
                  >
                    上传头像
                  </el-button>
                </el-upload>
              </div>

              <el-form
                ref="profileFormRef"
                :model="profileForm"
                :rules="profileRules"
                label-position="top"
                class="profile-form"
                @submit.prevent="handleProfileSave"
              >
                <el-form-item label="名字" prop="name">
                  <el-input
                    v-model="profileForm.name"
                    maxlength="50"
                    show-word-limit
                    clearable
                  />
                </el-form-item>

                <el-form-item label="介绍" prop="bio">
                  <el-input
                    v-model="profileForm.bio"
                    type="textarea"
                    :rows="4"
                    maxlength="160"
                    show-word-limit
                    resize="vertical"
                  />
                </el-form-item>

                <el-form-item label="头像地址" prop="avatar">
                  <el-input
                    v-model="profileForm.avatar"
                    placeholder="https://... 或 /uploads/..."
                    clearable
                  />
                </el-form-item>

                <div class="form-actions">
                  <el-button
                    type="primary"
                    native-type="submit"
                    :loading="profileSaving"
                    :icon="useRenderIcon('ri:save-line')"
                  >
                    保存更改
                  </el-button>
                </div>
              </el-form>
            </div>
          </section>
        </el-tab-pane>

        <el-tab-pane label="高级配置" name="advanced">
          <section class="tab-content">
            <header class="section-header section-header-row">
              <h2>高级配置</h2>
              <el-button
                type="primary"
                :icon="useRenderIcon('ri:add-circle-line')"
                @click="openAdd"
              >
                新增配置
              </el-button>
            </header>

            <pure-table
              :data="advancedConfigList"
              :columns="columns"
              :loading="loading"
              align-whole="center"
              row-key="id"
              table-layout="auto"
            >
              <template #value="{ row }">
                <div class="value-cell" :title="formatValue(row.value)">
                  {{ formatValue(row.value) }}
                </div>
              </template>

              <template #operation="{ row }">
                <el-button
                  link
                  type="primary"
                  size="small"
                  :icon="useRenderIcon('ri:edit-line')"
                  @click="openEdit(row)"
                >
                  编辑
                </el-button>
                <el-popconfirm
                  :title="`确认删除配置 ${row.key}？`"
                  @confirm="handleDelete(row)"
                >
                  <template #reference>
                    <el-button
                      link
                      type="danger"
                      size="small"
                      :icon="useRenderIcon('ri:delete-bin-line')"
                    >
                      删除
                    </el-button>
                  </template>
                </el-popconfirm>
              </template>
            </pure-table>
          </section>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="min(520px, calc(100vw - 32px))"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
        <el-form-item label="配置键名" prop="key">
          <el-input
            v-model="form.key"
            :disabled="isEdit"
            placeholder="如 cloud_music_playlist_id"
          />
        </el-form-item>
        <el-form-item label="配置值" prop="value">
          <el-input
            v-model="form.value"
            type="textarea"
            :rows="3"
            placeholder="配置值"
          />
        </el-form-item>
        <el-form-item label="说明" prop="description">
          <el-input
            v-model="form.description"
            placeholder="配置项说明（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.site-config-card :deep(.el-card__body) {
  padding: 8px 20px 20px;
}

.tab-content {
  min-height: 420px;
  padding: 8px 4px 4px;
}

.section-header {
  padding: 4px 0 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.section-header h2 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
  line-height: 32px;
}

.profile-editor {
  display: grid;
  grid-template-columns: 176px minmax(0, 560px);
  gap: 40px;
  align-items: start;
  max-width: 820px;
  padding: 28px 4px 12px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.avatar-frame {
  display: grid;
  width: 132px;
  height: 132px;
  place-items: center;
  border: 1px solid var(--el-border-color-light);
  border-radius: 50%;
  background: var(--el-fill-color-light);
}

.avatar-frame :deep(.el-avatar) {
  color: var(--el-text-color-secondary);
  font-size: 32px;
  font-weight: 600;
}

.profile-form {
  width: 100%;
  min-width: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}

.value-cell {
  max-width: 320px;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 767px) {
  .site-config-page {
    padding: 12px;
  }

  .site-config-card :deep(.el-card__body) {
    padding: 8px 12px 16px;
  }

  .tab-content {
    min-height: 0;
  }

  .profile-editor {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
    padding-top: 24px;
  }

  .section-header-row {
    align-items: flex-start;
  }

  .form-actions .el-button {
    width: 100%;
    min-height: 44px;
  }
}
</style>
