
# Lingo-Reader 开发进度记录

## Phase 1：基础改造（Dexie + 书架）

### 2025-12-28 - 实施计划第 1 步

- **已完成事项**
  - 阅读并对齐 `/memory-bank` 下的设计文档、结构说明和实施计划。
  - 梳理现有前端应用入口与路由结构：
    - 确认 `reader-html/src/main.ts` 为 Vue 应用入口，挂载根组件 `App.vue`，并注册 i18n、router、pinia。
    - 确认 `reader-html/src/router/index.ts` 使用 `createWebHashHistory('/lingo-reader/')`，并从 `routes.ts` 引入路由表。
    - 确认路由表中：`'/'`（name: `home`）指向 `pages/Home/Home.vue`，`'/book'`（name: `book`）指向 `pages/Book/Book.vue`。
    - 确认 `pages/Book/Book.vue` 为当前主阅读器视图，内部通过 `useBookStore` 管理书籍状态，并在 `back()` 中返回首页。

- **测试建议（由人工执行）**
  - 启动开发服务器后访问根路径，确认默认进入 Home 页面且无报错。
  - 在未加载书籍的情况下直接访问 `#/book`，确认被路由守卫重定向回 Home。

- **下一步计划**
  - 按《实施计划.md》执行第 2 步：
    - 为新架构准备基础目录和模块划分（views/components/services/composables 已存在但需在文档和约定层面固化用法）。
    - 规划并创建专门的“书架视图”占位组件（例如 `BookshelfView`），作为后续书架页实现的挂载点。

### 2025-12-28 - 实施计划第 2 步

- **已完成事项**
  - 在 `reader-html/src/` 下补齐架构目录与基础占位：
    - 新增 `views/BookshelfView.vue`，作为书架页面的占位视图，当前仅显示 i18n 文案 `bookshelfTitle`，后续将扩展为完整书架 UI。
    - 新建 `services/` 目录（含 `.gitkeep`），用于承载 Dexie 本地数据库、AI 客户端等纯 TypeScript 服务模块。
    - 新建 `composables/` 目录（含 `.gitkeep`），用于承载书架状态、阅读状态等 Vue Composition API 逻辑。
  - 在路由 `src/router/routes.ts` 中新增测试路由：
    - `path: '/bookshelf-test'`，`name: 'bookshelf-test'`，指向 `views/BookshelfView.vue`，用于在不影响现有首页和阅读器的前提下调试书架视图。
  - 在 i18n 文案中新增键值：
    - `bookshelfTitle`：英文为 "Bookshelf"，中文为 "书架"，用于书架视图标题展示。

- **测试建议（由人工执行）**
  - 访问 `#/bookshelf-test`（或带 base 的等效路径），确认页面显示 "Bookshelf" / "书架"，且控制台无报错。
  - 再次访问根路径 `/`，确认仍然进入 Home 页面，行为与改造前一致。
  - 在未加载书的情况下访问 `#/book`，确认仍然被重定向回 Home。

