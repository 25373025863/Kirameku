<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { message } from "@/utils/message";
import {
  getProjects,
  getProjectMetadata,
  createProject,
  updateProject,
  deleteProject
} from "@/api/project";
import type { ProjectItem, ProjectMetadata } from "@/api/project";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

defineOptions({ name: "ProjectIndex" });

const loading = ref(false);
const dataList = ref<ProjectItem[]>([]);
const typeFilter = ref<"all" | ProjectItem["project_type"]>("all");

const projectTypeOptions = [
  { value: "own", label: "我的项目" },
  { value: "favorite", label: "收藏项目" }
] as const;

const filteredDataList = computed(() => {
  if (typeFilter.value === "all") return dataList.value;
  return dataList.value.filter(item => item.project_type === typeFilter.value);
});

const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 60 },
  {
    label: "封面",
    prop: "cover_image",
    width: 80,
    slot: "cover"
  },
  { label: "名称", prop: "name", minWidth: 120 },
  {
    label: "归属",
    prop: "project_type",
    width: 100,
    slot: "projectType"
  },
  { label: "Slug", prop: "slug", width: 120 },
  {
    label: "描述",
    prop: "description",
    minWidth: 200,
    formatter: ({ description }: ProjectItem) =>
      description?.length > 60
        ? description.slice(0, 60) + "..."
        : description || "-"
  },
  {
    label: "技术栈",
    prop: "tech_stack",
    width: 150,
    slot: "tech"
  },
  {
    label: "状态",
    prop: "status",
    width: 100,
    slot: "status"
  },
  { label: "精选", prop: "is_featured", width: 70, slot: "featured" },
  { label: "排序", prop: "sort", width: 70 },
  {
    label: "创建时间",
    prop: "created_at",
    width: 170,
    formatter: ({ created_at }: ProjectItem) =>
      created_at?.replace("T", " ").slice(0, 19) ?? ""
  },
  { label: "操作", fixed: "right", width: 200, slot: "operation" }
];

const statusOptions = [
  { value: "developing", label: "开发中" },
  { value: "active", label: "已上线" },
  { value: "archived", label: "已归档" },
  { value: "planned", label: "计划中" }
];

async function onSearch() {
  loading.value = true;
  try {
    dataList.value = await getProjects();
  } finally {
    loading.value = false;
  }
}

// ========== 新增/编辑 ==========
const dialogVisible = ref(false);
const dialogTitle = ref("新增项目");
const form = ref(getDefaultForm());
const projectSourceUrl = ref("");
const metadataLoading = ref(false);
const loadedProjectUrl = ref("");

function getDefaultForm() {
  return {
    id: 0,
    name: "",
    slug: "",
    description: "",
    long_description: "",
    cover_image: "",
    tech_stack: [] as string[],
    link_github: "",
    link_gitee: "",
    link_live: "",
    link_docs: "",
    project_type: "own" as ProjectItem["project_type"],
    status: "developing",
    status_label: "",
    is_featured: false,
    sort: 0
  };
}

function setProjectDefaults(projectType: ProjectItem["project_type"]) {
  form.value.status = "active";
  form.value.status_label = projectType === "favorite" ? "已收藏" : "维护中";
}

function openDialog(row?: ProjectItem) {
  projectSourceUrl.value = "";
  loadedProjectUrl.value = "";
  if (row) {
    form.value = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || "",
      long_description: row.long_description || "",
      cover_image: row.cover_image || "",
      tech_stack: Array.isArray(row.tech_stack) ? [...row.tech_stack] : [],
      link_github: row.link_github || "",
      link_gitee: row.link_gitee || "",
      link_live: row.link_live || "",
      link_docs: row.link_docs || "",
      project_type: row.project_type || "own",
      status: row.status || "developing",
      status_label: row.status_label || "",
      is_featured: row.is_featured ?? false,
      sort: row.sort ?? 0
    };
    projectSourceUrl.value = row.link_github || row.link_gitee || "";
    loadedProjectUrl.value = projectSourceUrl.value;
    dialogTitle.value =
      row.project_type === "favorite" ? "修改收藏项目" : "修改我的项目";
  } else {
    form.value = getDefaultForm();
    const projectType = typeFilter.value === "favorite" ? "favorite" : "own";
    form.value.project_type = projectType;
    setProjectDefaults(projectType);
    dialogTitle.value =
      projectType === "favorite" ? "新增收藏项目" : "新增我的项目";
  }
  dialogVisible.value = true;
}

