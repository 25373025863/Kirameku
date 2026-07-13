// siteConfig.ts - 全站配置中心

export const siteConfig = {
  // 网站标题与博主信息
  title: "shxashの站",
  url: "https://www.shuxiashu.top",
  authorName: "树下树",
  bio: "乐乐来了",

  // 头像设置
  avatarUrl: "/images/lucy.jpg",

  // 背景设置
  useGradient: false,
  themeColors: ["#a18cd1", "#fbc2eb", "#a1c4fd", "#c2e9fb"],
  bgImages: [
    "/images/1.webp",
    "/images/42.webp",
    "/images/20.webp",
    "/images/36.webp",
    "/images/39.webp",
    "/images/41.webp",
  ],

  // 默认封面图
  defaultPostCover: "/images/1.webp",

  // 照片墙预览图
  photoWallImage: "/images/photo-wall.jpg",

  // 云音乐配置（网易云音乐）
  // 填歌单 ID 则自动拉取整个歌单，填歌曲 ID 列表则只播放指定歌曲
  cloudMusicPlaylistId: "18130020001", // 歌单 ID（优先，需使用公开歌单 ID）
  cloudMusicIds: [],                     // 歌曲 ID 列表（歌单为空时使用）
  // 本地/Cloudreve/OneDrive 音频直链配置（优先级最高）
  // src 必须是浏览器能直接打开播放的 mp3/flac 等音频直链
  // cover 和 lrcUrl 留空时，会尝试自动读取音频文件内嵌封面与歌词
  directMusicList: [
    {
      id: "ai-zai-xi-yuan-qian",
      title: "爱在西元前",
      artist: "周杰伦",
      cover: "",
      src: "https://cloud.shuxiashu.top/f/bLSL/%E7%88%B1%E5%9C%A8%E8%A5%BF%E5%85%83%E5%89%8D%20-%20%E5%91%A8%E6%9D%B0%E4%BC%A6.flac",
      lrcUrl: "",
    },
  ],

  // 后端 API 地址（留空，开发通过 next.config.ts rewrites 代理，生产通过 Nginx 反代）
  apiBaseUrl: "",

  // 社交链接
  social: {
    github: "https://github.com/25373025863",

    google: "mattoolmuhammad161@gmail.com",
    email: "r2537302583@outlook.com",
    qq: "2537302583",
    wechat: "r17384828974",
  },

  // 站点信息
  buildDate: "2026-05-07T12:00:00",
  footerBadges: [
    { name: "Next.js 15", color: "text-sky-500" },
    { name: "React 19", color: "text-cyan-400" },
    { name: "Tailwind 4", color: "text-teal-400" },
  ],
  icpConfig: {
    name: "",
    link: "",
  },
  moeIcpConfig: {
    name: "",
    link: "",
  },

  // 分类标题
  chatterTitle: "留言",
  chatterDescription: "生活、技术、随想的碎片记录",
};