- **下一步计划**
  - 按《实施计划.md》执行第 3 步：
    - 在 `reader-html` 子包中引入 Dexie.js 依赖（如尚未存在）。
    - 在 `src/services` 中实现本地数据库服务模块（如 `db` 服务），根据《结构.md` 定义 `books` 与 `vocabulary` 表结构，并在应用启动时初始化数据库。

### 2025-12-28 - 实施计划第 3 步

- **已完成事项**
  - 在 `reader-html/package.json` 中新增 Dexie 依赖：`"dexie": "^3.2.5"`。
  - 在 `src/services/db.ts` 中实现本地数据库服务：
    - 使用 Dexie 创建名为 `lingo-reader` 的本地数据库。
    - 定义 `books` 表结构：`id`（自增主键）、`title`、`author`、`cover`（Blob）、`data`（Blob）、`lastRead`（时间戳或空）、`progress`（0–1 浮点进度）。
    - 定义 `vocabulary` 表结构：`id`（字符串主键）、`word`、`context`、`aiExplanation`、`bookId`、`createdAt`（时间戳）。
    - 在 `version(1).stores` 中为常用查询字段建立索引：`books: '++id, title, author, lastRead'`，`vocabulary: 'id, word, bookId, createdAt'`。
  - 在 `src/main.ts` 中引入并初始化数据库：
    - 导入 `db` 实例，并在应用启动时调用 `db.open()`，在失败时将错误输出到控制台，确保 IndexedDB 在应用加载后即可见。

- **测试建议（由人工执行）**
  - 在工作区根目录安装依赖（例如 `pnpm install`），确保 Dexie 被正确安装。
  - 启动开发服务器并打开应用首页，检查控制台中没有与 Dexie 初始化相关的致命错误。
  - 打开浏览器开发者工具的 Application/Storage 面板，在 IndexedDB 中确认存在名为 `lingo-reader` 的数据库，并包含 `books` 与 `vocabulary` 两张表。
  - 多次刷新页面，确认数据库和表稳定存在且不会因重复初始化报错。

- **下一步计划**
  - 按《实施计划.md》执行第 4 步：
    - 在书架视图中实现“导入书籍”基础 UI（按钮 + 文件选择），不做解析与存库逻辑。
    - 在 `src/composables` 中实现书架相关的 `useBookshelf` composable，用于集中处理导入入口并为后续解析与存储提供挂载点。

### 2025-12-28 - 实施计划第 4 步

- **已完成事项**
  - 在 `src/composables/useBookshelf.ts` 中实现书架相关的基础 composable：
    - 暴露 `isImporting` 状态，用于标记导入流程是否正在进行（当前为占位，后续在解析/写库时挂载真实 loading 逻辑）。
    - 暴露 `handleFilesSelected(files)` 入口，统一处理文件选择事件（目前仅做参数检查和状态切换，不进行解析或存储）。
  - 在 `src/views/BookshelfView.vue` 中实现“导入书籍”基础 UI：
    - 通过 i18n 文案 `bookshelfTitle` 展示书架标题。
    - 新增文件选择入口：按钮样式的 `<label>` 包含隐藏的 `<input type="file" multiple>`，接受 EPUB/MOBI/AZW3/FB2 等电子书格式，`change` 事件委托给 `handleFilesSelected`。
    - 在界面上展示导入说明文案 `bookshelfImportHint` 和导入中占位文案 `bookshelfImporting`（由 `isImporting` 控制）。
  - 在 i18n 文案中新增键值：
    - `bookshelfImportButton`：导入按钮文本。
    - `bookshelfImportHint`：导入格式说明。
    - `bookshelfImporting`：导入中占位提示文本。

- **测试建议（由人工执行）**
  - 访问 `#/bookshelf-test`（或带 base 的等效路径），确认：
    - 页眉显示书架标题（"Bookshelf" / "书架"）。
    - 页面上有“导入书籍”按钮区域，点击后能够正常弹出系统文件选择对话框。
    - 选择若干电子书文件后，页面不报错，控制台无异常日志（当前阶段不要求有实际解析或书架展示效果）。

- **下一步计划**
  - 按《实施计划.md》执行第 5 步：
    - 整合 monorepo 中已有的电子书解析库（epub/mobi/azw3/fb2 等），在 `src/services` 下实现统一的电子书解析服务模块。
    - 通过该服务从上传文件中抽取元数据（书名、作者、封面）和原始文件二进制，暂不写入 IndexedDB，仅在内存中准备好后续存库所需的数据结构。
    - 在 `useBookshelf` 中接入解析服务，完成从“文件选择”到“获得解析结果”的链路，为下一步写入 `books` 表做准备。

### 2025-12-28 - 实施计划第 5 步

