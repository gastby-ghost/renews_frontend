// 组件切换功能
document.querySelectorAll('.component-card').forEach(card => {
    card.addEventListener('click', function() {
        const component = this.dataset.component;
        
        // 更新组件卡片状态
        document.querySelectorAll('.component-card').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        
        // 更新编辑面板
        document.querySelectorAll('.editor-panel').forEach(panel => panel.classList.remove('active'));
        document.getElementById(component + 'Panel').classList.add('active');
    });
});

// 项目展开/折叠功能
document.querySelectorAll('.project-title').forEach(title => {
    title.addEventListener('click', function(e) {
        e.stopPropagation();
        const projectItem = this.closest('.project-item');
        const chevron = this.querySelector('.fa-chevron-right, .fa-chevron-down');
        
        projectItem.classList.toggle('expanded');
        
        if (chevron.classList.contains('fa-chevron-right')) {
            chevron.classList.remove('fa-chevron-right');
            chevron.classList.add('fa-chevron-down');
        } else {
            chevron.classList.remove('fa-chevron-down');
            chevron.classList.add('fa-chevron-right');
        }
    });
});

// 项目选择功能
document.querySelectorAll('.project-item').forEach(item => {
    item.addEventListener('click', function(e) {
        if (e.target.closest('.project-title')) return;
        
        document.querySelectorAll('.project-item').forEach(p => p.classList.remove('active'));
        this.classList.add('active');
    });
});

// 组件项点击功能
document.querySelectorAll('.component-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.stopPropagation();
        const component = this.dataset.component;
        
        // 切换到对应组件
        document.querySelectorAll('.component-card').forEach(c => c.classList.remove('active'));
        document.querySelector(`.component-card[data-component="${component}"]`).classList.add('active');
        
        // 更新编辑面板
        document.querySelectorAll('.editor-panel').forEach(panel => panel.classList.remove('active'));
        document.getElementById(component + 'Panel').classList.add('active');
    });
});

// 右侧栏标签切换
document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const tabName = this.dataset.tab;
        
        // 更新标签状态
        document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // 更新面板
        document.querySelectorAll('.sidebar-panel').forEach(panel => panel.classList.remove('active'));
        document.getElementById(tabName + 'Panel').classList.add('active');
    });
});

// 关键词输入功能
const keywordInput = document.querySelector('.keyword-input input');
if (keywordInput) {
    keywordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim()) {
            const keywordTag = document.createElement('span');
            keywordTag.className = 'keyword-tag';
            keywordTag.innerHTML = `${this.value.trim()} <i class="fas fa-times"></i>`;
            
            keywordTag.querySelector('i').addEventListener('click', function() {
                keywordTag.remove();
            });
            
            this.parentNode.insertBefore(keywordTag, this);
            this.value = '';
        }
    });
}

// 关键词删除功能
document.querySelectorAll('.keyword-tag i').forEach(icon => {
    icon.addEventListener('click', function() {
        this.closest('.keyword-tag').remove();
    });
});

// 范围滑块更新
document.querySelectorAll('input[type="range"]').forEach(slider => {
    slider.addEventListener('input', function() {
        const valueDisplay = this.parentNode.querySelector('.range-value');
        if (valueDisplay) {
            let value = this.value;
            if (this.max == 100 && this.min == 0) {
                valueDisplay.textContent = value + '%';
            } else if (this.max == 5000 && this.min == 500) {
                valueDisplay.textContent = value + '字';
            } else if (this.max == 50 && this.min == 10) {
                valueDisplay.textContent = value + '字';
            } else {
                valueDisplay.textContent = value;
            }
        }
    });
});

// 标题选项选择
document.querySelectorAll('.title-option').forEach(option => {
    option.addEventListener('click', function() {
        document.querySelectorAll('.title-option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
    });
});

// 大纲项展开/折叠
document.querySelectorAll('.outline-item-content').forEach(content => {
    content.addEventListener('click', function(e) {
        if (e.target.closest('.outline-item-tools')) return;
        
        const outlineItem = this.closest('.outline-item');
        const chevron = this.querySelector('.fa-chevron-right, .fa-chevron-down');
        const children = outlineItem.querySelector('.outline-children');
        
        if (children) {
            children.style.display = children.style.display === 'none' ? 'block' : 'none';
            
            if (chevron.classList.contains('fa-chevron-right')) {
                chevron.classList.remove('fa-chevron-right');
                chevron.classList.add('fa-chevron-down');
            } else {
                chevron.classList.remove('fa-chevron-down');
                chevron.classList.add('fa-chevron-right');
            }
        }
    });
});

// 拖拽功能
let draggedElement = null;

document.querySelectorAll('.outline-item').forEach(item => {
    item.addEventListener('dragstart', function(e) {
        draggedElement = this;
        this.classList.add('dragging');
    });

    item.addEventListener('dragend', function(e) {
        this.classList.remove('dragging');
    });

    item.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });

    item.addEventListener('dragleave', function(e) {
        this.classList.remove('drag-over');
    });

    item.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        
        if (draggedElement !== this) {
            const parent = this.parentNode;
            const allItems = [...parent.querySelectorAll('.outline-item')];
            const draggedIndex = allItems.indexOf(draggedElement);
            const targetIndex = allItems.indexOf(this);
            
            if (draggedIndex < targetIndex) {
                parent.insertBefore(draggedElement, this.nextSibling);
            } else {
                parent.insertBefore(draggedElement, this);
            }
        }
    });
});

// 素材卡片选择
document.querySelectorAll('.material-card').forEach(card => {
    card.addEventListener('click', function() {
        this.classList.toggle('selected');
    });
});

// AI建议操作
document.querySelectorAll('.suggestion-btn.apply').forEach(btn => {
    btn.addEventListener('click', function() {
        const suggestionItem = this.closest('.suggestion-item');
        suggestionItem.style.opacity = '0.5';
        this.textContent = '已应用';
        this.disabled = true;
    });
});

document.querySelectorAll('.suggestion-btn.ignore').forEach(btn => {
    btn.addEventListener('click', function() {
        const suggestionItem = this.closest('.suggestion-item');
        suggestionItem.style.display = 'none';
    });
});

// 左侧栏折叠/展开
const leftSidebar = document.getElementById('leftSidebar');
const sidebarToggle = document.createElement('button');
sidebarToggle.className = 'nav-btn';
sidebarToggle.style.position = 'absolute';
sidebarToggle.style.left = '10px';
sidebarToggle.style.top = '70px';
sidebarToggle.style.zIndex = '101';
sidebarToggle.innerHTML = '<i class="fas fa-bars"></i>';
document.body.appendChild(sidebarToggle);

sidebarToggle.addEventListener('click', function() {
    leftSidebar.classList.toggle('collapsed');
});

