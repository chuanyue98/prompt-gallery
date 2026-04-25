---
name: Lottie 动画集成 (Lottie Animation Integration)
description: 关于在 React 应用中使用 lottie-react 集成 Lottie 动画的指南
---

# Lottie 动画集成指南

## 概述
本技能文档提供了一套在 React 应用中集成 Lottie 动画的标准工作流。涵盖了安装、资源管理以及使用 `lottie-react` 控制动画的最佳实践。

## 前置条件
- 一个 React 项目 (Vite, Next.js, 或 Rsbuild)
- 一个标准的 Lottie JSON 文件 (从 After Effects, Figma 导出或从 LottieFiles 下载)

## 技术栈
- **核心库**: `lottie-react` (轻量、维护良好的 Hook 风格库)
- **格式**: `.json` (标准 Lottie 格式)

## 动画资源获取策略 (Animation Sourcing Strategy)

在集成 Lottie 动画时，遵循以下优先级：

1. **AI 手搓 (AI Hand-crafting)**: 
   对于简单的微交互（如箭头跳动、淡入淡出、缩放、简单的路径位移），**强烈建议由 AI 直接编写 JSON 代码**。
   - **优势**: 响应速度极快，代码极其精简，且能精准适配项目的品牌色（Primary Color）和交互节奏。
   - **技巧**: 通过定义 `shapes` 里的 `path` 和 `ks`（Transform）里的 `k`（Keyframes）来实现基础动效。

2. **外部资源引用 (Fallback Strategy)**:
   对于复杂的角色动画、流畅的插画动效或复杂的粒子效果，如果 AI 难以手搓，应当：
   - 前往 [LottieFiles Featured Free Animations](https://lottiefiles.com/featured-free-animations) 下载或参考现成的动画资源。
   - 优先选择 Free 资源，并确保 JSON 结构与 `lottie-react` 兼容。

## 实现步骤

### 1. 安装
在目标工作区/应用中安装库：
```bash
# 使用 Yarn (推荐)
yarn add lottie-react

# 使用 NPM
npm install lottie-react
```

### 2. 资源放置
将 JSON 动画文件放置在组件附近的专用 assets 目录或共享 assets 文件夹中。
*示例*: `src/pages/FeatureName/assets/animation-name.json`

### 3. 基础用法 (组件式)
适用于简单的循环动画（如加载转圈、背景特效）：

```tsx
import Lottie from 'lottie-react'
import animationData from './assets/animation.json'

const SimpleAnimation = () => {
  return (
    <Lottie 
      animationData={animationData} 
      loop={true} 
      style={{ width: 100, height: 100 }} 
    />
  )
}
```

### 4. 高级控制 (交互式)
对于需要响应用户交互（如点击点赞、切换开关）的动画，需要使用 `lottieRef`。

**核心概念**:
- **`lottieRef.current.playSegments([start, end], true)`**: 清除等待队列并播放指定片段。
- **`lottieRef.current.goToAndStop(frame, true)`**: 跳转到指定帧并暂停。`true` 表示按帧数跳转（而非时间）。
- **`autoplay={false}`**: 对于交互式动画至关重要，防止加载时自动播放。

**实现模式**:

```tsx
import Lottie, { type LottieRefProps } from 'lottie-react'
import { useRef, useEffect } from 'react'
import heartAnimation from './assets/heart.json'

// 如果 TypeScript 在当前环境中无法解析具体类型，可临时使用 any
// const lottieRef = useRef<any>(null)

export const LikeButton = ({ isLiked }: { isLiked: boolean }) => {
  const lottieRef = useRef<LottieRefProps>(null)
  const isFirstMount = useRef(true)

  useEffect(() => {
    if (!lottieRef.current) return

    // 初始状态设置 (INITIAL STATE SETUP)
    if (isFirstMount.current) {
      // 如果已点赞，停在结束帧（如：实心红心）
      // 如果未点赞，停在起始帧（如：空心轮廓）
      lottieRef.current.goToAndStop(isLiked ? 60 : 0, true) 
      isFirstMount.current = false
    } 
    // 交互更新 (INTERACTION UPDATES)
    else if (isLiked) {
      // 播放“点赞”动画（如：从第0帧播到第60帧）
      lottieRef.current.playSegments([0, 60], true)
    } else {
      // 播放“取消点赞”或直接重置
      lottieRef.current.goToAndStop(0, true)
    }
  }, [isLiked])

  return (
    <div onClick={toggleLike}>
      <Lottie
        lottieRef={lottieRef}
        animationData={heartAnimation}
        loop={false}
        autoplay={false} // 重要！
        onDOMLoaded={() => {
           // 使用 onDOMLoaded 作为双重保险，确保 DOM 准备好时状态正确
           if (isLiked) lottieRef.current?.goToAndStop(60, true)
        }}
      />
    </div>
  )
}
```

## 典型应用场景 (Typical Application Scenarios)

在开发过程中，优先考虑在以下场景引入 Lottie 动画以提升用户体验：

1. **微交互 (Micro-interactions)**:
   - 按钮点击反馈（如点赞、收藏、关注）。
   - Tab 切换时的图标形变或动效。
   - 侧边栏/菜单的展开与收起。

2. **状态反馈 (Feedback & States)**:
   - **加载中**: 使用趣味动效替代原生的 Spin。
   - **操作结果**: 支付成功时的烟花、删除成功时的碎纸片。
   - **异常提示**: 断网、搜索无结果、404 页面的动态插画。

3. **引导与展示 (Onboarding & Display)**:
   - 新功能上线时的向导动画。
   - 登录页/欢迎页的高级感背景装饰。
   - 数据大屏中的动态装饰曲线。

4. **游戏化元素 (Gamification)**:
   - 勋章点亮、等级提升、开箱/抽奖效果。


## 故障排查与技巧 (Troubleshooting & Tips)

### 1. 动画显示为空白或不可见？
- **检查帧数 (Frames)**: 
  - 部分动画会在中间或结尾包含空白帧用于重置。
  - **技巧**: 如果停止在最后一帧（如 `goToAndStop(10, true)`) 无效，试着往前退 1-2 帧（如 `goToAndStop(8, true)`)。
