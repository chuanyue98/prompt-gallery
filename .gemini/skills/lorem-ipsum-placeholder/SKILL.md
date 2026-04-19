---
name: lorem-ipsum-placeholder
description: 在配置文件或示例代码中使用 Lorem Ipsum 占位内容的规范和最佳实践
---

## 📋 概述

当创建配置文件、示例代码或文档时，应使用 Lorem Ipsum 占位内容替代真实的业务数据，以避免：
- 敏感信息泄露（邮箱、电话、地址等）
- 硬编码真实业务内容到示例中
- 配置文件模板包含特定业务场景数据

## 🎯 适用场景

### 1. 配置文件示例

当创建可配置的组件或模块时，配置文件应使用占位内容：

```typescript
// ✅ 推荐：使用占位内容
export const config = {
  contact: {
    email: 'example@example.com',
    phone: '(00) 0000-0000',
  },
  content: {
    title: 'Lorem Ipsum Dolor Sit',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
  },
}

// ❌ 避免：使用真实业务数据
export const config = {
  contact: {
    email: 'support@company.com',  // 真实邮箱
    phone: '(02) 8888-8888',       // 真实电话
  },
  content: {
    title: 'Responsible Gaming Reminder',  // 具体业务场景
    description: 'This game is intended for...',
  },
}
```

### 2. 组件示例代码

在创建可复用组件的示例时：

```jsx
// ✅ 推荐：占位内容
<Card
  title="Lorem Ipsum"
  description="Lorem ipsum dolor sit amet"
  image="placeholder-image.png"
/>

// ❌ 避免：真实业务数据
<Card
  title="新用户注册优惠"
  description="首次充值送100元"
  image="promotion-banner.png"
/>
```

### 3. 单元测试数据

测试中使用的模拟数据：

```typescript
// ✅ 推荐
const mockUser = {
  name: 'Lorem Ipsum',
  email: 'test@example.com',
  bio: 'Lorem ipsum dolor sit amet',
}

// ❌ 避免
const mockUser = {
  name: '张三',
  email: 'zhangsan@company.com',
  bio: '资深游戏玩家',
}
```

### 4. 文档和教程

在编写使用文档时：

```markdown
✅ 推荐：
## 配置示例
\`\`\`typescript
const config = {
  apiKey: 'your-api-key-here',
  endpoint: 'https://api.example.com',
  timeout: 5000,
}
\`\`\`

❌ 避免：
\`\`\`typescript
const config = {
  apiKey: 'sk_live_abc123xyz789',  // 真实密钥
  endpoint: 'https://api.company.com',
  timeout: 5000,
}
\`\`\`
```

## 📝 占位内容规范

### 文本占位

| 内容类型 | 推荐占位方式 | 示例 |
|---------|------------|------|
| 短标题 | Lorem Ipsum + 2-3 单词 | `Lorem Ipsum Dolor` |
| 长标题 | Lorem Ipsum + 4-6 单词 | `Lorem Ipsum Dolor Sit Amet` |
| 段落文本 | 标准 Lorem Ipsum 段落 | `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod...` |
| 简短描述 | Lorem ipsum + 1 句话 | `Lorem ipsum dolor sit amet` |

### 联系信息占位

| 信息类型 | 推荐占位方式 | 示例 |
|---------|------------|------|
| 邮箱 | example@example.com | `user@example.com`, `admin@example.com` |
| 电话 | (00) 0000-0000 格式 | `(00) 0000-0000`, `+00 0000 0000` |
| 地址 | Lorem Ipsum 风格 | `123 Lorem Street, Ipsum City` |
| 网址 | example.com 域名 | `https://example.com`, `https://api.example.com` |

### 图片占位

| 场景 | 推荐方式 | 说明 |
|-----|---------|------|
| 占位图片 | placeholder-icon.png | 明确标注为占位图 |
| 图片样式 | 灰色背景 + 边框 + 对角线 | 视觉上明显是占位图 |
| 图片尺寸 | 根据实际使用场景 | 保持合理的宽高比 |

### 代码中的占位

```typescript
// ✅ 推荐的命名方式
const PLACEHOLDER_API_KEY = 'your-api-key-here'
const EXAMPLE_USER_ID = 'user-123'
const SAMPLE_DATA = { /* ... */ }

// ❌ 避免的命名方式
const API_KEY = 'real-key-abc123'
const USER_ID = 'john.doe@company.com'
const DATA = { /* 真实数据 */ }
```

## 🔧 实施步骤

### 步骤 1：内容配置化（外部化）

