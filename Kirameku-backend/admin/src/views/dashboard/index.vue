<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useDark, useECharts } from "@pureadmin/utils";
import { getDashboardStats } from "@/api/dashboard";
import type { DashboardStats } from "@/api/dashboard";
import { message } from "@/utils/message";
import { useUserStoreHook } from "@/store/modules/user";

import FileText from "~icons/lucide/file-text";
import FilePenLine from "~icons/lucide/file-pen-line";
import FolderOpen from "~icons/lucide/folder-open";
import Tags from "~icons/lucide/tags";
import MessageCircle from "~icons/lucide/message-circle";
import Mail from "~icons/lucide/mail";
import Eye from "~icons/lucide/eye";
import PenLine from "~icons/lucide/pen-line";
import TrendingUp from "~icons/lucide/trending-up";
import ChartPie from "~icons/lucide/chart-pie";
import MonitorSmartphone from "~icons/lucide/monitor-smartphone";

defineOptions({ name: "Dashboard" });

const router = useRouter();
const { isDark } = useDark();
const theme = computed(() => (isDark.value ? "dark" : "light"));
const loading = ref(true);
const stats = ref<DashboardStats | null>(null);

const displayName = computed(() => {
  const user = useUserStoreHook();
  return user.nickname || user.username || "管理员";
});

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了";
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
});

const todayLabel = new Intl.DateTimeFormat("zh-CN", {
  month: "long",
  day: "numeric",
  weekday: "long"
}).format(new Date());

const statCards = computed(() => {
  if (!stats.value) return [];
  const counts = stats.value.counts;
  return [
    {
      title: "已发布文章",
      value: counts.posts,
      icon: FileText,
      tone: "sky"
    },
    { title: "草稿", value: counts.drafts, icon: FilePenLine, tone: "amber" },
    {
      title: "分类",
      value: counts.categories,
      icon: FolderOpen,
      tone: "violet"
    },
    { title: "标签", value: counts.tags, icon: Tags, tone: "emerald" },
    {
      title: "评论",
      value: counts.comments,
      icon: MessageCircle,
      tone: "rose"
    },
    { title: "留言", value: counts.messages, icon: Mail, tone: "cyan" },
    { title: "访问次数", value: counts.visitors, icon: Eye, tone: "slate" }
  ];
});

const commonGrid = {
  top: 24,
  left: 16,
  right: 16,
  bottom: 12,
  containLabel: true
};

const postTrendRef = ref();
const { setOptions: setPostTrend } = useECharts(postTrendRef, { theme });

function updatePostTrend() {
  if (!stats.value) return;
  const data = stats.value.post_trend;
  setPostTrend({
    tooltip: { trigger: "axis" },
    grid: commonGrid,
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.map(item => item.date.slice(5)),
      axisTick: { show: false },
      axisLabel: { fontSize: 11 }
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.14)" } }
    },
    series: [
      {
        name: "发布数",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        showSymbol: false,
        lineStyle: { width: 3 },
        areaStyle: { opacity: 0.1 },
        color: "#0ea5e9",
        data: data.map(item => item.count)
      }
    ]
  });
}

const visitorTrendRef = ref();
const { setOptions: setVisitorTrend } = useECharts(visitorTrendRef, { theme });

function updateVisitorTrend() {
  if (!stats.value) return;
  const data = stats.value.visitor_trend;
  setVisitorTrend({
    tooltip: { trigger: "axis" },
    grid: commonGrid,
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.map(item => item.date.slice(5)),
      axisTick: { show: false },
      axisLabel: { fontSize: 11 }
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.14)" } }
    },
    series: [
      {
        name: "访问次数",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        showSymbol: false,
        lineStyle: { width: 3 },
        areaStyle: { opacity: 0.1 },
        color: "#f43f5e",
        data: data.map(item => item.count)
      }
    ]
  });
}

const categoryRef = ref();
const { setOptions: setCategory } = useECharts(categoryRef, { theme });

function updateCategory() {
  if (!stats.value) return;
  const data = stats.value.category_distribution;
  setCategory({
    color: ["#0ea5e9", "#f59e0b", "#10b981", "#f43f5e", "#8b5cf6"],
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: {
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 11 }
    },
    series: [
      {
        type: "pie",
        radius: ["48%", "70%"],
        center: ["50%", "44%"],
        itemStyle: {
          borderRadius: 5,
          borderColor: "transparent",
          borderWidth: 2
        },
        label: { show: false },
        emphasis: { scaleSize: 5 },
        data: data.length ? data : [{ name: "暂无数据", value: 0 }]
      }
    ]
  });
}

