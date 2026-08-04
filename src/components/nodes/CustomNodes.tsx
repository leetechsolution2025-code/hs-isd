import { Handle, Position } from '@xyflow/react'
import { Database, Power, CircleDot, Droplet, Sprout, Waves, Menu } from 'lucide-react'

export function WaterSourceNode({ data, selected }: any) {
  return (
    <div className={`px-4 py-2 shadow-md rounded-xl bg-white border-2 ${selected ? 'border-blue-500 shadow-blue-200' : 'border-blue-200'} transition-all min-w-[120px] flex items-center gap-2`}>
      <div className="p-1.5 rounded-lg bg-blue-50 text-blue-500">
        <Database size={16} />
      </div>
      <div className="font-semibold text-sm text-gray-700">{data.label || 'Nguồn nước'}</div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-white" />
    </div>
  )
}

export function PumpNode({ data, selected }: any) {
  return (
    <div className={`px-4 py-2 shadow-md rounded-xl bg-white border-2 ${selected ? 'border-amber-500 shadow-amber-200' : 'border-amber-200'} transition-all min-w-[120px] flex items-center gap-2`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-amber-500 border-2 border-white" />
      <div className="p-1.5 rounded-lg bg-amber-50 text-amber-500">
        <Power size={16} />
      </div>
      <div className="flex flex-col">
        <div className="font-semibold text-sm text-gray-700">{data.label || 'Máy bơm'}</div>
        {data.flowRate && <div className="text-[10px] text-gray-500">{data.flowRate} L/s</div>}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-amber-500 border-2 border-white" />
    </div>
  )
}

export function ValveNode({ data, selected }: any) {
  return (
    <div className={`px-4 py-2 shadow-md rounded-xl bg-white border-2 ${selected ? 'border-red-500 shadow-red-200' : 'border-red-200'} transition-all min-w-[120px] flex items-center gap-2`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-red-500 border-2 border-white" />
      <div className="p-1.5 rounded-lg bg-red-50 text-red-500">
        <CircleDot size={16} />
      </div>
      <div className="font-semibold text-sm text-gray-700">{data.label || 'Van'}</div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-red-500 border-2 border-white" />
    </div>
  )
}

export function SprinklerNode({ data, selected }: any) {
  return (
    <div className={`px-4 py-2 shadow-md rounded-xl bg-white border-2 ${selected ? 'border-emerald-500 shadow-emerald-200' : 'border-emerald-200'} transition-all min-w-[120px] flex items-center gap-2`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-emerald-500 border-2 border-white" />
      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-500">
        <Droplet size={16} />
      </div>
      <div className="font-semibold text-sm text-gray-700">{data.label || 'Vòi phun'}</div>
    </div>
  )
}

export function GateNode({ data, selected }: any) {
  return (
    <div className={`px-4 py-2 shadow-md rounded-xl bg-white border-2 ${selected ? 'border-indigo-500 shadow-indigo-200' : 'border-indigo-200'} transition-all min-w-[120px] flex items-center gap-2`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-indigo-500 border-2 border-white" />
      <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-500">
        <Menu size={16} />
      </div>
      <div className="font-semibold text-sm text-gray-700">{data.label || 'Cống'}</div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-indigo-500 border-2 border-white" />
    </div>
  )
}

export function WeirNode({ data, selected }: any) {
  return (
    <div className={`px-4 py-2 shadow-md rounded-xl bg-white border-2 ${selected ? 'border-cyan-500 shadow-cyan-200' : 'border-cyan-200'} transition-all min-w-[120px] flex items-center gap-2`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-cyan-500 border-2 border-white" />
      <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-500">
        <Waves size={16} />
      </div>
      <div className="font-semibold text-sm text-gray-700">{data.label || 'Đập'}</div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-cyan-500 border-2 border-white" />
    </div>
  )
}

export function FieldNode({ data, selected }: any) {
  return (
    <div className={`px-4 py-2 shadow-md rounded-xl bg-white border-2 ${selected ? 'border-green-500 shadow-green-200' : 'border-green-200'} transition-all min-w-[120px] flex items-center gap-2`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-green-500 border-2 border-white" />
      <div className="p-1.5 rounded-lg bg-green-50 text-green-500">
        <Sprout size={16} />
      </div>
      <div className="flex flex-col">
        <div className="font-semibold text-sm text-gray-700">{data.label || 'Đồng ruộng'}</div>
        {data.area && <div className="text-[10px] text-gray-500">{data.area} ha</div>}
      </div>
    </div>
  )
}

export const nodeTypes = {
  source: WaterSourceNode,
  pump: PumpNode,
  valve: ValveNode,
  sprinkler: SprinklerNode,
  gate: GateNode,
  weir: WeirNode,
  field: FieldNode,
}
