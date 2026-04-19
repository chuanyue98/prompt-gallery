# 数据模型：Soft UI 主题切换

## 实体：ThemeOption

- 说明：代表一个可被用户选择的主题。
- 字段：
  - `id`: 主题唯一标识，例如默认主题、Soft UI 主题。
  - `label`: 用户可见的主题名称。
  - `description`: 对主题氛围或用途的简短描述。
  - `isDefault`: 是否为应用默认主题。
  - `supportsSoftSurface`: 是否启用柔和浮雕表面语义。
- 关系：
  - 可被 `ThemePreference` 引用为当前选中主题。
- 校验规则：
  - `id` 必须唯一且稳定。
  - 至少存在一个默认主题。
  - Soft UI 主题必须具备用户可识别的名称和说明。

## 实体：ThemePreference

- 说明：代表当前用户最近一次选择的主题偏好。
- 字段：
  - `selectedThemeId`: 当前生效的主题标识。
  - `persistedAt`: 最近一次成功保存主题选择的时间点或保存时机。
  - `source`: 偏好来源，例如首次默认值或用户主动切换。
- 关系：
  - 指向一个 `ThemeOption`。
- 校验规则：
  - `selectedThemeId` 必须匹配已注册的主题。
  - 当无持久化值时，系统必须回退到默认主题。
- 状态转换：
  - `default` -> `soft-ui-selected`: 用户主动切换到 Soft UI。
  - `soft-ui-selected` -> `default`: 用户切回默认主题。
  - `persisted` -> `restored`: 用户刷新或重新访问后恢复到先前选择。

## 实体：ThemeSurface

- 说明：代表主题下需要统一渲染的界面表面或控件。
- 字段：
  - `surfaceId`: 表面类型标识，例如 page-shell、card、button、input、modal。
  - `variant`: 表面变体，例如 primary、secondary、accent、ghost。
  - `state`: 当前交互状态，例如 default、hover、active、focus、disabled。
  - `elevation`: 层级表现，例如 flat、raised、pressed、inset。
  - `contrastLevel`: 与背景的对比级别。
- 关系：
  - 在不同 `ThemeOption` 下拥有不同视觉表现。
- 校验规则：
  - 每种高频交互控件至少要定义 default、hover、active 状态。
  - Soft UI 主题下的主操作表面必须具备可辨识的强调色。
  - 任意状态都不能降低文字和图标可读性。

## 实体：ThemeSwitchControl

- 说明：代表用户操作主题切换的入口控件。
- 字段：
  - `controlLabel`: 控件名称或辅助文本。
  - `availableThemes`: 可选主题列表。
  - `selectedThemeId`: 当前显示为选中的主题。
  - `interactionState`: 控件当前状态，例如 idle、expanded、switching。
- 关系：
  - 驱动 `ThemePreference` 更新。
  - 读取 `ThemeOption` 列表进行展示。
- 校验规则：
  - 必须在用户可见区域内可访问。
  - 切换后界面反馈应与当前选中项保持一致。