- **onDOMLoaded**: 使用 `onDOMLoaded` 回调来强制设置初始帧，以防 `useEffect` 执行过早或 Ref 尚未绑定。
- **外观样式**: 
  - 确认颜色是否由于父级背景色（如深色模式）导致“视而不见”。
  - 可以通过 CSS `filter: invert(1)` 等手段临时改变 SVG 渲染的 Lottie 颜色。

### 2. 加载状态与性能
- **乐观更新 (Optimistic UI)**: 点击后立即触发 `playSegments`，不要等接口返回。保留 `disabled` 逻辑防止重复点击即可。
- **避免组件卸载**: 在 `loading` 时不要用条件渲染 (`{loading ? <Spin /> : <Lottie />}`) 销毁组件，这会导致动画瞬间消失。应通过控制 CSS `visibility` 或 `opacity` 来显示/隐藏 Loading。

### 3. 测试环境问题 (Jest/JSDOM)
- **报错 `fillStyle` 为空**: `lottie-web` 在 JSDOM 环境下操作 Canvas 会报错。
- **解决方案**: 在单元测试中，必须 Mock 掉 `lottie-react` 组件：
```tsx
jest.mock('lottie-react', () => ({
  __esModule: true,
  default: () => <div data-testid="lottie-mock" />,
}))
```

### 4. TypeScript 报错
如果 `LottieRefProps` 无法导出或找不到：
- **快速修复**: 使用 `useRef<any>(null)`。
- **正规修复**: 确保 `lottie-react` 版本是最新的，并检查其 `index.d.ts` 定义。

## 资源链接
- **LottieFiles**: [免费动画资源库](https://lottiefiles.com/)
- **Lottie-React 文档**: [使用指南](https://lottiereact.com/)