function handleProjectTypeChange(projectType: ProjectItem["project_type"]) {
  setProjectDefaults(projectType);
  dialogTitle.value =
    projectType === "favorite"
      ? form.value.id
        ? "修改收藏项目"
        : "新增收藏项目"
      : form.value.id
        ? "修改我的项目"
        : "新增我的项目";
}

function applyProjectMetadata(metadata: ProjectMetadata) {
  const { id, sort, is_featured, project_type } = form.value;
  form.value = {
    ...form.value,
    ...metadata,
    id,
    sort,
    is_featured,
    project_type,
    status: "active",
    status_label: project_type === "favorite" ? "已收藏" : "维护中"
  };
}

async function loadProjectMetadata(showSuccess = true): Promise<boolean> {
  const sourceUrl = projectSourceUrl.value.trim();
  if (!sourceUrl) {
    message("请粘贴项目地址", { type: "warning" });
    return false;
  }

  metadataLoading.value = true;
  try {
    const metadata = await getProjectMetadata(sourceUrl);
    applyProjectMetadata(metadata);
    projectSourceUrl.value =
      metadata.link_github || metadata.link_gitee || sourceUrl;
    loadedProjectUrl.value = projectSourceUrl.value;
    if (showSuccess) message("项目信息读取成功", { type: "success" });
    return true;
  } catch (e: any) {
    message(e?.response?.data?.detail ?? e?.message ?? "读取项目信息失败", {
      type: "error"
    });
    return false;
  } finally {
    metadataLoading.value = false;
  }
}

async function handleSubmit() {
  const sourceUrl = projectSourceUrl.value.trim();
  if (!sourceUrl) {
    message("请粘贴项目地址", { type: "warning" });
    return;
  }
  if (!form.value.name || loadedProjectUrl.value !== sourceUrl) {
    const loaded = await loadProjectMetadata(false);
    if (!loaded) return;
  }
  try {
    const payload = { ...form.value };
    delete (payload as any).id;
    if (form.value.id) {
      await updateProject(form.value.id, payload);
      message("项目更新成功", { type: "success" });
    } else {
      await createProject(payload);
      message("项目创建成功", { type: "success" });
    }
    dialogVisible.value = false;
    onSearch();
  } catch (e: any) {
    message(e?.response?.data?.detail ?? e?.message ?? "操作失败", {
      type: "error"
    });
  }
}

async function handleDelete(row: ProjectItem) {
  try {
    await deleteProject(row.id);
    message("删除成功", { type: "success" });
    onSearch();
  } catch (e: any) {
    message(e?.message ?? "删除失败", { type: "error" });
  }
}

function getStatusLabel(status: string): string {
  return statusOptions.find(s => s.value === status)?.label ?? status;
}

type TagType = "primary" | "success" | "warning" | "danger" | "info";

function getStatusType(status: string): TagType {
  const map: Record<string, TagType> = {
    developing: "warning",
    active: "success",
    archived: "info",
    planned: "primary"
  };
  return map[status] ?? "info";
}

function getProjectTypeLabel(projectType: ProjectItem["project_type"]): string {
  return (
    projectTypeOptions.find(option => option.value === projectType)?.label ??
    "我的项目"
  );
}