// 统计项点击
document.querySelectorAll('.component-stat-item').forEach(item => {
    item.addEventListener('click', function() {
        const componentName = this.querySelector('span').textContent;
        let component = '';
        
        switch(componentName) {
            case '需求定义': component = 'requirement'; break;
            case '标题生成': component = 'title'; break;
            case '大纲结构': component = 'outline'; break;
            case '正文编辑': component = 'content'; break;
            case '素材管理': component = 'material'; break;
        }
        
        if (component) {
            // 切换到对应组件
            document.querySelectorAll('.component-card').forEach(c => c.classList.remove('active'));
            document.querySelector(`.component-card[data-component="${component}"]`).classList.add('active');
            
            // 更新编辑面板
            document.querySelectorAll('.editor-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById(component + 'Panel').classList.add('active');
        }
    });
});

// 模拟自动保存
setInterval(() => {
    const statusIndicator = document.querySelector('.status-indicator-small');
    const statusText = statusIndicator.nextElementSibling;
    
    statusIndicator.style.backgroundColor = '#f39c12';
    statusText.textContent = '正在保存...';
    
    setTimeout(() => {
        statusIndicator.style.backgroundColor = '#27ae60';
        statusText.textContent = '已保存';
    }, 1000);
}, 30000);

// AI助手按钮点击
document.querySelector('.ai-assistant').addEventListener('click', function() {
    alert('AI助手功能正在开发中...');
});

// 过滤标签点击
document.querySelectorAll('.filter-tag, .filter-chip').forEach(tag => {
    tag.addEventListener('click', function() {
        const parent = this.parentNode;
        parent.querySelectorAll('.filter-tag, .filter-chip').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
    });
});

// AI简报功能
let briefingGenerated = false;
let isEditingBriefing = false;

// 生成AI简报
document.getElementById('generateBriefingBtn').addEventListener('click', function() {
    const aiBriefingSection = document.getElementById('aiBriefingSection');
    const briefingContent = document.getElementById('briefingContent');
    const confirmBtn = document.getElementById('confirmRequirementsBtn');
    
    // 显示AI简报区域
    aiBriefingSection.style.display = 'block';
    
    // 显示加载状态
    briefingContent.innerHTML = `
        <div class="briefing-placeholder">
            <i class="fas fa-brain"></i>
            <span>AI正在分析您的需求...</span>
        </div>
    `;
    
    // 模拟AI分析过程
    setTimeout(() => {
        const formData = collectFormData();
        const aiAnalysis = generateAIAnalysis(formData);
        
        briefingContent.innerHTML = `
            <div class="briefing-text">
                ${aiAnalysis}
            </div>
        `;
        
        // 启用确认按钮
        confirmBtn.disabled = false;
        briefingGenerated = true;
        
        // 滚动到简报区域
        aiBriefingSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 2000);
});

// 收集表单数据
function collectFormData() {
    const formData = {
        writingGoal: document.querySelector('.form-select').value,
        audience: Array.from(document.querySelectorAll('.filter-tag.active')).map(tag => tag.textContent),
        audienceDescription: document.querySelectorAll('.form-textarea')[0].value,
        style: document.querySelector('input[type="range"]').value,
        styleDescription: document.querySelectorAll('.form-textarea')[1].value,
        keywords: Array.from(document.querySelectorAll('.keyword-tag')).map(tag => tag.textContent.replace(' ×', '')),
        wordCount: document.getElementById('titleLengthSlider')?.value || '20',
        specialRequirements: document.querySelectorAll('.form-textarea')[2].value
    };
    return formData;
}

// 生成AI分析内容
function generateAIAnalysis(formData) {
    const analysis = `
        <h4 style="margin-bottom: 10px; color: #fff;">📋 需求分析总结</h4>
        <p style="margin-bottom: 8px;"><strong>写作目标：</strong>${formData.writingGoal}</p>
        <p style="margin-bottom: 8px;"><strong>目标受众：</strong>${formData.audience.join('、') || '未指定'}</p>
        ${formData.audienceDescription ? `<p style="margin-bottom: 8px;"><strong>受众特征：</strong>${formData.audienceDescription}</p>` : ''}
        <p style="margin-bottom: 8px;"><strong>写作风格：</strong>${formData.style}%正式度</p>
        ${formData.styleDescription ? `<p style="margin-bottom: 8px;"><strong>风格要求：</strong>${formData.styleDescription}</p>` : ''}
        <p style="margin-bottom: 8px;"><strong>关键词：</strong>${formData.keywords.join('、') || '无'}</p>
        <p style="margin-bottom: 8px;"><strong>字数要求：</strong>${formData.wordCount}字</p>
        ${formData.specialRequirements ? `<p style="margin-bottom: 8px;"><strong>特殊要求：</strong>${formData.specialRequirements}</p>` : ''}
        
        <h4 style="margin: 15px 0 10px; color: #fff;">💡 AI建议</h4>
        <p style="margin-bottom: 8px;">基于您的需求，建议采用以下策略：</p>
        <ul style="margin-left: 20px; margin-bottom: 8px;">
            <li>重点关注${formData.keywords.length > 0 ? formData.keywords[0] : '核心主题'}的相关内容</li>
            <li>采用${formData.style > 60 ? '正式专业' : '轻松易懂'}的语言风格</li>
            <li>结构上建议包含背景介绍、核心分析、案例说明和未来展望</li>
        </ul>
        
        <h4 style="margin: 15px 0 10px; color: #fff;">🎯 下一步行动</h4>
        <p>确认需求后，系统将为您智能检索相关素材，包括技术文档、行业报告、案例分析等，为内容创作提供有力支持。</p>
    `;
    return analysis;
}

// 编辑AI简报
document.getElementById('editBriefingBtn').addEventListener('click', function() {
    const briefingContent = document.getElementById('briefingContent');
    const briefingEditor = document.getElementById('briefingEditor');
    const briefingTextarea = document.getElementById('briefingTextarea');
    
    if (!isEditingBriefing) {
        // 进入编辑模式
        briefingTextarea.value = briefingContent.textContent.trim();
        briefingContent.style.display = 'none';
        briefingEditor.style.display = 'block';
        this.innerHTML = '<i class="fas fa-times"></i> 取消编辑';
        isEditingBriefing = true;
    } else {
        // 取消编辑
        briefingContent.style.display = 'block';
        briefingEditor.style.display = 'none';
        this.innerHTML = '<i class="fas fa-edit"></i> 编辑';
        isEditingBriefing = false;
    }
});

// 保存编辑
document.getElementById('saveEditBtn').addEventListener('click', function() {
    const briefingContent = document.getElementById('briefingContent');
    const briefingTextarea = document.getElementById('briefingTextarea');
    const editBtn = document.getElementById('editBriefingBtn');
    
    const editedContent = briefingTextarea.value.trim();
    if (editedContent) {
        briefingContent.innerHTML = `<div class="briefing-text">${editedContent.replace(/\n/g, '<br>')}</div>`;
    }
    
    // 退出编辑模式
    briefingContent.style.display = 'block';
    document.getElementById('briefingEditor').style.display = 'none';
    editBtn.innerHTML = '<i class="fas fa-edit"></i> 编辑';
    isEditingBriefing = false;
});

// 取消编辑
document.getElementById('cancelEditBtn').addEventListener('click', function() {
    const briefingContent = document.getElementById('briefingContent');
    const briefingEditor = document.getElementById('briefingEditor');
    const editBtn = document.getElementById('editBriefingBtn');
    
    // 退出编辑模式
    briefingContent.style.display = 'block';
    briefingEditor.style.display = 'none';
    editBtn.innerHTML = '<i class="fas fa-edit"></i> 编辑';
    isEditingBriefing = false;
});

// 刷新AI简报
document.getElementById('refreshBriefingBtn').addEventListener('click', function() {
    if (briefingGenerated) {
        const briefingContent = document.getElementById('briefingContent');
        
        // 显示加载状态
        briefingContent.innerHTML = `
            <div class="briefing-placeholder">
                <i class="fas fa-sync-alt fa-spin"></i>
                <span>AI正在重新分析需求...</span>
            </div>
        `;
        
        // 重新生成分析
        setTimeout(() => {
            const formData = collectFormData();
            const aiAnalysis = generateAIAnalysis(formData);
            
            briefingContent.innerHTML = `
                <div class="briefing-text">
                    ${aiAnalysis}
                </div>
            `;
        }, 1500);
    }
});

// 确认需求
document.getElementById('confirmRequirementsBtn').addEventListener('click', function() {
    if (briefingGenerated) {
        // 切换到素材抓取面板
        document.querySelectorAll('.component-card').forEach(c => c.classList.remove('active'));
        document.querySelector('.component-card[data-component="material"]').classList.add('active');
        
        document.querySelectorAll('.editor-panel').forEach(panel => panel.classList.remove('active'));
        document.getElementById('materialPanel').classList.add('active');
        
        // 显示确认提示
        showNotification('需求已确认，正在为您检索相关素材...', 'success');
        
        // 自动执行AI素材抓取
        setTimeout(() => {
            performAIBasedCapture();
        }, 1000);
    }
});

// 显示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    
    let bgColor = '#3498db'; // info
    if (type === 'success') bgColor = '#27ae60';
    if (type === 'warning') bgColor = '#f39c12';
    if (type === 'error') bgColor = '#e74c3c';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 素材抓取功能
let isCapturing = false;
let selectedMaterials = new Set();
let retrievedMaterials = new Set();
let currentSearchMode = 'ai';

// 检索方式切换
document.querySelectorAll('.search-mode-selector .mode-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.search-mode-selector .mode-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentSearchMode = this.dataset.mode;
        
        // 更新输入框占位符
        const keywordInput = document.getElementById('keywordSearchInput');
        keywordInput.placeholder = currentSearchMode === 'ai' ? '输入关键词，AI将智能理解您的需求...' : '输入关键词进行检索...';
    });
});

// 关键词建议标签点击
document.querySelectorAll('.suggestion-tag').forEach(tag => {
    tag.addEventListener('click', function() {
        document.getElementById('keywordSearchInput').value = this.textContent;
    });
});

// 搜索按钮点击
document.getElementById('searchBtn').addEventListener('click', function() {
    const keyword = document.getElementById('keywordSearchInput').value.trim();
    if (!keyword) {
        showNotification('请输入搜索关键词', 'warning');
        return;
    }
    
    if (currentSearchMode === 'ai') {
        performAISearch(keyword);
    } else {
        performNormalSearch(keyword);
    }
});

// 回车键搜索
document.getElementById('keywordSearchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('searchBtn').click();
    }
});

