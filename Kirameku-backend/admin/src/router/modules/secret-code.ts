import { secretCode } from "@/router/enums";

const Layout = () => import("@/layout/index.vue");

export default {
  path: "/secret-code",
  name: "SecretCode",
  component: Layout,
  redirect: "/secret-code/index",
  meta: {
    icon: "ri:key-2-line",
    title: "暗号管理",
    rank: secretCode
  },
  children: [
    {
      path: "/secret-code/index",
      name: "SecretCodeIndex",
      component: () => import("@/views/secret-code/index.vue"),
      meta: {
        title: "暗号管理"
      }
    }
  ]
} satisfies RouteConfigsTable;
