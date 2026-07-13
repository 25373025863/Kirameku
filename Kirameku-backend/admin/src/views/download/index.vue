<script setup lang="ts">
import { onMounted, ref } from "vue";
import { message } from "@/utils/message";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import {
  createExternalDownload,
  deleteDownloadFile,
  getDownloadFiles,
  updateDownloadFile,
  uploadDownloadFile
} from "@/api/download";
import type { DownloadFileItem, DownloadSource } from "@/api/download";

defineOptions({ name: "DownloadIndex" });

const loading = ref(false);
const uploading = ref(false);
const dataList = ref<DownloadFileItem[]>([]);
const MUSIC_CATEGORY = "音乐";
const AUDIO_ACCEPT = "audio/*,.mp3,.flac,.m4a,.aac,.ogg,.oga,.wav";
type ViewMode = "files" | "music";
type TagType = "primary" | "success" | "warning" | "danger" | "info";
const viewMode = ref<ViewMode>("files");

const sourceOptions: Array<{ label: string; value: DownloadSource }> = [
  { label: "本地", value: "local" },
  { label: "Cloudreve", value: "cloudreve" },
  { label: "OneDrive", value: "onedrive" },
  { label: "普通外链", value: "link" }
];

const columns: TableColumnList = [
  { label: "ID", prop: "id", width: 70 },
  { label: "标题", prop: "title", minWidth: 180 },
  { label: "分类", prop: "category", width: 120 },
  { label: "来源", prop: "source_type", width: 110, slot: "source" },
  {
    label: "大小",
    prop: "file_size",
    width: 110,
    formatter: ({ file_size }) => formatSize(file_size)
  },
  { label: "公开", prop: "is_public", width: 90, slot: "public" },
  { label: "下载次数", prop: "download_count", width: 110 },
  {
    label: "创建时间",
    prop: "created_at",
    width: 170,
    formatter: ({ created_at }) =>
      created_at?.replace("T", " ").slice(0, 19) ?? ""
  },
  { label: "操作", fixed: "right", width: 260, slot: "operation" }
];

const uploadDialogVisible = ref(false);
const linkDialogVisible = ref(false);
const editDialogVisible = ref(false);
const selectedFile = ref<File | null>(null);
const uploadDialogTitle = ref("上传文件");
const uploadAccept = ref("");
const linkDialogTitle = ref("添加外链");

const uploadForm = ref({
  title: "",
  description: "",
  category: "",
  is_public: true,
  sort: 0
});

const linkForm = ref({
  id: 0,
  title: "",
  description: "",
  category: "",
  source_type: "cloudreve" as DownloadSource,
  external_url: "",
  original_filename: "",
  file_size: 0,
  mime_type: "",
  is_public: true,
  sort: 0
});

async function onSearch() {
  loading.value = true;
  try {
    dataList.value = await getDownloadFiles({ kind: viewMode.value });
  } finally {
    loading.value = false;
  }
}

function resetUploadForm(category = "") {
  selectedFile.value = null;
  uploadForm.value = {
    title: "",
    description: "",
    category,
    is_public: true,
    sort: 0
  };
}

function resetLinkForm(category = "") {
  linkForm.value = {
    id: 0,
    title: "",
    description: "",
    category,
    source_type: "cloudreve",
    external_url: "",
    original_filename: "",
    file_size: 0,
    mime_type: "",
    is_public: true,
    sort: 0
  };
}

function openUploadDialog() {
  viewMode.value = "files";
  resetUploadForm();
  uploadDialogTitle.value = "上传文件";
  uploadAccept.value = "";
  uploadDialogVisible.value = true;
}

function openMusicUploadDialog() {
  viewMode.value = "music";
  resetUploadForm(MUSIC_CATEGORY);
  uploadDialogTitle.value = "上传音乐";
  uploadAccept.value = AUDIO_ACCEPT;
  uploadDialogVisible.value = true;
}

function openLinkDialog() {
  viewMode.value = "files";
  resetLinkForm();
  linkDialogTitle.value = "添加外链";
  linkDialogVisible.value = true;
}