onMounted(() => onSearch());
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <div class="flex-bc flex-wrap gap-3">
          <div class="flex flex-wrap items-center gap-3">
            <span class="font-medium">项目管理</span>
            <el-radio-group v-model="typeFilter" size="small">
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button
                v-for="option in projectTypeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </el-radio-button>
            </el-radio-group>
          </div>
          <el-button
            type="primary"
            :icon="useRenderIcon('ri:add-circle-line')"
            @click="openDialog()"
          >
            新增项目
          </el-button>
        </div>
      </template>

      <pure-table
        :data="filteredDataList"
        :columns="columns"
        :loading="loading"
        align-whole="center"
        row-key="id"
        table-layout="auto"
      >
        <template #cover="{ row }">
          <el-image
            v-if="row.cover_image"
            :src="row.cover_image"
            fit="cover"
            preview-teleported
            class="size-12 rounded-lg"
          />
          <span v-else class="text-gray-400 text-xs">无</span>
        </template>

        <template #tech="{ row }">
          <div class="flex flex-wrap gap-1">
            <el-tag
              v-for="t in (row.tech_stack || []).slice(0, 3)"
              :key="t"
              size="small"
              type="info"
            >
              {{ t }}
            </el-tag>
            <el-tag
              v-if="(row.tech_stack || []).length > 3"
              size="small"
              type="info"
            >
              +{{ row.tech_stack.length - 3 }}
            </el-tag>
            <span v-if="!row.tech_stack?.length" class="text-gray-400 text-xs"
              >-</span
            >
          </div>
        </template>

        <template #projectType="{ row }">
          <el-tag
            :type="row.project_type === 'favorite' ? 'warning' : 'primary'"
            size="small"
          >
            {{ getProjectTypeLabel(row.project_type) }}
          </el-tag>
        </template>

        <template #status="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ row.status_label || getStatusLabel(row.status) }}
          </el-tag>
        </template>

        <template #featured="{ row }">
          <el-tag :type="row.is_featured ? 'danger' : 'info'" size="small">
            {{ row.is_featured ? "精选" : "普通" }}
          </el-tag>
        </template>

        <template #operation="{ row }">
          <el-button
            link
            type="primary"
            :icon="useRenderIcon('ri:edit-line')"
            @click="openDialog(row)"
          >
            修改
          </el-button>
          <el-popconfirm
            :title="`确认删除项目「${row.name}」？`"
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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="min(680px, calc(100vw - 24px))"
      destroy-on-close
    >
      <el-form :model="form" label-width="90px">
        <el-form-item label="项目归属">
          <el-radio-group
            v-model="form.project_type"
            @change="handleProjectTypeChange"
          >
            <el-radio-button
              v-for="option in projectTypeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="项目地址" required>
          <el-input
            v-model="projectSourceUrl"
            clearable
            placeholder="粘贴 GitHub 或 Gitee 项目地址"
            @change="loadProjectMetadata(false)"
            @keyup.enter="loadProjectMetadata()"
          >
            <template #append>
              <el-button
                :loading="metadataLoading"
                :icon="useRenderIcon('ri:magic-line')"
                @click="loadProjectMetadata()"
              >
                读取
              </el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item v-if="loadedProjectUrl" label="读取结果">
          <div class="w-full border-l-2 border-sky-400 pl-3">
            <div class="flex items-start gap-3">
              <el-image
                v-if="form.cover_image"
                :src="form.cover_image"
                fit="cover"
                class="h-16 w-28 shrink-0 rounded-md"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium">{{ form.name }}</p>
                <p
                  v-if="form.description"
                  class="mt-1 line-clamp-2 text-xs text-gray-500"
                >
                  {{ form.description }}
                </p>
                <div
                  v-if="form.tech_stack.length"
                  class="mt-2 flex flex-wrap gap-1"
                >
                  <el-tag
                    v-for="tech in form.tech_stack"
                    :key="tech"
                    size="small"
                    type="info"
                  >
                    {{ tech }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="metadataLoading"
          @click="handleSubmit"
        >
          {{
            form.id
              ? "保存"
              : form.project_type === "favorite"
                ? "添加收藏"
                : "添加项目"
          }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