const browserRef = ref();
const { setOptions: setBrowser } = useECharts(browserRef, { theme });

function updateBrowser() {
  if (!stats.value) return;
  const data = stats.value.browser_distribution;
  setBrowser({
    color: ["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#64748b"],
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: {
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 11 }
    },
    series: [
      {
        type: "pie",
        radius: ["48%", "70%"],
        center: ["50%", "44%"],
        itemStyle: {
          borderRadius: 5,
          borderColor: "transparent",
          borderWidth: 2
        },
        label: { show: false },
        emphasis: { scaleSize: 5 },
        data: data.length ? data : [{ name: "暂无数据", value: 0 }]
      }
    ]
  });
}

async function loadDashboard() {
  loading.value = true;
  try {
    stats.value = await getDashboardStats();
    await nextTick();
    updatePostTrend();
    updateVisitorTrend();
    updateCategory();
    updateBrowser();
  } catch (error: any) {
    message(error?.message ?? "加载统计数据失败", { type: "error" });
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<template>
  <div v-loading="loading" class="dashboard-page">
    <section class="dashboard-intro">
      <div>
        <p class="dashboard-date">{{ todayLabel }}</p>
        <h1>{{ greeting }}，{{ displayName }}</h1>
        <p class="dashboard-subtitle">这里是今天的站点概览。</p>
      </div>
      <el-button type="primary" @click="router.push('/post/edit')">
        <IconifyIconOffline :icon="PenLine" />
        <span>写文章</span>
      </el-button>
    </section>

    <section class="stat-grid" aria-label="站点统计">
      <article
        v-for="item in statCards"
        :key="item.title"
        class="stat-card"
        :data-tone="item.tone"
      >
        <span class="stat-icon" aria-hidden="true">
          <IconifyIconOffline :icon="item.icon" />
        </span>
        <div>
          <p>{{ item.title }}</p>
          <strong>{{ item.value }}</strong>
        </div>
      </article>
    </section>

    <section class="dashboard-grid dashboard-grid-trends">
      <article class="chart-panel">
        <header class="chart-header">
          <span class="chart-icon sky" aria-hidden="true">
            <IconifyIconOffline :icon="TrendingUp" />
          </span>
          <div>
            <h2>文章发布趋势</h2>
            <p>近 30 天</p>
          </div>
        </header>
        <div ref="postTrendRef" class="chart-canvas" />
      </article>

      <article class="chart-panel">
        <header class="chart-header">
          <span class="chart-icon rose" aria-hidden="true">
            <IconifyIconOffline :icon="Eye" />
          </span>
          <div>
            <h2>访问趋势</h2>
            <p>近 30 天</p>
          </div>
        </header>
        <div ref="visitorTrendRef" class="chart-canvas" />
      </article>
    </section>

    <section class="dashboard-grid dashboard-grid-distribution">
      <article class="chart-panel">
        <header class="chart-header">
          <span class="chart-icon amber" aria-hidden="true">
            <IconifyIconOffline :icon="ChartPie" />
          </span>
          <div>
            <h2>分类分布</h2>
            <p>已发布文章</p>
          </div>
        </header>
        <div ref="categoryRef" class="chart-canvas chart-canvas-pie" />
      </article>

      <article class="chart-panel">
        <header class="chart-header">
          <span class="chart-icon emerald" aria-hidden="true">
            <IconifyIconOffline :icon="MonitorSmartphone" />
          </span>
          <div>
            <h2>浏览器分布</h2>
            <p>访客设备</p>
          </div>
        </header>
        <div ref="browserRef" class="chart-canvas chart-canvas-pie" />
      </article>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dashboard-intro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 92px;
  padding: 8px 2px 10px;
  gap: 20px;

  .dashboard-date {
    color: var(--kira-primary-hover);
    font-size: 12px;
    font-weight: 700;
  }

  h1 {
    margin-top: 5px;
    color: var(--kira-text);
    font-size: 24px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: 0;
  }

  .dashboard-subtitle {
    margin-top: 6px;
    color: var(--kira-text-muted);
    font-size: 14px;
  }
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  display: flex;
  min-width: 0;
  min-height: 92px;
  padding: 16px;
  align-items: center;
  gap: 12px;
  background: var(--kira-surface);
  border: 1px solid var(--kira-border);
  border-radius: var(--kira-radius);
  box-shadow: var(--kira-shadow-sm);
  transition:
    border-color var(--kira-transition),
    box-shadow var(--kira-transition),
    transform var(--kira-transition);

  &:hover {
    border-color: var(--kira-border-strong);
    box-shadow: var(--kira-shadow-md);
    transform: translateY(-2px);
  }

  .stat-icon {
    display: inline-flex;
    flex: 0 0 38px;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    color: var(--stat-color);
    background: var(--stat-bg);
    border-radius: var(--kira-radius);
  }

  div {
    min-width: 0;
  }

  p {
    overflow: hidden;
    color: var(--kira-text-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 5px;
    color: var(--kira-text);
    font-size: 22px;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  &[data-tone="sky"] {
    --stat-color: #0284c7;
    --stat-bg: rgb(14 165 233 / 12%);
  }

  &[data-tone="amber"] {
    --stat-color: #d97706;
    --stat-bg: rgb(245 158 11 / 13%);
  }

  &[data-tone="violet"] {
    --stat-color: #7c3aed;
    --stat-bg: rgb(139 92 246 / 12%);
  }

  &[data-tone="emerald"] {
    --stat-color: #059669;
    --stat-bg: rgb(16 185 129 / 12%);
  }

  &[data-tone="rose"] {
    --stat-color: #e11d48;
    --stat-bg: rgb(244 63 94 / 12%);
  }

  &[data-tone="cyan"] {
    --stat-color: #0891b2;
    --stat-bg: rgb(6 182 212 / 12%);
  }

  &[data-tone="slate"] {
    --stat-color: #475569;
    --stat-bg: rgb(100 116 139 / 12%);
  }
}

.dark .stat-card[data-tone="sky"],
.dark .stat-card[data-tone="cyan"] {
  --stat-color: #38bdf8;
}

.dark .stat-card[data-tone="amber"] {
  --stat-color: #fbbf24;
}

.dark .stat-card[data-tone="violet"] {
  --stat-color: #a78bfa;
}

.dark .stat-card[data-tone="emerald"] {
  --stat-color: #34d399;
}

.dark .stat-card[data-tone="rose"] {
  --stat-color: #fb7185;
}

.dark .stat-card[data-tone="slate"] {
  --stat-color: #cbd5e1;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.chart-panel {
  min-width: 0;
  padding: 18px;
  background: var(--kira-surface);
  border: 1px solid var(--kira-border);
  border-radius: var(--kira-radius);
  box-shadow: var(--kira-shadow-sm);
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 10px;

  .chart-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 7px;

    &.sky {
      color: #0284c7;
      background: rgb(14 165 233 / 12%);
    }

    &.rose {
      color: #e11d48;
      background: rgb(244 63 94 / 12%);
    }

    &.amber {
      color: #d97706;
      background: rgb(245 158 11 / 13%);
    }

    &.emerald {
      color: #059669;
      background: rgb(16 185 129 / 12%);
    }
  }

  h2 {
    color: var(--kira-text);
    font-size: 15px;
    font-weight: 700;
    line-height: 1.3;
  }

  p {
    margin-top: 2px;
    color: var(--kira-text-muted);
    font-size: 11px;
  }
}

.chart-canvas {
  width: 100%;
  height: 280px;
  margin-top: 8px;
}

.chart-canvas-pie {
  height: 260px;
}

@media (width <= 1280px) {
  .stat-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (width <= 900px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stat-card:last-child:nth-child(odd) {
    grid-column: span 2;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (width <= 560px) {
  .dashboard-intro {
    align-items: flex-start;
    min-height: auto;

    h1 {
      font-size: 20px;
    }

    .dashboard-subtitle {
      display: none;
    }
  }

  .stat-grid {
    gap: 8px;
  }

  .stat-card {
    min-height: 82px;
    padding: 12px;
    gap: 9px;

    .stat-icon {
      flex-basis: 34px;
      width: 34px;
      height: 34px;
    }

    strong {
      font-size: 19px;
    }
  }

  .chart-panel {
    padding: 14px;
  }

  .chart-canvas {
    height: 240px;
  }
}
</style>