- **已完成事项**
  - 在 `src/services/bookParser.ts` 中实现统一的电子书解析服务：
    - 封装对 `@lingo-reader/epub-parser`、`@lingo-reader/mobi-parser`、`@lingo-reader/fb2-parser` 的调用，通过 `EBookParser` 接口读取 `getMetadata()` 与 `getFileInfo()`。
    - 抽取统一的解析结果结构 `ParsedBookForBookshelf`，包含：`title`、`author`、`fileName`、原始 `File` 对象（后续写入 `books.data` 使用）以及 `cover`（当前为 `null` 占位）。
    - 针对不同格式的 metadata 结构实现兼容的 title / author 提取逻辑，异常情况下回退到文件名（去掉扩展名）。
  - 在 `src/composables/useBookshelf.ts` 中接入解析服务：
    - 新增 `pendingBooks` 状态，用于在内存中保存本次导入解析得到的书籍列表。
    - 将 `handleFilesSelected` 改为异步函数：
      - 接收 `FileList`，转换为 `File[]` 后调用 `parseMultipleFilesForBookshelf` 进行解析。
      - 将解析结果赋值给 `pendingBooks`，并通过 `console.info` 输出调试信息（当前阶段仅内存保留，不写入 IndexedDB）。
      - 通过 `isImporting` 标记导入中的状态，配合 UI 显示占位文案。
  - 在 `src/views/BookshelfView.vue` 中解构并暴露 `pendingBooks`，为后续书架列表渲染与写库后的刷新打好接口基础（当前模板尚未展示该列表）。

- **测试建议（由人工执行）**
  - 打开 `#/bookshelf-test` 页面，使用“导入书籍”按钮选择若干 EPUB/MOBI/AZW3/FB2 文件：
    - 确认页面不出现错误提示或异常行为。
    - 在浏览器控制台中看到日志 `"[Bookshelf] Parsed books for import"`，后接一个数组，每项包含 `title`、`author`、`fileName`、`file`、`cover` 等字段。
  - 选取包含不同元数据完备程度的文件（有/无标题、有/无作者）验证：
    - 当元数据中存在标题/作者时，解析结果能正确反映。
    - 当缺失元数据时，标题会合理回退到去掉扩展名的文件名，作者为空字符串。

- **下一步计划**
  - 按《实施计划.md》执行第 6 步：
    - 将 `pendingBooks` 中的解析结果写入 Dexie 的 `books` 表（仅存元数据与原始文件 Blob）。
    - 确保写入逻辑只在导入时触发，后续书架列表展示不批量读取 `data` 字段，以满足性能约束。

### 2025-12-28 - 实施计划第 6 步

- **已完成事项**
  - 在 `src/composables/useBookshelf.ts` 中将解析结果落地到 IndexedDB：
    - 维持 `pendingBooks` 作为内存中的解析结果列表，用于调试与后续展示。
    - 在完成解析后，通过 `db.books.bulkAdd` 将每本书写入 `books` 表：
      - 字段映射：`title`、`author`、`cover`（当前为 `null`）、`data`（原始 `File` 对象）、`lastRead`（初始为 `null`）、`progress`（初始为 `0`）。
    - 写入完成后在控制台输出日志 `"[Bookshelf] Parsed books saved to IndexedDB"`，便于人工确认入库过程。

- **测试建议（由人工执行）**
  - 打开 `#/bookshelf-test` 页面，通过“导入书籍”选择若干 EPUB/MOBI/AZW3/FB2 文件：
    - 确认页面无报错，控制台出现 `"[Bookshelf] Parsed books saved to IndexedDB"` 日志。
  - 在浏览器开发者工具的 IndexedDB 面板中检查 `lingo-reader` 数据库下的 `books` 表：
    - 确认每本导入的书籍对应一条记录，字段 `title`、`author`、`data`（Blob）、`lastRead`、`progress` 等值合理。
    - 刷新页面后记录仍然存在，证明写入成功且持久化正常。