在替换占位内容之前，应优先将硬编码在组件或页面中的文案、链接等业务数据提取到独立的配置文件中。

**操作指南**：
1. 在模块的 `src/config/` 目录下创建 `xxxConfig.ts`。
2. 定义配置对象的接口或使用 `satisfies` 进行类型约束。
3. 将组件中的原始文案迁移至配置文件。
4. 组件通过 import 导入并引用配置。

**优点**：
- 职责分离：UI 逻辑与业务文案分离。
- 易于维护：无需修改代码即可更新内容。
- 规范化：便于统一执行 Lorem Ipsum 替换。

### 步骤 2：识别需要占位的内容

检查以下类型的内容：
- [ ] 邮箱地址
- [ ] 电话号码
- [ ] 真实姓名
- [ ] 具体业务场景描述
- [ ] API 密钥或令牌
- [ ] 真实图片资源
- [ ] 业务特定的标题和文案

### 步骤 3：替换为占位内容

```typescript
// 原始内容
const config = {
  email: 'support@fortunelink.com',
  phone: '(02) 8888-8888',
  title: 'Responsible Gaming reminder',
}

// 替换为占位内容
const config = {
  email: 'example@example.com',
  phone: '(00) 0000-0000',
  title: 'Lorem Ipsum Dolor Sit',
}
```

### 步骤 4：创建占位图片

对于图片资源，使用 Python 脚本生成占位图：

```python
import struct
import zlib

def create_placeholder_png(width, height):
    """创建带有对角线和边框的占位图"""
    png_signature = b'\x89PNG\r\n\x1a\n'

    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_chunk = b'IHDR' + ihdr_data
    ihdr_crc = struct.pack('>I', zlib.crc32(ihdr_chunk))
    ihdr = struct.pack('>I', len(ihdr_data)) + ihdr_chunk + ihdr_crc

    # 创建图像数据
    bg_color = (220, 220, 220)  # 浅灰色背景
    border_color = (150, 150, 150)  # 深灰色边框和对角线

    lines = []
    border_thickness = 4

    for y in range(height):
        line = bytearray([0])  # filter type

        for x in range(width):
            # 绘制边框
            if (x < border_thickness or x >= width - border_thickness or
                y < border_thickness or y >= height - border_thickness):
                line.extend(border_color)
            # 绘制对角线
            elif (abs(x - y * width / height) < 2 or
                  abs(x - (height - y) * width / height) < 2):
                line.extend(border_color)
            else:
                line.extend(bg_color)

        lines.append(bytes(line))

    raw_data = b''.join(lines)
    compressed = zlib.compress(raw_data, 9)

    idat_chunk = b'IDAT' + compressed
    idat_crc = struct.pack('>I', zlib.crc32(idat_chunk))
    idat = struct.pack('>I', len(compressed)) + idat_chunk + idat_crc

    # IEND chunk
    iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', zlib.crc32(b'IEND'))

    return png_signature + ihdr + idat + iend

# 使用示例
png_data = create_placeholder_png(200, 200)
with open('placeholder-icon.png', 'wb') as f:
    f.write(png_data)
```

### 步骤 5：更新文档

在配置文件的文档中说明占位内容的使用：

```markdown
## 配置说明

本配置文件使用 Lorem Ipsum 占位内容作为示例。

### 修改方式

1. 将 `example@example.com` 替换为实际邮箱
2. 将 `(00) 0000-0000` 替换为实际电话
3. 将 Lorem Ipsum 文本替换为实际文案
4. 将 `placeholder-icon.png` 替换为实际图片

### 注意事项

- 占位内容仅用于示例，不能直接用于生产环境
- 图片资源需要替换为符合品牌规范的实际图片
- 所有联系方式需要更新为真实有效的信息
```

## ✅ 检查清单

在提交代码前检查：

- [ ] 所有示例配置使用占位内容
- [ ] 邮箱使用 `example@example.com` 或类似格式
- [ ] 电话使用 `(00) 0000-0000` 或类似格式
- [ ] 文本使用 Lorem Ipsum 占位
- [ ] 图片使用明确的占位图（带边框和对角线）
- [ ] 文档中说明了占位内容的替换方法
- [ ] 没有硬编码真实的业务数据
- [ ] 测试数据使用明显的占位值

## 🚫 常见错误

### 错误 1：使用真实但不相关的数据

```typescript
// ❌ 错误：使用其他公司的真实信息
email: 'support@google.com'
phone: '1-800-GOOGLE'

// ✅ 正确：使用明确的占位内容
email: 'example@example.com'
phone: '(00) 0000-0000'
```