// AI智能搜索
function performAISearch(keyword) {
    if (isCapturing) return;
    
    const aiCaptureProgress = document.getElementById('aiCaptureProgress');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressStatus = document.getElementById('progressStatus');
    const progressPercentage = document.querySelector('.progress-percentage');
    
    // 显示进度条
    aiCaptureProgress.style.display = 'block';
    isCapturing = true;
    document.getElementById('aiCaptureBtn').disabled = true;
    document.getElementById('searchBtn').disabled = true;
    
    // 模拟AI搜索进度
    const steps = [
        { percentage: 20, status: '正在理解您的搜索意图...' },
        { percentage: 40, status: '正在扩展相关关键词...' },
        { percentage: 60, status: '正在搜索多源素材...' },
        { percentage: 80, status: '正在智能筛选和排序...' },
        { percentage: 100, status: '搜索完成！' }
    ];
    
    let currentStep = 0;
    const progressInterval = setInterval(() => {
        if (currentStep < steps.length) {
            const step = steps[currentStep];
            progressBarFill.style.width = step.percentage + '%';
            progressPercentage.textContent = step.percentage + '%';
            progressStatus.textContent = step.status;
            currentStep++;
        } else {
            clearInterval(progressInterval);
            
            // 搜索完成，显示结果
            setTimeout(() => {
                aiCaptureProgress.style.display = 'none';
                displayRetrievedMaterials(keyword, 'ai');
                isCapturing = false;
                document.getElementById('aiCaptureBtn').disabled = false;
                document.getElementById('searchBtn').disabled = false;
            }, 1000);
        }
    }, 1200);
}

// 普通搜索
function performNormalSearch(keyword) {
    const searchBtn = document.getElementById('searchBtn');
    const originalText = searchBtn.innerHTML;
    
    // 显示搜索状态
    searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    searchBtn.disabled = true;
    
    // 模拟搜索延迟
    setTimeout(() => {
        displayRetrievedMaterials(keyword, 'normal');
        searchBtn.innerHTML = originalText;
        searchBtn.disabled = false;
    }, 1000);
}

// AI抓取素材按钮（基于需求定义）
document.getElementById('aiCaptureBtn').addEventListener('click', function() {
    if (isCapturing) return;
    
    performAIBasedCapture();
});

// 基于需求定义的AI抓取
function performAIBasedCapture() {
    const aiCaptureProgress = document.getElementById('aiCaptureProgress');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressStatus = document.getElementById('progressStatus');
    const progressPercentage = document.querySelector('.progress-percentage');
    
    // 显示进度条
    aiCaptureProgress.style.display = 'block';
    isCapturing = true;
    this.disabled = true;
    document.getElementById('searchBtn').disabled = true;
    
    // 模拟基于需求的抓取进度
    const steps = [
        { percentage: 20, status: '正在分析您的需求定义...' },
        { percentage: 40, status: '正在提取关键词和主题...' },
        { percentage: 60, status: '正在匹配相关素材...' },
        { percentage: 80, status: '正在按质量排序...' },
        { percentage: 100, status: '抓取完成！' }
    ];
    
    let currentStep = 0;
    const progressInterval = setInterval(() => {
        if (currentStep < steps.length) {
            const step = steps[currentStep];
            progressBarFill.style.width = step.percentage + '%';
            progressPercentage.textContent = step.percentage + '%';
            progressStatus.textContent = step.status;
            currentStep++;
        } else {
            clearInterval(progressInterval);
            
            // 抓取完成，显示结果
            setTimeout(() => {
                aiCaptureProgress.style.display = 'none';
                displayRetrievedMaterials('基于需求的智能抓取', 'ai-based');
                isCapturing = false;
                document.getElementById('aiCaptureBtn').disabled = false;
                document.getElementById('searchBtn').disabled = false;
            }, 1000);
        }
    }, 1500);
}

// 显示检索到的素材（在检索结果预览区）
function displayRetrievedMaterials(keyword, searchType) {
    const retrievalResults = document.getElementById('retrievalResults');
    const retrievalMaterialsList = document.getElementById('retrievalMaterialsList');
    const resultsCount = document.getElementById('resultsCount');
    
    // 根据搜索类型生成不同的素材数据
    let materials = [];
    
    if (searchType === 'ai-based') {
        // 基于需求定义的AI抓取
        materials = [
            {
                title: 'AI技术发展报告2023',
                summary: '本报告全面分析了2023年人工智能技术的发展现状，包括机器学习、深度学习、自然语言处理等领域的最新进展...',
                type: '报告',
                rating: 5,
                relevance: '高'
            },
            {
                title: '机器学习应用案例集',
                summary: '收集了机器学习在各行业的典型应用案例，包括金融、医疗、教育、制造等领域的实际应用...',
                type: '文章',
                rating: 4,
                relevance: '高'
            },
            {
                title: '深度学习最新进展',
                summary: '综述了深度学习领域的最新研究进展，包括新型神经网络架构、训练方法优化、应用场景拓展等...',
                type: '文章',
                rating: 4,
                relevance: '高'
            },
            {
                title: 'AI市场规模数据',
                summary: '提供了全球人工智能市场的详细数据，包括市场规模、增长率、细分领域占比、区域分布等...',
                type: '数据',
                rating: 4,
                relevance: '中'
            },
            {
                title: '智能算法优化技术白皮书',
                summary: '深入探讨了智能算法的优化技术，包括参数调优、模型压缩、计算加速等关键技术点...',
                type: '报告',
                rating: 5,
                relevance: '高'
            }
        ];
    } else if (searchType === 'ai') {
        // AI智能搜索
        materials = [
            {
                title: `关于"${keyword}"的深度分析报告`,
                summary: `本报告深入分析了${keyword}的最新发展趋势，包括技术原理、应用场景、市场前景等多个维度的专业解读...`,
                type: '报告',
                rating: 4,
                relevance: '高'
            },
            {
                title: `${keyword}应用实践案例`,
                summary: `收集了${keyword}在各行业的典型应用案例，提供了详细的实施过程、效果评估和经验总结...`,
                type: '文章',
                rating: 4,
                relevance: '高'
            },
            {
                title: `${keyword}技术白皮书`,
                summary: `全面介绍${keyword}的技术原理、架构设计和实现方法，适合技术人员深入学习和参考...`,
                type: '白皮书',
                rating: 5,
                relevance: '高'
            },
            {
                title: `${keyword}市场调研数据`,
                summary: `提供${keyword}相关的市场规模、用户画像、竞争格局等详细数据和分析报告...`,
                type: '数据',
                rating: 3,
                relevance: '中'
            }
        ];
    } else {
        // 普通搜索
        materials = [
            {
                title: `${keyword}相关资料`,
                summary: `与${keyword}相关的参考资料，包含基础概念、发展历程和应用现状等基本信息...`,
                type: '文章',
                rating: 3,
                relevance: '中'
            },
            {
                title: `${keyword}技术研究`,
                summary: `关于${keyword}的技术分析和研究报告，涵盖技术特点、优势局限和发展方向...`,
                type: '报告',
                rating: 4,
                relevance: '中'
            }
        ];
    }
    
    // 清空并显示检索结果
    retrievalMaterialsList.innerHTML = '';
    retrievedMaterials.clear();
    
    materials.forEach((material, index) => {
        const materialItem = document.createElement('div');
        materialItem.className = 'retrieval-material-item';
        materialItem.dataset.materialId = `retrieved_${index}`;
        materialItem.dataset.materialData = JSON.stringify(material);
        
        materialItem.innerHTML = `
            <input type="checkbox" class="retrieval-material-checkbox">
            <div class="retrieval-material-content">
                <div class="retrieval-material-title">${material.title}</div>
                <div class="retrieval-material-summary">${material.summary}</div>
                <div class="retrieval-material-meta">
                    <span class="retrieval-material-type">${material.type}</span>
                    <span class="retrieval-material-rating">${generateStarRating(material.rating)}</span>
                    ${searchType === 'ai' || searchType === 'ai-based' ? `<span style="color: ${material.relevance === '高' ? '#27ae60' : '#f39c12'}; font-size: 11px;">相关度: ${material.relevance}</span>` : ''}
                </div>
            </div>
        `;
        
        // 添加点击事件
        materialItem.addEventListener('click', function(e) {
            if (e.target.type !== 'checkbox') {
                const checkbox = this.querySelector('.retrieval-material-checkbox');
                checkbox.checked = !checkbox.checked;
            }
            toggleRetrievedMaterialSelection(this);
        });
        
        // 复选框事件
        const checkbox = materialItem.querySelector('.retrieval-material-checkbox');
        checkbox.addEventListener('change', function() {
            toggleRetrievedMaterialSelection(materialItem);
        });
        
        retrievalMaterialsList.appendChild(materialItem);
    });
    
    // 显示结果区域
    resultsCount.textContent = materials.length;
    retrievalResults.style.display = 'block';
    
    // 滚动到结果区域
    retrievalResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    showNotification(`检索完成！找到 ${materials.length} 个相关素材`, 'success');
}

