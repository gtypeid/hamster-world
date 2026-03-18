import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, MarkerType, Position } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

export interface MiniFlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type?: 'default' | 'input' | 'output';
  sourcePosition?: 'top' | 'right' | 'bottom' | 'left';
  targetPosition?: 'top' | 'right' | 'bottom' | 'left';
  style?: {
    bg?: string;
    color?: string;
    border?: string;
    width?: number;
    fontWeight?: string;
  };
}

export interface MiniFlowEdge {
  source: string;
  target: string;
  animated?: boolean;
  dashed?: boolean;
  color?: string;
  label?: string;
}

export interface DocMiniFlowProps {
  nodes: MiniFlowNode[];
  edges: MiniFlowEdge[];
  height?: number | '100%';
  /** 노드 연결 방향: 'LR' = 좌→우 (기본), 'TB' = 위→아래 */
  direction?: 'LR' | 'TB';
  /** 핵심 서비스 노드 id 패턴 — 해당 노드 강조, 나머지 축소 */
  ownerService?: string;
  /** MiniMap 표시 여부 */
  miniMap?: boolean;
  /** 노드 드래그 허용 여부 */
  draggable?: boolean;
  /** 줌 허용 여부 */
  zoomable?: boolean;
}

const POSITION_MAP = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};

function toReactFlowNodes(items: MiniFlowNode[], direction: 'LR' | 'TB', ownerService?: string): Node[] {
  const defaultSource = direction === 'LR' ? Position.Right : Position.Bottom;
  const defaultTarget = direction === 'LR' ? Position.Left : Position.Top;

  return items.map((item) => {
    const isOwner = ownerService ? item.label.toLowerCase().includes(ownerService.toLowerCase()) : false;
    const dimmed = ownerService && !isOwner;

    return {
      id: item.id,
      type: item.type ?? 'default',
      data: {
        label: (
          <div className="text-[11px] font-semibold leading-tight text-center whitespace-pre-line">
            {item.label}
          </div>
        ),
      },
      position: { x: item.x, y: item.y },
      sourcePosition: item.sourcePosition ? POSITION_MAP[item.sourcePosition] : defaultSource,
      targetPosition: item.targetPosition ? POSITION_MAP[item.targetPosition] : defaultTarget,
      style: {
        background: item.style?.bg ?? '#1e293b',
        color: item.style?.color ?? '#e2e8f0',
        border: isOwner
          ? '2px solid #fbbf24'
          : (item.style?.border ?? '1px solid #334155'),
        borderRadius: '8px',
        padding: '8px 12px',
        width: item.style?.width ?? 160,
        fontWeight: item.style?.fontWeight,
        fontSize: '11px',
        opacity: dimmed ? 0.55 : 1,
        boxShadow: isOwner ? '0 0 12px rgba(251, 191, 36, 0.3)' : undefined,
      },
    };
  });
}

function toReactFlowEdges(items: MiniFlowEdge[]): Edge[] {
  return items.map((item, i) => ({
    id: `e-${i}-${item.source}-${item.target}`,
    source: item.source,
    target: item.target,
    animated: item.animated,
    label: item.label,
    labelStyle: { fontSize: '9px', fill: '#94a3b8' },
    labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
    markerEnd: { type: MarkerType.ArrowClosed, color: item.color ?? '#475569', width: 16, height: 16 },
    style: {
      stroke: item.color ?? '#475569',
      strokeDasharray: item.dashed ? '5,5' : undefined,
    },
  }));
}

/** 노드 데이터에서 y 범위를 읽어 적절한 높이를 자동 계산 */
const NODE_HEIGHT_ESTIMATE = 40;
const PADDING_Y = 60;

function computeAutoHeight(nodes: MiniFlowNode[], fallback: number): number {
  if (nodes.length === 0) return fallback;
  const minY = Math.min(...nodes.map((n) => n.y));
  const maxY = Math.max(...nodes.map((n) => n.y));
  return maxY - minY + NODE_HEIGHT_ESTIMATE + PADDING_Y * 2;
}

export function DocMiniFlow({ nodes, edges, height, direction = 'LR', ownerService, miniMap, draggable, zoomable }: DocMiniFlowProps) {
  const rfNodes = toReactFlowNodes(nodes, direction, ownerService);
  const rfEdges = toReactFlowEdges(edges);
  const resolvedHeight = useMemo(() => height === '100%' ? '100%' : (height ?? computeAutoHeight(nodes, 280)), [height, nodes]);

  return (
    <div style={{ height: resolvedHeight }} className="rounded-lg border border-gray-800/60 overflow-hidden bg-[#080e1a]">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={draggable ?? false}
        nodesConnectable={false}
        elementsSelectable={draggable ?? false}
        panOnDrag
        zoomOnScroll={zoomable ?? false}
        zoomOnPinch={zoomable ?? false}
        zoomOnDoubleClick={false}
        preventScrolling={zoomable ?? false}
        minZoom={0.3}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
      >
        <Controls
          showInteractive={false}
          position="top-right"
          style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '6px' }}
        />
        <Background color="#1e293b" gap={20} />
        {miniMap && (
          <MiniMap
            nodeColor={(node) => {
              const bg = node.style?.background;
              return typeof bg === 'string' ? bg : '#334155';
            }}
            maskColor="rgba(0, 0, 0, 0.7)"
            style={{ background: '#0f172a', border: '1px solid #1e293b' }}
          />
        )}
      </ReactFlow>
    </div>
  );
}