### 错误 2：占位内容不够明显

```typescript
// ❌ 错误：看起来像真实数据
email: 'contact@mysite.com'
title: 'Welcome to our platform'

// ✅ 正确：明确的占位标识
email: 'example@example.com'
title: 'Lorem Ipsum Dolor Sit'
```

### 错误 3：混合真实和占位内容

```typescript
// ❌ 错误：部分真实、部分占位
const config = {
  email: 'example@example.com',        // 占位
  phone: '(02) 8888-8888',             // 真实
  title: 'Lorem Ipsum',                 // 占位
  description: 'This game is for...',  // 真实
}

// ✅ 正确：全部使用占位内容
const config = {
  email: 'example@example.com',
  phone: '(00) 0000-0000',
  title: 'Lorem Ipsum Dolor Sit',
  description: 'Lorem ipsum dolor sit amet...',
}
```

### 错误 4：在示例中包含真实公司域名或邮箱

```typescript
// ❌ 错误：使用真实公司域名（可能被误用或泄露信息）
const config = {
  email: 'support@google.com',      // 真实公司邮箱
  apiUrl: 'https://api.github.com', // 真实服务域名
  cdnUrl: 'https://cdn.company.com', // 真实 CDN 域名
}

// ✅ 正确：使用通用占位域名
const config = {
  email: 'example@example.com',
  apiUrl: 'https://api.example.com',
  cdnUrl: 'https://cdn.example.com',
}
```

**说明**：
- 避免在示例中使用真实公司的域名或邮箱，以防被误用或造成混淆
- `example.com`、`example.org` 是 IANA 保留的专用示例域名
- 如需展示特定场景，使用 `your-company.com`、`your-api.com` 等明确的占位符

## 📚 参考案例

### 案例 1：负责任游戏提醒组件配置

**任务**：将负责任游戏提醒组件改为可配置，并使用占位内容。

**实施方案**：
```typescript
// src/apps/home/src/config/responsibleGamingConfig.ts
import placeholderIcon from '@/assets/placeholder-icon.png'

export const responsibleGamingConfig = {
  image: {
    src: placeholderIcon,
    alt: 'Placeholder icon',
  },

  contact: {
    email: 'example@example.com',
    phone: '(00) 0000-0000',
    phonePrompt: 'Lorem ipsum dolor sit amet',
  },

  content: {
    title: 'Lorem Ipsum Dolor Sit',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do ' +
      'eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ' +
      'ad minim veniam, quis nostrud exercitation ullamco laboris.',
  },
} satisfies {
  image: { src: string; alt: string }
  contact: { email: string; phone: string; phonePrompt: string }
  content: { title: string; description: string }
}
```

**文档说明**：
```markdown
# 配置文件

## 配置结构

本配置文件使用 Lorem Ipsum 占位内容。在实际使用时需要替换为真实内容。

### 修改指南

1. **修改邮箱**：将 `example@example.com` 替换为客服邮箱
2. **修改电话**：将 `(00) 0000-0000` 替换为客服电话
3. **修改标题**：将 `Lorem Ipsum Dolor Sit` 替换为实际标题
4. **修改描述**：将 Lorem Ipsum 段落替换为实际描述文本
5. **更换图片**：将 `placeholder-icon.png` 替换为实际图标

### 注意事项

- 重新构建：修改配置后需要重新构建项目
- 图片路径：图片必须通过 import 导入
- 类型安全：配置使用 `satisfies` 语法确保类型正确
```

## 🎓 最佳实践总结

1. **一致性**：项目中所有占位内容使用统一的风格
2. **明确性**：占位内容应该一眼就能看出是示例
3. **完整性**：配置文件应配有详细的替换说明文档
4. **可追溯性**：在代码注释中说明这是占位内容
5. **测试友好**：占位内容应该能通过基本的格式验证

## 🔗 相关资源

