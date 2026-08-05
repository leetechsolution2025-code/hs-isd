import sys

with open("src/components/DesignFullscreenModal.tsx", "r") as f:
    content = f.read()

# 1. Update processedBranches logic
old_calc = """      let totalFlow = 0;
      if (efficiency > 0) {"""
new_calc = """      let totalFlow = 0;
      if (struct.flowCalcMethod === 'nhap_gia_tri') {
        totalFlow = Number(struct.reqFlow) || 0;
      } else if (efficiency > 0) {"""
content = content.replace(old_calc, new_calc)

# 2. Add reqFlow and flowCalcMethod to the Add/Edit actions
old_add = """                        chainage: chainageInput,
                        length: parseFloat(canalLengthInput) || 0,
                        riceArea: parseFloat(riceAreaInput) || 0,"""
new_add = """                        chainage: chainageInput,
                        length: parseFloat(canalLengthInput) || 0,
                        flowCalcMethod: flowCalcMethodInput,
                        reqFlow: parseFloat(reqFlowInput) || 0,
                        riceArea: parseFloat(riceAreaInput) || 0,"""
content = content.replace(old_add, new_add)

with open("src/components/DesignFullscreenModal.tsx", "w") as f:
    f.write(content)
print("Patched flow calculations")
