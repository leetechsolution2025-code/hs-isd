import sys

with open("src/components/DesignFullscreenModal.tsx", "r") as f:
    content = f.read()

# Update headers
old_header = """                      <th colSpan={4} className="px-3 py-2 border-r border-slate-200 border-b border-slate-200 bg-[#fafafa]">Cao độ</th>"""
new_header = """                      <th colSpan={5} className="px-3 py-2 border-r border-slate-200 border-b border-slate-200 bg-[#fafafa]">Cao độ</th>"""
content = content.replace(old_header, new_header)

old_sub = """                      <th className="px-3 py-2 border-r border-slate-200 bg-[#fafafa]">Nhỏ nhất</th>
                      <th className="px-3 py-2 border-r border-slate-200 bg-[#fafafa]">Đáy kênh</th>
                      <th className="px-3 py-2 border-r border-slate-200 bg-[#fafafa]">Htk</th>"""
new_sub = """                      <th className="px-3 py-2 border-r border-slate-200 bg-[#fafafa]">Nhỏ nhất</th>
                      <th className="px-3 py-2 border-r border-slate-200 bg-[#fafafa]">Mặt đất</th>
                      <th className="px-3 py-2 border-r border-slate-200 bg-[#fafafa]">Đáy kênh</th>
                      <th className="px-3 py-2 border-r border-slate-200 bg-[#fafafa]">Htk</th>"""
content = content.replace(old_sub, new_sub)

# Update data rows
# Find where h_min is rendered and dayStr is rendered
old_td = """                          <td className={`px-3 py-1.5 text-center border-r border-slate-100 ${isDesigned ? 'text-slate-700' : 'text-slate-300'}`}>{h_min}</td>
                          <td className={`px-3 py-1.5 text-center border-r border-slate-100 ${isFirstNode && controlElevationType === 'day' && controlElevationValue ? 'font-bold text-red-600' : (dayStr !== '-' ? 'text-slate-700' : 'text-slate-300')}`}>
                            {dayStr}
                          </td>"""

new_td = """                          <td className={`px-3 py-1.5 text-center border-r border-slate-100 ${isDesigned ? 'text-slate-700' : 'text-slate-300'}`}>{h_min}</td>
                          <td className={`px-3 py-1.5 text-center border-r border-slate-100 ${terrainElevationStr !== '-' ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>
                            {terrainElevationStr}
                          </td>
                          <td className={`px-3 py-1.5 text-center border-r border-slate-100 ${isFirstNode && controlElevationType === 'day' && controlElevationValue ? 'font-bold text-red-600' : (dayStr !== '-' ? 'text-slate-700' : 'text-slate-300')}`}>
                            {dayStr}
                          </td>"""

content = content.replace(old_td, new_td)

# Now we need to define terrainElevationStr in the loop
old_calc = """                      const yeuCauStr = node.type === 'branch' && node.reqWaterLevel ? node.reqWaterLevel.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, '') : '-';"""

new_calc = """                      const yeuCauStr = node.type === 'branch' && node.reqWaterLevel ? node.reqWaterLevel.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, '') : '-';
                      
                      // Find terrain elevation for this chainage
                      let terrainElevationStr = '-';
                      if (terrainData && terrainData.length > 0) {
                        const tNode = terrainData.find(t => Math.abs(Number(t.lyTrinh) - (node.chainage || 0)) < 0.1);
                        if (tNode) {
                          terrainElevationStr = Number(tNode.caoDo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, '');
                        }
                      }"""

content = content.replace(old_calc, new_calc)

# Update empty row colSpan from 13 to 14
old_empty = """                            {Array.from({ length: 13 }).map((_, i) => {"""
new_empty = """                            {Array.from({ length: 14 }).map((_, i) => {"""
content = content.replace(old_empty, new_empty)

old_colspan = """                          <td colSpan={13} className="px-3 py-2 text-left font-semibold text-slate-700">"""
new_colspan = """                          <td colSpan={14} className="px-3 py-2 text-left font-semibold text-slate-700">"""
content = content.replace(old_colspan, new_colspan)

old_empty_td_border = """                              let className = `px-3 py-1.5 text-center ${i < 12 ? 'border-r border-slate-100' : ''}`;"""
new_empty_td_border = """                              let className = `px-3 py-1.5 text-center ${i < 13 ? 'border-r border-slate-100' : ''}`;"""
content = content.replace(old_empty_td_border, new_empty_td_border)

with open("src/components/DesignFullscreenModal.tsx", "w") as f:
    f.write(content)
print("Success patch main table")
