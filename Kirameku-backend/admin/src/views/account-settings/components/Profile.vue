<script setup lang="ts">
import { message } from "@/utils/message";
import { onMounted, reactive, ref } from "vue";
import { getMine, updateMine } from "@/api/user";
import { uploadImage } from "@/api/album";
import type { FormInstance, FormRules } from "element-plus";
import ReCropperPreview from "@/components/ReCropperPreview";
import { deviceDetection } from "@pureadmin/utils";
import { useUserStoreHook } from "@/store/modules/user";
import uploadLine from "~icons/ri/upload-line";

defineOptions({
  name: "Profile"
});

const imgSrc = ref("");
const cropperBlob = ref();
const cropRef = ref();
const uploadRef = ref();
const isShow = ref(false);
const userInfoFormRef = ref<FormInstance>();
const submitting = ref(false);
const avatarUploading = ref(false);

type ProfileForm = {
  avatar: string;
  nickname: string;
  description: string;
};

const userInfos = reactive<ProfileForm>({
  avatar: "",
  nickname: "",
  description: ""
});

const rules = reactive<FormRules<ProfileForm>>({
  nickname: [{ required: true, message: "昵称必填", trigger: "blur" }]
});

const onChange = uploadFile => {
  const reader = new FileReader();
  reader.onload = e => {
    imgSrc.value = e.target.result as string;
    isShow.value = true;
  };
  reader.readAsDataURL(uploadFile.raw);
};

const handleClose = () => {
  cropRef.value.hidePopover();
  uploadRef.value.clearFiles();
  isShow.value = false;
};

const onCropper = ({ blob }) => (cropperBlob.value = blob);

const handleSubmitImage = async () => {
  if (!cropperBlob.value) return;
  avatarUploading.value = true;
  try {
    const file = new File([cropperBlob.value], "avatar.jpg", {
      type: "image/jpeg"
    });
    const res = await uploadImage(file);
    await updateMine({ avatar: res.url });
    userInfos.avatar = res.url;
    useUserStoreHook().SET_AVATAR(res.url);
    message("头像更新成功", { type: "success" });
    handleClose();
  } catch (e: any) {
    message(e?.message ?? "头像上传失败", { type: "error" });
  } finally {
    avatarUploading.value = false;
  }
};

const onSubmit = async (formEl?: FormInstance) => {
  if (!formEl) return;
  const valid = await formEl.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    const { code, message: msg } = await updateMine({
      nickname: userInfos.nickname,
      bio: userInfos.description
    });
    if (code === 0) {
      message("更新成功", { type: "success" });
      useUserStoreHook().SET_NICKNAME(userInfos.nickname);
    } else {
      message(msg || "更新失败", { type: "error" });
    }
  } catch (e: any) {
    message(e?.message ?? "更新失败", { type: "error" });
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  const { code, data } = await getMine();
  if (code === 0) {
    userInfos.avatar = data.avatar;
    userInfos.nickname = data.nickname;
    userInfos.description = data.description;
  }
});
</script>

<template>
  <div class="w-full max-w-xl">
    <el-form
      ref="userInfoFormRef"
      label-position="top"
      :rules="rules"
      :model="userInfos"
    >
      <el-form-item label="头像">
        <el-avatar :size="80" :src="userInfos.avatar" />
        <el-upload
          ref="uploadRef"
          accept="image/*"
          action="#"
          :limit="1"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="onChange"
        >
          <el-button plain class="avatar-upload-button ml-4!">
            <IconifyIconOffline :icon="uploadLine" />
            <span class="ml-2">更新头像</span>
          </el-button>
        </el-upload>
      </el-form-item>
      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="userInfos.nickname" placeholder="请输入昵称" />
      </el-form-item>
      <el-form-item label="简介">
        <el-input
          v-model="userInfos.description"
          placeholder="请输入简介"
          type="textarea"
          :autosize="{ minRows: 6, maxRows: 8 }"
          maxlength="56"
          show-word-limit
        />
      </el-form-item>
      <el-button
        class="profile-submit"
        type="primary"
        :loading="submitting"
        @click="onSubmit(userInfoFormRef)"
      >
        更新信息
      </el-button>
    </el-form>
    <el-dialog
      v-model="isShow"
      width="40%"
      title="编辑头像"
      destroy-on-close
      :closeOnClickModal="false"
      :before-close="handleClose"
      :fullscreen="deviceDetection()"
    >
      <ReCropperPreview ref="cropRef" :imgSrc="imgSrc" @cropper="onCropper" />
      <template #footer>
        <div class="dialog-footer">
          <el-button bg text @click="handleClose">取消</el-button>
          <el-button
            bg
            text
            type="primary"
            :loading="avatarUploading"
            @click="handleSubmitImage"
          >
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.avatar-upload-button,
.profile-submit {
  min-height: 40px;
}

@media (max-width: 767px) {
  .avatar-upload-button,
  .profile-submit {
    min-height: 44px;
  }

  .profile-submit {
    width: 100%;
  }
}
</style>