// 切换检索到的素材选择状态
function toggleRetrievedMaterialSelection(item) {
    const materialId = item.dataset.materialId;
    const checkbox = item.querySelector('.retrieval-material-checkbox');
    
    if (checkbox.checked) {
        retrievedMaterials.add(materialId);
        item.classList.add('selected');
    } else {
        retrievedMaterials.delete(materialId);
        item.classList.remove('selected');
    }
    
    updateRetrievalActions();
}

// 更新检索操作按钮状态
function updateRetrievalActions() {
    const addToLibraryBtn = document.getElementById('addToLibraryBtn');
    addToLibraryBtn.disabled = retrievedMaterials.size === 0;
    
    if (retrievedMaterials.size > 0) {
        addToLibraryBtn.innerHTML = `<i class="fas fa-plus"></i> 添加选中素材到库 (${retrievedMaterials.size})`;
    } else {
        addToLibraryBtn.innerHTML = `<i class="fas fa-plus"></i> 添加选中素材到库`;
    }
}

// 清空检索结果
document.getElementById('clearRetrievalBtn').addEventListener('click', function() {
    const retrievalResults = document.getElementById('retrievalResults');
    const retrievalMaterialsList = document.getElementById('retrievalMaterialsList');
    
    retrievalMaterialsList.innerHTML = '';
    retrievedMaterials.clear();
    retrievalResults.style.display = 'none';
    
    updateRetrievalActions();
    showNotification('已清空检索结果', 'info');
});

// 添加选中素材到素材库
document.getElementById('addToLibraryBtn').addEventListener('click', function() {
    if (retrievedMaterials.size === 0) return;
    
    const materialGrid = document.getElementById('materialGrid');
    let addedCount = 0;
    
    // 清空空状态
    if (materialGrid.querySelector('.empty-state')) {
        materialGrid.innerHTML = '';
    }
    
    // 将选中的检索素材添加到素材库
    document.querySelectorAll('.retrieval-material-item.selected').forEach(item => {
        const materialData = JSON.parse(item.dataset.materialData);
        const materialCard = document.createElement('div');
        materialCard.className = 'material-card';
        materialCard.dataset.materialId = `library_${Date.now()}_${Math.random()}`;
        
        materialCard.innerHTML = `
            <div class="material-title">${materialData.title}</div>
            <div class="material-summary">${materialData.summary}</div>
            <div class="material-meta">
                <span class="material-rating">
                    ${generateStarRating(materialData.rating)}
                </span>
                <span>${materialData.type}</span>
            </div>
        `;
        
        // 添加点击事件
        materialCard.addEventListener('click', function() {
            toggleLibraryMaterialSelection(this);
        });
        
        materialGrid.appendChild(materialCard);
        addedCount++;
    });
    
    // 清空检索结果
    document.getElementById('clearRetrievalBtn').click();
    
    showNotification(`成功添加 ${addedCount} 个素材到素材库`, 'success');
});

// 切换素材库素材选择状态
function toggleLibraryMaterialSelection(card) {
    const materialId = card.dataset.materialId;
    
    if (selectedMaterials.has(materialId)) {
        selectedMaterials.delete(materialId);
        card.classList.remove('selected');
    } else {
        selectedMaterials.add(materialId);
        card.classList.add('selected');
    }
    
    updateSelectedMaterialsDisplay();
}

// 生成星级评分
function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// 切换素材选择状态
function toggleMaterialSelection(card, material) {
    const materialId = card.dataset.materialId;
    
    if (selectedMaterials.has(materialId)) {
        selectedMaterials.delete(materialId);
        card.classList.remove('selected');
    } else {
        selectedMaterials.add(materialId);
        card.classList.add('selected');
    }
    
    updateSelectedMaterialsDisplay();
}

