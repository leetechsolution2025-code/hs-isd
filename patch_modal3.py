import sys

with open("src/components/DesignFullscreenModal.tsx", "r") as f:
    content = f.read()

old_reset = """                            setInlineStructureLossInput(struct.headLoss?.toString() || '');
                            setInlineInletLoss('');
                            setInlineOutletLoss('');
                            setInlineFrictionLoss('');
                            setShowInlineLossDetails(false);"""

new_reset = """                            setInlineStructureLossInput(struct.headLoss?.toString() || '');
                            setInlineInletLoss(struct.inletLoss?.toString() || '');
                            setInlineOutletLoss(struct.outletLoss?.toString() || '');
                            setInlineFrictionLoss(struct.frictionLoss?.toString() || '');
                            setShowInlineLossDetails(false);"""

if old_reset in content:
    content = content.replace(old_reset, new_reset)
else:
    print("Failed to find reset logic")

with open("src/components/DesignFullscreenModal.tsx", "w") as f:
    f.write(content)
print("Success")