- **下一步计划**
  - 按《实施计划.md》执行第 7 步：
    - 在书架视图中从 `books` 表读取书籍元数据，并以列表/网格形式展示（仅使用 `id`、`title`、`author`、`cover`、`lastRead`、`progress` 等元数据，不在列表阶段使用 `data` 字段）。
    - 为后续“点击卡片进入阅读器”的交互留出 `bookId`（即 `books.id`）的传递通道。
 
### 2025-12-28 - 实施计划第 7 步

- **已完成事项**
  - 在 `src/composables/useBookshelf.ts` 中扩展书架状态与读取逻辑：
    - 新增 `books` 列表状态，仅包含 `id`、`title`、`author` 三个字段，专用于列表展示。
    - 新增 `loadBooks()` 方法，通过 Dexie 的 `db.books.toArray()` 异步读取 `books` 表中所有记录，并映射为轻量视图模型，避免在列表阶段读取 `data` Blob。
  - 在 `src/components/Bookshelf/BookCard.vue` 中实现纯 UI 卡片组件：
    - 通过 props 接收 `title` 和 `author`，使用简洁的卡片样式展示书名（两行截断）与作者信息，不直接操作数据库或路由。
  - 在 `src/views/BookshelfView.vue` 中接入并展示书架列表：
    - 在 `onMounted` 钩子中调用 `loadBooks()`，在页面加载时自动从 IndexedDB 读取已导入书籍的元数据。
    - 若 `books` 列表非空，则以响应式网格（移动端双列、桌面端四列）的形式渲染 `BookCard` 列表；
    - 若 `books` 为空，则通过 i18n 文案 `bookshelfEmptyHint` 展示“书架还是空的…”提示。
  - 在 i18n 文案文件中新增 `bookshelfEmptyHint` 键值，分别提供中英文提示文本，确保书架空状态多语言可配。

- **测试建议（由人工执行）**
  - 在 `books` 表为空或已清空的情况下访问 `#/bookshelf-test`：
    - 确认页面显示书架标题和导入按钮，并在内容区域显示空书架提示文案 `bookshelfEmptyHint`。
  - 导入若干电子书后再次访问或刷新 `#/bookshelf-test`：
    - 确认页面展示对应数量的书籍卡片，每个卡片包含正确的书名和作者信息（若作者缺失则不展示作者行）。
    - 检查刷新页面后列表仍然完整，说明数据成功从 IndexedDB 读取。
  - 连续导入多本书籍，观察列表加载速度：
    - 在常见数量（如 10 本左右）下确认无明显卡顿，证明列表仅基于元数据渲染、未批量加载 Blob。

- **下一步计划**
  - 按《实施计划.md》执行第 8 步：
    - 实现从书架点击书籍卡片后，按 `bookId` 从 IndexedDB 加载对应电子书到阅读管线，并导航到现有 `/book` 阅读器视图。
    - 在成功打开书籍时更新 `lastRead` 字段，为后续按最近阅读排序奠定数据基础。

### 2025-12-28 - 实施计划第 8 步

- **已完成事项**
  - 在 `src/composables/useBookshelf.ts` 中新增并接入 `openBookFromId(bookId)`：
    - 按传入的 `bookId` 从 Dexie 的 `books` 表读取对应记录，若不存在则在控制台输出告警并中止后续流程。
    - 使用记录中的 `fileName` 与 `data` Blob 构造临时 `File` 对象，以保证现有 `useBookStore.initBook` 能根据扩展名选择正确的解析器；对于旧数据缺少 `fileName` 的情况，兜底使用 `title` 作为文件名。
    - 调用 `useBookStore().initBook(file)` 复用原有阅读器解析与渲染管线，将书籍加载到内存中。
    - 成功加载后，调用 `db.books.update(bookId, { lastRead: Date.now() })` 更新该书的 `lastRead` 时间戳，为后续按最近阅读排序提供数据基础。
  - 在 `src/components/Bookshelf/BookCard.vue` 中为卡片组件增加 `select` 事件：
    - 组件仍保持“纯 UI”角色，仅通过 `defineEmits` 暴露 `select` 事件，在根节点 `@click` 时触发，完全不关心路由与数据库。
  - 在 `src/views/BookshelfView.vue` 中串联点击行为与路由跳转：
    - 通过 `useBookshelf` 解构出 `openBookFromId`，实现 `onBookSelect(bookId)`：先调用 `openBookFromId(bookId)` 将书加载进 `useBookStore`，再通过 `router.push({ name: 'book', query: { bookId: String(bookId) } })` 导航到阅读器 `/book` 路由。
    - 在模板中为每个 `BookCard` 绑定 `@select="onBookSelect(book.id)"`，使“点击卡片 → 加载书籍 → 进入阅读器”形成完整链路。

