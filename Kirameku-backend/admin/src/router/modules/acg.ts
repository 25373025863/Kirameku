import { acg } from "@/router/enums";

const Layout = () => import("@/layout/index.vue");

export default {
  path: "/acg",
  name: "Acg",
  component: Layout,
  redirect: "/acg/index",
  meta: {
    icon: "ri:movie-2-line",
    title: "ACG 收藏",
    rank: acg
  },
  children: [
    {
      path: "/acg/index",
      name: "AcgIndex",
      component: () => import("@/views/acg/index.vue"),
      meta: { title: "ACG 收藏" }
    }
  ]
} satisfies RouteConfigsTable;