- [Lorem Ipsum 生成器](https://www.lipsum.com/)
- [Placeholder.com - 占位图片服务](https://placeholder.com/)
- [Python Pillow 文档](https://pillow.readthedocs.io/) - 用于生成占位图片

---

## 💡 实战经验总结

### 案例：配置文件优化与简化（PR #1453）

**背景**：在实施 Lorem Ipsum 占位内容替换后，发现配置文件中混杂了业务逻辑代码，违反了「配置文件仅存放纯数据」的原则。

#### 核心问题

1. **工具函数放错位置**：`toSelectOptions` 转换函数放在 `shared/constants.ts` 中
2. **配置项冗余**：`DEFAULT_ID_TYPE` 需要手动配置，容易与列表不同步
3. **样式配置混入**：颜色等样式配置放在业务配置文件中
4. **嵌套结构过度**：简单的字符串值被包装成对象结构
5. **测试硬编码**：测试中硬编码特定值，不随配置动态变化

#### 优化方案

##### 1. 工具函数迁移到 utils 目录

**问题**：
```typescript
// ❌ 错误：逻辑函数在 constants 文件中
// src/apps/kyc/src/shared/constants.ts
function toSelectOptions(list: readonly string[]): readonly SelectOption[] {
  return list.map(/* ... */)
}

export const ID_TYPE_OPTIONS = toSelectOptions(ID_TYPE_LIST)
```

**解决**：
```typescript
// ✅ 正确：工具函数独立到 utils
// src/apps/kyc/src/utils/selectOptions.ts
export function toSelectOptions(list: readonly string[]): readonly SelectOption[] {
  return list.map(/* ... */)
}

// src/apps/kyc/src/shared/constants.ts
import { toSelectOptions } from '@/utils/selectOptions'
export const ID_TYPE_OPTIONS = toSelectOptions(ID_TYPE_LIST)
```

**收益**：
- 职责清晰：constants 只存数据，utils 存工具函数
- 易于复用：工具函数可被其他模块导入
- 易于测试：可单独为工具函数编写单元测试

##### 2. 自动生成默认值，减少配置项

**问题**：
```typescript
// ❌ 错误：需要手动维护默认值
export const DEFAULT_ID_TYPE = 'lorem-id-type-alpha'  // 容易与列表不一致
export const ID_TYPE_OPTIONS = toSelectOptions(ID_TYPE_LIST)
```

**解决**：
```typescript
// ✅ 正确：自动从列表第一项生成
export const ID_TYPE_OPTIONS = toSelectOptions(ID_TYPE_LIST)
export const DEFAULT_ID_TYPE = ID_TYPE_OPTIONS[0].value  // 自动同步
```

**收益**：
- 减少配置维护成本
- 避免默认值与列表不一致的错误
- 自动随列表排序变化

##### 3. 移除样式配置，直接硬编码到组件

**问题**：
```typescript
// ❌ 错误：样式配置放在业务配置中
// config/responsibleGamingConfig.ts
export const config = {
  content: { title: 'Lorem Ipsum', description: '...' },
  styles: {
    backgroundClassName: 'bg-[#00379C]',
    secondaryBackgroundClassName: 'bg-[#00379C]',
  },
}
```

**解决**：
```typescript
// ✅ 正确：配置只包含业务数据
// config/responsibleGamingConfig.ts
export const config = {
  content: { title: 'Lorem Ipsum', description: '...' },
}

// 组件中直接使用样式
<div className="mb-4 overflow-hidden bg-[#00379C]">
```

**收益**：
- 配置文件更简洁
- 样式逻辑内聚在组件中
- 减少不必要的配置层级

##### 4. 简化嵌套结构

**问题**：
```typescript
// ❌ 错误：不必要的嵌套
export const config = {
  items: {
    termsOfUse: {
      label: 'Lorem Ipsum Dolor',
    },
    responsibleGaming: {
      label: 'Lorem Ipsum Dolor Sit',
    },
  },
}

// 使用时需要多层访问
config.items.termsOfUse.label
```

**解决**：
```typescript
// ✅ 正确：扁平化结构
export const config = {
  items: {
    termsOfUse: 'Lorem Ipsum Dolor',
    responsibleGaming: 'Lorem Ipsum Dolor Sit',
  },
}

// 使用时更简洁
config.items.termsOfUse
```

**收益**：
- 代码更简洁
- 减少样板代码
- 提高可读性

##### 5. 测试动态适配配置

**问题**：
```typescript
// ❌ 错误：测试硬编码特定值
jest.mock('@/shared/constants', () => ({
  ID_TYPE_OPTIONS: [{ label: 'Passport', value: 'passport' }],
  DEFAULT_ID_TYPE: 'passport',  // 硬编码，如果列表变化会失效
}))
```

**解决**：
```typescript
// ✅ 正确：测试自动从列表获取
jest.mock('@/shared/constants', () => {
  const mockIdTypeOptions = [{ label: 'Passport', value: 'passport' }]
  return {
    ID_TYPE_OPTIONS: mockIdTypeOptions,
    DEFAULT_ID_TYPE: mockIdTypeOptions[0].value,  // 自动同步
  }
})
```

**收益**：
- 测试更健壮，不依赖特定值
- 测试逻辑与生产代码一致
- 避免测试和实现脱节

#### 文档同步更新

**关键点**：代码变更后必须同步更新文档

**问题文档**：
```markdown
❌ 错误：文档描述与实现不一致

4. 更新 `DEFAULT_ID_TYPE` 为实际的默认证件类型 value（kebab-case 格式）

**注意**：
- `toSelectOptions()` 函数会自动处理转换
- **重要**：`DEFAULT_ID_TYPE` 必须手动更新为与 `ID_TYPE_LIST` 匹配的 value
```

**更新后的文档**：
```markdown
✅ 正确：文档反映当前实现

**注意**：
- 只需修改字符串列表，无需手动维护 `{label, value}` 格式
- 转换逻辑由 `src/apps/kyc/src/utils/selectOptions.ts` 中的 `toSelectOptions()` 函数统一处理
- `DEFAULT_ID_TYPE` 会自动从 `ID_TYPE_OPTIONS[0].value` 生成，始终取列表第一项，无需手动配置
```

#### 代码审查反馈处理

**Owner 反馈**：
> 在 `constants.ts` 中引入 `toSelectOptions` 逻辑函数不符合「常量文件仅存放纯数据」的原则。建议将此类工具逻辑移至 `utils` 目录。

**处理方式**：
1. 立即响应并认同问题
2. 创建 `utils/selectOptions.ts` 存放工具函数
3. 更新导入路径
4. 运行测试确保无破坏性变更
5. 更新相关文档

**AI 审查反馈**：
> DEFAULT_ID_TYPE 自动取排序后第一项，可能违反后端契约

**处理方式**：
1. 与 Owner 沟通确认设计意图
2. 明确 `DEFAULT_ID_TYPE` 完全由前端控制，与后端无关
3. 在文档中补充说明自动生成的逻辑和原因
4. 更新测试以反映这个设计理念

#### 统计数据

| 指标 | 优化前 | 优化后 | 改善 |
|------|--------|--------|------|
| 代码行数 | 855 行 | 695 行 | -19% |
| 配置文件数量 | 6 个 | 6 个 | - |
| 工具函数位置 | constants | utils | ✅ |
| 默认值配置 | 手动 | 自动 | ✅ |
| 测试覆盖 | 通过 | 通过 | ✅ |
| 文档一致性 | 不一致 | 一致 | ✅ |

#### 关键经验

1. **配置文件原则**：
   - ✅ **只存数据**：配置文件应只包含纯数据
   - ✅ **无逻辑代码**：函数、类型约束、验证逻辑都应移到其他地方
   - ✅ **无样式配置**：颜色、类名等样式应在组件中管理

2. **自动化优于手动**：
   - ✅ 能自动生成的值不要手动配置
   - ✅ 能从现有数据推导的不要重复声明
   - ✅ 减少人为维护，降低出错风险

3. **测试与实现同步**：
   - ✅ 测试逻辑应反映生产代码的设计理念
   - ✅ 避免硬编码，使用动态生成的值
   - ✅ 测试应该验证行为而非具体值

4. **文档与代码一致**：
   - ✅ 代码变更后必须同步更新文档
   - ✅ 文档应准确描述当前实现
   - ✅ 过时的说明会误导维护者

5. **代码审查反馈**：
   - ✅ 认真对待所有审查意见
   - ✅ 与审查者沟通确认设计意图
   - ✅ 在文档中补充说明设计理由

#### 提交结构建议

为了清晰展示优化过程，建议分多个 commit 提交：

1. **Commit 1**: `refactor: 简化配置文件结构` - 核心重构
2. **Commit 2**: `refactor(home): 移除未使用的导入` - 清理代码
3. **Commit 3**: `test(kyc): 修复测试中缺失的 mock` - 修复测试
4. **Commit 4**: `refactor(kyc): 将工具函数移至 utils 目录` - 响应审查
5. **Commit 5**: `docs(kyc): 更新 README 以反映当前实现` - 同步文档

每个 commit 应该：
- 有清晰的提交信息说明改动内容和原因
- 包含相关的测试和文档更新
- 通过所有 CI 检查

#### 总结

在实施 Lorem Ipsum 占位内容替换时，不仅要关注内容本身的替换，还要审视配置文件的结构和组织方式：

- **简化配置**：移除不必要的嵌套和样板代码
- **职责分离**：配置存数据，工具存函数，组件存逻辑
- **自动化**：减少手动维护，让代码自动同步
- **文档一致**：确保文档准确反映实现
- **测试健壮**：测试应该适应配置变化

通过这次优化，不仅实现了占位内容的规范化，还提升了代码的可维护性和整体质量。
