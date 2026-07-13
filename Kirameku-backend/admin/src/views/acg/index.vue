<script setup lang="ts">
import { onMounted, ref } from "vue";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import {
  deleteAcgItem,
  getAcgItems,
  importBangumiItem,
  refreshAcgItem,
  searchBangumi,
  updateAcgItem
} from "@/api/acg";
import type {
  AcgItem,
  AcgPersonalFields,
  AcgStatus,
  BangumiSearchItem
} from "@/api/acg";

defineOptions({ name: "AcgIndex" });

const loading = ref(false);
const dataList = ref<AcgItem[]>([]);
type TagType = "primary" | "success" | "warning" | "danger" | "info";
const statusOptions: Array<{
  value: AcgStatus;
  label: string;
  type: TagType;
}> = [
  { value: "watched", label: "已看完", type: "success" },
  { value: "watching", label: "在看", type: "primary" },
  { value: "plan", label: "想看", type: "warning" },
  { value: "on_hold", label: "搁置", type: "info" },
  { value: "dropped", label: "弃番", type: "danger" }
];

const columns: TableColumnList = [
  { label: "封面", prop: "cover_url", width: 76, slot: "cover" },
  { label: "作品", prop: "name_cn", minWidth: 210, slot: "title" },
  { label: "状态", prop: "status", width: 96, slot: "status" },
  { label: "进度", prop: "progress", width: 90, slot: "progress" },
  { label: "我的评分", prop: "personal_score", width: 100, slot: "score" },
  { label: "看完日期", prop: "watched_at", width: 120 },
  { label: "公开", prop: "is_public", width: 80, slot: "public" },
  { label: "操作", fixed: "right", width: 240, slot: "operation" }
];

async function onSearch() {
  loading.value = true;
  try {
    dataList.value = await getAcgItems();
  } finally {
    loading.value = false;
  }
}

function statusInfo(status: AcgStatus) {
  return statusOptions.find(item => item.value === status) ?? statusOptions[0];
}

const searchDialogVisible = ref(false);
const keyword = ref("");
const searching = ref(false);
const searchResults = ref<BangumiSearchItem[]>([]);

function openSearchDialog() {
  keyword.value = "";
  searchResults.value = [];
  searchDialogVisible.value = true;
}

async function handleBangumiSearch() {
  if (!keyword.value.trim()) {
    message("请输入作品名称", { type: "warning" });
    return;
  }
  searching.value = true;
  try {
    searchResults.value = await searchBangumi(keyword.value.trim());
  } catch (error: any) {
    message(error?.message ?? "Bangumi 搜索失败", { type: "error" });
  } finally {
    searching.value = false;
  }
}

function today() {
  const date = new Date();
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000
  );
  return localDate.toISOString().slice(0, 10);
}

async function handleImport(item: BangumiSearchItem) {
  try {
    const created = await importBangumiItem(item.bangumi_id, {
      status: "watched",
      progress: item.total_episodes,
      personal_score: 0,
      review: "",
      watched_at: today(),
      favorite: false,
      is_public: true,
      sort: 0
    });
    message("已加入 ACG 收藏", { type: "success" });
    searchDialogVisible.value = false;
    await onSearch();
    openEditDialog(created);
  } catch (error: any) {
    message(error?.message ?? "加入收藏失败", { type: "error" });
  }
}

const editDialogVisible = ref(false);
const editingTitle = ref("");
const editId = ref(0);
const form = ref<AcgPersonalFields>({
  status: "watched",
  progress: 0,
  personal_score: 0,
  review: "",
  watched_at: "",
  favorite: false,
  is_public: true,
  sort: 0
});

function openEditDialog(row: AcgItem) {
  editId.value = row.id;
  editingTitle.value = row.name_cn || row.name;
  form.value = {
    status: row.status,
    progress: row.progress,
    personal_score: row.personal_score,
    review: row.review || "",
    watched_at: row.watched_at || "",
    favorite: row.favorite,
    is_public: row.is_public,
    sort: row.sort
  };
  editDialogVisible.value = true;
}

async function handleSubmit() {
  try {
    await updateAcgItem(editId.value, {
      ...form.value,
      watched_at: form.value.watched_at || ""
    });
    message("收藏记录已更新", { type: "success" });
    editDialogVisible.value = false;
    await onSearch();
  } catch (error: any) {
    message(error?.message ?? "更新失败", { type: "error" });
  }
}

async function togglePublic(row: AcgItem) {
  await updateAcgItem(row.id, { is_public: !row.is_public });
  await onSearch();
}

async function handleRefresh(row: AcgItem) {
  try {
    await refreshAcgItem(row.id);
    message("Bangumi 资料已刷新", { type: "success" });
    await onSearch();
  } catch (error: any) {
    message(error?.message ?? "刷新失败", { type: "error" });
  }
}

async function handleDelete(row: AcgItem) {
  try {
    await deleteAcgItem(row.id);
    message("已从收藏中移除", { type: "success" });
    await onSearch();
  } catch (error: any) {
    message(error?.message ?? "删除失败", { type: "error" });
  }
}

