import { download } from "@/router/enums";

const Layout = () => import("@/layout/index.vue");

export default {
  path: "/download",
  name: "Download",
  component: Layout,
  redirect: "/download/index",
  meta: {
    icon: "ri:download-cloud-2-line",
    title: "文件库",
    rank: download
  },
  children: [
    {
      path: "/download/index",
      name: "DownloadIndex",
      component: () => import("@/views/download/index.vue"),
      meta: {
        title: "文件库"
      }
    }
  ]
} satisfies RouteConfigsTable;