function openMusicLinkDialog() {
  viewMode.value = "music";
  resetLinkForm(MUSIC_CATEGORY);
  linkDialogTitle.value = "添加音乐外链";
  linkDialogVisible.value = true;
}

function openEditDialog(row: DownloadFileItem) {
  linkForm.value = {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    source_type: row.source_type,
    external_url: row.external_url,
    original_filename: row.original_filename,
    file_size: row.file_size,
    mime_type: row.mime_type,
    is_public: row.is_public,
    sort: row.sort
  };
  editDialogVisible.value = true;
}

function handleFileChange(uploadFile: any) {
  const file = uploadFile.raw || uploadFile.file || uploadFile;
  if (uploadAccept.value && file && !isAudioFile(file)) {
    selectedFile.value = null;
    message("请选择音频文件", { type: "warning" });
    return;
  }
  selectedFile.value = file ?? null;
  if (file && !uploadForm.value.title) {
    uploadForm.value.title = file.name.replace(/\.[^.]+$/, "");
  }
}

function isAudioFile(file: File) {
  if (file.type?.startsWith("audio/")) return true;
  return /\.(mp3|flac|m4a|aac|ogg|oga|wav)$/i.test(file.name);
}

async function handleUploadSubmit() {
  if (!selectedFile.value) {
    message("请先选择文件", { type: "warning" });
    return;
  }
  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append("file", selectedFile.value);
    formData.append("title", uploadForm.value.title);
    formData.append("description", uploadForm.value.description);
    formData.append("category", uploadForm.value.category);
    formData.append("is_public", String(uploadForm.value.is_public));
    formData.append("sort", String(uploadForm.value.sort));
    await uploadDownloadFile(formData);
    message("上传成功", { type: "success" });
    uploadDialogVisible.value = false;
    await onSearch();
  } catch (e: any) {
    message(e?.message ?? "上传失败", { type: "error" });
  } finally {
    uploading.value = false;
  }
}

async function handleLinkSubmit() {
  if (!linkForm.value.title || !linkForm.value.external_url) {
    message("请填写标题和链接", { type: "warning" });
    return;
  }
  try {
    const payload = { ...linkForm.value };
    delete (payload as any).id;
    if (linkForm.value.id) {
      await updateDownloadFile(linkForm.value.id, payload);
      message("更新成功", { type: "success" });
      editDialogVisible.value = false;
    } else {
      await createExternalDownload(payload);
      message("创建成功", { type: "success" });
      linkDialogVisible.value = false;
    }
    await onSearch();
  } catch (e: any) {
    message(e?.message ?? "保存失败", { type: "error" });
  }
}

async function togglePublic(row: DownloadFileItem) {
  await updateDownloadFile(row.id, { is_public: !row.is_public });
  await onSearch();
}

async function handleDelete(row: DownloadFileItem) {
  try {
    await deleteDownloadFile(row.id);
    message("删除成功", { type: "success" });
    await onSearch();
  } catch (e: any) {
    message(e?.message ?? "删除失败", { type: "error" });
  }
}

function openDownload(row: DownloadFileItem) {
  window.open(row.download_url, "_blank");
}

async function copyDownloadUrl(row: DownloadFileItem) {
  const url = `${window.location.origin}${row.download_url}`;
  await navigator.clipboard.writeText(url);
  message("已复制下载链接", { type: "success" });
}

