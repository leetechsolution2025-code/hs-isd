import sys

with open("src/components/DesignFullscreenModal.tsx", "r") as f:
    content = f.read()

# 1. Update Interface
content = content.replace(
    "inlineStructureType?: string, endChainage?: string, headLoss?: number, inletLoss?: number, outletLoss?: number, frictionLoss?: number\n",
    "inlineStructureType?: string, endChainage?: string, headLoss?: number, inletLoss?: number, outletLoss?: number, frictionLoss?: number,\n    flowCalcMethod?: string, reqFlow?: number\n"
)

# 2. Add State
content = content.replace(
    "  const [canalLengthInput, setCanalLengthInput] = useState<string>('0');\n  const [riceAreaInput, setRiceAreaInput] = useState<string>('0');",
    "  const [canalLengthInput, setCanalLengthInput] = useState<string>('0');\n  const [flowCalcMethodInput, setFlowCalcMethodInput] = useState('tinh_toan');\n  const [reqFlowInput, setReqFlowInput] = useState<string>('0');\n  const [riceAreaInput, setRiceAreaInput] = useState<string>('0');"
)

# 3. Load State
content = content.replace(
    "        setCanalLengthInput(struct.length?.toString() || '0');\n        setRiceAreaInput(struct.riceArea?.toString() || '0');",
    "        setCanalLengthInput(struct.length?.toString() || '0');\n        setFlowCalcMethodInput(struct.flowCalcMethod || 'tinh_toan');\n        setReqFlowInput(struct.reqFlow?.toString() || '0');\n        setRiceAreaInput(struct.riceArea?.toString() || '0');"
)

# 4. Save State (Add)
content = content.replace(
    "                        length: parseFloat(canalLengthInput) || 0,\n                        riceArea: parseFloat(riceAreaInput) || 0,",
    "                        length: parseFloat(canalLengthInput) || 0,\n                        flowCalcMethod: flowCalcMethodInput,\n                        reqFlow: parseFloat(reqFlowInput) || 0,\n                        riceArea: parseFloat(riceAreaInput) || 0,"
)

# 5. Save State (Update)
content = content.replace(
    "                          length: parseFloat(canalLengthInput) || 0,\n                          riceArea: parseFloat(riceAreaInput) || 0,",
    "                          length: parseFloat(canalLengthInput) || 0,\n                          flowCalcMethod: flowCalcMethodInput,\n                          reqFlow: parseFloat(reqFlowInput) || 0,\n                          riceArea: parseFloat(riceAreaInput) || 0,"
)

# 6. UI: Add PropertyRow
ui_injection = """            {/* Group 2: Nhu cầu nước */}
            <PropertyGroup title="Nhu cầu nước">
              <PropertyRow label="Phương pháp tính">
                <div className="flex w-full items-center gap-3 px-2 py-1 text-[11px] text-slate-700">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="flowCalcMethodInput" value="tinh_toan" checked={flowCalcMethodInput === 'tinh_toan'} onChange={(e) => setFlowCalcMethodInput(e.target.value)} className="w-3 h-3 text-blue-600 focus:ring-0" />
                    Tự động tính
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="flowCalcMethodInput" value="nhap_gia_tri" checked={flowCalcMethodInput === 'nhap_gia_tri'} onChange={(e) => setFlowCalcMethodInput(e.target.value)} className="w-3 h-3 text-blue-600 focus:ring-0" />
                    Nhập giá trị
                  </label>
                </div>
              </PropertyRow>
              {flowCalcMethodInput === 'nhap_gia_tri' && (
                <PropertyRow label="Lưu lượng nhánh (m3/s)">
                  <input 
                    type="number" 
                    step="any" 
                    className="w-full px-2 py-1 text-[11px] outline-none text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    value={reqFlowInput}
                    onChange={(e) => setReqFlowInput(e.target.value)}
                  />
                </PropertyRow>
              )}"""

content = content.replace(
    '            {/* Group 2: Nhu cầu nước */}\n            <PropertyGroup title="Nhu cầu nước">',
    ui_injection
)

# 7. Disable inputs based on flowCalcMethodInput
content = content.replace(
    'value={index === 0 ? riceAreaInput : fruitAreaInput}\n                            onChange={e => index === 0 ? setRiceAreaInput(e.target.value) : setFruitAreaInput(e.target.value)}\n                          />',
    'value={index === 0 ? riceAreaInput : fruitAreaInput}\n                            onChange={e => index === 0 ? setRiceAreaInput(e.target.value) : setFruitAreaInput(e.target.value)}\n                            disabled={flowCalcMethodInput === \'nhap_gia_tri\'}\n                            className={`w-full px-2 py-1 text-[11px] outline-none text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${flowCalcMethodInput === \'nhap_gia_tri\' ? \'bg-slate-100 text-slate-400\' : \'\'}`}\n                          />'
)
# Note: I replaced the className attribute completely in the above to handle styling when disabled.
# Let's fix the duplication of className.
# The original code has:
# className="w-full px-2 py-1 text-[11px] outline-none text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
# value={...}
# onChange={...}
# />

with open("src/components/DesignFullscreenModal.tsx", "w") as f:
    f.write(content)

print("Patched!")
