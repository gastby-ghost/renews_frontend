#!/usr/bin/env python3
"""
OpenAPI 拆分工具
将大型 OpenAPI 规范文件按功能模块拆分成多个独立的组成部分。

策略一：按功能/业务模块拆分（推荐）
策略二：按 OpenAPI 结构拆分（辅助策略）
最佳实践：将策略一和策略二结合起来，即按功能模块创建目录，在每个模块目录下再按 OpenAPI 结构拆分。
"""

import json
import os
import sys
import argparse
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Set, Tuple
from collections import defaultdict
import copy


class OpenAPISplitter:
    """OpenAPI 文件拆分器"""
    
    def __init__(self, input_file: str, output_dir: str, strategy: str = "hybrid"):
        """
        初始化拆分器
        
        Args:
            input_file: 输入的 OpenAPI JSON 文件路径
            output_dir: 输出目录
            strategy: 拆分策略，可选 "functional", "structural", "hybrid"
        """
        self.input_file = input_file
        self.output_dir = output_dir
        self.strategy = strategy
        self.openapi_spec = None
        
        # 确保输出目录存在
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        self.logger = self._setup_logger()
    
    def _setup_logger(self) -> logging.Logger:
        """设置日志记录器"""
        logger = logging.getLogger("openapi_splitter")
        logger.setLevel(logging.INFO)
        
        # 创建控制台处理器
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        
        # 创建文件处理器
        log_file = os.path.join(self.output_dir, "split.log")
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        
        # 创建格式化器
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        console_handler.setFormatter(formatter)
        file_handler.setFormatter(formatter)
        
        logger.addHandler(console_handler)
        logger.addHandler(file_handler)
        
        return logger
    
    def load_openapi_spec(self) -> bool:
        """加载 OpenAPI 规范文件"""
        try:
            with open(self.input_file, 'r', encoding='utf-8') as f:
                self.openapi_spec = json.load(f)
            self.logger.info(f"成功加载 OpenAPI 规范文件: {self.input_file}")
            return True
        except Exception as e:
            self.logger.error(f"加载 OpenAPI 规范文件失败: {e}")
            return False
    
    def identify_functional_modules(self) -> Dict[str, Dict[str, Any]]:
        """
        识别功能模块
        
        Returns:
            功能模块字典，键为模块名，值为包含路径和组件的字典
        """
        if not self.openapi_spec or "paths" not in self.openapi_spec:
            self.logger.error("无效的 OpenAPI 规范文件")
            return {}
        
        # 按标签分组路径
        modules = defaultdict(lambda: {"paths": {}, "tags": set()})
        
        for path, path_item in self.openapi_spec["paths"].items():
            for method, operation in path_item.items():
                if method.lower() not in ["get", "post", "put", "delete", "patch", "options", "head", "trace"]:
                    continue
                
                # 获取操作的标签
                tags = operation.get("tags", ["未分类"])
                if not tags:
                    tags = ["未分类"]
                
                # 使用第一个标签作为模块名
                module_name = tags[0]
                modules[module_name]["paths"][path] = {method: operation}
                modules[module_name]["tags"].update(tags)
        
        # 转换 set 为 list 以便 JSON 序列化
        for module_name, module_data in modules.items():
            module_data["tags"] = list(module_data["tags"])
        
        self.logger.info(f"识别到 {len(modules)} 个功能模块: {list(modules.keys())}")
        return dict(modules)
    
    def identify_components_by_reference(self, modules: Dict[str, Dict[str, Any]]) -> Dict[str, Set[str]]:
        """
        识别每个模块引用的组件
        
        Args:
            modules: 功能模块字典
            
        Returns:
            模块到组件引用的映射
        """
        module_components = defaultdict(set)
        
        if not self.openapi_spec or "components" not in self.openapi_spec:
            return module_components
        
        # 获取所有组件
        all_components = self.openapi_spec.get("components", {})
        
        for module_name, module_data in modules.items():
            # 将模块数据转换为 JSON 字符串以便查找引用
            module_json = json.dumps(module_data)
            
            # 查找所有组件引用
            for component_type, component_schemas in all_components.items():
                if not isinstance(component_schemas, dict):
                    continue
                
                for component_name in component_schemas.keys():
                    # 查找 "#/components/{component_type}/{component_name}" 引用
                    ref_pattern = f"#/components/{component_type}/{component_name}"
                    if ref_pattern in module_json:
                        module_components[module_name].add(f"{component_type}/{component_name}")
        
        return module_components
    
    def extract_components_for_module(self, module_name: str, component_refs: Set[str]) -> Dict[str, Any]:
        """
        为模块提取所需的组件
        
        Args:
            module_name: 模块名
            component_refs: 组件引用集合
            
        Returns:
            模块所需的组件字典
        """
        if not self.openapi_spec or "components" not in self.openapi_spec:
            return {}
        
        all_components = self.openapi_spec.get("components", {})
        module_components = {}
        
        for ref in component_refs:
            component_type, component_name = ref.split("/", 1)
            
            if component_type not in all_components:
                self.logger.warning(f"组件类型 {component_type} 不存在")
                continue
            
            if component_name not in all_components[component_type]:
                self.logger.warning(f"组件 {component_type}/{component_name} 不存在")
                continue
            
            if component_type not in module_components:
                module_components[component_type] = {}
            
            module_components[component_type][component_name] = all_components[component_type][component_name]
        
        return module_components
    
    def create_base_spec(self) -> Dict[str, Any]:
        """
        创建基础 OpenAPI 规范，包含不拆分的部分
        
        Returns:
            基础 OpenAPI 规范
        """
        if not self.openapi_spec:
            return {}
        
        # 复制不拆分的部分
        base_spec = {
            "openapi": self.openapi_spec.get("openapi", ""),
            "info": self.openapi_spec.get("info", {}),
            "servers": self.openapi_spec.get("servers", []),
        }
        
        # 添加安全方案
        if "components" in self.openapi_spec and "securitySchemes" in self.openapi_spec["components"]:
            if "components" not in base_spec:
                base_spec["components"] = {}
            base_spec["components"]["securitySchemes"] = self.openapi_spec["components"]["securitySchemes"]
        
        return base_spec
    
    def split_by_functional_modules(self) -> bool:
        """
        按功能模块拆分 OpenAPI 规范
        
        Returns:
            拆分是否成功
        """
        if not self.openapi_spec:
            self.logger.error("未加载 OpenAPI 规范")
            return False
        
        # 识别功能模块
        modules = self.identify_functional_modules()
        if not modules:
            self.logger.error("未能识别任何功能模块")
            return False
        
        # 识别每个模块引用的组件
        module_components = self.identify_components_by_reference(modules)
        
        # 创建基础规范
        base_spec = self.create_base_spec()
        
        # 为每个模块创建单独的 OpenAPI 文件
        for module_name, module_data in modules.items():
            # 创建模块目录
            module_dir = os.path.join(self.output_dir, self._sanitize_filename(module_name))
            Path(module_dir).mkdir(parents=True, exist_ok=True)
            
            # 创建模块的 OpenAPI 规范
            module_spec = copy.deepcopy(base_spec)
            module_spec["paths"] = module_data["paths"]
            
            # 添加模块特定的标签
            if "tags" not in module_spec:
                module_spec["tags"] = []
            
            for tag in module_data["tags"]:
                module_spec["tags"].append({
                    "name": tag,
                    "description": f"{tag} 相关的 API"
                })
            
            # 添加模块所需的组件
            component_refs = module_components.get(module_name, set())
            if component_refs:
                module_components_dict = self.extract_components_for_module(module_name, component_refs)
                if module_components_dict:
                    if "components" not in module_spec:
                        module_spec["components"] = {}
                    
                    for component_type, components in module_components_dict.items():
                        if component_type not in module_spec["components"]:
                            module_spec["components"][component_type] = {}
                        module_spec["components"][component_type].update(components)
            
            # 保存模块的 OpenAPI 文件
            module_file = os.path.join(module_dir, f"{self._sanitize_filename(module_name)}.json")
            try:
                with open(module_file, 'w', encoding='utf-8') as f:
                    json.dump(module_spec, f, ensure_ascii=False, indent=2)
                self.logger.info(f"已创建模块文件: {module_file}")
            except Exception as e:
                self.logger.error(f"保存模块文件失败: {e}")
                return False
            
            # 如果是混合策略，进一步按结构拆分
            if self.strategy == "hybrid":
                self.split_by_structural_components(module_name, module_spec, module_dir)
        
        # 保存基础规范
        base_file = os.path.join(self.output_dir, "base.json")
        try:
            with open(base_file, 'w', encoding='utf-8') as f:
                json.dump(base_spec, f, ensure_ascii=False, indent=2)
            self.logger.info(f"已创建基础规范文件: {base_file}")
        except Exception as e:
            self.logger.error(f"保存基础规范文件失败: {e}")
            return False
        
        return True
    
    def split_by_structural_components(self, module_name: str, module_spec: Dict[str, Any], module_dir: str):
        """
        按 OpenAPI 结构拆分模块
        
        Args:
            module_name: 模块名
            module_spec: 模块的 OpenAPI 规范
            module_dir: 模块目录
        """
        # 创建结构目录
        struct_dir = os.path.join(module_dir, "by-structure")
        Path(struct_dir).mkdir(parents=True, exist_ok=True)
        
        # 拆分路径
        if "paths" in module_spec:
            paths_file = os.path.join(struct_dir, "paths.json")
            try:
                with open(paths_file, 'w', encoding='utf-8') as f:
                    json.dump(module_spec["paths"], f, ensure_ascii=False, indent=2)
                self.logger.debug(f"已创建路径文件: {paths_file}")
            except Exception as e:
                self.logger.error(f"保存路径文件失败: {e}")
        
        # 拆分组件
        if "components" in module_spec:
            for component_type, components in module_spec["components"].items():
                if not components:
                    continue
                
                component_file = os.path.join(struct_dir, f"{component_type}.json")
                try:
                    with open(component_file, 'w', encoding='utf-8') as f:
                        json.dump(components, f, ensure_ascii=False, indent=2)
                    self.logger.debug(f"已创建组件文件: {component_file}")
                except Exception as e:
                    self.logger.error(f"保存组件文件失败: {e}")
        
        # 保存模块元数据
        metadata = {
            "name": module_name,
            "tags": module_spec.get("tags", []),
            "paths_count": len(module_spec.get("paths", {})),
            "components": list(module_spec.get("components", {}).keys())
        }
        
        metadata_file = os.path.join(struct_dir, "metadata.json")
        try:
            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
            self.logger.debug(f"已创建元数据文件: {metadata_file}")
        except Exception as e:
            self.logger.error(f"保存元数据文件失败: {e}")
    
    def split_by_structural_only(self) -> bool:
        """
        仅按 OpenAPI 结构拆分
        
        Returns:
            拆分是否成功
        """
        if not self.openapi_spec:
            self.logger.error("未加载 OpenAPI 规范")
            return False
        
        # 创建基础规范
        base_spec = self.create_base_spec()
        
        # 保存基础规范
        base_file = os.path.join(self.output_dir, "base.json")
        try:
            with open(base_file, 'w', encoding='utf-8') as f:
                json.dump(base_spec, f, ensure_ascii=False, indent=2)
            self.logger.info(f"已创建基础规范文件: {base_file}")
        except Exception as e:
            self.logger.error(f"保存基础规范文件失败: {e}")
            return False
        
        # 拆分路径
        if "paths" in self.openapi_spec:
            paths_file = os.path.join(self.output_dir, "paths.json")
            try:
                with open(paths_file, 'w', encoding='utf-8') as f:
                    json.dump(self.openapi_spec["paths"], f, ensure_ascii=False, indent=2)
                self.logger.info(f"已创建路径文件: {paths_file}")
            except Exception as e:
                self.logger.error(f"保存路径文件失败: {e}")
                return False
        
        # 拆分组件
        if "components" in self.openapi_spec:
            components_dir = os.path.join(self.output_dir, "components")
            Path(components_dir).mkdir(parents=True, exist_ok=True)
            
            for component_type, components in self.openapi_spec["components"].items():
                if not components:
                    continue
                
                component_file = os.path.join(components_dir, f"{component_type}.json")
                try:
                    with open(component_file, 'w', encoding='utf-8') as f:
                        json.dump(components, f, ensure_ascii=False, indent=2)
                    self.logger.info(f"已创建组件文件: {component_file}")
                except Exception as e:
                    self.logger.error(f"保存组件文件失败: {e}")
                    return False
        
        return True
    
    def _sanitize_filename(self, filename: str) -> str:
        """
        清理文件名，移除不合法字符
        
        Args:
            filename: 原始文件名
            
        Returns:
            清理后的文件名
        """
        # 替换不合法字符
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            filename = filename.replace(char, '_')
        
        # 移除前后空格
        filename = filename.strip()
        
        # 确保不为空
        if not filename:
            filename = "unnamed"
        
        return filename
    
    def split(self) -> bool:
        """
        执行拆分操作
        
        Returns:
            拆分是否成功
        """
        self.logger.info(f"开始拆分 OpenAPI 文件: {self.input_file}")
        self.logger.info(f"输出目录: {self.output_dir}")
        self.logger.info(f"拆分策略: {self.strategy}")
        
        # 加载 OpenAPI 规范
        if not self.load_openapi_spec():
            return False
        
        # 根据策略执行拆分
        if self.strategy == "functional":
            return self.split_by_functional_modules()
        elif self.strategy == "structural":
            return self.split_by_structural_only()
        elif self.strategy == "hybrid":
            return self.split_by_functional_modules()
        else:
            self.logger.error(f"未知的拆分策略: {self.strategy}")
            return False
    
    def generate_index(self) -> bool:
        """
        生成拆分结果的索引文件
        
        Returns:
            是否成功生成索引
        """
        self.logger.info("生成索引文件...")
        
        index = {
            "input_file": self.input_file,
            "output_directory": self.output_dir,
            "strategy": self.strategy,
            "modules": []
        }
        
        # 扫描输出目录，收集模块信息
        output_path = Path(self.output_dir)
        
        if self.strategy in ["functional", "hybrid"]:
            # 扫描功能模块目录
            for item in output_path.iterdir():
                if item.is_dir() and item.name != "by-structure":
                    module_info = {
                        "name": item.name,
                        "directory": str(item),
                        "files": []
                    }
                    
                    # 扫描模块文件
                    for file_item in item.iterdir():
                        if file_item.is_file():
                            module_info["files"].append({
                                "name": file_item.name,
                                "path": str(file_item),
                                "type": "module" if file_item.suffix == ".json" and file_item.name != "metadata.json" else "metadata"
                            })
                    
                    index["modules"].append(module_info)
        
        # 保存索引文件
        index_file = os.path.join(self.output_dir, "index.json")
        try:
            with open(index_file, 'w', encoding='utf-8') as f:
                json.dump(index, f, ensure_ascii=False, indent=2)
            self.logger.info(f"已创建索引文件: {index_file}")
            return True
        except Exception as e:
            self.logger.error(f"保存索引文件失败: {e}")
            return False


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="OpenAPI 文件拆分工具")
    parser.add_argument("input_file", help="输入的 OpenAPI JSON 文件路径")
    parser.add_argument("output_dir", help="输出目录")
    parser.add_argument(
        "--strategy", 
        choices=["functional", "structural", "hybrid"],
        default="hybrid",
        help="拆分策略: functional(按功能), structural(按结构), hybrid(混合，默认)"
    )
    
    args = parser.parse_args()
    
    # 检查输入文件是否存在
    if not os.path.exists(args.input_file):
        print(f"错误: 输入文件不存在: {args.input_file}")
        sys.exit(1)
    
    # 创建拆分器并执行拆分
    splitter = OpenAPISplitter(args.input_file, args.output_dir, args.strategy)
    
    if not splitter.split():
        print("拆分失败")
        sys.exit(1)
    
    # 生成索引
    splitter.generate_index()
    
    print(f"拆分完成! 输出目录: {args.output_dir}")


if __name__ == "__main__":
    main()