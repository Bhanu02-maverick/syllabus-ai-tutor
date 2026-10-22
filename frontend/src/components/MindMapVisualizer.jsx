import React, { useState, useMemo, useRef } from "react";
import {
  Compass,
  BookOpen,
  Lightbulb,
  Target,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  FolderOpen,
  Folder,
  Layers,
  X,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Helper to compute breadcrumb path from root to target node
 */
function findNodePath(current, targetId, path = []) {
  if (!current) return null;
  const nextPath = [...path, current];
  if (current.id === targetId) return nextPath;
  if (current.children && current.children.length > 0) {
    for (const child of current.children) {
      const found = findNodePath(child, targetId, nextPath);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Helper to compute tree stats: total concept count and maximum depth
 */
function getTreeMetrics(root) {
  let count = 0;
  let maxDepth = 0;
  function traverse(node, depth) {
    if (!node) return;
    count++;
    if (depth > maxDepth) maxDepth = depth;
    if (node.children) {
      node.children.forEach((c) => traverse(c, depth + 1));
    }
  }
  traverse(root, 1);
  return { totalConcepts: count, maxDepth };
}

/**
 * Individual Node Pill Component
 */
function MindMapNodeItem({
  node,
  depth,
  isSelected,
  isExpanded,
  hasChildren,
  onSelect,
  onToggleExpand,
  isDark,
}) {
  const childCount = node.children ? node.children.length : 0;

  // Level-specific visual styling (Clean, compact, academic)
  let levelBadge = null;
  let nodeStyle = "";
  let icon = null;

  if (depth === 0) {
    // Root Node (Main Unit Concept)
    nodeStyle = isSelected
      ? isDark
        ? "bg-indigo-950/90 border-indigo-400 ring-2 ring-indigo-400 text-white shadow-md shadow-indigo-950/50"
        : "bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500 text-indigo-950 shadow-md shadow-indigo-100"
      : isDark
      ? "bg-slate-900 border-indigo-500/50 hover:border-indigo-400 text-white shadow-sm"
      : "bg-white border-indigo-300 hover:border-indigo-500 text-slate-900 shadow-sm";
    levelBadge = "Unit Core";
    icon = <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
  } else if (depth === 1) {
    // Level 1: Major Syllabus Topic
    nodeStyle = isSelected
      ? isDark
        ? "bg-blue-950/90 border-blue-400 ring-2 ring-blue-400 text-white shadow-md shadow-blue-950/50"
        : "bg-blue-50 border-blue-600 ring-2 ring-blue-500 text-blue-950 shadow-md shadow-blue-100"
      : isDark
      ? "bg-slate-900 border-slate-700/80 hover:border-blue-400 text-slate-100 shadow-sm"
      : "bg-white border-slate-200 hover:border-blue-400 text-slate-800 shadow-sm";
    levelBadge = "Topic";
    icon = <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />;
  } else if (depth === 2) {
    // Level 2: Subtopic
    nodeStyle = isSelected
      ? isDark
        ? "bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-400 text-white shadow-md shadow-emerald-950/50"
        : "bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500 text-emerald-950 shadow-md shadow-emerald-100"
      : isDark
      ? "bg-slate-900 border-slate-800 hover:border-emerald-400 text-slate-200 shadow-sm"
      : "bg-white border-slate-200 hover:border-emerald-400 text-slate-800 shadow-sm";
    levelBadge = "Subtopic";
    icon = <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />;
  } else {
    // Level 3+: Leaf concept
    nodeStyle = isSelected
      ? isDark
        ? "bg-purple-950/90 border-purple-400 ring-2 ring-purple-400 text-white shadow-md"
        : "bg-purple-50 border-purple-600 ring-2 ring-purple-500 text-purple-950 shadow-md"
      : isDark
      ? "bg-slate-900 border-slate-800 hover:border-purple-400 text-slate-300"
      : "bg-white border-slate-200 hover:border-purple-400 text-slate-700";
    icon = <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />;
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node);
      }}
      className={`group relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all duration-200 cursor-pointer select-none ${nodeStyle}`}
      style={{ minWidth: depth === 0 ? "210px" : "160px", maxWidth: "260px" }}
      title={node.description || node.label}
    >
      {/* Node Bullet / Icon */}
      {icon}

      {/* Node Text & Info */}
      <div className="flex-1 min-w-0">
        {levelBadge && depth <= 1 && (
          <span className="block text-[9px] font-bold uppercase tracking-wider opacity-60 mb-0.5">
            {levelBadge}
          </span>
        )}
        <p
          className={`truncate leading-snug ${
            depth === 0
              ? "font-extrabold text-xs sm:text-sm"
              : depth === 1
              ? "font-bold text-xs"
              : "font-semibold text-[11px]"
          }`}
        >
          {node.label}
        </p>
      </div>

      {/* Child Count Badge & Expand/Collapse Toggle */}
      {hasChildren && (
        <div className="flex items-center gap-1.5 ml-1 shrink-0">
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
              isDark
                ? "bg-slate-800/80 border-slate-700 text-slate-300"
                : "bg-slate-100 border-slate-200 text-slate-600"
            }`}
          >
            {childCount}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
            className={`p-1 rounded-md border transition-colors cursor-pointer ${
              isDark
                ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
            }`}
            title={isExpanded ? "Collapse branch" : "Expand branch"}
          >
            {isExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Recursive Branch Component with Organic Orthogonal Connector Lines
 */
function MindMapBranch({
  node,
  depth,
  selectedNodeId,
  onSelectNode,
  expandedIds,
  onToggleExpand,
  isDark,
}) {
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedNodeId === node.id;

  const lineColor = isDark ? "border-slate-700" : "border-slate-300";
  const lineBgColor = isDark ? "bg-slate-700" : "bg-slate-300";

  return (
    <div className="flex items-center relative py-1">
      {/* Node Box */}
      <MindMapNodeItem
        node={node}
        depth={depth}
        isSelected={isSelected}
        isExpanded={isExpanded}
        hasChildren={hasChildren}
        onSelect={onSelectNode}
        onToggleExpand={onToggleExpand}
        isDark={isDark}
      />

      {/* Children Column with Branch Lines */}
      {hasChildren && isExpanded && (
        <div className="flex items-center pl-6 relative">
          {/* Horizontal trunk spur extending from parent node */}
          <div className={`w-6 h-[2px] absolute -left-0 ${lineBgColor}`} />

          {/* Children Vertical Stack */}
          <div className="flex flex-col justify-center relative space-y-3.5 py-1">
            {node.children.map((child, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === node.children.length - 1;
              const isOnly = node.children.length === 1;

              return (
                <div key={child.id || idx} className="relative flex items-center pl-6">
                  {/* Tree Connector Lines */}
                  {!isOnly && (
                    <div
                      className={`absolute left-0 w-6 border-l-2 ${lineColor} pointer-events-none ${
                        isFirst
                          ? "top-1/2 bottom-0 rounded-tl-xl border-t-2"
                          : isLast
                          ? "top-0 bottom-1/2 rounded-bl-xl border-b-2"
                          : "top-0 bottom-0 border-t-0"
                      }`}
                    />
                  )}

                  {/* Horizontal spur into child node */}
                  <div className={`w-6 h-[2px] absolute left-0 ${lineBgColor} pointer-events-none`} />

                  <MindMapBranch
                    node={child}
                    depth={depth + 1}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={onSelectNode}
                    expandedIds={expandedIds}
                    onToggleExpand={onToggleExpand}
                    isDark={isDark}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Slide-Over Node Detail Panel / Popover
 */
function NodeDetailPanel({
  selectedNode,
  tree,
  onClose,
  onAction,
  onSelectNode,
  isDark,
  unitNumber,
}) {
  if (!selectedNode) return null;

  const path = findNodePath(tree, selectedNode.id) || [selectedNode];
  const hasChildren = selectedNode.children && selectedNode.children.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`w-80 sm:w-96 border-l shadow-2xl flex flex-col justify-between z-30 shrink-0 transition-colors ${
        isDark ? "bg-slate-900/95 border-slate-800 text-slate-100" : "bg-white/95 border-slate-200 text-slate-900"
      }`}
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-700/20 flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-1 text-[10px] font-semibold opacity-60 flex-wrap">
            {path.map((p, i) => (
              <React.Fragment key={p.id || i}>
                <span className="truncate max-w-[80px]">{p.label}</span>
                {i < path.length - 1 && <ChevronRight className="w-3 h-3 shrink-0" />}
              </React.Fragment>
            ))}
          </div>

          <h4 className="text-base font-extrabold tracking-tight truncate leading-tight">
            {selectedNode.label}
          </h4>
        </div>

        <button
          onClick={onClose}
          className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
            isDark
              ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-white"
              : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900"
          }`}
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Scrollable Body */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Syllabus Context / Description */}
        <div
          className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
            isDark ? "bg-slate-950/60 border-slate-800/80 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-60 mb-1">
            Curriculum Definition
          </span>
          <p className="font-medium">
            {selectedNode.description ||
              `Core syllabus concept under Unit ${unitNumber}. Explore deep explanations, real-world examples, or take an active recall quiz below.`}
          </p>
        </div>

        {/* Sub-concepts / Children Chips if present */}
        {hasChildren && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 block">
              Direct Child Concepts ({selectedNode.children.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedNode.children.map((child, i) => (
                <button
                  key={child.id || i}
                  onClick={() => onSelectNode(child)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                    isDark
                      ? "bg-slate-800/70 hover:bg-slate-800 border-slate-700 text-slate-300"
                      : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                  }`}
                >
                  <span className="truncate max-w-[120px]">{child.label}</span>
                  <ArrowRight className="w-2.5 h-2.5 opacity-50" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Existing AI Research Actions Hub */}
        <div className="space-y-2.5 pt-2 border-t border-slate-700/20">
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 block">
            Interactive Concept Actions
          </span>

          {/* 1. Explain */}
          <button
            onClick={() => onAction(selectedNode.id, selectedNode.label, "explain")}
            className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer group ${
              isDark
                ? "bg-slate-800/50 hover:bg-blue-950/40 border-slate-700 hover:border-blue-500/50 text-slate-200"
                : "bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold">Deep Concept Explanation</p>
                <p className="text-[10px] opacity-60">Syllabus-grounded breakdown & formulas</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-blue-500" />
          </button>

          {/* 2. Example */}
          <button
            onClick={() => onAction(selectedNode.id, selectedNode.label, "example")}
            className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer group ${
              isDark
                ? "bg-slate-800/50 hover:bg-amber-950/40 border-slate-700 hover:border-amber-500/50 text-slate-200"
                : "bg-slate-50 hover:bg-amber-50 border-slate-200 hover:border-amber-300 text-slate-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold">Practical Example</p>
                <p className="text-[10px] opacity-60">Real-world scenario & application</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-amber-500" />
          </button>

          {/* 3. Quiz Me */}
          <button
            onClick={() => onAction(selectedNode.id, selectedNode.label, "quiz")}
            className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer group ${
              isDark
                ? "bg-slate-800/50 hover:bg-emerald-950/40 border-slate-700 hover:border-emerald-500/50 text-slate-200"
                : "bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-300 text-slate-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold">Quiz Me on This</p>
                <p className="text-[10px] opacity-60">Test concept retention with micro-quiz</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-emerald-500" />
          </button>

          {/* 4. Ask AI */}
          <button
            onClick={() => onAction(selectedNode.id, selectedNode.label, "ask")}
            className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer group ${
              isDark
                ? "bg-slate-800/50 hover:bg-purple-950/40 border-slate-700 hover:border-purple-500/50 text-slate-200"
                : "bg-slate-50 hover:bg-purple-50 border-slate-200 hover:border-purple-300 text-slate-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold">Ask AI Tutor</p>
                <p className="text-[10px] opacity-60">Ask specific syllabus questions</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-purple-500" />
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-700/20 text-[10px] opacity-50 flex items-center justify-between">
        <span>VCE AI Mind Map</span>
        <span>Click any node in tree to inspect</span>
      </div>
    </motion.div>
  );
}

/**
 * Main MindMapVisualizer Component
 */
export default function MindMapVisualizer({
  tree,
  onAction,
  isDark,
  unitNumber,
  unitName,
  isCached,
}) {
  if (!tree) return null;

  // Selected node for the right-side detail drawer (null by default so full tree is visible)
  const [selectedNode, setSelectedNode] = useState(null);

  // Expanded nodes tracker: by default root and its level-1 children are expanded
  const [expandedIds, setExpandedIds] = useState(() => {
    const initial = new Set([tree.id]);
    if (tree.children) {
      tree.children.forEach((c) => initial.add(c.id));
    }
    return initial;
  });

  // Canvas zoom state
  const [zoom, setZoom] = useState(1);

  // Tree Metrics
  const { totalConcepts, maxDepth } = useMemo(() => getTreeMetrics(tree), [tree]);

  // Toggle single branch
  const handleToggleExpand = (nodeId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Expand all branches
  const handleExpandAll = () => {
    const all = new Set();
    function collect(node) {
      if (!node) return;
      if (node.children && node.children.length > 0) {
        all.add(node.id);
        node.children.forEach(collect);
      }
    }
    collect(tree);
    setExpandedIds(all);
  };

  // Collapse all except root
  const handleCollapseAll = () => {
    setExpandedIds(new Set([tree.id]));
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(1)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(1)));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="space-y-4">
      {/* ─── Mind Map Header Bar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/30">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-wide uppercase text-indigo-500">
              Unit {unitNumber}: {unitName} Concept Tree
            </h3>
            <div className="flex items-center gap-2 text-xs opacity-60 font-medium">
              <span>{totalConcepts} Concepts</span>
              <span>•</span>
              <span>{maxDepth} Hierarchy Levels</span>
              <span>•</span>
              <span>Click any node for deep dive & actions</span>
            </div>
          </div>
        </div>

        {isCached && (
          <span className="vce-badge vce-badge-success">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Saved copy
          </span>
        )}
      </div>

      {/* ─── Mind Map Canvas Container ─── */}
      <div
        className={`vce-card overflow-hidden relative flex flex-col ${
          isDark
            ? "bg-slate-950/80 border-slate-800"
            : "bg-slate-50/90 border-slate-200"
        }`}
        style={{ minHeight: "560px" }}
      >
        {/* Canvas Toolbar (Controls: Zoom, Expand, Collapse) */}
        <div
          className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs font-semibold select-none z-10 ${
            isDark ? "bg-slate-900/90 border-slate-800 text-slate-300" : "bg-white/90 border-slate-200 text-slate-700"
          }`}
        >
          {/* Quick Info / Legend */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[11px] opacity-75">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> Core
            </span>
            <span className="flex items-center gap-1.5 text-[11px] opacity-75">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Topic
            </span>
            <span className="flex items-center gap-1.5 text-[11px] opacity-75">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Subtopic
            </span>
            <span className="flex items-center gap-1.5 text-[11px] opacity-75">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> Leaf
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5">
            {/* Expand / Collapse All */}
            <button
              onClick={handleExpandAll}
              className="vce-btn vce-btn-secondary vce-btn-sm"
              title="Expand all branches"
            >
              <FolderOpen className="w-3.5 h-3.5" /> Expand All
            </button>
            <button
              onClick={handleCollapseAll}
              className="vce-btn vce-btn-secondary vce-btn-sm"
              title="Collapse to main topics"
            >
              <Folder className="w-3.5 h-3.5" /> Collapse
            </button>

            <div className={`h-4 w-[1px] mx-1 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />

            {/* Zoom Controls */}
            <button
              onClick={handleZoomOut}
              className="vce-btn vce-btn-secondary vce-btn-icon"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1 min-w-[38px] text-center font-bold text-slate-600 dark:text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="vce-btn vce-btn-secondary vce-btn-icon"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="vce-btn vce-btn-secondary vce-btn-icon"
              title="Reset view (100%)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ─── Interactive Mind Map Workspace Area ─── */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Canvas Scroll Area with blueprint dot pattern */}
          <div
            className="flex-1 overflow-x-auto overflow-y-auto p-8 sm:p-12 relative cursor-grab active:cursor-grabbing"
            style={{
              backgroundImage: isDark
                ? "radial-gradient(#334155 1px, transparent 1px)"
                : "radial-gradient(#cbd5e1 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          >
            {/* Scalable Mind Map Concept Tree */}
            <div
              className="inline-block transition-transform duration-200 origin-left"
              style={{ transform: `scale(${zoom})` }}
            >
              <MindMapBranch
                node={tree}
                depth={0}
                selectedNodeId={selectedNode?.id}
                onSelectNode={(node) => setSelectedNode(node)}
                expandedIds={expandedIds}
                onToggleExpand={handleToggleExpand}
                isDark={isDark}
              />
            </div>

            {/* Subtle floating tip when no node is selected */}
            {!selectedNode && (
              <div
                className={`absolute bottom-4 left-6 px-3.5 py-1.5 rounded-full border text-[11px] font-semibold flex items-center gap-2 pointer-events-none transition-opacity opacity-75 backdrop-blur-md ${
                  isDark
                    ? "bg-slate-900/90 border-slate-700 text-slate-300"
                    : "bg-white/90 border-slate-200 text-slate-600 shadow-sm"
                }`}
              >
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                <span>Click any concept node to inspect definitions & actions</span>
              </div>
            )}
          </div>

          {/* Right-Side Detail Panel (Slide-Over Drawer) */}
          <AnimatePresence>
            {selectedNode && (
              <NodeDetailPanel
                selectedNode={selectedNode}
                tree={tree}
                onClose={() => setSelectedNode(null)}
                onAction={onAction}
                onSelectNode={(node) => setSelectedNode(node)}
                isDark={isDark}
                unitNumber={unitNumber}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