- **测试建议（由人工执行）**
  - 在书架中至少存在一条书籍记录的前提下：
    - 打开 `#/bookshelf-test`，点击任意一本书的卡片，确认路由跳转到 `#/book`，且阅读器能够正常渲染对应电子书（目录和正文均可访问）。
  - 在 IndexedDB 面板中观察 `lastRead` 字段：
    - 打开某本书后，检查其记录的 `lastRead` 是否更新为接近当前时间的时间戳；多次打开不同书籍，确认各自的 `lastRead` 随操作更新。
  - 在无有效书籍记录的异常场景下（例如手动删除了 IndexedDB 中的对应记录）：
    - 再次点击书架中的该卡片，确认控制台输出 “Book not found in IndexedDB” 警告；若由于未成功加载书籍导致 `useBookStore().existBook()` 返回 `false`，访问 `/book` 时会被现有路由守卫重定向回首页，避免空书状态下的阅读器错误。

- **下一步计划**
  - 按《实施计划.md》执行第 9 步：
    - 将书架视图设为应用默认首页，使用户首次进入应用时看到的是本地书架而非旧的首页或阅读器。
    - 确保从阅读器 `Book.vue` 返回时回到书架视图，并验证路由守卫在无书状态下仍会安全地重定向到书架。

### 2025-12-28 - 实施计划第 9 步

- **已完成事项**
  - 更新路由配置，将书架设为默认首页：
    - 在 `src/router/routes.ts` 中将 `'/'`（name: `home`）的组件由 `pages/Home/Home.vue` 切换为 `views/BookshelfView.vue`，使应用根路径直接进入书架视图。
    - 保留 `'/bookshelf-test'`（name: `bookshelf-test`）路由，仍然指向 `views/BookshelfView.vue`，作为开发阶段的测试入口。
    - 保持 `'/book'`（name: `book`）路由指向 `pages/Book/Book.vue` 不变，继续作为主阅读器视图。
  - 对 `Book.vue` 返回行为的利用：
    - 阅读器中原有的 `back()` 逻辑仍然调用 `router.push('/')`，在将 `'/'` 指向书架视图后，点击阅读器顶部返回按钮会自然回到书架首页。
  - 保持并复用路由守卫逻辑：
    - 在 `src/router/index.ts` 中，继续使用守卫规则：当访问 `/book` 且 `useBookStore().existBook()` 为 `false` 时，重定向到 `home` 路由。
    - 由于 `home` 现在指向书架视图，用户在未初始化任何书籍的情况下直接访问 `/book` 时，会被安全地带回书架。
  - 在 `memory-bank/结构.md` 中同步路由与视图职责：
    - 明确 `'/'` 为书架默认首页，`Home.vue` 成为非默认的说明/调试视图。
    - 记录 `BookshelfView.vue` 作为首页/书架的职责，便于后续维护。

