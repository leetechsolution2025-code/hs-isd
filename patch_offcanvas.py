import sys

with open("src/components/TerrainDataOffcanvas.tsx", "r") as f:
    content = f.read()

# Add initialData to props
old_props = """interface TerrainDataOffcanvasProps {
  isOpen: boolean
  onClose: () => void
  onUpdate?: (data: any[]) => void
}"""
new_props = """interface TerrainDataOffcanvasProps {
  isOpen: boolean
  onClose: () => void
  onUpdate?: (data: any[]) => void
  initialData?: any[]
}"""

content = content.replace(old_props, new_props)

old_comp = """export default function TerrainDataOffcanvas({
  isOpen,
  onClose,
  onUpdate
}: TerrainDataOffcanvasProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [terrainData, setTerrainData] = useState<any[]>([]);"""
new_comp = """export default function TerrainDataOffcanvas({
  isOpen,
  onClose,
  onUpdate,
  initialData = []
}: TerrainDataOffcanvasProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [terrainData, setTerrainData] = useState<any[]>(initialData);

  React.useEffect(() => {
    if (isOpen) {
      setTerrainData(initialData);
    }
  }, [isOpen, initialData]);"""

content = content.replace(old_comp, new_comp)

with open("src/components/TerrainDataOffcanvas.tsx", "w") as f:
    f.write(content)
print("Success patch offcanvas")