function formatSize(size = 0) {
  if (!size) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = size;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function sourceType(row: DownloadFileItem): TagType {
  const map: Record<DownloadSource, TagType> = {
    local: "success",
    cloudreve: "primary",
    onedrive: "warning",
    link: "info"
  };
  return map[row.source_type] ?? "info";
}

onMounted(() => onSearch());
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <span class="font-medium">文件库</span>
            <el-radio-group v-model="viewMode" size="small" @change="onSearch">
              <el-radio-button label="files">下载文件</el-radio-button>
              <el-radio-button label="music">播放器音乐</el-radio-button>
            </el-radio-group>
          </div>
          <div class="flex gap-2">
            <el-dropdown v-if="viewMode === 'files'">
              <el-button
                type="primary"
                :icon="useRenderIcon('ri:add-circle-line')"
              >
                添加文件
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="openUploadDialog">
                    上传本地文件
                  </el-dropdown-item>
                  <el-dropdown-item @click="openLinkDialog">
                    添加文件外链
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-dropdown v-else>
              <el-button
                type="success"
                :icon="useRenderIcon('ri:music-2-line')"
              >
                添加音乐
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="openMusicUploadDialog">
                    上传本地音乐
                  </el-dropdown-item>
                  <el-dropdown-item @click="openMusicLinkDialog">
                    添加音乐外链
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
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
        <template #source="{ row }">
          <el-tag :type="sourceType(row)" size="small">
            {{ row.source_type }}
          </el-tag>
        </template>

        <template #public="{ row }">
          <el-switch :model-value="row.is_public" @change="togglePublic(row)" />
        </template>

        <template #operation="{ row }">
          <el-button
            link
            type="primary"
            :icon="useRenderIcon('ri:download-2-line')"
            @click="openDownload(row)"
          >
            下载
          </el-button>
          <el-button
            link
            :icon="useRenderIcon('ri:file-copy-line')"
            @click="copyDownloadUrl(row)"
          >
            复制
          </el-button>
          <el-button
            link
            type="primary"
            :icon="useRenderIcon('ri:edit-line')"
            @click="openEditDialog(row)"
          >
            编辑
          </el-button>
          <el-popconfirm
            :title="`确认删除「${row.title}」吗？`"
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
      v-model="uploadDialogVisible"
      :title="uploadDialogTitle"
      width="560px"
    >
      <el-form :model="uploadForm" label-width="96px">
        <el-form-item label="文件">
          <el-upload
            :auto-upload="false"
            :limit="1"
            :show-file-list="true"
            :accept="uploadAccept"
            :on-change="handleFileChange"
          >
            <el-button>选择文件</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="uploadForm.title" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="uploadForm.category" placeholder="可选" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="3"
            placeholder="Music: cover: https://... / lrc: https://..."
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="uploadForm.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="公开">
          <el-switch v-model="uploadForm.is_public" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="uploading"
          @click="handleUploadSubmit"
        >
          上传
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="linkDialogVisible"
      :title="linkDialogTitle"
      width="560px"
    >
      <el-form :model="linkForm" label-width="112px">
        <el-form-item label="来源">
          <el-select v-model="linkForm.source_type" class="w-full">
            <el-option
              v-for="item in sourceOptions.filter(s => s.value !== 'local')"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="linkForm.title" />
        </el-form-item>
        <el-form-item label="链接">
          <el-input
            v-model="linkForm.external_url"
            placeholder="Cloudreve 或 OneDrive 分享链接"
          />
        </el-form-item>
        <el-form-item label="文件名">
          <el-input v-model="linkForm.original_filename" placeholder="可选" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="linkForm.category" placeholder="可选" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="linkForm.description"
            type="textarea"
            :rows="3"
            placeholder="Music: cover: https://... / lrc: https://..."
          />
        </el-form-item>
        <el-form-item label="大小">
          <el-input-number
            v-model="linkForm.file_size"
            :min="0"
            :max="999999999999"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="linkForm.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="公开">
          <el-switch v-model="linkForm.is_public" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="linkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleLinkSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑文件" width="560px">
      <el-form :model="linkForm" label-width="112px">
        <el-form-item label="来源">
          <el-select v-model="linkForm.source_type" class="w-full">
            <el-option
              v-for="item in sourceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="linkForm.title" />
        </el-form-item>
        <el-form-item label="链接">
          <el-input
            v-model="linkForm.external_url"
            placeholder="仅外部文件需要填写"
          />
        </el-form-item>
        <el-form-item label="文件名">
          <el-input v-model="linkForm.original_filename" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="linkForm.category" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="linkForm.description"
            type="textarea"
            :rows="3"
            placeholder="Music: cover: https://... / lrc: https://..."
          />
        </el-form-item>
        <el-form-item label="大小">
          <el-input-number
            v-model="linkForm.file_size"
            :min="0"
            :max="999999999999"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="linkForm.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="公开">
          <el-switch v-model="linkForm.is_public" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleLinkSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