- **测试建议（由人工执行）**
  - 默认首页行为：
    - 启动开发服务器后直接访问应用根路径（包含 hash base 的 `/lingo-reader/#/`）。
    - 确认首次进入即显示书架视图（标题为 `bookshelfTitle`，带“导入书籍”按钮和书籍网格/空书架提示），而不是旧的 `Home.vue` 或阅读器页面。
  - 从阅读器返回路径：
    - 在书架中点击任意一本书进入 `/book` 阅读器。
    - 在阅读器顶部点击返回按钮。
    - 确认路由返回到书架视图（`/`），且书架列表正常显示已导入的书籍。
  - 无书状态的直达访问：
    - 刷新浏览器或清空当前 `useBookStore` 状态后，直接访问 `#/book`.
    - 确认路由守卫将其重定向到 `home`（书架），不会停留在空书状态的阅读器页面。
  - 测试路由仍然可用：
    - 访问 `#/bookshelf-test`，确认显示内容与 `#/` 一致，证明测试入口与新首页指向同一书架视图实现。

- **下一步计划**
  - 按《实施计划.md》执行第 10 步（基础稳定性与回归测试）：
    - 在不同浏览器与设备上，完整跑通“空书架 → 导入书 → 书架展示 → 点击进入阅读器 → 返回书架 → 刷新后书仍在”的用户流程，并关注性能与异常情况。

### 2025-12-28 - 实施计划第 10 步

- **已完成事项**
  - 在桌面浏览器中完成基础回归测试：
    - 验证了从空书架开始导入多本书籍，书架列表正常展示且刷新页面后数据仍然存在。
    - 验证了从书架点击进入 `/book` 阅读器并通过顶部返回按钮回到书架的完整流程，多次往返无异常报错。
    - 验证了在未初始化书籍时直接访问 `#/book` 会被路由守卫重定向回首页（书架视图），避免进入空阅读器页面。
  - 完成了导入交互和视觉细节的小幅优化：
    - 将书架页顶部导入入口改为显眼的按钮样式，隐藏原生文件输入控件，仅保留按钮触发文件对话框。
    - 在 `useBookshelf` 中于写入 IndexedDB 后调用 `loadBooks()`，实现导入完成后书架列表自动刷新，无需手动刷新浏览器。

- **测试结论（Phase 1）**
  - 在当前覆盖下，Dexie 本地存储、书架导入与展示、从书架进入阅读器及返回书架的核心流程表现稳定，可视为 Phase 1（基础改造：Dexie + 书架）已完成，进入后续 AI 与生词本功能的开发阶段。

- **下一步计划**
  - 进入 Phase 2，按《设计文档.md》与《实施计划.md》执行下一阶段步骤：
    - 首先实现设置页与 API Key 管理（将用户提供的 AI 接口 Key 持久化到 `localStorage`，Key 名为 `lingoReader.apiKey`，并提供清除入口），为后续 AI 分析与生词本功能打基础。

## Phase 2：AI 接入与设置页

### 2025-12-28 - Phase 2 步骤 1（已完成）

- **已完成事项**
  - 在 `src/services/apiKeyStorage.ts` 中实现本地 API Key 存储服务：
    - 使用 `localStorage`，Key 固定为 `lingoReader.apiKey`。
    - 提供 `getApiKey()`、`setApiKey(key)`、`clearApiKey()` 三个方法，并在浏览器不支持或被禁用 `localStorage` 时安全降级（仅输出警告，不中断应用）。
  - 在 `src/views/SettingsView.vue` 中搭建基础设置页：
    - 包含一个多行文本框用于输入/粘贴 API Key，以及“保存”“清除”两个按钮。
    - 通过 `getApiKey()` 在挂载时预填当前保存的 Key，保存时调用 `setApiKey`，清除时调用 `clearApiKey` 并清空输入框。
    - 在保存/清除后显示简短状态提示文案（例如“API key saved.”、“API Key 已保存。”），提升用户反馈体验。
  - 在 `src/router/routes.ts` 中新增 `/settings` 路由，指向 `SettingsView.vue` 作为独立设置页面。
  - 在 `src/views/BookshelfView.vue` 顶部标题区域添加“设置/Settings”按钮，点击后通过路由跳转到 `/settings`，作为统一设置入口。
  - 在 i18n 文案 `en.json` / `zh.json` 中新增与设置页相关的文案键值（标题、标签、提示语、按钮文本等）。

