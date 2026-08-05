import sys

with open("src/components/DesignFullscreenModal.tsx", "r") as f:
    content = f.read()

# 1. Update interface
content = content.replace("inlineStructureType?: string, endChainage?: string, headLoss?: number, inletLoss?: number, outletLoss?: number, frictionLoss?: number",
                          "inlineStructureType?: string, endChainage?: string, headLoss?: number, inletLoss?: number, outletLoss?: number, frictionLoss?: number, flowCalcMethod?: string, reqFlow?: number")

# 2. Add state
state_code = """  const [canalLengthInput, setCanalLengthInput] = useState<string>('0');
  const [riceAreaInput, setRiceAreaInput] = useState<string>('0');"""
new_state_code = """  const [canalLengthInput, setCanalLengthInput] = useState<string>('0');
  const [flowCalcMethodInput, setFlowCalcMethodInput] = useState('tinh_toan');
  const [reqFlowInput, setReqFlowInput] = useState<string>('0');
  const [riceAreaInput, setRiceAreaInput] = useState<string>('0');"""
content = content.replace(state_code, new_state_code)

# 3. Load state
load_code = """        setCanalLengthInput(struct.length?.toString() || '0');
        setRiceAreaInput(struct.riceArea?.toString() || '0');"""
new_load_code = """        setCanalLengthInput(struct.length?.toString() || '0');
        setFlowCalcMethodInput(struct.flowCalcMethod || 'tinh_toan');
        setReqFlowInput(struct.reqFlow?.toString() || '0');
        setRiceAreaInput(struct.riceArea?.toString() || '0');"""
content = content.replace(load_code, new_load_code)

# 4. Save state 
save_code = """                              length: parseFloat(canalLengthInput) || 0,
                              riceArea: parseFloat(riceAreaInput) || 0,"""
new_save_code = """                              length: parseFloat(canalLengthInput) || 0,
                              flowCalcMethod: flowCalcMethodInput,
                              reqFlow: parseFloat(reqFlowInput) || 0,
                              riceArea: parseFloat(riceAreaInput) || 0,"""
content = content.replace(save_code, new_save_code)

# 5. Insert UI
ui_code = """              <PropertyRow label="Lý trình">
                <div className="flex items-center w-full bg-white">
                  <input 
                    type="text" 
                    className="flex-1 px-2 py-1 text-[11px] outline-none text-black" 
                    value={chainageInput}
                    onChange={(e) => setChainageInput(e.target.value)}
                  />
                  <button 
                    className={`px-1.5 py-1 transition-colors border-l border-slate-200 ${pickingChainageTarget === 'single' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'}`}
                    title="Pick điểm trên biểu đồ"
                    onClick={() => {
                      if (pickingChainageTarget === 'single') {
                        setPickingChainageTarget(null);
                        setPickingStructureId(null);
                      } else {
                        setPickingChainageTarget('single');
                        setPickingStructureId(selectedStructureId);
                      }
                    }}
                  >
                    <Hand size={14} />
                  </button>
                </div>
              </PropertyRow>"""
new_ui_code = ui_code + """
              <PropertyRow label="PP tính lưu lượng">
                <select
                  className="w-full px-2 py-1 text-[11px] outline-none bg-white text-black"
                  value={flowCalcMethodInput}
                  onChange={(e) => setFlowCalcMethodInput(e.target.value)}
                >
                  <option value="tinh_toan">Tính toán</option>
                  <option value="nhap_gia_tri">Nhập giá trị</option>
                </select>
              </PropertyRow>
              {flowCalcMethodInput === 'nhap_gia_tri' && (
                <PropertyRow label="Lưu lượng yêu cầu">
                  <div className="flex items-center w-full bg-white pr-2 border-r border-transparent">
                    <input 
                      type="number" 
                      className="flex-1 px-2 py-1 text-[11px] outline-none text-black" 
                      value={reqFlowInput}
                      onChange={(e) => setReqFlowInput(e.target.value)}
                    />
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">m³/s</span>
                  </div>
                </PropertyRow>
              )}"""

content = content.replace(ui_code, new_ui_code)

with open("src/components/DesignFullscreenModal.tsx", "w") as f:
    f.write(content)

print("Patched modal flow inputs")
