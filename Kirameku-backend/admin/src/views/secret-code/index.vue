<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import {
  createSecretCode,
  deleteSecretCode,
  getSecretCodes,
  resetSecretCodeUses,
  updateSecretCode
} from "@/api/secretCode";
import type {
  SecretCodeItem,
  SecretCodePayload,
  SecretCodeTargetType
} from "@/api/secretCode";

defineOptions({ name: "SecretCodeIndex" });

type TagType = "primary" | "success" | "warning" | "danger" | "info";

const targetOptions: Array<{
  value: SecretCodeTargetType;
  label: string;
  tag: TagType;
}> = [
  { value: "internal", label: "站内页面", tag: "primary" },
  { value: "external", label: "外部网址", tag: "success" },
  { value: "download", label: "下载地址", tag: "warning" }
];

const loading = ref(false);
const saving = ref(false);
const dataList = ref<SecretCodeItem[]>([]);
const dialogVisible = ref(false);
const dialogTitle = ref("新增暗号");
const formRef = ref();
const advancedSections = ref<string[]>([]);
const form = ref(getDefaultForm());

const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 64 },
  { label: "名称", prop: "name", minWidth: 130 },
  { label: "暗号", prop: "code", minWidth: 150, slot: "code" },
  { label: "类型", prop: "target_type", width: 110, slot: "targetType" },
  { label: "目标地址", prop: "target_url", minWidth: 240, slot: "target" },
  { label: "状态", prop: "is_active", width: 100, slot: "status" },
  { label: "使用情况", prop: "use_count", width: 110, slot: "usage" },
  { label: "过期时间", prop: "expires_at", width: 170, slot: "expires" },
  { label: "最近使用", prop: "last_used_at", width: 170, slot: "lastUsed" },
  { label: "操作", fixed: "right", width: 230, slot: "operation" }
];

const targetPlaceholder = computed(() => {
  if (form.value.target_type === "internal") return "/garden";
  if (form.value.target_type === "download") {
    return "/api/downloads/1/download 或 https://...";
  }
  return "https://example.com";
});

const rules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入暗号", trigger: "blur" }],
  target_url: [{ required: true, message: "请输入目标地址", trigger: "blur" }]
};

function getDefaultForm() {
  return {
    id: 0,
    name: "",
    code: "",
    description: "",
    target_type: "internal" as SecretCodeTargetType,
    target_url: "",
    is_active: true,
    expires_at: null as string | null,
    max_uses: 0
  };
}

function formatTime(value: string | null): string {
  return value ? value.replace("T", " ").slice(0, 19) : "-";
}

function getTargetOption(targetType: SecretCodeTargetType) {
  return (
    targetOptions.find(option => option.value === targetType) ??
    targetOptions[0]
  );
}

function getStatus(row: SecretCodeItem): { label: string; type: TagType } {
  if (!row.is_active) return { label: "已停用", type: "info" };
  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
    return { label: "已过期", type: "warning" };
  }
  if (row.max_uses > 0 && row.use_count >= row.max_uses) {
    return { label: "次数用尽", type: "danger" };
  }
  return { label: "可使用", type: "success" };
}

async function onSearch() {
  loading.value = true;
  try {
    dataList.value = await getSecretCodes();
  } finally {
    loading.value = false;
  }
}

function openDialog(row?: SecretCodeItem) {
  if (row) {
    dialogTitle.value = "修改暗号";
    form.value = {
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description || "",
      target_type: row.target_type,
      target_url: row.target_url,
      is_active: row.is_active,
      expires_at: row.expires_at,
      max_uses: row.max_uses
    };
    advancedSections.value =
      row.expires_at || row.max_uses > 0 ? ["limits"] : [];
  } else {
    dialogTitle.value = "新增暗号";
    form.value = getDefaultForm();
    advancedSections.value = [];
  }
  dialogVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  const payload: SecretCodePayload = {
    name: form.value.name.trim(),
    code: form.value.code.trim(),
    description: form.value.description.trim(),
    target_type: form.value.target_type,
    target_url: form.value.target_url.trim(),
    is_active: form.value.is_active,
    expires_at: form.value.expires_at || null,
    max_uses: form.value.max_uses
  };

  saving.value = true;
  try {
    if (form.value.id) {
      await updateSecretCode(form.value.id, payload);
      message("暗号更新成功", { type: "success" });
    } else {
      await createSecretCode(payload);
      message("暗号创建成功", { type: "success" });
    }
    dialogVisible.value = false;
    await onSearch();
  } catch (error: any) {
    message(error?.response?.data?.detail ?? error?.message ?? "保存暗号失败", {
      type: "error"
    });
  } finally {
    saving.value = false;
  }
}

async function toggleActive(row: SecretCodeItem) {
  try {
    await updateSecretCode(row.id, { is_active: !row.is_active });
    message(row.is_active ? "暗号已停用" : "暗号已启用", {
      type: "success"
    });
    await onSearch();
  } catch (error: any) {
    message(error?.response?.data?.detail ?? error?.message ?? "操作失败", {
      type: "error"
    });
  }
}

