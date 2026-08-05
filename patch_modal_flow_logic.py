import sys

with open("src/components/DesignFullscreenModal.tsx", "r") as f:
    content = f.read()

target = """        ...struct,
        totalArea,
        canalType,
        permeability,
        efficiency,
        totalFlow
      };
    });"""

replacement = """        ...struct,
        totalArea,
        canalType,
        permeability,
        efficiency,
        totalFlow: struct.flowCalcMethod === 'nhap_gia_tri' ? (Number(struct.reqFlow) || 0) : totalFlow
      };
    });"""

content = content.replace(target, replacement)

with open("src/components/DesignFullscreenModal.tsx", "w") as f:
    f.write(content)