onMounted(onSearch);
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <div class="flex-bc">
          <div>
            <div class="font-medium">ACG 收藏</div>
            <div class="mt-1 text-xs text-gray-400">
              {{ dataList.length }} 部作品
            </div>
          </div>
          <el-button
            type="primary"
            :icon="useRenderIcon('ri:search-line')"
            @click="openSearchDialog"
          >
            从 Bangumi 添加
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
        <template #cover="{ row }">
          <el-image
            :src="row.cover_url"
            fit="cover"
            preview-teleported
            class="h-16 w-12 rounded"
          />
        </template>
        <template #title="{ row }">
          <div class="text-left">
            <div class="font-medium">{{ row.name_cn || row.name }}</div>
            <div class="mt-1 truncate text-xs text-gray-400">
              {{ row.name_cn ? row.name : `Bangumi #${row.bangumi_id}` }}
            </div>
          </div>
        </template>
        <template #status="{ row }">
          <el-tag :type="statusInfo(row.status).type" size="small">
            {{ statusInfo(row.status).label }}
          </el-tag>
        </template>
        <template #progress="{ row }">
          {{ row.progress }} / {{ row.total_episodes || "?" }}
        </template>
        <template #score="{ row }">
          <span v-if="row.personal_score" class="font-medium text-amber-500">
            {{ row.personal_score.toFixed(1) }}
          </span>
          <span v-else class="text-gray-400">-</span>
        </template>
        <template #public="{ row }">
          <el-switch :model-value="row.is_public" @change="togglePublic(row)" />
        </template>
        <template #operation="{ row }">
          <el-button
            link
            type="primary"
            :icon="useRenderIcon('ri:edit-line')"
            @click="openEditDialog(row)"
            >编辑</el-button
          >
          <el-button
            link
            :icon="useRenderIcon('ri:refresh-line')"
            @click="handleRefresh(row)"
            >刷新资料</el-button
          >
          <el-popconfirm
            :title="`确认移除《${row.name_cn || row.name}》？`"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button
                link
                type="danger"
                :icon="useRenderIcon('ri:delete-bin-line')"
                >移除</el-button
              >
            </template>
          </el-popconfirm>
        </template>
      </pure-table>
    </el-card>

    <el-dialog v-model="searchDialogVisible" title="搜索 Bangumi" width="760px">
      <div class="mb-4 flex gap-2">
        <el-input
          v-model="keyword"
          clearable
          placeholder="输入中文、日文或英文作品名"
          @keyup.enter="handleBangumiSearch"
        />
        <el-button
          type="primary"
          :loading="searching"
          @click="handleBangumiSearch"
        >
          搜索
        </el-button>
      </div>
      <div v-loading="searching" class="max-h-[58vh] space-y-2 overflow-y-auto">
        <div
          v-for="item in searchResults"
          :key="item.bangumi_id"
          class="flex items-center gap-3 border-b border-gray-100 py-3 dark:border-gray-700"
        >
          <el-image
            :src="item.cover_url"
            fit="cover"
            class="h-20 w-14 shrink-0 rounded"
          />
          <div class="min-w-0 flex-1">
            <div class="truncate font-medium">
              {{ item.name_cn || item.name }}
            </div>
            <div class="mt-1 truncate text-xs text-gray-400">
              {{ item.name }}
            </div>
            <div class="mt-2 flex gap-3 text-xs text-gray-500">
              <span>{{ item.air_date || "日期未知" }}</span>
              <span>{{ item.total_episodes || "?" }} 集</span>
              <span v-if="item.score">Bangumi {{ item.score.toFixed(1) }}</span>
            </div>
          </div>
          <el-button type="primary" plain @click="handleImport(item)"
            >加入收藏</el-button
          >
        </div>
        <el-empty
          v-if="!searching && !searchResults.length"
          description="输入作品名开始搜索"
        />
      </div>
    </el-dialog>

    <el-dialog
      v-model="editDialogVisible"
      :title="`编辑 · ${editingTitle}`"
      width="560px"
    >
      <el-form :model="form" label-width="92px">
        <el-form-item label="观看状态">
          <el-select v-model="form.status" class="w-full">
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="观看进度">
          <el-input-number v-model="form.progress" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="个人评分">
          <el-input-number
            v-model="form.personal_score"
            :min="0"
            :max="10"
            :step="0.5"
            :precision="1"
          />
          <span class="ml-2 text-xs text-gray-400">满分 10 分</span>
        </el-form-item>
        <el-form-item label="看完日期">
          <el-date-picker
            v-model="form.watched_at"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="短评">
          <el-input
            v-model="form.review"
            type="textarea"
            :rows="5"
            maxlength="2000"
            show-word-limit
            placeholder="写下看完后的感受"
          />
        </el-form-item>
        <el-form-item label="特别喜欢">
          <el-switch v-model="form.favorite" />
        </el-form-item>
        <el-form-item label="公开展示">
          <el-switch v-model="form.is_public" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
