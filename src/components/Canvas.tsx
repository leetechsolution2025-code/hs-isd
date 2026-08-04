"use client"
import { useCallback, useRef, useState, useEffect } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { loadProject } from '@/app/actions'
import { nodeTypes } from './nodes/CustomNodes'

let id = 0
const getId = () => `dndnode_${id++}`

export function Canvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const { screenToFlowPosition, fitView } = useReactFlow()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    async function fetchProject() {
      const projectId = localStorage.getItem('projectId') || undefined
      const project = await loadProject(projectId)
      if (project) {
        localStorage.setItem('projectId', project.id)
        setNodes(project.nodes)
        setEdges(project.edges)
        setTimeout(() => fitView(), 100)
      }
      setIsLoaded(true)
    }
    fetchProject()
  }, [setNodes, setEdges, fitView])

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true, type: 'smoothstep' }, eds)),
    [setEdges]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')

      if (typeof type === 'undefined' || !type) {
        return
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: `${type.charAt(0).toUpperCase() + type.slice(1)}` }
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [screenToFlowPosition, setNodes]
  )

  return (
    <div className="flex-1 h-full w-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        className="bg-slate-50"
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#cbd5e1" />
      </ReactFlow>
    </div>
  )
}