async function copyText(value: string, label: string) {
  await navigator.clipboard.writeText(value);
  message(`${label}已复制`, { type: "success" });
}

async function resetUses(row: SecretCodeItem) {
  try {
    await resetSecretCodeUses(row.id);
    message("使用统计已重置", { type: "success" });
    await onSearch();
  } catch (error: any) {
    message(error?.response?.data?.detail ?? error?.message ?? "重置失败", {
      type: "error"
    });
  }
}

async function handleDelete(row: SecretCodeItem) {
  try {
    await deleteSecretCode(row.id);
    message("暗号已删除", { type: "success" });
    await onSearch();
  } catch (error: any) {
    message(error?.response?.data?.detail ?? error?.message ?? "删除失败", {
      type: "error"
    });
  }
}

onMounted(() => onSearch());
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <div class="flex-bc gap-3">
          <span class="font-medium">暗号管理</span>
          <el-button
            type="primary"
            :icon="useRenderIcon('ri:add-circle-line')"
            @click="openDialog()"
          >
            新增暗号
          </el-button>
        </div>
      </template>

      <pure-table
        :data="dataList"
        :columns="columns"
        :loading="loading"
        align-whole="center"
        row-key="id"
        table-layout="auto"
      >
        <template #code="{ row }">
          <div class="flex-c gap-1">
            <code
              class="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800"
            >
              {{ row.code }}
            </code>
            <el-button
              link
              :icon="useRenderIcon('ri:file-copy-line')"
              title="复制暗号"
              @click="copyText(row.code, '暗号')"
            />
          </div>
        </template>

        <template #targetType="{ row }">
          <el-tag :type="getTargetOption(row.target_type).tag" size="small">
            {{ getTargetOption(row.target_type).label }}
          </el-tag>
        </template>

        <template #target="{ row }">
          <div class="flex-c min-w-0 gap-1">
            <el-tooltip :content="row.target_url" placement="top">
              <span class="max-w-56 truncate text-sm">{{
                row.target_url
              }}</span>
            </el-tooltip>
            <el-button
              link
              :icon="useRenderIcon('ri:file-copy-line')"
              title="复制地址"
              @click="copyText(row.target_url, '地址')"
            />
          </div>
        </template>

        <template #status="{ row }">
          <el-tooltip content="点击切换启用状态" placement="top">
            <el-tag
              :type="getStatus(row).type"
              size="small"
              class="cursor-pointer"
              @click="toggleActive(row)"
            >
              {{ getStatus(row).label }}
            </el-tag>
          </el-tooltip>
        </template>

        <template #usage="{ row }">
          <span class="tabular-nums">
            {{ row.use_count }} / {{ row.max_uses || "∞" }}
          </span>
        </template>

        <template #expires="{ row }">
          {{ formatTime(row.expires_at) }}
        </template>

        <template #lastUsed="{ row }">
          {{ formatTime(row.last_used_at) }}
        </template>

        <template #operation="{ row }">
          <el-button
            link
            type="primary"
            :icon="useRenderIcon('ri:edit-line')"
            @click="openDialog(row)"
          >
            编辑
          </el-button>
          <el-button
            v-if="row.use_count > 0"
            link
            :icon="useRenderIcon('ri:restart-line')"
            @click="resetUses(row)"
          >
            重置
          </el-button>
          <el-popconfirm
            :title="`确认删除暗号「${row.name}」？`"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button
                link
                type="danger"
                :icon="useRenderIcon('ri:delete-bin-line')"
              >
                删除
              </el-button>
            </template>
          </el-popconfirm>
        </template>
      </pure-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="min(640px, calc(100vw - 24px))"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="92px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：星港入口" />
        </el-form-item>
        <el-form-item label="暗号" prop="code">
          <el-input
            v-model="form.code"
            placeholder="输入后用于首页识别"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="目标类型">
          <el-radio-group v-model="form.target_type">
            <el-radio-button
              v-for="option in targetOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="目标地址" prop="target_url">
          <el-input
            v-model="form.target_url"
            :placeholder="targetPlaceholder"
            clearable
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="可选，仅用于后台备注"
          />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.is_active" />
        </el-form-item>

        <el-collapse v-model="advancedSections">
          <el-collapse-item title="高级限制" name="limits">
            <el-form-item label="过期时间">
              <el-date-picker
                v-model="form.expires_at"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss"
                placeholder="不设置则长期有效"
                class="w-full"
                clearable
              />
            </el-form-item>
            <el-form-item label="最多使用">
              <el-input-number v-model="form.max_uses" :min="0" :max="999999" />
              <span class="ml-2 text-xs text-gray-400">0 表示不限次数</span>
            </el-form-item>
          </el-collapse-item>
        </el-collapse>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
