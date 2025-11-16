from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON, Enum as SqlEnum, BigInteger, Numeric, Index, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

# Association table for Material and MaterialTag many-to-many relationship
material_tag_association = Table(
    "material_tag_association",
    Base.metadata,
    Column("material_id", BigInteger, ForeignKey("materials.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", BigInteger, ForeignKey("material_tags.id", ondelete="CASCADE"), primary_key=True),
    Index("idx_material_tag_association_material_id", "material_id"),
    Index("idx_material_tag_association_tag_id", "tag_id")
)


# ============================================================================
# 0. 用户表 (users) - 全局用户管理
# ============================================================================
class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        Index('idx_users_email', 'email', unique=True),
        Index('idx_users_username', 'username', unique=True),
        Index('idx_users_created_at', 'created_at'),
        Index('idx_users_is_active', 'is_active'),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="用户ID")
    username = Column(String(100), unique=True, nullable=False, comment="用户名")
    email = Column(String(255), unique=True, nullable=False, comment="邮箱")
    full_name = Column(String(255), comment="全名")
    password_hash = Column(String(255), nullable=False, comment="密码哈希")
    is_active = Column(Boolean, default=True, nullable=False, comment="是否激活")
    is_admin = Column(Boolean, default=False, nullable=False, comment="是否管理员")
    is_email_verified = Column(Boolean, default=False, nullable=False, comment="邮箱是否验证")
    preferences = Column(JSON, comment="用户偏好设置（JSON）")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    last_login_at = Column(DateTime(timezone=True), comment="最后登录时间")

    # 关系
    material_libraries = relationship("MaterialLibrary", back_populates="user", cascade="all, delete-orphan")
    materials = relationship("Material", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    search_histories = relationship("SearchHistory", back_populates="user", cascade="all, delete-orphan")


# ============================================================================
# 1. 素材库表 (material_libraries)
# ============================================================================
class MaterialLibrary(Base):
    __tablename__ = "material_libraries"
    __table_args__ = (
        Index('idx_material_libraries_user_id', 'user_id'),
        Index('idx_material_libraries_is_default', 'is_default'),
        Index('idx_material_libraries_created_at', 'created_at'),
        Index('idx_material_libraries_user_default', 'user_id', 'is_default'),  # 复合索引：查找用户默认库
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="素材库ID")
    library_name = Column(String(255), nullable=False, comment="素材库名称")
    description = Column(Text, comment="描述")
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="用户ID")
    is_default = Column(Boolean, default=False, nullable=False, comment="是否为默认素材库")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    user = relationship("User", back_populates="material_libraries")
    materials = relationship("Material", back_populates="library", cascade="all, delete-orphan")


# ============================================================================
# 2. 素材表 (materials)
# ============================================================================
class Material(Base):
    __tablename__ = "materials"
    __table_args__ = (
        Index('idx_materials_library_id', 'library_id'),
        Index('idx_materials_user_id', 'user_id'),
        Index('idx_materials_score', 'score'),
        Index('idx_materials_created_at', 'created_at'),
        Index('idx_materials_search_provider', 'search_provider'),
        Index('idx_materials_published_date', 'published_date'),
        Index('idx_materials_library_score', 'library_id', 'score'),  # 复合索引：按库和评分排序
        Index('idx_materials_user_created', 'user_id', 'created_at'),  # 复合索引：用户素材时间线
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="素材ID")
    library_id = Column(BigInteger, ForeignKey("material_libraries.id", ondelete="CASCADE"), nullable=False, comment="素材库ID")
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="用户ID")
    title = Column(String(500), nullable=False, comment="AI总结标题")
    summary = Column(Text, comment="摘要")
    url = Column(String(2048), comment="原始URL")  # 增加URL长度限制
    content = Column(JSON, comment="完整内容（JSON格式）")
    score = Column(Numeric(precision=5, scale=4), default=0.0000, nullable=False, comment="相关性评分（0-1）")
    key_excerpts = Column(JSON, comment="关键摘录（JSON数组）")
    published_date = Column(DateTime(timezone=True), comment="发布日期")
    search_provider = Column(String(100), comment="搜索提供商（tavily/bocha等）")
    search_query = Column(String(500), comment="搜索关键词")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    library = relationship("MaterialLibrary", back_populates="materials")
    user = relationship("User", back_populates="materials")
    tags = relationship("MaterialTag", secondary=material_tag_association, back_populates="materials")


