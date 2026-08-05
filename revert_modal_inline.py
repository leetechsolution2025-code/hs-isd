import sys

with open("src/components/DesignFullscreenModal.tsx", "r") as f:
    content = f.read()

target = """              </PropertyRow>

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
              
if target in content:
    content = content.replace(target, "              </PropertyRow>")
    with open("src/components/DesignFullscreenModal.tsx", "w") as f:
        f.write(content)
    print("Reverted inline structure panel")
else:
    print("Target not found for revert")