// 更新选中素材显示
function updateSelectedMaterialsDisplay() {
    const selectedCount = document.getElementById('selectedCount');
    const materialConfirmation = document.getElementById('materialConfirmation');
    const selectedMaterialsList = document.getElementById('selectedMaterialsList');
    
    selectedCount.textContent = selectedMaterials.size;
    
    if (selectedMaterials.size > 0) {
        materialConfirmation.style.display = 'block';
        
        // 显示选中的素材
        selectedMaterialsList.innerHTML = '';
        document.querySelectorAll('.material-card.selected').forEach(card => {
            const materialId = card.dataset.materialId;
            const title = card.querySelector('.material-title').textContent;
            const type = card.querySelector('.material-meta span:last-child').textContent;
            
            const selectedItem = document.createElement('div');
            selectedItem.className = 'selected-material-item';
            selectedItem.innerHTML = `
                <div>
                    <div class="selected-material-title">${title}</div>
                    <span class="selected-material-type">${type}</span>
                </div>
                <button class="remove-material-btn" onclick="removeSelectedMaterial('${materialId}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            selectedMaterialsList.appendChild(selectedItem);
        });
    } else {
        materialConfirmation.style.display = 'none';
    }
}

// 移除选中的素材
function removeSelectedMaterial(materialId) {
    selectedMaterials.delete(materialId);
    const card = document.querySelector(`[data-material-id="${materialId}"]`);
    if (card) {
        card.classList.remove('selected');
    }
    updateSelectedMaterialsDisplay();
}

// 重新选择按钮
document.getElementById('reselectBtn').addEventListener('click', function() {
    selectedMaterials.clear();
    document.querySelectorAll('.material-card.selected').forEach(card => {
        card.classList.remove('selected');
    });
    updateSelectedMaterialsDisplay();
});

// 确认素材按钮
document.getElementById('confirmMaterialsBtn').addEventListener('click', function() {
    if (selectedMaterials.size > 0) {
        // 这里可以添加将选中素材传递到下一步的逻辑
        showNotification(`已确认选择 ${selectedMaterials.size} 个素材`, 'success');
        
        // 可以切换到标题生成面板
        setTimeout(() => {
            document.querySelectorAll('.component-card').forEach(c => c.classList.remove('active'));
            document.querySelector('.component-card[data-component="title"]').classList.add('active');
            
            document.querySelectorAll('.editor-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById('titlePanel').classList.add('active');
        }, 1500);
    }
});

// 上传素材按钮
document.getElementById('uploadMaterialBtn').addEventListener('click', function() {
    showNotification('上传素材功能正在开发中...', 'info');
});

// 标题生成功能
class TitleGenerator {
    constructor() {
        this.selectedLength = 20;
        this.selectedStyle = 'formal';
        this.selectedTitles = [];
        this.currentSelectedTitle = null;
        this.availableMaterials = [
            { id: 1, title: 'AI技术发展报告', type: '报告' },
            { id: 2, title: '机器学习应用案例', type: '案例' },
            { id: 3, title: '深度学习最新进展', type: '进展' }
        ];
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateMaterialsList();
    }

    bindEvents() {
        // 标题长度选择（滑块）
        const titleLengthSlider = document.getElementById('titleLengthSlider');
        if (titleLengthSlider) {
            titleLengthSlider.addEventListener('input', (e) => {
                this.selectedLength = parseInt(e.target.value);
                // 更新滑块值显示
                const valueDisplay = titleLengthSlider.parentNode.querySelector('.range-value');
                if (valueDisplay) {
                    valueDisplay.textContent = this.selectedLength + '字';
                }
            });
            
            // 初始化滑块值显示
            const valueDisplay = titleLengthSlider.parentNode.querySelector('.range-value');
            if (valueDisplay) {
                valueDisplay.textContent = this.selectedLength + '字';
            }
        }

        // 标题风格选择
        document.getElementById('titleStyleSelect')?.addEventListener('change', (e) => {
            this.selectedStyle = e.target.value;
        });

        // 生成标题按钮
        document.getElementById('generateTitlesBtn')?.addEventListener('click', () => {
            this.generateTitles();
        });

        // 重新生成标题按钮
        document.getElementById('regenerateTitlesBtn')?.addEventListener('click', () => {
            this.generateTitles();
        });

        // 确认标题按钮
        document.getElementById('confirmTitleBtn')?.addEventListener('click', () => {
            this.confirmTitle();
        });

        // 管理素材按钮
        document.getElementById('manageMaterialsBtn')?.addEventListener('click', () => {
            this.showNotification('素材管理功能正在开发中...', 'info');
        });
    }

    updateMaterialsList() {
        const materialsList = document.getElementById('selectedMaterialsList');
        if (!materialsList) return;

        materialsList.innerHTML = this.availableMaterials.map(material => `
            <div class="bound-material-item">
                <span>${material.title}</span>
                <i class="fas fa-times" data-material-id="${material.id}"></i>
            </div>
        `).join('');

        // 绑定删除素材事件
        materialsList.querySelectorAll('.fa-times').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const materialId = parseInt(e.target.dataset.materialId);
                this.removeMaterial(materialId);
            });
        });
    }

    removeMaterial(materialId) {
        this.availableMaterials = this.availableMaterials.filter(m => m.id !== materialId);
        this.updateMaterialsList();
        this.showNotification('素材已移除', 'success');
    }

    generateTitles() {
        if (this.availableMaterials.length === 0) {
            this.showNotification('请先选择素材', 'warning');
            return;
        }

        const titles = this.createTitleOptions();
        this.displayTitles(titles);
        
        // 显示结果区域
        document.getElementById('titleResults').style.display = 'block';
        document.getElementById('titleCount').textContent = titles.length;
    }

    createTitleOptions() {
        const styleMap = {
            'formal': ['正式', '严谨', '专业'],
            'casual': ['轻松', '有趣', '生动'],
            'creative': ['创意', '新颖', '独特'],
            'professional': ['专业', '深度', '权威']
        };

        const baseTitles = [
            {
                title: '人工智能：重塑未来的技术革命',
                reasoning: '这个标题直接点明了AI的核心价值，突出了其革命性影响，符合正式风格的要求。',
                materials: [1, 2]
            },
            {
                title: '深度学习如何改变我们的世界',
                reasoning: '以问题形式引发读者思考，强调了深度学习的实际应用，具有吸引力。',
                materials: [2, 3]
            },
            {
                title: 'AI技术的现状与未来展望',
                reasoning: '全面覆盖了技术的现状和未来发展趋势，结构清晰，逻辑性强。',
                materials: [1, 3]
            },
            {
                title: '机器学习：从理论到实践',
                reasoning: '突出了理论与实践的结合，适合专业读者，内容完整。',
                materials: [1, 2, 3]
            }
        ];

        return baseTitles.map((item, index) => ({
            id: index + 1,
            title: this.adjustTitleLength(item.title),
            reasoning: item.reasoning,
            materials: item.materials,
            confidence: Math.floor(Math.random() * 20) + 80 // 80-99的置信度
        }));
    }

    adjustTitleLength(originalTitle) {
        const targetLength = this.selectedLength;
        const currentLength = originalTitle.length;
        
        if (currentLength <= targetLength) {
            return originalTitle;
        }

        // 简单的长度调整逻辑
        const shorteningRatio = targetLength / currentLength;
        const words = originalTitle.split('');
        const newLength = Math.floor(words.length * shorteningRatio);
        
        return words.slice(0, newLength).join('') + '...';
    }

    displayTitles(titles) {
        const container = document.getElementById('titleOptions');
        if (!container) return;

        container.innerHTML = titles.map(title => `
            <div class="title-option" data-title-id="${title.id}">
                <div class="title-text">${title.title}</div>
                <div class="title-meta">置信度: ${title.confidence}% | 基于素材: ${title.materials.length}个</div>
                <div class="title-reasoning">
                    <strong>选择理由:</strong> ${title.reasoning}
                </div>
                <div class="title-materials">
                    <strong>相关素材:</strong>
                    ${title.materials.map(materialId => {
                        const material = this.availableMaterials.find(m => m.id === materialId);
                        return `<span class="title-material-tag" data-material-id="${materialId}">${material?.title || '未知素材'}</span>`;
                    }).join('')}
                </div>
            </div>
        `).join('');

        // 绑定标题选择事件
        container.querySelectorAll('.title-option').forEach(option => {
            option.addEventListener('click', (e) => {
                if (e.target.classList.contains('title-material-tag')) {
                    this.highlightMaterial(parseInt(e.target.dataset.materialId));
                    return;
                }
                
                container.querySelectorAll('.title-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                this.currentSelectedTitle = parseInt(option.dataset.titleId);
            });
        });

        // 绑定素材标签点击事件
        container.querySelectorAll('.title-material-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.stopPropagation();
                this.highlightMaterial(parseInt(e.target.dataset.materialId));
            });
        });
    }

    highlightMaterial(materialId) {
        const material = this.availableMaterials.find(m => m.id === materialId);
        if (material) {
            this.showNotification(`相关素材: ${material.title}`, 'info');
        }
    }

    confirmTitle() {
        if (!this.currentSelectedTitle) {
            this.showNotification('请先选择一个标题', 'warning');
            return;
        }

        const selectedTitle = this.getSelectedTitleData();
        if (selectedTitle) {
            this.showNotification(`已确认标题: ${selectedTitle.title}`, 'success');
            // 这里可以添加确认后的逻辑，比如保存到项目等
        }
    }

    getSelectedTitleData() {
        const titles = this.createTitleOptions();
        return titles.find(t => t.id === this.currentSelectedTitle);
    }

    showNotification(message, type = 'info') {
        // 如果页面已有通知函数，使用它
        if (typeof showNotification === 'function') {
            showNotification(message, type);
            return;
        }

        // 否则创建简单的通知
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        const colors = {
            'success': '#27ae60',
            'warning': '#f39c12',
            'error': '#e74c3c',
            'info': '#3498db'
        };

        notification.style.backgroundColor = colors[type] || colors.info;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// 大纲素材绑定功能
class OutlineMaterialBinder {
    constructor() {
        this.currentOutlineItem = null;
        this.outlineMaterials = new Map(); // 存储大纲项绑定的素材
        this.availableMaterials = [
            { id: 'mat_1', title: 'AI技术发展报告2023', type: '报告', summary: '本报告全面分析了2023年人工智能技术的发展现状...' },
            { id: 'mat_2', title: '机器学习应用案例集', type: '文章', summary: '收集了机器学习在各行业的典型应用案例...' },
            { id: 'mat_3', title: '深度学习最新进展', type: '文章', summary: '综述了深度学习领域的最新研究进展...' },
            { id: 'mat_4', title: 'AI市场规模数据', type: '数据', summary: '提供了全球人工智能市场的详细数据...' }
        ];
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeOutlineMaterials();
    }

    bindEvents() {
        // 绑定素材按钮点击
        document.addEventListener('click', (e) => {
            if (e.target.closest('.bind-material-btn')) {
                const btn = e.target.closest('.bind-material-btn');
                const outlineItem = btn.closest('.outline-item');
                this.openMaterialSelectionModal(outlineItem);
            }

            // 添加素材按钮点击
            if (e.target.closest('.add-material-btn')) {
                const btn = e.target.closest('.add-material-btn');
                const outlineItem = btn.closest('.outline-item');
                this.openMaterialSelectionModal(outlineItem);
            }

            // 移除素材按钮点击
            if (e.target.closest('.remove-material-btn')) {
                const btn = e.target.closest('.remove-material-btn');
                const materialChip = btn.closest('.bound-material-chip');
                this.removeMaterialFromOutline(materialChip);
            }
        });

        // 重新生成大纲按钮
        document.getElementById('regenerateOutlineBtn')?.addEventListener('click', () => {
            this.regenerateOutline();
        });
    }

    initializeOutlineMaterials() {
        // 初始化一些示例素材绑定
        this.outlineMaterials.set('1.1', ['mat_1']);
        this.outlineMaterials.set('1.2', ['mat_3']);
        this.outlineMaterials.set('2.1', ['mat_2']);
        this.outlineMaterials.set('2.2', ['mat_1', 'mat_3']);
        
        this.updateAllOutlineMaterialsDisplay();
    }

    openMaterialSelectionModal(outlineItem) {
        this.currentOutlineItem = outlineItem;
        const outlineId = outlineItem.dataset.outlineId;
        
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'material-selection-modal';
        modal.innerHTML = `
            <div class="material-selection-content">
                <div class="material-selection-header">
                    <h3>选择素材 - ${outlineItem.querySelector('span').textContent}</h3>
                    <button class="btn btn-secondary" onclick="this.closest('.material-selection-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="material-selection-body">
                    ${this.availableMaterials.map(material => `
                        <div class="selectable-material-item" data-material-id="${material.id}">
                            <div style="font-weight: 600; margin-bottom: 4px;">${material.title}</div>
                            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${material.type}</div>
                            <div style="font-size: 13px; color: #333;">${material.summary}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="material-selection-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.material-selection-modal').remove()">取消</button>
                    <button class="btn btn-primary" onclick="outlineMaterialBinder.confirmMaterialSelection(this)">确认选择</button>
                </div>
            </div>
        `;

        // 设置已选择的素材
        const currentMaterials = this.outlineMaterials.get(outlineId) || [];
        modal.querySelectorAll('.selectable-material-item').forEach(item => {
            const materialId = item.dataset.materialId;
            if (currentMaterials.includes(materialId)) {
                item.classList.add('selected');
            }
            
            // 添加点击事件
            item.addEventListener('click', () => {
                item.classList.toggle('selected');
            });
        });

        document.body.appendChild(modal);
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    confirmMaterialSelection(btn) {
        const modal = btn.closest('.material-selection-modal');
        const selectedItems = modal.querySelectorAll('.selectable-material-item.selected');
        const selectedMaterials = Array.from(selectedItems).map(item => item.dataset.materialId);
        
        if (this.currentOutlineItem) {
            const outlineId = this.currentOutlineItem.dataset.outlineId;
            this.outlineMaterials.set(outlineId, selectedMaterials);
            this.updateOutlineMaterialsDisplay(this.currentOutlineItem);
        }
        
        modal.remove();
        showNotification('素材绑定成功', 'success');
    }

    removeMaterialFromOutline(materialChip) {
        const outlineItem = materialChip.closest('.outline-item');
        const outlineId = outlineItem.dataset.outlineId;
        const materialTitle = materialChip.querySelector('span').textContent;
        
        // 找到对应的素材ID
        const material = this.availableMaterials.find(m => m.title === materialTitle);
        if (material) {
            const currentMaterials = this.outlineMaterials.get(outlineId) || [];
            const updatedMaterials = currentMaterials.filter(id => id !== material.id);
            this.outlineMaterials.set(outlineId, updatedMaterials);
            this.updateOutlineMaterialsDisplay(outlineItem);
        }
    }

    updateOutlineMaterialsDisplay(outlineItem) {
        const outlineId = outlineItem.dataset.outlineId;
        const materialsContainer = outlineItem.querySelector('.outline-materials');
        const boundMaterialsList = materialsContainer.querySelector('.bound-materials-list');
        
        const materialIds = this.outlineMaterials.get(outlineId) || [];
        
        // 清空现有显示
        boundMaterialsList.innerHTML = '';
        
        // 添加绑定的素材
        materialIds.forEach(materialId => {
            const material = this.availableMaterials.find(m => m.id === materialId);
            if (material) {
                const materialChip = document.createElement('div');
                materialChip.className = 'bound-material-chip';
                materialChip.innerHTML = `
                    <i class="fas fa-file-alt"></i>
                    <span>${material.title}</span>
                    <i class="fas fa-times remove-material-btn"></i>
                `;
                boundMaterialsList.appendChild(materialChip);
            }
        });
    }

    updateAllOutlineMaterialsDisplay() {
        document.querySelectorAll('.outline-item[data-outline-id]').forEach(item => {
            this.updateOutlineMaterialsDisplay(item);
        });
    }

    regenerateOutline() {
        if (this.outlineMaterials.size === 0) {
            showNotification('请先绑定素材到大纲项', 'warning');
            return;
        }

        // 模拟重新生成大纲的过程
        const btn = document.getElementById('regenerateOutlineBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 重新生成中...';
        btn.disabled = true;

        setTimeout(() => {
            // 分析现有素材绑定，生成新的大纲结构
            const newOutline = this.generateNewOutlineStructure();
            this.applyNewOutlineStructure(newOutline);
            
            btn.innerHTML = originalText;
            btn.disabled = false;
            showNotification('大纲已基于素材绑定重新生成', 'success');
        }, 2000);
    }

    generateNewOutlineStructure() {
        // 基于现有素材绑定分析内容结构
        const materialAnalysis = this.analyzeMaterials();
        
        return [
            {
                id: '1',
                title: '引言：人工智能技术概述',
                children: [
                    { id: '1.1', title: 'AI技术发展背景', materials: ['mat_1'] },
                    { id: '1.2', title: '研究意义与价值', materials: ['mat_4'] }
                ]
            },
            {
                id: '2',
                title: '核心技术深度分析',
                children: [
                    { id: '2.1', title: '机器学习算法原理', materials: ['mat_2'] },
                    { id: '2.2', title: '深度学习技术进展', materials: ['mat_1', 'mat_3'] },
                    { id: '2.3', title: '技术对比与选择', materials: ['mat_1', 'mat_2'] }
                ]
            },
            {
                id: '3',
                title: '市场与应用前景',
                children: [
                    { id: '3.1', title: '市场规模分析', materials: ['mat_4'] },
                    { id: '3.2', title: '行业应用案例', materials: ['mat_2'] }
                ]
            },
            {
                id: '4',
                title: '结论与展望',
                children: [
                    { id: '4.1', title: '技术发展趋势', materials: ['mat_1', 'mat_3'] },
                    { id: '4.2', title: '未来挑战与机遇', materials: ['mat_4'] }
                ]
            }
        ];
    }

    analyzeMaterials() {
        // 分析绑定的素材，提取主题和内容
        const allMaterials = Array.from(this.outlineMaterials.values()).flat();
        return {
            hasTechnicalContent: allMaterials.includes('mat_1') || allMaterials.includes('mat_3'),
            hasCaseStudies: allMaterials.includes('mat_2'),
            hasMarketData: allMaterials.includes('mat_4'),
            materialCount: allMaterials.length
        };
    }

    applyNewOutlineStructure(newOutline) {
        const outlineTree = document.querySelector('.outline-tree');
        
        // 清空现有大纲
        outlineTree.innerHTML = '';
        
        // 生成新的大纲HTML
        newOutline.forEach(section => {
            const sectionElement = this.createOutlineElement(section, 0);
            outlineTree.appendChild(sectionElement);
        });
        
        // 重新绑定事件
        this.bindOutlineEvents();
        
        // 更新素材绑定显示
        this.updateAllOutlineMaterialsDisplay();
    }

    createOutlineElement(item, level) {
        const div = document.createElement('div');
        div.className = 'outline-item';
        div.draggable = true;
        div.dataset.outlineId = item.id;
        
        const hasChildren = item.children && item.children.length > 0;
        
        div.innerHTML = `
            <div class="outline-item-content">
                <i class="fas fa-grip-vertical" style="margin-right: 8px; color: #bdc3c7;"></i>
                ${hasChildren ? '<i class="fas fa-chevron-right" style="margin-right: 8px; color: #bdc3c7;"></i>' : ''}
                <span>${item.title}</span>
                <div class="outline-item-tools">
                    <button class="outline-tool-btn" title="重写">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button class="outline-tool-btn" title="扩展">
                        <i class="fas fa-expand-arrows-alt"></i>
                    </button>
                    <button class="outline-tool-btn" title="优化">
                        <i class="fas fa-magic"></i>
                    </button>
                    <button class="outline-tool-btn bind-material-btn" title="绑定素材">
                        <i class="fas fa-paperclip"></i>
                    </button>
                </div>
            </div>
            <div class="outline-materials">
                <div class="bound-materials-list"></div>
                <div class="add-material-btn" title="添加素材">
                    <i class="fas fa-plus"></i>
                </div>
            </div>
        `;
        
        if (hasChildren) {
            const childrenDiv = document.createElement('div');
            childrenDiv.className = 'outline-children';
            item.children.forEach(child => {
                const childElement = this.createOutlineElement(child, level + 1);
                childrenDiv.appendChild(childElement);
            });
            div.appendChild(childrenDiv);
        }
        
        return div;
    }

    bindOutlineEvents() {
        // 重新绑定大纲项事件
        document.querySelectorAll('.outline-item-content').forEach(content => {
            content.addEventListener('click', function(e) {
                if (e.target.closest('.outline-item-tools')) return;
                
                const outlineItem = this.closest('.outline-item');
                const chevron = this.querySelector('.fa-chevron-right, .fa-chevron-down');
                const children = outlineItem.querySelector('.outline-children');
                
                if (children) {
                    children.style.display = children.style.display === 'none' ? 'block' : 'none';
                    
                    if (chevron.classList.contains('fa-chevron-right')) {
                        chevron.classList.remove('fa-chevron-right');
                        chevron.classList.add('fa-chevron-down');
                    } else {
                        chevron.classList.remove('fa-chevron-down');
                        chevron.classList.add('fa-chevron-right');
                    }
                }
            });
        });
    }
}

// 初始化大纲素材绑定器
let outlineMaterialBinder;
document.addEventListener('DOMContentLoaded', function() {
    new TitleGenerator();
    outlineMaterialBinder = new OutlineMaterialBinder();
});

// 添加通知动画样式
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyles);

// 素材管理器类
class MaterialManager {
    constructor() {
        this.materials = new Map();
        this.currentMaterial = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSampleMaterials();
    }

    setupEventListeners() {
        // 展开按钮
        document.addEventListener('click', (e) => {
            if (e.target.closest('.expand-btn')) {
                const materialItem = e.target.closest('.material-item');
                this.toggleExpand(materialItem);
            }
        });

        // 编辑模式按钮
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-mode-btn')) {
                const materialItem = e.target.closest('.material-item');
                this.enterEditMode(materialItem);
            }
        });

        // 更多按钮（下拉菜单）
        document.addEventListener('click', (e) => {
            if (e.target.closest('.material-action-btn[title="更多"]')) {
                e.stopPropagation();
                const materialItem = e.target.closest('.material-item');
                this.toggleMaterialDropdown(materialItem);
            } else {
                this.closeAllDropdowns();
            }
        });

        // 编辑按钮
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-actions .save-edit')) {
                const materialItem = e.target.closest('.material-item');
                this.saveInlineEdit(materialItem);
            }
        });

        // 取消编辑按钮
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-actions .cancel-edit')) {
                const materialItem = e.target.closest('.material-item');
                this.cancelInlineEdit(materialItem);
            }
        });

        // 标签输入
        document.addEventListener('keydown', (e) => {
            if (e.target.closest('.edit-tags-input input')) {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    this.addInlineTag(e.target);
                }
            }
        });

        // 标签删除
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-tag')) {
                this.removeInlineTag(e.target.closest('.edit-tag'));
            }
        });
    }

    loadSampleMaterials() {
        const sampleMaterials = {
            'mat_1': {
                id: 'mat_1',
                title: 'AI技术发展报告2023',
                type: '报告',
                tags: ['AI技术', '年度报告', '技术分析'],
                sourceLink: 'https://example.com/ai-report-2023',
                summary: '本报告全面分析了2023年人工智能技术的发展现状，包括机器学习、深度学习、自然语言处理等领域的最新进展...',
                content: `AI技术发展报告2023

概述：2023年是人工智能技术发展的关键一年，大语言模型的突破性进展带动了整个行业的快速发展。

主要进展：
- 大语言模型的规模化和效率提升
- 多模态AI技术的成熟应用
- AI在各个行业的深度渗透
- 监管和伦理框架的逐步建立

未来趋势：
- 更高效的AI模型架构
- AI与其他技术的深度融合
- 个性化AI应用的普及`
            },
            'mat_2': {
                id: 'mat_2',
                title: '机器学习应用案例集',
                type: '文章',
                tags: ['机器学习', '应用案例', '行业分析'],
                sourceLink: 'https://example.com/ml-cases',
                summary: '收集了机器学习在各行业的典型应用案例，包括金融、医疗、教育、制造等领域的实际应用...',
                content: `机器学习应用案例集

金融行业：
- 智能风控系统
- 量化投资策略
- 客户行为分析

医疗健康：
- 医学影像诊断
- 药物研发加速
- 个性化治疗方案

教育领域：
- 智能学习系统
- 个性化教育推荐
- 学习效果评估`
            },
            'mat_3': {
                id: 'mat_3',
                title: '深度学习最新进展',
                type: '文章',
                tags: ['深度学习', '前沿技术', '研究综述'],
                sourceLink: 'https://example.com/deep-learning',
                summary: '综述了深度学习领域的最新研究进展，包括新型神经网络架构、训练方法优化、应用场景拓展等...',
                content: `深度学习最新进展

Transformer架构的演进：
- 注意力机制的优化
- 多头注意力的高效实现
- 位置编码的新方法

训练技术创新：
- 自监督学习的突破
- 少样本学习的进展
- 分布式训练的优化`
            },
            'mat_4': {
                id: 'mat_4',
                title: 'AI市场规模数据',
                type: '数据',
                tags: ['市场数据', '统计分析', '投资趋势'],
                sourceLink: 'https://example.com/ai-market-data',
                summary: '提供了全球人工智能市场的详细数据，包括市场规模、增长率、细分领域占比、区域分布等...',
                content: `AI市场规模数据

全球市场规模：
- 2023年：1500亿美元
- 2024年预测：2000亿美元
- 年增长率：33%

细分领域分布：
- 机器学习平台：35%
- 自然语言处理：25%
- 计算机视觉：20%
- AI芯片：15%
- 其他：5%

区域分布：
- 北美：45%
- 亚太：30%
- 欧洲：20%
- 其他：5%`
            }
        };

        Object.entries(sampleMaterials).forEach(([id, material]) => {
            this.materials.set(id, material);
        });
    }

    toggleExpand(materialItem) {
        const isExpanded = materialItem.classList.contains('expanded');
        const expandedContent = materialItem.querySelector('.material-item-expanded');
        
        if (isExpanded) {
            // 收起动画
            expandedContent.style.maxHeight = '0px';
            materialItem.classList.remove('expanded', 'editing');
            this.removeEditButton(materialItem);
            
            // 等待动画完成后重置
            setTimeout(() => {
                expandedContent.style.maxHeight = '';
            }, 400);
        } else {
            // 关闭其他展开的卡片
            document.querySelectorAll('.material-item.expanded').forEach(item => {
                if (item !== materialItem) {
                    const otherExpanded = item.querySelector('.material-item-expanded');
                    otherExpanded.style.maxHeight = '0px';
                    item.classList.remove('expanded', 'editing');
                    this.removeEditButton(item);
                    
                    setTimeout(() => {
                        otherExpanded.style.maxHeight = '';
                    }, 400);
                }
            });
            
            // 展开动画
            materialItem.classList.add('expanded');
            
            // 计算实际内容高度
            const contentHeight = expandedContent.scrollHeight;
            expandedContent.style.maxHeight = contentHeight + 'px';
            
            // 添加编辑按钮
            setTimeout(() => {
                this.addEditButton(materialItem);
            }, 200);
        }
    }

    updateContentDisplay(materialItem) {
        const materialId = materialItem.dataset.materialId;
        const material = this.materials.get(materialId);
        if (!material) return;

        const contentDisplay = materialItem.querySelector('.material-content-display');
        if (contentDisplay) {
            contentDisplay.innerHTML = material.content.replace(/\n/g, '<br>');
        }
    }

    saveInlineEdit(materialItem) {
        const materialId = materialItem.dataset.materialId;
        const material = this.materials.get(materialId);
        if (!material) return;

        const editSection = materialItem.querySelector('.material-edit-section');
        if (!editSection) return;

        // 获取编辑表单数据
        const title = editSection.querySelector('.edit-input').value;
        const type = editSection.querySelector('.edit-select').value;
        const sourceLink = editSection.querySelector('input[type="url"]').value;
        
        // 获取标签
        const tagElements = editSection.querySelectorAll('.edit-tag');
        const tags = Array.from(tagElements).map(el => el.textContent.replace('×', '').trim());

        // 获取摘要和内容
        const textareas = editSection.querySelectorAll('.edit-textarea');
        const summary = textareas.length >= 1 ? textareas[0].value : '';
        const content = textareas.length >= 2 ? textareas[1].value : '';

        // 验证必填字段
        if (!title.trim()) {
            this.showNotification('标题不能为空', 'error');
            return;
        }

        // 更新素材数据
        material.title = title.trim();
        material.type = type;
        material.summary = summary.trim();
        material.content = content.trim();
        material.sourceLink = sourceLink.trim();
        material.tags = tags;

        // 更新显示
        this.updateMaterialDisplay(materialItem, material);
        this.updateContentDisplay(materialItem);
        
        // 切换到查看模式
        materialItem.classList.remove('editing');
        
        // 重新计算高度以适应查看界面
        setTimeout(() => {
            const expandedContent = materialItem.querySelector('.material-item-expanded');
            const newHeight = expandedContent.scrollHeight;
            expandedContent.style.maxHeight = newHeight + 'px';
        }, 50);
        
        this.showNotification('素材已保存', 'success');
    }

    cancelInlineEdit(materialItem) {
        const materialId = materialItem.dataset.materialId;
        const material = this.materials.get(materialId);
        const expandedContent = materialItem.querySelector('.material-item-expanded');
        
        if (!material) return;

        // 恢复原始数据
        this.updateEditForm(materialItem, material);
        
        // 切换到查看模式
        materialItem.classList.remove('editing');
        
        // 重新计算高度以适应查看界面
        setTimeout(() => {
            const newHeight = expandedContent.scrollHeight;
            expandedContent.style.maxHeight = newHeight + 'px';
        }, 50);
    }

    updateMaterialDisplay(materialItem, material) {
        // 更新标题
        const titleElement = materialItem.querySelector('.material-item-title');
        if (titleElement) titleElement.textContent = material.title;

        // 更新摘要
        const summaryElement = materialItem.querySelector('.material-item-summary');
        if (summaryElement) summaryElement.textContent = material.summary;

        // 更新标签
        const tagsContainer = materialItem.querySelector('.material-tags');
        if (tagsContainer) {
            tagsContainer.innerHTML = '';
            material.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'material-tag';
                tagElement.textContent = tag;
                tagsContainer.appendChild(tagElement);
            });
        }

        // 更新源链接
        const sourceLink = materialItem.querySelector('.material-source-link a');
        if (sourceLink && material.sourceLink) {
            sourceLink.href = material.sourceLink;
        }

        // 更新内容显示
        this.updateContentDisplay(materialItem);
    }

    updateEditForm(materialItem, material) {
        const editSection = materialItem.querySelector('.material-edit-section');
        if (!editSection) return;

        // 更新标题
        const titleInput = editSection.querySelector('.edit-input');
        if (titleInput) titleInput.value = material.title;

        // 更新类型
        const typeSelect = editSection.querySelector('.edit-select');
        if (typeSelect) typeSelect.value = material.type;

        // 更新标签
        const tagsContainer = editSection.querySelector('.edit-tags-input');
        if (tagsContainer) {
            const input = tagsContainer.querySelector('input');
            if (input) {
                tagsContainer.innerHTML = '';
                
                material.tags.forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.className = 'edit-tag';
                    tagElement.innerHTML = `${tag} <i class="fas fa-times remove-tag"></i>`;
                    tagsContainer.appendChild(tagElement);
                });
                
                tagsContainer.appendChild(input);
            }
        }

        // 更新源链接
        const urlInput = editSection.querySelector('input[type="url"]');
        if (urlInput) urlInput.value = material.sourceLink;

        // 更新摘要和内容
        const textareas = editSection.querySelectorAll('.edit-textarea');
        if (textareas.length >= 1) textareas[0].value = material.summary;
        if (textareas.length >= 2) textareas[1].value = material.content;
    }

    addInlineTag(input) {
        const tagText = input.value.trim();
        if (!tagText) return;

        const tagElement = document.createElement('span');
        tagElement.className = 'edit-tag';
        tagElement.innerHTML = `${tagText} <i class="fas fa-times remove-tag"></i>`;
        
        input.parentNode.insertBefore(tagElement, input);
        input.value = '';
    }

    removeInlineTag(tagElement) {
        tagElement.remove();
    }

    toggleMaterialDropdown(materialItem) {
        this.closeAllDropdowns();
        
        let dropdown = materialItem.querySelector('.material-dropdown');
        if (!dropdown) {
            dropdown = this.createDropdown();
            materialItem.appendChild(dropdown);
        }
        
        dropdown.classList.toggle('active');
    }

    createDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'material-dropdown';
        dropdown.innerHTML = `
            <div class="material-dropdown-item" onclick="materialManager.duplicateMaterial()">
                <i class="fas fa-copy"></i>
                复制素材
            </div>
            <div class="material-dropdown-item" onclick="materialManager.exportMaterial()">
                <i class="fas fa-download"></i>
                导出素材
            </div>
            <div class="material-dropdown-item" onclick="materialManager.shareMaterial()">
                <i class="fas fa-share"></i>
                分享素材
            </div>
            <div class="material-dropdown-item danger" onclick="materialManager.deleteMaterial()">
                <i class="fas fa-trash"></i>
                删除素材
            </div>
        `;
        return dropdown;
    }

    closeAllDropdowns() {
        document.querySelectorAll('.material-dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }

    // 进入编辑模式
    enterEditMode(materialItem) {
        const materialId = materialItem.dataset.materialId;
        const material = this.materials.get(materialId);
        const expandedContent = materialItem.querySelector('.material-item-expanded');
        
        if (!material) return;
        
        // 更新编辑表单数据
        this.updateEditForm(materialItem, material);
        
        // 切换到编辑模式
        materialItem.classList.add('editing');
        
        // 重新计算高度以适应编辑界面
        setTimeout(() => {
            const newHeight = expandedContent.scrollHeight;
            expandedContent.style.maxHeight = newHeight + 'px';
        }, 50);
    }

    // 添加编辑模式按钮到展开内容
    addEditButton(materialItem) {
        const viewSection = materialItem.querySelector('.material-view-section');
        if (viewSection && !viewSection.querySelector('.edit-mode-btn')) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-primary edit-mode-btn';
            editBtn.innerHTML = '<i class="fas fa-edit"></i> 编辑';
            editBtn.style.marginTop = '10px';
            editBtn.onclick = () => this.enterEditMode(materialItem);
            viewSection.appendChild(editBtn);
        }
    }

    // 移除编辑按钮
    removeEditButton(materialItem) {
        const editBtn = materialItem.querySelector('.edit-mode-btn');
        if (editBtn) {
            editBtn.remove();
        }
    }

    duplicateMaterial() {
        if (!this.currentMaterial) return;
        
        const newMaterial = {
            ...this.currentMaterial,
            id: 'mat_' + Date.now(),
            title: this.currentMaterial.title + ' (副本)'
        };
        
        this.materials.set(newMaterial.id, newMaterial);
        this.showNotification('素材已复制', 'success');
        this.closeAllDropdowns();
    }

    exportMaterial() {
        if (!this.currentMaterial) return;
        
        const dataStr = JSON.stringify(this.currentMaterial, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.currentMaterial.title + '.json';
        link.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('素材已导出', 'success');
        this.closeAllDropdowns();
    }

    shareMaterial() {
        if (!this.currentMaterial) return;
        
        const shareUrl = window.location.href + '?material=' + this.currentMaterial.id;
        navigator.clipboard.writeText(shareUrl).then(() => {
            this.showNotification('分享链接已复制到剪贴板', 'success');
        }).catch(() => {
            this.showNotification('分享链接复制失败', 'error');
        });
        
        this.closeAllDropdowns();
    }

    deleteMaterial() {
        if (!this.currentMaterial) return;
        
        if (confirm('确定要删除这个素材吗？此操作不可撤销。')) {
            this.materials.delete(this.currentMaterial.id);
            this.showNotification('素材已删除', 'success');
            this.closeAllDropdowns();
            this.closeModals();
            
            // 从DOM中移除
            const materialItem = document.querySelector(`[data-material-id="${this.currentMaterial.id}"]`);
            if (materialItem) {
                materialItem.remove();
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// 全局函数
function closeMaterialViewer() {
    document.getElementById('materialViewerModal').classList.remove('active');
}

function closeMaterialEditor() {
    document.getElementById('materialEditorModal').classList.remove('active');
}

function editMaterialFromViewer() {
    closeMaterialViewer();
    materialManager.editMaterial(materialManager.currentMaterial.id);
}

function saveMaterial() {
    if (!materialManager.currentMaterial) return;
    
    const title = document.getElementById('editorMaterialTitle').value;
    const type = document.getElementById('editorMaterialType').value;
    const summary = document.getElementById('editorMaterialSummary').value;
    const content = document.getElementById('editorMaterialContent').value;
    const sourceLink = document.getElementById('editorMaterialLink').value;
    
    // 获取标签
    const tagElements = document.querySelectorAll('#editorMaterialTags .editable-tag');
    const tags = Array.from(tagElements).map(el => el.textContent.replace('×', '').trim());
    
    // 更新素材数据
    materialManager.currentMaterial.title = title;
    materialManager.currentMaterial.type = type;
    materialManager.currentMaterial.summary = summary;
    materialManager.currentMaterial.content = content;
    materialManager.currentMaterial.sourceLink = sourceLink;
    materialManager.currentMaterial.tags = tags;
    
    // 更新显示
    const materialItem = document.querySelector(`[data-material-id="${materialManager.currentMaterial.id}"]`);
    if (materialItem) {
        materialItem.querySelector('.material-item-title').textContent = title;
        materialItem.querySelector('.material-item-summary').textContent = summary;
        
        // 更新标签显示
        const metaContainer = materialItem.querySelector('.material-item-meta');
        if (metaContainer) {
            const tagsContainer = metaContainer.querySelector('.material-tags');
            if (tagsContainer) {
                tagsContainer.innerHTML = '';
                tags.forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.className = 'material-tag';
                    tagElement.textContent = tag;
                    tagsContainer.appendChild(tagElement);
                });
            }
        }
    }
    
    materialManager.showNotification('素材已保存', 'success');
    closeMaterialEditor();
}

// 初始化素材管理器
let materialManager;
document.addEventListener('DOMContentLoaded', function() {
    new TitleGenerator();
    outlineMaterialBinder = new OutlineMaterialBinder();
    materialManager = new MaterialManager();
});