# ============================================================================
# 3. 素材标签表 (material_tags)
# ============================================================================
class MaterialTag(Base):
    __tablename__ = "material_tags"
    __table_args__ = (
        Index('idx_material_tags_tag_name', 'tag_name'),
        Index('idx_material_tags_created_at', 'created_at'),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="标签ID")
    tag_name = Column(String(100), nullable=False, comment="标签名称")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")

    materials = relationship("Material", secondary=material_tag_association, back_populates="tags")


# ============================================================================
# 4. 项目表 (projects)
# ============================================================================
class Project(Base):
    __tablename__ = "projects"
    __table_args__ = (
        Index('idx_projects_user_id', 'user_id'),
        Index('idx_projects_status', 'status'),
        Index('idx_projects_type', 'type'),
        Index('idx_projects_created_at', 'created_at'),
        Index('idx_projects_updated_at', 'updated_at'),
        Index('idx_projects_user_status', 'user_id', 'status'),  # 复合索引：用户项目状态查询
        Index('idx_projects_status_updated', 'status', 'updated_at'),  # 复合索引：按状态和更新时间排序
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="项目ID")
    name = Column(String(255), nullable=False, comment="项目名称")
    type = Column(SqlEnum('article', 'report', 'marketing', 'technical', name='project_type'),
                  default='article', nullable=False, comment="项目类型")
    status = Column(SqlEnum('TITLE_GENERATION', 'OUTLINE_GENERATION', 'BODY_GENERATION', 'COMPLETED', name='project_status'),
                    default='TITLE_GENERATION', nullable=False, comment="项目当前状态")
    current_component = Column(SqlEnum('topic-selection', 'outline', 'content', name='project_component'),
                               default='topic-selection', nullable=False, comment="当前组件")
    description = Column(Text, comment="项目描述")
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="用户ID")
    folder_id = Column(BigInteger, comment="文件夹ID（可选）")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    user = relationship("User", back_populates="projects")
    requirement = relationship("Requirement", back_populates="project", uselist=False)
    titles = relationship("Title", back_populates="project", cascade="all, delete-orphan")
    outlines = relationship("Outline", back_populates="project", cascade="all, delete-orphan")
    bodies = relationship("Body", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project")
    research_briefs = relationship("ResearchBrief", back_populates="project")
    title_candidates = relationship("TitleCandidate", back_populates="project", cascade="all, delete-orphan")


# ============================================================================
# 5. 需求表 (requirements)
# ============================================================================
class Requirement(Base):
    __tablename__ = "requirements"
    __table_args__ = (
        Index('idx_requirements_project_id', 'project_id', unique=True),  # 一个项目一个需求
        Index('idx_requirements_source_library_id', 'source_library_id'),
        Index('idx_requirements_created_at', 'created_at'),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="需求ID")
    project_id = Column(BigInteger, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, comment="项目ID")
    topic = Column(String(500), nullable=False, comment="主题/标题")
    key_points = Column(JSON, comment="关键要点（JSON数组）")
    special_requirements = Column(Text, comment="特殊要求")
    target_audience = Column(String(255), comment="目标受众")
    document_type = Column(String(100), comment="文档类型")
    word_count = Column(Integer, comment="目标字数")
    tone = Column(String(100), comment="写作风格")
    source_library_id = Column(BigInteger, ForeignKey("material_libraries.id", ondelete="SET NULL"), comment="素材库ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    project = relationship("Project", back_populates="requirement")
    source_library = relationship("MaterialLibrary")


# ============================================================================
# 6. AI简报表 (research_briefs)
# ============================================================================
class ResearchBrief(Base):
    __tablename__ = "research_briefs"
    __table_args__ = (
        Index('idx_research_briefs_project_id', 'project_id'),
        Index('idx_research_briefs_status', 'status'),
        Index('idx_research_briefs_task_id', 'task_id'),
        Index('idx_research_briefs_created_at', 'created_at'),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="简报ID")
    project_id = Column(BigInteger, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, comment="项目ID")
    brief_content = Column(Text, nullable=False, comment="简报内容（Markdown）")
    status = Column(SqlEnum('draft', 'generated', 'edited', 'confirmed', name='brief_status'),
                    default='draft', nullable=False, comment="状态")
    word_count = Column(Integer, default=0, comment="字数统计")
    task_id = Column(String(255), comment="关联的AI任务ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    project = relationship("Project", back_populates="research_briefs")


# ============================================================================
# 7. 标题候选表 (title_candidates)
# ============================================================================
class TitleCandidate(Base):
    __tablename__ = "title_candidates"
    __table_args__ = (
        Index('idx_title_candidates_project_id', 'project_id'),
        Index('idx_title_candidates_status', 'status'),
        Index('idx_title_candidates_score', 'score'),
        Index('idx_title_candidates_created_at', 'created_at'),
        Index('idx_title_candidates_project_score', 'project_id', 'score'),  # 复合索引：项目内按评分排序
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="候选标题ID")
    project_id = Column(BigInteger, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, comment="项目ID")
    title_text = Column(Text, nullable=False, comment="标题内容")
    angle = Column(Text, comment="研究角度")
    why_now = Column(Text, comment="为什么是现在")
    verifiability = Column(Text, comment="可验证性")
    feasibility = Column(Text, comment="可行性")
    sources = Column(JSON, comment="来源素材ID列表（JSON数组）")
    risk_notes = Column(Text, comment="风险提示")
    news_values = Column(JSON, comment="新闻价值点（JSON数组）")
    status = Column(SqlEnum('generated', 'selected', 'rejected', name='title_candidate_status'),
                    default='generated', nullable=False, comment="状态")
    score = Column(Numeric(precision=5, scale=2), comment="AI评分（0-100）")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")

    # 关系
    project = relationship("Project", back_populates="title_candidates")
    material_relations = relationship("MaterialTitleRelation", back_populates="title_candidate", cascade="all, delete-orphan")


# ============================================================================
# 8. 标题表（版本化）(titles)
# ============================================================================
class Title(Base):
    __tablename__ = "titles"
    __table_args__ = (
        Index('idx_titles_project_id', 'project_id'),
        Index('idx_titles_is_active', 'is_active'),
        Index('idx_titles_created_at', 'created_at'),
        Index('idx_titles_project_active', 'project_id', 'is_active'),  # 复合索引：查找项目的活动标题
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="标题ID")
    project_id = Column(BigInteger, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, comment="项目ID")
    title_text = Column(Text, nullable=False, comment="标题内容")
    angle = Column(Text, comment="研究角度")
    why_now = Column(Text, comment="为什么是现在")
    verifiability = Column(Text, comment="可验证性")
    feasibility = Column(Text, comment="可行性")
    sources = Column(JSON, comment="来源素材ID列表（JSON数组）")
    risk_notes = Column(Text, comment="风险提示")
    news_values = Column(JSON, comment="新闻价值点（JSON数组）")
    is_active = Column(Boolean, default=False, nullable=False, comment="是否为当前活动版本")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    project = relationship("Project", back_populates="titles")
    outlines = relationship("Outline", back_populates="title")


# ============================================================================
# 9. 大纲表（版本化）(outlines)
# ============================================================================
class Outline(Base):
    __tablename__ = "outlines"
    __table_args__ = (
        Index('idx_outlines_project_id', 'project_id'),
        Index('idx_outlines_title_id', 'title_id'),
        Index('idx_outlines_is_active', 'is_active'),
        Index('idx_outlines_task_id', 'task_id'),
        Index('idx_outlines_created_at', 'created_at'),
        Index('idx_outlines_project_active', 'project_id', 'is_active'),  # 复合索引：项目的活动大纲
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="大纲ID")
    project_id = Column(BigInteger, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, comment="项目ID")
    title_id = Column(BigInteger, ForeignKey("titles.id", ondelete="CASCADE"), nullable=False, comment="依赖的标题ID")
    is_active = Column(Boolean, default=False, nullable=False, comment="是否为当前活动版本")
    outline_sources_details = Column(JSON, comment="大纲来源详情（JSON）")
    section_count = Column(Integer, default=0, nullable=False, comment="章节数量")
    generation_time = Column(Integer, default=0, comment="生成耗时（毫秒）")
    total_word_estimate = Column(Integer, comment="预估总字数")
    generation_summary = Column(Text, comment="生成总结")
    final_report = Column(Text, comment="最终报告")
    task_id = Column(String(255), comment="关联的AI任务ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    project = relationship("Project", back_populates="outlines")
    title = relationship("Title", back_populates="outlines")
    sections = relationship("OutlineSection", back_populates="outline", cascade="all, delete-orphan")
    bodies = relationship("Body", back_populates="outline")


# ============================================================================
# 10. 大纲章节表 (outline_sections)
# ============================================================================
class OutlineSection(Base):
    __tablename__ = "outline_sections"
    __table_args__ = (
        Index('idx_outline_sections_outline_id', 'outline_id'),
        Index('idx_outline_sections_order', 'section_order'),
        Index('idx_outline_sections_level', 'level'),
        Index('idx_outline_sections_priority', 'priority'),
        Index('idx_outline_sections_outline_order', 'outline_id', 'section_order'),  # 复合索引：大纲章节排序
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="章节ID")
    outline_id = Column(BigInteger, ForeignKey("outlines.id", ondelete="CASCADE"), nullable=False, comment="大纲ID")
    section_order = Column(Integer, nullable=False, comment="章节顺序")
    level = Column(Integer, default=1, nullable=False, comment="标题级别（1-6）")
    section_title = Column(String(500), nullable=False, comment="章节标题")
    content_direction = Column(Text, comment="内容方向")
    data_requirements = Column(JSON, comment="数据需求（JSON数组）")
    estimated_word_count = Column(Integer, comment="预估字数")
    priority = Column(SqlEnum('high', 'medium', 'low', name='section_priority'),
                      default='medium', nullable=False, comment="优先级")
    sources = Column(JSON, comment="来源素材（JSON数组）")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    outline = relationship("Outline", back_populates="sections")


# ============================================================================
# 11. 正文表（版本化）(bodies)
# ============================================================================
class Body(Base):
    __tablename__ = "bodies"
    __table_args__ = (
        Index('idx_bodies_project_id', 'project_id'),
        Index('idx_bodies_outline_id', 'outline_id'),
        Index('idx_bodies_is_active', 'is_active'),
        Index('idx_bodies_task_id', 'task_id'),
        Index('idx_bodies_word_count', 'word_count'),
        Index('idx_bodies_readability_score', 'readability_score'),
        Index('idx_bodies_created_at', 'created_at'),
        Index('idx_bodies_project_active', 'project_id', 'is_active'),  # 复合索引：项目的活动正文
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="正文ID")
    project_id = Column(BigInteger, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, comment="项目ID")
    outline_id = Column(BigInteger, ForeignKey("outlines.id", ondelete="CASCADE"), nullable=False, comment="依赖的大纲ID")
    content = Column(Text, nullable=False, comment="正文内容（Markdown）")
    word_count = Column(Integer, default=0, nullable=False, comment="字数")
    character_count = Column(Integer, default=0, nullable=False, comment="字符数")
    character_count_no_spaces = Column(Integer, default=0, nullable=False, comment="字符数（不含空格）")
    paragraph_count = Column(Integer, default=0, nullable=False, comment="段落数")
    sentence_count = Column(Integer, default=0, nullable=False, comment="句子数")
    headings_count = Column(Integer, default=0, nullable=False, comment="标题数")
    headings_by_level = Column(JSON, comment="各级标题数量（JSON）")
    links_count = Column(Integer, default=0, nullable=False, comment="链接数")
    images_count = Column(Integer, default=0, nullable=False, comment="图片数")
    code_blocks_count = Column(Integer, default=0, nullable=False, comment="代码块数")
    list_items_count = Column(Integer, default=0, nullable=False, comment="列表项数")
    avg_sentence_length = Column(Numeric(precision=8, scale=2), default=0.00, comment="平均句子长度")
    avg_paragraph_length = Column(Numeric(precision=8, scale=2), default=0.00, comment="平均段落长度")
    readability_score = Column(Numeric(precision=5, scale=2), default=0.00, comment="可读性分数（0-100）")
    suggestions = Column(JSON, comment="AI建议（JSON数组）")
    is_active = Column(Boolean, default=False, nullable=False, comment="是否为当前活动版本")
    task_id = Column(String(255), comment="关联的AI任务ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    project = relationship("Project", back_populates="bodies")
    outline = relationship("Outline", back_populates="bodies")


# ============================================================================
# 12. 素材与标题关联表 (material_title_relations)
# ============================================================================
class MaterialTitleRelation(Base):
    __tablename__ = "material_title_relations"
    __table_args__ = (
        Index('idx_material_title_relations_material_id', 'material_id'),
        Index('idx_material_title_relations_title_candidate_id', 'title_candidate_id'),
        Index('idx_material_title_relations_material_title', 'material_id', 'title_candidate_id', unique=True),  # 防重复关联
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="关联ID")
    material_id = Column(BigInteger, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, comment="素材ID")
    title_candidate_id = Column(BigInteger, ForeignKey("title_candidates.id", ondelete="CASCADE"), nullable=False, comment="标题候选ID")
    relevance_score = Column(Numeric(precision=5, scale=4), comment="相关性评分（0-1）")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")

    # 关系
    material = relationship("Material")
    title_candidate = relationship("TitleCandidate", back_populates="material_relations")


# ============================================================================
# 13. 素材与大纲章节关联表 (material_outline_section_relations)
# ============================================================================
class MaterialOutlineSectionRelation(Base):
    __tablename__ = "material_outline_section_relations"
    __table_args__ = (
        Index('idx_material_outline_section_relations_material_id', 'material_id'),
        Index('idx_material_outline_section_relations_outline_section_id', 'outline_section_id'),
        Index('idx_material_outline_section_relations_binding_type', 'binding_type'),
        Index('idx_material_outline_section_relations_material_section', 'material_id', 'outline_section_id', unique=True),  # 防重复关联
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="关联ID")
    material_id = Column(BigInteger, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, comment="素材ID")
    outline_section_id = Column(BigInteger, ForeignKey("outline_sections.id", ondelete="CASCADE"), nullable=False, comment="大纲章节ID")
    binding_type = Column(SqlEnum('required', 'reference', 'optional', name='binding_type'),
                          default='required', nullable=False, comment="绑定类型")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")

    # 关系
    material = relationship("Material")
    outline_section = relationship("OutlineSection")


# ============================================================================
# 14. 素材与项目关联表 (material_project_relations)
# ============================================================================
class MaterialProjectRelation(Base):
    __tablename__ = "material_project_relations"
    __table_args__ = (
        Index('idx_material_project_relations_material_id', 'material_id'),
        Index('idx_material_project_relations_project_id', 'project_id'),
        Index('idx_material_project_relations_context', 'context'),
        Index('idx_material_project_relations_material_project_context', 'material_id', 'project_id', 'context', unique=True),  # 防重复关联
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="关联ID")
    material_id = Column(BigInteger, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, comment="素材ID")
    project_id = Column(BigInteger, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, comment="项目ID")
    context = Column(SqlEnum('title_generation', 'outline_generation', 'content_generation', name='material_context'),
                     nullable=False, comment="使用场景")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")

    # 关系
    material = relationship("Material")
    project = relationship("Project")


# ============================================================================
# 15. AI任务表 (tasks)
# ============================================================================
class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (
        Index('idx_tasks_project_id', 'project_id'),
        Index('idx_tasks_task_type', 'task_type'),
        Index('idx_tasks_status', 'status'),
        Index('idx_tasks_task_id', 'task_id', unique=True),  # 外部任务ID唯一
        Index('idx_tasks_created_at', 'created_at'),
        Index('idx_tasks_updated_at', 'updated_at'),
        Index('idx_tasks_status_created', 'status', 'created_at'),  # 复合索引：按状态和创建时间排序
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="任务ID")
    project_id = Column(BigInteger, ForeignKey("projects.id", ondelete="SET NULL"), comment="项目ID（可选）")
    task_type = Column(SqlEnum(
        'scope_agent', 'search_agent', 'search2title_agent', 'outline_generate', 'content_generate',
        'title_polish', 'content_polish', name='task_type'
    ), nullable=False, comment="任务类型")
    task_id = Column(String(255), nullable=False, comment="外部任务ID")
    status = Column(SqlEnum('pending', 'running', 'completed', 'failed', 'cancelled', 'timeout', name='task_status'),
                    default='pending', nullable=False, comment="任务状态")
    progress = Column(Integer, default=0, nullable=False, comment="进度百分比（0-100）")
    message = Column(Text, comment="状态消息")
    result = Column(JSON, comment="任务结果（JSON）")
    error = Column(Text, comment="错误信息")
    request_params = Column(JSON, comment="请求参数（JSON）")
    current_phase = Column(String(100), comment="当前阶段（如：research/title_generation）")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    completed_at = Column(DateTime(timezone=True), comment="完成时间")

    project = relationship("Project", back_populates="tasks")


# ============================================================================
# 16. 任务轮询历史表 (task_poll_history)
# ============================================================================
class TaskPollHistory(Base):
    __tablename__ = "task_poll_history"
    __table_args__ = (
        Index('idx_task_poll_history_task_id', 'task_id'),
        Index('idx_task_poll_history_status', 'status'),
        Index('idx_task_poll_history_created_at', 'created_at'),
        Index('idx_task_poll_history_task_created', 'task_id', 'created_at'),  # 复合索引：任务轮询时间线
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="轮询历史ID")
    task_id = Column(BigInteger, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, comment="任务ID")
    status = Column(SqlEnum('pending', 'running', 'completed', 'failed', 'cancelled', 'timeout', name='poll_status'),
                    nullable=False, comment="轮询时的状态")
    progress = Column(Integer, default=0, nullable=False, comment="轮询时的进度")
    response_data = Column(JSON, comment="轮询响应数据（JSON）")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="轮询时间")

    # 关系
    task = relationship("Task")


# ============================================================================
# 17. 搜索历史表 (search_history)
# ============================================================================
class SearchHistory(Base):
    __tablename__ = "search_history"
    __table_args__ = (
        Index('idx_search_history_user_id', 'user_id'),
        Index('idx_search_history_keywords', 'keywords'),
        Index('idx_search_history_search_mode', 'search_mode'),
        Index('idx_search_history_search_provider', 'search_provider'),
        Index('idx_search_history_created_at', 'created_at'),
        Index('idx_search_history_user_created', 'user_id', 'created_at'),  # 复合索引：用户搜索时间线
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="搜索历史ID")
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="用户ID")
    keywords = Column(String(500), nullable=False, comment="搜索关键词")
    search_config = Column(JSON, comment="搜索配置（JSON）")
    search_mode = Column(SqlEnum('simple', 'agent', name='search_mode'),
                         default='simple', nullable=False, comment="搜索模式")
    search_provider = Column(String(100), comment="搜索提供商")
    result_count = Column(Integer, default=0, nullable=False, comment="结果数量")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")

    # 关系
    user = relationship("User", back_populates="search_histories")


# ============================================================================
# 18. 用户偏好设置表 (user_preferences)
# ============================================================================
class UserPreference(Base):
    __tablename__ = "user_preferences"
    __table_args__ = (
        Index('idx_user_preferences_user_id', 'user_id', unique=True),  # 每个用户只有一个偏好设置
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="偏好设置ID")
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="用户ID")
    theme = Column(String(50), default="light", comment="主题设置（light/dark）")
    font_size = Column(String(50), default="medium", comment="字体大小（small/medium/large）")
    auto_save_interval = Column(Integer, default=5, comment="自动保存间隔（秒）")
    shortcut_settings = Column(JSON, comment="快捷键设置（JSON）")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    user = relationship("User")