-- **下一步计划**
  - Phase 2 步骤 2：在阅读器中监听文本选中事件，并输出包含选中文本和上下文句子的调试信息，为后续浮动菜单和 AI 调用打基础。

### 2025-12-28 - Phase 2 步骤 2（已完成）

- **已完成事项**
  - 新增 `src/composables/useSelectionDebug.ts`，实现基础选区调试逻辑：
    - 在组件挂载时监听 `document` 上的 `mouseup` / `touchend` 事件。
    - 使用 `window.getSelection()` 获取当前选中文本，忽略空选区。
    - 通过 `Range.commonAncestorContainer` 获取选区所在节点，从中提取文本上下文，并按中英文句号、问号、感叹号（`. ! ? 。 ！ ？`）切分，只保留包含选中文本的那一句作为 `context`，避免上下文过长。
    - 在控制台输出调试日志：`[AI][Selection] { text, context }`，用于人工验证选区捕获效果。
  - 在 `pages/Book/Book.vue` 中引入并调用 `useSelectionDebug()`，使阅读器在不改动现有 UI 的前提下具备选区调试能力。

- **测试结论**
  - 在阅读器中用鼠标或触屏选中一段文字，控制台会输出对应的选中文本及所在句子，证明选区监听和上下文截取逻辑工作正常。

- **下一步计划**
  - Phase 2 步骤 3：基于当前选区信息实现浮动菜单组件（至少包含“翻译/解释”和“加入生词本”两个操作），并确保在桌面端和移动端都能友好显示和隐藏。

### 2025-12-28 - Phase 2 步骤 3（已完成）

- **已完成事项**
  - 新增 `src/composables/useSelectionMenu.ts` 管理浮动菜单状态：
    - 在选区变化时计算菜单在视口中的 `x/y` 坐标，并根据上下空间自动选择将菜单放在选中句子的上方或下方。
    - 对左右边缘进行约束，避免菜单在靠近页面边缘时被裁切。
    - 在滚动或窗口尺寸变化时自动隐藏菜单，防止位置错位。
  - 新增 `src/components/SelectionMenu.vue` 浮动菜单组件：
    - 在选区附近以深色气泡形式展示，并提供“解释”“加入生词本”“关闭”三个按钮。
    - 使用纯 CSS 样式实现明显可点的操作按钮，兼容当前项目未启用 Tailwind 的情况。
    - 通过 `explain`、`add-vocabulary`、`close` 事件向上层汇报用户点击行为。
  - 在 `pages/Book/Book.vue` 中集成浮动菜单：
    - 将 `useSelectionMenu` 暴露的坐标和选区文本传入 `SelectionMenu`，并在点击菜单按钮时输出对应的调试日志（例如 `[AI][Menu][Explain]`）。
    - 调整菜单定位逻辑，多轮迭代优化“靠顶部/底部/左右边缘时不遮挡文字且不被裁切”的行为，并通过截图与实测确认体验达标。

- **测试结论**
  - 在阅读器中无论在页面中部、顶部还是底部选中文本，浮动菜单都能贴近选区且不显著遮挡文字；在窗口缩放和打开 DevTools 等极端高度下仍能保持菜单完整可见。

- **下一步计划**
  - Phase 2 步骤 4：接入豆包/ARK AI 接口，对选中的单词和上下文进行解释，并在阅读器右下角以面板形式流式展示结果。

### 2025-12-28 - Phase 3 步骤 5（进行中）

