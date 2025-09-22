<template>
  <div class="requirements-container">
    <ArtTableHeader title="需求定义" @back="goBack" />

    <div class="requirements-layout">
      <div class="requirements-content">
        <div class="step-indicator">
          <div class="step-item active">
            <div class="step-number">1</div>
            <div class="step-label">需求</div>
          </div>
          <div class="step-connector"></div>
          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-label">标题</div>
          </div>
          <div class="step-connector"></div>
          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-label">大纲</div>
          </div>
          <div class="step-connector"></div>
          <div class="step-item">
            <div class="step-number">4</div>
            <div class="step-label">正文</div>
          </div>
        </div>

        <!-- 模板操作区域 -->
        <div class="template-actions">
          <el-button-group>
            <el-button
              type="primary"
              :icon="Document"
              @click="saveAsTemplate"
              :disabled="!canSaveTemplate"
            >
              保存为模板
            </el-button>
            <el-dropdown @command="handleTemplateCommand" trigger="click">
              <el-button type="default" :icon="Collection">
                使用模板
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="template in savedTemplates"
                    :key="template.id"
                    :command="template.id"
                  >
                    {{ template.name }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="savedTemplates.length === 0" disabled>
                    暂无保存的模板
                  </el-dropdown-item>
                  <el-dropdown-item divided command="manage"> 管理模板 </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-button-group>
        </div>

        <div class="requirements-form">
          <el-form
            ref="requirementsFormRef"
            :model="requirementsForm"
            :rules="requirementsRules"
            label-width="120px"
            size="large"
          >
            <!-- 写作目标 -->
            <el-form-item label="写作目标" prop="writingGoal">
              <el-input
                v-model="requirementsForm.writingGoal"
                type="textarea"
                :rows="3"
                placeholder="请输入写作目标（可选），如：提升品牌知名度、传达产品价值、教育用户等"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>

            <!-- 标题字数范围 -->
            <el-form-item label="标题字数范围" required>
              <div class="word-range-group">
                <el-form-item prop="titleWordRange.min" class="range-item">
                  <el-input-number
                    v-model="requirementsForm.titleWordRange.min"
                    :min="5"
                    :max="50"
                    placeholder="最小字数"
                    @change="
                      () =>
                        validateWordRange(
                          requirementsForm.titleWordRange.min,
                          requirementsForm.titleWordRange.max,
                          'title'
                        )
                    "
                  />
                  <span class="range-label">最小字数</span>
                </el-form-item>
                <span class="range-separator">-</span>
                <el-form-item prop="titleWordRange.max" class="range-item">
                  <el-input-number
                    v-model="requirementsForm.titleWordRange.max"
                    :min="5"
                    :max="50"
                    placeholder="最大字数"
                    @change="
                      () =>
                        validateWordRange(
                          requirementsForm.titleWordRange.min,
                          requirementsForm.titleWordRange.max,
                          'title'
                        )
                    "
                  />
                  <span class="range-label">最大字数</span>
                </el-form-item>
              </div>
              <div class="form-help-text">标题字数应在5-50字之间</div>
            </el-form-item>

            <!-- 正文字数范围 -->
            <el-form-item label="正文字数范围" required>
              <div class="word-range-group">
                <el-form-item prop="contentWordRange.min" class="range-item">
                  <el-input-number
                    v-model="requirementsForm.contentWordRange.min"
                    :min="500"
                    :max="5000"
                    :step="100"
                    placeholder="最小字数"
                    @change="
                      () =>
                        validateWordRange(
                          requirementsForm.contentWordRange.min,
                          requirementsForm.contentWordRange.max,
                          'content'
                        )
                    "
                  />
                  <span class="range-label">最小字数</span>
                </el-form-item>
                <span class="range-separator">-</span>
                <el-form-item prop="contentWordRange.max" class="range-item">
                  <el-input-number
                    v-model="requirementsForm.contentWordRange.max"
                    :min="500"
                    :max="5000"
                    :step="100"
                    placeholder="最大字数"
                    @change="
                      () =>
                        validateWordRange(
                          requirementsForm.contentWordRange.min,
                          requirementsForm.contentWordRange.max,
                          'content'
                        )
                    "
                  />
                  <span class="range-label">最大字数</span>
                </el-form-item>
              </div>
              <div class="form-help-text">正文字数应在500-5000字之间</div>
            </el-form-item>

            <!-- 题材（领域） -->
            <el-form-item label="题材（领域）" prop="genre">
              <el-select
                v-model="requirementsForm.genre"
                placeholder="请选择题材领域"
                style="width: 100%"
              >
                <el-option label="科技互联网" value="technology" />
                <el-option label="金融财经" value="finance" />
                <el-option label="教育培训" value="education" />
                <el-option label="医疗健康" value="healthcare" />
                <el-option label="文化娱乐" value="culture" />
                <el-option label="体育运动" value="sports" />
                <el-option label="旅游生活" value="lifestyle" />
                <el-option label="房产家居" value="real_estate" />
                <el-option label="汽车交通" value="automotive" />
                <el-option label="时尚美妆" value="fashion" />
                <el-option label="母婴亲子" value="parenting" />
                <el-option label="政务民生" value="public_affairs" />
                <el-option label="环保能源" value="environment" />
                <el-option label="法律法规" value="legal" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>

            <!-- 写作风格（文风） -->
            <el-form-item label="写作风格" prop="writingStyle">
              <el-radio-group v-model="requirementsForm.writingStyle">
                <el-radio label="正式严谨">正式严谨</el-radio>
                <el-radio label="轻松活泼">轻松活泼</el-radio>
                <el-radio label="专业权威">专业权威</el-radio>
                <el-radio label="亲切友好">亲切友好</el-radio>
                <el-radio label="说服力强">说服力强</el-radio>
                <el-radio label="客观中性">客观中性</el-radio>
                <el-radio label="幽默风趣">幽默风趣</el-radio>
                <el-radio label="情感丰富">情感丰富</el-radio>
              </el-radio-group>
            </el-form-item>

            <!-- 内容类型 -->
            <el-form-item label="内容类型" prop="contentType">
              <el-select
                v-model="requirementsForm.contentType"
                placeholder="请选择内容类型"
                style="width: 100%"
              >
                <el-option label="消息" value="news" />
                <el-option label="通讯" value="communication" />
                <el-option label="评论" value="commentary" />
                <el-option label="特写" value="feature" />
                <el-option label="深度报道" value="in_depth" />
                <el-option label="分析报告" value="analysis" />
                <el-option label="产品介绍" value="product_intro" />
                <el-option label="使用指南" value="guide" />
                <el-option label="技术文档" value="technical" />
                <el-option label="营销文案" value="marketing" />
                <el-option label="宣传稿" value="publicity" />
                <el-option label="白皮书" value="whitepaper" />
                <el-option label="案例研究" value="case_study" />
                <el-option label="行业观察" value="industry_insight" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>

            <!-- 目标受众 -->
            <el-form-item label="目标受众" required>
              <div class="audience-group">
                <el-form-item label="年龄" prop="targetAudience.age" class="audience-item">
                  <el-select
                    v-model="requirementsForm.targetAudience.age"
                    placeholder="选择年龄段"
                    clearable
                    @change="(value) => console.log('年龄选择:', value)"
                  >
                    <el-option value="18-25">18-25岁</el-option>
                    <el-option value="26-35">26-35岁</el-option>
                    <el-option value="36-45">36-45岁</el-option>
                    <el-option value="46-55">46-55岁</el-option>
                    <el-option value="55+">55岁以上</el-option>
                  </el-select>
                </el-form-item>

                <el-form-item label="性别" prop="targetAudience.gender" class="audience-item">
                  <el-select
                    v-model="requirementsForm.targetAudience.gender"
                    placeholder="选择性别"
                    clearable
                    @change="(value) => console.log('性别选择:', value)"
                  >
                    <el-option value="不限">不限</el-option>
                    <el-option value="男性">男性</el-option>
                    <el-option value="女性">女性</el-option>
                  </el-select>
                </el-form-item>

                <el-form-item
                  label="教育水平"
                  prop="targetAudience.education"
                  class="audience-item"
                >
                  <el-select
                    v-model="requirementsForm.targetAudience.education"
                    placeholder="选择教育水平"
                    clearable
                    @change="(value) => console.log('教育水平选择:', value)"
                  >
                    <el-option value="小学及以下">小学及以下</el-option>
                    <el-option value="初中">初中</el-option>
                    <el-option value="高中">高中</el-option>
                    <el-option value="大专">大专</el-option>
                    <el-option value="本科">本科</el-option>
                    <el-option value="硕士">硕士</el-option>
                    <el-option value="博士">博士</el-option>
                  </el-select>
                </el-form-item>

                <el-form-item label="职业" prop="targetAudience.occupation" class="audience-item">
                  <el-select
                    v-model="requirementsForm.targetAudience.occupation"
                    placeholder="选择职业"
                    clearable
                    @change="(value) => console.log('职业选择:', value)"
                  >
                    <el-option value="学生">学生</el-option>
                    <el-option value="教师">教师</el-option>
                    <el-option value="工程师">工程师</el-option>
                    <el-option value="管理人员">管理人员</el-option>
                    <el-option value="医生">医生</el-option>
                    <el-option value="律师">律师</el-option>
                    <el-option value="企业家">企业家</el-option>
                    <el-option value="公务员">公务员</el-option>
                    <el-option value="工人">工人</el-option>
                    <el-option value="农民">农民</el-option>
                    <el-option value="自由职业者">自由职业者</el-option>
                    <el-option value="退休人员">退休人员</el-option>
                    <el-option value="其他">其他</el-option>
                  </el-select>
                </el-form-item>
              </div>
            </el-form-item>

            <!-- 关键词 -->
            <el-form-item label="关键词" prop="keywords">
              <div class="keywords-input">
                <el-input
                  v-model="currentKeyPoint"
                  placeholder="输入关键词后按回车添加（最多10个）"
                  @keyup.enter="addKeyword"
                />
                <el-button
                  @click="addKeyword"
                  :disabled="!currentKeyPoint.trim() || requirementsForm.keywords.length >= 10"
                  >添加</el-button
                >
              </div>
              <div class="keywords-list" v-if="requirementsForm.keywords.length > 0">
                <el-tag
                  v-for="(keyword, index) in requirementsForm.keywords"
                  :key="index"
                  closable
                  @close="removeKeyword(index)"
                  type="primary"
                >
                  {{ keyword }}
                </el-tag>
              </div>
              <div class="form-help-text"
                >已添加 {{ requirementsForm.keywords.length }}/10 个关键词</div
              >
            </el-form-item>

            <el-form-item label="特殊要求" prop="specialRequirements">
              <el-input
                v-model="requirementsForm.specialRequirements"
                type="textarea"
                :rows="4"
                placeholder="请输入任何特殊要求，如需要包含的特定信息、避免的词汇等"
              />
            </el-form-item>

            <el-form-item label="参考素材" prop="referenceMaterials">
              <div class="reference-section">
                <el-button @click="selectFromMaterialLibrary" type="primary" plain
                  >从素材库选择</el-button
                >
                <el-button @click="aiSearchMaterials" :loading="aiSearching" plain
                  >AI智能检索</el-button
                >
              </div>
              <div class="selected-materials" v-if="selectedMaterials.length > 0">
                <div v-for="material in selectedMaterials" :key="material.id" class="material-item">
                  <div class="material-info">
                    <h4>{{ material.title }}</h4>
                    <p>{{ (material.content || '').substring(0, 100) }}...</p>
                  </div>
                  <el-button type="danger" size="small" @click="removeMaterial(material.id)" link>
                    移除
                  </el-button>
                </div>
              </div>
            </el-form-item>
          </el-form>

          <div class="form-actions">
            <el-button @click="goBack" size="large">返回</el-button>
            <el-button
              type="primary"
              size="large"
              @click="generateAIBriefing"
              :loading="generatingBriefing"
              :disabled="!canGenerateBriefing"
            >
              生成AI简报
            </el-button>
            <el-button
              type="success"
              size="large"
              @click="confirmRequirements"
              :disabled="!aiBriefingGenerated"
            >
              确认需求
            </el-button>
          </div>
        </div>

        <!-- AI简报展示区域 -->
        <div class="ai-briefing-section" v-if="aiBriefingGenerated">
          <div class="section-header">
            <h3>AI创作简报</h3>
            <el-button @click="editBriefing" size="small" type="primary" plain>编辑简报</el-button>
          </div>

          <div class="briefing-content">
            <div class="briefing-section">
              <h4>📋 文档概述</h4>
              <p>{{ aiBriefing.overview }}</p>
            </div>

            <div class="briefing-section">
              <h4>🎯 目标受众分析</h4>
              <p>{{ aiBriefing.audienceAnalysis }}</p>
            </div>

            <div class="briefing-section">
              <h4>📝 内容结构建议</h4>
              <ul>
                <li v-for="suggestion in aiBriefing.structureSuggestions" :key="suggestion">{{
                  suggestion
                }}</li>
              </ul>
            </div>

            <div class="briefing-section">
              <h4>🔑 关键词建议</h4>
              <div class="keyword-tags">
                <el-tag
                  v-for="keyword in aiBriefing.keywords"
                  :key="keyword"
                  type="warning"
                  effect="plain"
                >
                  {{ keyword }}
                </el-tag>
              </div>
            </div>

            <div class="briefing-section">
              <h4>⚠️ 注意事项</h4>
              <ul>
                <li v-for="note in aiBriefing.cautions" :key="note">{{ note }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 编辑简报对话框 -->
      <el-dialog
        v-model="briefingDialogVisible"
        title="编辑AI简报"
        width="800px"
        :close-on-click-modal="false"
      >
        <el-form :model="editableBriefing" label-width="120px">
          <el-form-item label="文档概述">
            <el-input v-model="editableBriefing.overview" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="受众分析">
            <el-input v-model="editableBriefing.audienceAnalysis" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="结构建议">
            <el-input
              v-model="structureSuggestionsText"
              type="textarea"
              :rows="4"
              placeholder="每行一个建议"
            />
          </el-form-item>
          <el-form-item label="关键词">
            <el-input v-model="keywordsText" placeholder="用逗号分隔关键词" />
          </el-form-item>
          <el-form-item label="注意事项">
            <el-input
              v-model="cautionsText"
              type="textarea"
              :rows="4"
              placeholder="每行一个注意事项"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="briefingDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveBriefing">保存</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 右侧素材抽屉 -->
      <div class="material-drawer" :class="{ 'drawer-open': materialDrawerVisible }">
        <div class="drawer-header">
          <h3>素材管理</h3>
          <div class="drawer-actions">
            <el-button @click="refreshMaterials" size="small" :loading="loadingMaterials">
              <el-icon><Refresh /></el-icon>
            </el-button>
            <el-button @click="toggleDrawer" size="small">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>

        <div class="drawer-content">
          <!-- 搜索和筛选 -->
          <div class="material-filters">
            <el-input
              v-model="materialSearchKeyword"
              placeholder="搜索素材..."
              size="small"
              clearable
              @input="filterMaterials"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <el-select
              v-model="materialFilterType"
              placeholder="类型"
              size="small"
              clearable
              @change="filterMaterials"
            >
              <el-option label="全部" value="" />
              <el-option label="外部" value="外部" />
              <el-option label="主流媒体" value="主流媒体" />
              <el-option label="本地" value="本地" />
            </el-select>
          </div>

          <!-- 素材列表 -->
          <div class="material-list">
            <div v-if="filteredMaterials.length === 0" class="empty-state">
              <el-icon size="48"><Document /></el-icon>
              <p>暂无素材</p>
              <el-button @click="goToMaterialManagement" type="primary" size="small">
                去素材库添加
              </el-button>
            </div>

            <div
              v-for="material in filteredMaterials"
              :key="material.id"
              class="material-item"
              draggable="true"
              @dragstart="handleDragStart($event, material)"
              @click="selectMaterial(material)"
            >
              <div class="material-header">
                <h4>{{ material.title }}</h4>
                <div class="material-tags">
                  <el-tag
                    v-for="tag in material.tags.slice(0, 2)"
                    :key="tag"
                    size="small"
                    :type="getTagType(tag)"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>

              <div class="material-content">
                <p>{{ material.summary || (material.content || '').substring(0, 100) }}...</p>
              </div>

              <div class="material-footer">
                <span class="material-source">{{ material.source }}</span>
                <span class="material-date">{{ formatDate(material.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 抽屉开关按钮 -->
      <div class="drawer-toggle" @click="toggleDrawer">
        <el-icon><Collection /></el-icon>
        <span>素材库</span>
      </div>
    </div>

    <!-- 保存模板对话框 -->
    <el-dialog
      v-model="saveTemplateDialogVisible"
      title="保存为模板"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="templateForm"
        :rules="templateRules"
        ref="templateFormRef"
        label-width="80px"
      >
        <el-form-item label="模板名称" prop="name">
          <el-input
            v-model="templateForm.name"
            placeholder="请输入模板名称"
            maxlength="30"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="templateForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述（可选）"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveTemplateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSaveTemplate" :loading="savingTemplate">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 模板管理对话框 -->
    <el-dialog
      v-model="templateManageDialogVisible"
      title="模板管理"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="template-list">
        <div v-if="savedTemplates.length === 0" class="empty-state">
          <el-empty description="暂无保存的模板" />
        </div>
        <div v-else class="template-items">
          <div v-for="template in savedTemplates" :key="template.id" class="template-item">
            <div class="template-info">
              <div class="template-name">{{ template.name }}</div>
              <div class="template-description">{{ template.description || '暂无描述' }}</div>
              <div class="template-time">{{ formatDate(template.createdAt) }}</div>
            </div>
            <div class="template-actions">
              <el-button type="info" size="small" :icon="View" @click="previewTemplate(template)">
                预览
              </el-button>
              <el-button type="primary" size="small" @click="applyTemplate(template.id)">
                应用
              </el-button>
              <el-button type="warning" size="small" @click="editTemplate(template)">
                重命名
              </el-button>
              <el-button type="danger" size="small" @click="deleteTemplate(template.id)">
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="templateManageDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 重命名模板对话框 -->
    <el-dialog
      v-model="renameTemplateDialogVisible"
      title="重命名模板"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="renameForm" :rules="renameRules" ref="renameFormRef" label-width="80px">
        <el-form-item label="新名称" prop="name">
          <el-input
            v-model="renameForm.name"
            placeholder="请输入新的模板名称"
            maxlength="30"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renameTemplateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRenameTemplate" :loading="renamingTemplate">
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- 模板预览对话框 -->
    <el-dialog
      v-model="templatePreviewDialogVisible"
      title="模板预览"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="previewingTemplate" class="template-preview">
        <div class="preview-header">
          <h3>{{ previewingTemplate.name }}</h3>
          <p class="preview-description">{{ previewingTemplate.description || '暂无描述' }}</p>
          <p class="preview-time">创建时间：{{ formatDate(previewingTemplate.createdAt) }}</p>
        </div>

        <div class="preview-content">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="写作目标">
              {{ previewingTemplate.data.writingGoal || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="标题字数范围">
              {{ previewingTemplate.data.titleWordRange.min }}-{{
                previewingTemplate.data.titleWordRange.max
              }}字
            </el-descriptions-item>
            <el-descriptions-item label="正文字数范围">
              {{ previewingTemplate.data.contentWordRange.min }}-{{
                previewingTemplate.data.contentWordRange.max
              }}字
            </el-descriptions-item>
            <el-descriptions-item label="题材（领域）">
              {{ previewingTemplate.data.genre || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="写作风格">
              {{ previewingTemplate.data.writingStyle || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="内容类型">
              {{ previewingTemplate.data.contentType || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="目标受众年龄">
              {{ previewingTemplate.data.targetAudience.age || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="目标受众性别">
              {{ previewingTemplate.data.targetAudience.gender || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="目标受众教育水平">
              {{ previewingTemplate.data.targetAudience.education || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="目标受众职业">
              {{ previewingTemplate.data.targetAudience.occupation || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="关键词" :span="2">
              <div
                v-if="
                  previewingTemplate.data.keywords && previewingTemplate.data.keywords.length > 0
                "
              >
                <el-tag
                  v-for="keyword in previewingTemplate.data.keywords"
                  :key="keyword"
                  size="small"
                  style="margin-right: 8px; margin-bottom: 4px"
                >
                  {{ keyword }}
                </el-tag>
              </div>
              <span v-else>未设置</span>
            </el-descriptions-item>
            <el-descriptions-item label="特殊要求" :span="2">
              {{ previewingTemplate.data.specialRequirements || '未设置' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      <template #footer>
        <el-button @click="templatePreviewDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="applyTemplateFromPreview" v-if="previewingTemplate">
          应用此模板
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    Refresh,
    Close,
    Search,
    Document,
    Collection,
    ArrowDown,
    View
  } from '@element-plus/icons-vue'
  import { useMaterialStore } from '@/store/material'
  import type { FormInstance, FormRules } from 'element-plus'
  import type { Material } from '@/types/material'

  interface RequirementsForm {
    writingGoal: string // 写作目标（可选）
    titleWordRange: {
      min: number
      max: number
    } // 标题字数范围（5-50字）
    contentWordRange: {
      min: number
      max: number
    } // 正文字数范围（500-5000字）
    genre: string // 题材（领域）
    writingStyle: string // 写作风格（文风）
    contentType: string // 类型（消息、通讯、评论等）
    targetAudience: {
      age: string // 年龄
      gender: string // 性别
      education: string // 教育水平
      occupation: string // 职业
    } // 目标受众（多个属性）
    keywords: string[] // 关键词（最多10个）
    specialRequirements: string
    referenceMaterials: any[]
  }

  interface AIBriefing {
    overview: string
    audienceAnalysis: string
    structureSuggestions: string[]
    keywords: string[]
    cautions: string[]
  }

  interface Template {
    id: string
    name: string
    description: string
    data: RequirementsForm
    createdAt: string
  }

  interface TemplateForm {
    name: string
    description: string
  }

  interface RenameForm {
    name: string
  }

  const router = useRouter()
  const route = useRoute()
  const requirementsFormRef = ref<FormInstance>()
  const materialStore = useMaterialStore()

  const projectId = route.params.projectId as string

  // 抽屉相关数据
  const materialDrawerVisible = ref(false)
  const materialSearchKeyword = ref('')
  const materialFilterType = ref('')
  const loadingMaterials = ref(false)

  // 模板相关数据
  const savedTemplates = ref<Template[]>([])
  const saveTemplateDialogVisible = ref(false)
  const templateManageDialogVisible = ref(false)
  const renameTemplateDialogVisible = ref(false)
  const templatePreviewDialogVisible = ref(false)
  const savingTemplate = ref(false)
  const renamingTemplate = ref(false)
  const currentEditingTemplate = ref<Template | null>(null)
  const previewingTemplate = ref<Template | null>(null)

  const templateForm = reactive<TemplateForm>({
    name: '',
    description: ''
  })

  const renameForm = reactive<RenameForm>({
    name: ''
  })

  const templateFormRef = ref<FormInstance>()
  const renameFormRef = ref<FormInstance>()

  const requirementsForm = reactive<RequirementsForm>({
    writingGoal: '',
    titleWordRange: {
      min: 5,
      max: 20
    },
    contentWordRange: {
      min: 1000,
      max: 3000
    },
    genre: '',
    writingStyle: '',
    contentType: '',
    targetAudience: {
      age: '',
      gender: '',
      education: '',
      occupation: ''
    },
    keywords: [],
    specialRequirements: '',
    referenceMaterials: []
  })

  // 添加调试信息
  watch(
    () => requirementsForm.targetAudience,
    (newVal) => {
      console.log('目标受众变化:', newVal)
    },
    { deep: true }
  )

  const currentKeyword = ref('')
  const currentKeyPoint = ref('') // 保持兼容
  const selectedMaterials = ref<Material[]>([])
  const generatingBriefing = ref(false)
  const aiBriefingGenerated = ref(false)
  const aiSearching = ref(false)
  const briefingDialogVisible = ref(false)

  const aiBriefing = reactive<AIBriefing>({
    overview: '',
    audienceAnalysis: '',
    structureSuggestions: [],
    keywords: [],
    cautions: []
  })

  const editableBriefing = reactive({
    overview: '',
    audienceAnalysis: '',
    structureSuggestions: [] as string[],
    keywords: [] as string[],
    cautions: [] as string[]
  })

  const requirementsRules: FormRules = {
    'titleWordRange.min': [
      { required: true, message: '请设置标题最小字数', trigger: 'blur' },
      { type: 'number', min: 5, max: 50, message: '标题字数应在5-50字之间', trigger: 'blur' }
    ],
    'titleWordRange.max': [
      { required: true, message: '请设置标题最大字数', trigger: 'blur' },
      { type: 'number', min: 5, max: 50, message: '标题字数应在5-50字之间', trigger: 'blur' }
    ],
    'contentWordRange.min': [
      { required: true, message: '请设置正文最小字数', trigger: 'blur' },
      {
        type: 'number',
        min: 500,
        max: 5000,
        message: '正文字数应在500-5000字之间',
        trigger: 'blur'
      }
    ],
    'contentWordRange.max': [
      { required: true, message: '请设置正文最大字数', trigger: 'blur' },
      {
        type: 'number',
        min: 500,
        max: 5000,
        message: '正文字数应在500-5000字之间',
        trigger: 'blur'
      }
    ],
    genre: [{ required: true, message: '请选择题材（领域）', trigger: 'change' }],
    writingStyle: [{ required: true, message: '请选择写作风格', trigger: 'change' }],
    contentType: [{ required: true, message: '请选择内容类型', trigger: 'change' }],
    'targetAudience.age': [{ required: true, message: '请选择目标受众年龄', trigger: 'change' }]
  }

  const templateRules: FormRules = {
    name: [
      { required: true, message: '请输入模板名称', trigger: 'blur' },
      { min: 1, max: 30, message: '模板名称长度应在1-30个字符之间', trigger: 'blur' }
    ]
  }

  const renameRules: FormRules = {
    name: [
      { required: true, message: '请输入新名称', trigger: 'blur' },
      { min: 1, max: 30, message: '模板名称长度应在1-30个字符之间', trigger: 'blur' }
    ]
  }

  const canGenerateBriefing = computed(() => {
    return (
      requirementsForm.genre &&
      requirementsForm.writingStyle &&
      requirementsForm.contentType &&
      requirementsForm.targetAudience.age &&
      requirementsForm.titleWordRange.min >= 5 &&
      requirementsForm.titleWordRange.max <= 50 &&
      requirementsForm.titleWordRange.min <= requirementsForm.titleWordRange.max &&
      requirementsForm.contentWordRange.min >= 500 &&
      requirementsForm.contentWordRange.max <= 5000 &&
      requirementsForm.contentWordRange.min <= requirementsForm.contentWordRange.max
    )
  })

  const canSaveTemplate = computed(() => {
    return canGenerateBriefing.value
  })

  const structureSuggestionsText = computed({
    get: () => editableBriefing.structureSuggestions.join('\n'),
    set: (value: string) => {
      editableBriefing.structureSuggestions = value.split('\n').filter((s) => s.trim())
    }
  })

  const keywordsText = computed({
    get: () => editableBriefing.keywords.join(', '),
    set: (value: string) => {
      editableBriefing.keywords = value
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k)
    }
  })

  const cautionsText = computed({
    get: () => editableBriefing.cautions.join('\n'),
    set: (value: string) => {
      editableBriefing.cautions = value.split('\n').filter((c) => c.trim())
    }
  })

  // 素材相关计算属性
  const allMaterials = computed(() => materialStore.materials)

  const filteredMaterials = computed(() => {
    let materials = allMaterials.value

    // 按搜索关键词过滤
    if (materialSearchKeyword.value) {
      const keyword = materialSearchKeyword.value.toLowerCase()
      materials = materials.filter(
        (material) =>
          material.title.toLowerCase().includes(keyword) ||
          material.summary?.toLowerCase().includes(keyword) ||
          (material.content || '').toLowerCase().includes(keyword) ||
          material.tags.some((tag) => tag.toLowerCase().includes(keyword))
      )
    }

    // 按类型过滤
    if (materialFilterType.value) {
      materials = materials.filter((material) => material.tags.includes(materialFilterType.value))
    }

    return materials
  })

  onMounted(() => {
    // Load existing requirements if available
    loadExistingRequirements()
    // Load saved templates
    loadTemplates()
  })

  const loadExistingRequirements = () => {
    // TODO: Load from API or store
    // For now, load mock data if it exists
    const mockRequirements = localStorage.getItem(`project_${projectId}_requirements`)
    if (mockRequirements) {
      const data = JSON.parse(mockRequirements)
      Object.assign(requirementsForm, data.requirements)
      if (data.aiBriefing) {
        Object.assign(aiBriefing, data.aiBriefing)
        aiBriefingGenerated.value = true
      }
    }
  }

  const addKeyword = () => {
    const keyword = currentKeyPoint.value.trim()
    if (!keyword) {
      ElMessage.warning('请输入关键词')
      return
    }
    if (requirementsForm.keywords.includes(keyword)) {
      ElMessage.warning('关键词已存在')
      return
    }
    if (requirementsForm.keywords.length >= 10) {
      ElMessage.warning('最多只能添加10个关键词')
      return
    }
    requirementsForm.keywords.push(keyword)
    currentKeyPoint.value = ''
    ElMessage.success(`已添加关键词: ${keyword}`)
  }

  const removeKeyword = (index: number) => {
    requirementsForm.keywords.splice(index, 1)
  }

  const selectFromMaterialLibrary = () => {
    // TODO: Open material library selector
    ElMessage.info('素材库选择功能开发中')
  }

  const aiSearchMaterials = async () => {
    aiSearching.value = true
    try {
      // Simulate AI search
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock AI search results
      const mockMaterials: Material[] = [
        {
          id: '1',
          title: '2024年AI技术发展趋势',
          content:
            '人工智能技术在过去一年中取得了显著进展，特别是在大语言模型、计算机视觉和机器学习等领域...',
          type: 'text',
          source: 'AI检索',
          summary: 'AI技术发展趋势分析',
          tags: ['AI', '技术'],
          createdAt: new Date(),
          url: ''
        },
        {
          id: '2',
          title: '人工智能应用场景分析',
          content:
            'AI技术已经广泛应用于金融、医疗、教育、制造等多个行业，为这些领域带来了革命性的变化...',
          type: 'text',
          source: 'AI检索',
          summary: 'AI应用场景深度分析',
          tags: ['AI', '应用'],
          createdAt: new Date(),
          url: ''
        }
      ]

      selectedMaterials.value = mockMaterials
      ElMessage.success('AI检索完成，找到相关素材')
    } catch {
      ElMessage.error('AI检索失败')
    } finally {
      aiSearching.value = false
    }
  }

  const removeMaterial = (id: string) => {
    const index = selectedMaterials.value.findIndex((m) => m.id === id)
    if (index > -1) {
      selectedMaterials.value.splice(index, 1)
    }
  }

  const generateAIBriefing = async () => {
    if (!requirementsFormRef.value) return

    try {
      await requirementsFormRef.value.validate()
      generatingBriefing.value = true

      // Simulate AI generation
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Generate mock AI briefing based on form data
      const audienceDesc = getAudienceDescription(requirementsForm.targetAudience)
      const briefing: AIBriefing = {
        overview: `基于您提供的需求，我们将创作一篇${requirementsForm.genre}领域的${requirementsForm.contentType}。该文档将针对${audienceDesc}，采用${requirementsForm.writingStyle}的写作风格，标题控制在${requirementsForm.titleWordRange.min}-${requirementsForm.titleWordRange.max}字，正文字数控制在${requirementsForm.contentWordRange.min}-${requirementsForm.contentWordRange.max}字。${requirementsForm.writingGoal ? `写作目标：${requirementsForm.writingGoal}` : ''}`,
        audienceAnalysis: `${audienceDesc}通常对${requirementsForm.genre}相关的信息有较高的关注度，他们期望获得${requirementsForm.keywords.length > 0 ? requirementsForm.keywords.join('、') : '核心信息'}等方面的深入分析。`,
        structureSuggestions: [
          '开篇引入：通过数据或案例引起读者兴趣',
          '背景介绍：提供必要的背景信息和现状分析',
          '核心内容：围绕关键要点展开详细论述',
          '实例说明：通过具体案例或数据支撑观点',
          '总结展望：总结核心观点并展望未来趋势'
        ],
        keywords: [
          requirementsForm.genre,
          ...requirementsForm.keywords.slice(0, 5),
          requirementsForm.contentType
        ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
        cautions: [
          '避免过于技术化的术语，确保内容通俗易懂',
          '注意数据的时效性和准确性',
          '保持客观中立的立场，避免主观臆断',
          '确保逻辑清晰，层次分明',
          `标题字数严格控制在${requirementsForm.titleWordRange.min}-${requirementsForm.titleWordRange.max}字之间`,
          `正文字数严格控制在${requirementsForm.contentWordRange.min}-${requirementsForm.contentWordRange.max}字之间`
        ]
      }

      if (requirementsForm.specialRequirements) {
        briefing.cautions.push(`特殊要求：${requirementsForm.specialRequirements}`)
      }

      Object.assign(aiBriefing, briefing)
      aiBriefingGenerated.value = true

      // Save to localStorage for persistence
      saveRequirements()

      ElMessage.success('AI简报生成成功！')
    } catch {
      // Form validation failed
      ElMessage.error('请完善表单信息')
    } finally {
      generatingBriefing.value = false
    }
  }

  const editBriefing = () => {
    Object.assign(editableBriefing, {
      overview: aiBriefing.overview,
      audienceAnalysis: aiBriefing.audienceAnalysis,
      structureSuggestions: aiBriefing.structureSuggestions,
      keywords: aiBriefing.keywords,
      cautions: aiBriefing.cautions
    })
    briefingDialogVisible.value = true
  }

  const saveBriefing = () => {
    Object.assign(aiBriefing, {
      overview: editableBriefing.overview,
      audienceAnalysis: editableBriefing.audienceAnalysis,
      structureSuggestions: editableBriefing.structureSuggestions,
      keywords: editableBriefing.keywords,
      cautions: editableBriefing.cautions
    })
    briefingDialogVisible.value = false
    saveRequirements()
    ElMessage.success('简报已更新')
  }

  const confirmRequirements = async () => {
    if (!aiBriefingGenerated.value) {
      ElMessage.warning('请先生成AI简报')
      return
    }

    try {
      // Save requirements
      saveRequirements()

      ElMessage.success('需求已确认，即将进入标题选择阶段')

      // Navigate to title selection
      setTimeout(() => {
        router.push(`/document-generation/title/${projectId}`)
      }, 1500)
    } catch {
      ElMessage.error('保存失败')
    }
  }

  const saveRequirements = () => {
    const data = {
      requirements: requirementsForm,
      aiBriefing: aiBriefing,
      updatedAt: new Date().toISOString()
    }
    localStorage.setItem(`project_${projectId}_requirements`, JSON.stringify(data))
  }

  const goBack = () => {
    router.push('/document-generation/project-list')
  }

  // Helper functions
  const getAudienceDescription = (audience: any) => {
    const parts = []
    if (audience.age) parts.push(getAgeText(audience.age))
    if (audience.gender) parts.push(getGenderText(audience.gender))
    if (audience.education) parts.push(getEducationText(audience.education))
    if (audience.occupation) parts.push(getOccupationText(audience.occupation))
    return parts.length > 0 ? parts.join('、') : '目标受众'
  }

  const getAgeText = (age: string) => {
    const ages: Record<string, string> = {
      '18-25': '18-25岁年轻群体',
      '26-35': '26-35岁青年群体',
      '36-45': '36-45岁中年群体',
      '46-55': '46-55岁中老年群体',
      '55+': '55岁以上群体'
    }
    return ages[age] || age
  }

  const getGenderText = (gender: string) => {
    // 现在直接返回中文值
    return gender || ''
  }

  const getEducationText = (education: string) => {
    // 现在直接返回中文值
    return education || ''
  }

  const getOccupationText = (occupation: string) => {
    // 现在直接返回中文值
    return occupation || ''
  }

  // 验证字数范围
  const validateWordRange = (min: number, max: number, type: 'title' | 'content') => {
    if (type === 'title') {
      if (min < 5 || min > 50 || max < 5 || max > 50) {
        ElMessage.error('标题字数应在5-50字之间')
        return false
      }
    } else {
      if (min < 500 || min > 5000 || max < 500 || max > 5000) {
        ElMessage.error('正文字数应在500-5000字之间')
        return false
      }
    }
    if (min > max) {
      ElMessage.error('最小值不能大于最大值')
      return false
    }
    return true
  }

  // 抽屉相关方法
  const toggleDrawer = () => {
    materialDrawerVisible.value = !materialDrawerVisible.value
  }

  const refreshMaterials = async () => {
    loadingMaterials.value = true
    try {
      await materialStore.loadLibraryMaterials()
      ElMessage.success('素材列表已刷新')
    } catch {
      ElMessage.error('刷新失败')
    } finally {
      loadingMaterials.value = false
    }
  }

  const filterMaterials = () => {
    // 过滤逻辑已在计算属性中实现
  }

  const selectMaterial = (material: Material) => {
    // 检查是否已经选中
    const existingIndex = selectedMaterials.value.findIndex((m) => m.id === material.id)
    if (existingIndex === -1) {
      selectedMaterials.value.push(material)
      ElMessage.success(`已添加素材: ${material.title}`)
    } else {
      ElMessage.info('该素材已选中')
    }
  }

  const handleDragStart = (event: DragEvent, material: Material) => {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', JSON.stringify(material))
      event.dataTransfer.effectAllowed = 'copy'
    }
  }

  const getTagType = (tag: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
    const tagTypes: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
      外部: 'warning',
      主流媒体: 'success',
      本地: 'info'
    }
    return tagTypes[tag] || 'primary'
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const goToMaterialManagement = () => {
    router.push('/material/management')
  }

  // 模板相关方法
  const loadTemplates = () => {
    try {
      const templates = localStorage.getItem('requirement-templates')
      if (templates) {
        savedTemplates.value = JSON.parse(templates)
      }
    } catch (error) {
      console.error('加载模板失败:', error)
      ElMessage.error('加载模板失败')
    }
  }

  const saveTemplates = () => {
    try {
      localStorage.setItem('requirement-templates', JSON.stringify(savedTemplates.value))
    } catch (error) {
      console.error('保存模板失败:', error)
      ElMessage.error('保存模板失败')
    }
  }

  const saveAsTemplate = () => {
    templateForm.name = ''
    templateForm.description = ''
    saveTemplateDialogVisible.value = true
  }

  const confirmSaveTemplate = async () => {
    if (!templateFormRef.value) return

    try {
      await templateFormRef.value.validate()

      // 检查模板名称是否重复
      const existingTemplate = savedTemplates.value.find((t) => t.name === templateForm.name)
      if (existingTemplate) {
        ElMessage.error('该模板名称已存在')
        return
      }

      savingTemplate.value = true

      const newTemplate: Template = {
        id: Date.now().toString(),
        name: templateForm.name,
        description: templateForm.description,
        data: { ...requirementsForm },
        createdAt: new Date().toISOString()
      }

      savedTemplates.value.unshift(newTemplate)
      saveTemplates()

      ElMessage.success('模板保存成功')
      saveTemplateDialogVisible.value = false
    } catch (error) {
      console.error('保存模板失败:', error)
    } finally {
      savingTemplate.value = false
    }
  }

  const handleTemplateCommand = (command: string) => {
    if (command === 'manage') {
      templateManageDialogVisible.value = true
    } else {
      applyTemplate(command)
    }
  }

  const applyTemplate = (templateId: string) => {
    const template = savedTemplates.value.find((t) => t.id === templateId)
    if (!template) {
      ElMessage.error('模板不存在')
      return
    }

    try {
      // 应用模板数据
      Object.assign(requirementsForm, template.data)
      ElMessage.success(`已应用模板: ${template.name}`)
    } catch (error) {
      console.error('应用模板失败:', error)
      ElMessage.error('应用模板失败，请重试')
    }
  }

  const editTemplate = (template: Template) => {
    currentEditingTemplate.value = template
    renameForm.name = template.name
    renameTemplateDialogVisible.value = true
  }

  const confirmRenameTemplate = async () => {
    if (!renameFormRef.value || !currentEditingTemplate.value) return

    try {
      await renameFormRef.value.validate()

      // 检查新名称是否重复
      const existingTemplate = savedTemplates.value.find(
        (t) => t.name === renameForm.name && t.id !== currentEditingTemplate.value!.id
      )
      if (existingTemplate) {
        ElMessage.error('该模板名称已存在')
        return
      }

      renamingTemplate.value = true

      const template = savedTemplates.value.find((t) => t.id === currentEditingTemplate.value!.id)
      if (template) {
        template.name = renameForm.name
        saveTemplates()
        ElMessage.success('重命名成功')
        renameTemplateDialogVisible.value = false
      }
    } catch (error) {
      console.error('重命名失败:', error)
    } finally {
      renamingTemplate.value = false
    }
  }

  const deleteTemplate = async (templateId: string) => {
    try {
      await ElMessageBox.confirm('确定要删除这个模板吗？删除后不可恢复。', '确认删除', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })

      const index = savedTemplates.value.findIndex((t) => t.id === templateId)
      if (index > -1) {
        savedTemplates.value.splice(index, 1)
        saveTemplates()
        ElMessage.success('删除成功')
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除模板失败:', error)
        ElMessage.error('删除失败，请重试')
      }
    }
  }

  const previewTemplate = (template: Template) => {
    previewingTemplate.value = template
    templatePreviewDialogVisible.value = true
  }

  const applyTemplateFromPreview = () => {
    if (previewingTemplate.value) {
      applyTemplate(previewingTemplate.value.id)
      templatePreviewDialogVisible.value = false
    }
  }
</script>

<style scoped lang="scss">
  .requirements-container {
    position: relative;
    max-width: 1200px;
    padding: 20px;
    margin: 0 auto;
  }

  .requirements-layout {
    position: relative;
    display: flex;
  }

  // 模板操作区域样式
  .template-actions {
    padding: 16px;
    margin-bottom: 20px;
    background: var(--el-bg-color-page);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;

    .el-button-group {
      .el-button {
        border-radius: 6px;
      }
    }
  }

  .requirements-content {
    flex: 1;
    transition: margin-right 0.3s ease;
  }

  .requirements-content.drawer-open {
    margin-right: 400px;
  }

  .step-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    margin-bottom: 40px;
    background: var(--el-bg-color);
    border-radius: 8px;
  }

  .step-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .step-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      margin-bottom: 8px;
      font-weight: bold;
      color: var(--el-text-color-secondary);
      background: var(--el-border-color);
      border-radius: 50%;
    }

    .step-label {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }

    &.active {
      .step-number {
        color: white;
        background: var(--el-color-primary);
      }

      .step-label {
        font-weight: 500;
        color: var(--el-color-primary);
      }
    }
  }

  .step-connector {
    width: 60px;
    height: 2px;
    margin: 0 20px;
    margin-top: -20px;
    background: var(--el-border-color);
  }

  .requirements-form {
    padding: 30px;
    margin-bottom: 20px;
    background: var(--el-bg-color);
    border-radius: 8px;
  }

  // 字数范围样式
  .word-range-group {
    display: flex;
    gap: 12px;
    align-items: center;

    .range-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 0;

      .el-input-number {
        width: 140px;

        .el-input__inner {
          font-size: 14px;
          font-weight: 500;
          text-align: center;
        }
      }

      .range-label {
        margin-top: 4px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    .range-separator {
      margin: 0 8px;
      font-size: 16px;
      font-weight: bold;
      color: var(--el-text-color-regular);
    }
  }

  .form-help-text {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--el-text-color-secondary);
  }

  // 受众群体样式
  .audience-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    .audience-item {
      margin-bottom: 0;

      .el-form-item__label {
        min-width: 80px;
        font-size: 13px;
        color: var(--el-text-color-regular);
        white-space: nowrap;
      }

      .el-select {
        width: 100%;
        min-width: 200px;

        .el-input__inner {
          min-height: 40px;
          padding: 8px 12px;
          font-size: 14px;
        }

        .el-input__suffix {
          right: 8px;
        }
      }
    }
  }

  // 关键词样式
  .keywords-input {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }

  .keywords-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
  }

  .reference-section {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
  }

  .selected-materials {
    padding: 10px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
  }

  .material-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 10px;
    border-bottom: 1px solid var(--el-border-color);

    &:last-child {
      border-bottom: none;
    }

    .material-info {
      flex: 1;

      h4 {
        margin: 0 0 8px;
        font-size: 14px;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 0;
        font-size: 12px;
        line-height: 1.4;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .form-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 30px;
  }

  .ai-briefing-section {
    padding: 30px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-color-primary-light-8);
    border-radius: 8px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 18px;
      color: var(--el-color-primary);
    }
  }

  .briefing-section {
    margin-bottom: 25px;

    &:last-child {
      margin-bottom: 0;
    }

    h4 {
      margin: 0 0 12px;
      font-size: 16px;
      color: var(--el-text-color-primary);
    }

    p,
    li {
      margin: 0;
      line-height: 1.6;
      color: var(--el-text-color-regular);
    }

    ul {
      padding-left: 20px;
      margin: 0;
    }
  }

  .keyword-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  @media (width <= 768px) {
    .requirements-form {
      padding: 20px;
    }

    .step-indicator {
      padding: 15px;
    }

    .step-connector {
      width: 40px;
      margin: 0 10px;
    }

    .form-actions {
      flex-direction: column;
      align-items: center;
    }

    .reference-section {
      flex-direction: column;
    }

    .keywords-input {
      flex-direction: column;
    }

    .word-range-group {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;

      .range-item {
        align-items: flex-start;

        .el-input-number {
          width: 100%;
        }
      }

      .range-separator {
        align-self: center;
        margin: 8px 0;
      }
    }

    .audience-group {
      grid-template-columns: 1fr;
      gap: 12px;

      .audience-item {
        .el-select {
          min-width: 100%;
        }
      }
    }
  }

  // 素材抽屉样式
  .material-drawer {
    position: fixed;
    top: 0;
    right: -400px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    width: 400px;
    height: 100vh;
    background: var(--el-bg-color);
    border-left: 1px solid var(--el-border-color);
    box-shadow: -2px 0 8px rgb(0 0 0 / 10%);
    transition: right 0.3s ease;

    &.drawer-open {
      right: 0;
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: var(--el-bg-color-page);
      border-bottom: 1px solid var(--el-border-color);

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .drawer-actions {
        display: flex;
        gap: 8px;
      }
    }

    .drawer-content {
      display: flex;
      flex: 1;
      flex-direction: column;
      overflow: hidden;

      .material-filters {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px 20px;
        border-bottom: 1px solid var(--el-border-color);

        .el-input {
          width: 100%;
        }

        .el-select {
          width: 100%;
        }
      }

      .material-list {
        flex: 1;
        padding: 16px 20px;
        overflow-y: auto;

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: var(--el-text-color-secondary);

          p {
            margin: 12px 0;
            font-size: 14px;
          }
        }

        .material-item {
          padding: 16px;
          margin-bottom: 12px;
          cursor: pointer;
          background: var(--el-bg-color);
          border: 1px solid var(--el-border-color);
          border-radius: 8px;
          transition: all 0.2s ease;

          &:hover {
            border-color: var(--el-color-primary);
            box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
          }

          &:active {
            transform: translateY(1px);
          }

          .material-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 8px;

            h4 {
              flex: 1;
              margin: 0;
              font-size: 14px;
              font-weight: 600;
              line-height: 1.4;
              color: var(--el-text-color-primary);
            }

            .material-tags {
              display: flex;
              flex-wrap: wrap;
              gap: 4px;
              margin-left: 8px;
            }
          }

          .material-content {
            margin-bottom: 8px;

            p {
              display: -webkit-box;
              margin: 0;
              overflow: hidden;
              font-size: 12px;
              line-height: 1.4;
              color: var(--el-text-color-regular);
              -webkit-line-clamp: 2;
              line-clamp: 2;
              -webkit-box-orient: vertical;
            }
          }

          .material-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 11px;
            color: var(--el-text-color-secondary);

            .material-source {
              font-weight: 500;
            }
          }
        }
      }
    }
  }

  .drawer-toggle {
    position: fixed;
    top: 50%;
    right: 20px;
    z-index: 999;
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 500;
    color: white;
    cursor: pointer;
    background: var(--el-color-primary);
    border-radius: 8px 0 0 8px;
    box-shadow: -2px 0 8px rgb(0 0 0 / 10%);
    transition: all 0.3s ease;
    transform: translateY(-50%);

    &:hover {
      right: 25px;
      background: var(--el-color-primary-light-3);
    }

    .el-icon {
      font-size: 16px;
    }
  }

  // 模板管理样式
  .template-list {
    .empty-state {
      padding: 40px 0;
      text-align: center;
    }

    .template-items {
      .template-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        margin-bottom: 12px;
        background: var(--el-bg-color-page);
        border: 1px solid var(--el-border-color-light);
        border-radius: 8px;
        transition: all 0.3s ease;

        &:hover {
          border-color: var(--el-color-primary);
          box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
        }

        .template-info {
          flex: 1;

          .template-name {
            margin-bottom: 4px;
            font-size: 16px;
            font-weight: 500;
            color: var(--el-text-color-primary);
          }

          .template-description {
            margin-bottom: 4px;
            font-size: 14px;
            color: var(--el-text-color-regular);
          }

          .template-time {
            font-size: 12px;
            color: var(--el-text-color-placeholder);
          }
        }

        .template-actions {
          display: flex;
          gap: 8px;
        }
      }
    }
  }

  // 模板预览样式
  .template-preview {
    .preview-header {
      padding-bottom: 16px;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--el-border-color-light);

      h3 {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .preview-description {
        margin: 0 0 8px;
        font-size: 14px;
        line-height: 1.5;
        color: var(--el-text-color-regular);
      }

      .preview-time {
        margin: 0;
        font-size: 12px;
        color: var(--el-text-color-placeholder);
      }
    }

    .preview-content {
      .el-descriptions {
        .el-descriptions__label {
          font-weight: 500;
          color: var(--el-text-color-primary);
        }

        .el-descriptions__content {
          color: var(--el-text-color-regular);
        }
      }
    }
  }

  // 响应式设计
  @media (width <= 768px) {
    .material-drawer {
      right: -100vw;
      width: 100vw;

      &.drawer-open {
        right: 0;
      }
    }

    .requirements-content.drawer-open {
      margin-right: 0;
    }

    .drawer-toggle {
      right: 10px;
      padding: 8px 12px;
      font-size: 12px;

      span {
        display: none;
      }
    }
  }
</style>

<style lang="scss">
  // Global styles for ElSlider input
  .el-slider__input {
    width: 100px;
  }
</style>
