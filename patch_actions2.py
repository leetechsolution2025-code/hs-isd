import sys

with open("src/app/actions.ts", "r") as f:
    content = f.read()

if "headLoss: s.headLoss," in content:
    content = content.replace(
        "headLoss: s.headLoss,",
        "headLoss: s.headLoss,\n          inletLoss: s.inletLoss,\n          outletLoss: s.outletLoss,\n          frictionLoss: s.frictionLoss,"
    )

with open("src/app/actions.ts", "w") as f:
    f.write(content)
print("Success")