- **已完成事项（开发中）**
  - 在 `src/services/vocabularyService.ts` 中实现生词写入服务：
    - 定义 `addVocabularyItem({ word, context, aiExplanation, bookId })`，内部调用 Dexie 的 `db.vocabulary.add`，生成 UUID 风格 `id` 并自动填充 `createdAt` 时间戳。
    - 仅在 `word` 非空时执行写入，避免误保存空记录。
  - 在 `pages/Book/Book.vue` 中将“加入生词本”按钮接入生词写入逻辑：
    - 使用 `useRoute()` 读取当前路由上的 `bookId` 查询参数，作为 `vocabulary.bookId` 字段的来源；若 `bookId` 缺失或非法，则在控制台输出告警并跳过写入。
    - 将当前选中的 `text` 作为 `word`，`selectionContext` 作为 `context`，并将右下角 AI 面板中的最新解释文本 `aiOutput` 作为 `aiExplanation` 写入 `vocabulary` 表。

- **下一步计划**
  - 在浏览器开发者工具的 IndexedDB 面板中验证多次点击“加入生词本”后 `vocabulary` 表的写入是否符合预期（字段完整、bookId 正确、时间戳合理），并根据验证结果将本步骤标记为“已完成”。

### 2025-12-28 - Phase 3 步骤 6（已完成）

- **已完成事项（开发中）**
  - 在 `src/composables/useVocabularyHighlight.ts` 中实现基础高亮逻辑：
    - 按 `bookId` 从 Dexie 的 `vocabulary` 表读取当前书籍的全部生词记录。
    - 遍历给定根节点下的文本节点，按英文单词边界匹配 `word`，将命中的文本片段替换为带有 `.vocab-word` 类名的 `<span>` 元素，实现结构化高亮。
    - 在章节 HTML 或 `bookId` 变化时重新执行高亮，并在执行前清理旧的 `.vocab-word` 包裹，避免重复嵌套。
  - 在 `ColumnReader.vue` 中接入 `useVocabularyHighlight`：
    - 为组件增加 `bookId` prop，并由 `Book.vue` 在列式阅读模式下传入当前路由的 `bookId`。
    - 使用 `articleRef` 作为高亮根节点，使高亮逻辑仅作用于章节内容区域，不影响其他 UI 元素。
    - 在样式中为 `.vocab-word` 增加红色波浪下划线与手型光标，符合设计文档中的视觉要求。

### 2025-12-28 - Phase 3 步骤 7（已完成）

- **已完成事项（开发中）**
  - 设计“点击高亮生词 → 展示详情卡片/抽屉”的基本交互流程，确定：
    - 高亮阶段在 `<span class="vocab-word">` 上挂载 `data-vocab-*` 元数据（word/context/aiExplanation/id）。
    - 使用独立的 `useVocabularyPopup` composable 在阅读区域内监听 `.vocab-word` 点击事件并维护当前选中生词的展示状态。
    - 使用专门的 UI 组件 `VocabularyDetailPanel` 作为生词详情的可复用视图层，实现“移动端底部抽屉 + 桌面端右侧小面板”的响应式布局。

-- **补充事项（扩展到其他阅读模式）**
  - 在 `ScrollReader.vue` 中接入 `useVocabularyHighlight`：
    - 为组件新增 `bookId` prop，并由 `Book.vue` 在滚动阅读模式下传入当前路由的 `bookId`。
    - 使用 `articleRef` 作为高亮根节点，使高亮逻辑仅作用于 `.article-text` 区域，不影响两侧调节拖拽区域和顶部按钮。
    - 在样式中为 `.article-text :deep(.vocab-word)` 增加红色波浪下划线与手型光标，保持与 ColumnReader 视觉一致。
  - 在 `ScrollWithNote.vue` 中接入 `useVocabularyHighlight`：
    - 为组件新增 `bookId` prop，并由 `Book.vue` 在「滚动 + 笔记」模式下传入当前路由的 `bookId`。
    - 使用 `articleRef` 指向正文 `article.article-text`，确保高亮逻辑不会作用于左侧笔记区，仅在右侧阅读内容区域处理生词。
    - 在样式中同样为 `.article-text :deep(.vocab-word)` 增加红色波浪下划线与手型光标。
  - 至此，三种阅读模式（Column / Scroll / ScrollWithNote）在同一本书中共享统一的生词高亮与生词卡片体验。
