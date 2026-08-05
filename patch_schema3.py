import sys
import re

with open("prisma/schema.prisma", "r") as f:
    content = f.read()

content = re.sub(r'headLoss\s+Float\?', 'headLoss    Float?\n  inletLoss   Float?\n  outletLoss  Float?\n  frictionLoss Float?', content)

with open("prisma/schema.prisma", "w") as f:
    f.write(content)
