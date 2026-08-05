const fs = require('fs');
const file = '/Users/leanhvan/hd-isd/src/components/ProjectCreateOffcanvas.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'onSuccess?: () => void;\n}',
  'onSuccess?: () => void;\n  editProject?: any;\n}'
);

content = content.replace(
  'export default function ProjectCreateOffcanvas({ isOpen, onClose, phases, users = [], onSuccess }: ProjectCreateOffcanvasProps) {',
  'export default function ProjectCreateOffcanvas({ isOpen, onClose, phases, users = [], onSuccess, editProject }: ProjectCreateOffcanvasProps) {\n  const isEditing = !!editProject;\n  const [initialCrops, setInitialCrops] = useState<any[]>([]);'
);

content = content.replace(
  'useEffect(() => {\n    if (isOpen) {\n      setTimeout(() => setShow(true), 10);\n    } else {\n      setShow(false);\n    }\n  }, [isOpen]);',
  `useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShow(true), 10);
      if (editProject) {
        setSlide(editProject.type === 'CANAL' ? 'canals' : 'headworks');
        if (editProject.cropCount) {
          setCropCount(editProject.cropCount);
          try {
            if (editProject.irrigationCoefficient) {
              const crops = JSON.parse(editProject.irrigationCoefficient);
              setInitialCrops(crops);
            }
          } catch(e) {}
        }
      }
    } else {
      setShow(false);
      setTimeout(() => {
        setSlide('headworks');
        setCropCount(0);
        setInitialCrops([]);
      }, 300);
    }
  }, [isOpen, editProject]);`
);

content = content.replace(
  'toast.success("Đã tạo dự án thành công: " + res.project.code);',
  'toast.success((isEditing ? "Đã cập nhật dự án: " : "Đã tạo dự án thành công: ") + res.project.code);'
);

content = content.replace(
  '<h2 className="text-lg font-bold text-slate-800">Thêm dự án mới</h2>',
  '<h2 className="text-lg font-bold text-slate-800">{isEditing ? "Cập nhật dự án" : "Thêm dự án mới"}</h2>'
);

// Slide 1 replacements
content = content.replace(
  '<form action={handleSubmit} id="form-headworks" className="space-y-4 flex-1 flex flex-col">',
  '<form key={editProject?.id || "new-headworks"} action={handleSubmit} id="form-headworks" className="space-y-4 flex-1 flex flex-col">\n{isEditing && <input type="hidden" name="id" value={editProject.id} />}'
);

content = content.replace(
  'name="name" required type="text"',
  'name="name" defaultValue={editProject?.name} required type="text"'
);

content = content.replace(
  'name="category" type="text"',
  'name="category" defaultValue={editProject?.category} type="text"'
);

content = content.replace(
  'AutocompleteInput name="location" options={VIETNAM_PROVINCES}',
  'AutocompleteInput name="location" defaultValue={editProject?.location} options={VIETNAM_PROVINCES}'
);

content = content.replace(
  'select name="phaseId" className="',
  'select name="phaseId" defaultValue={editProject?.phaseId || ""} className="'
);

content = content.replace(
  'name="summary" rows={4}',
  'name="summary" defaultValue={editProject?.summary} rows={4}'
);

// Slide 2 replacements
content = content.replace(
  '<form action={handleSubmit} id="form-canals" className="space-y-4 flex-1 flex flex-col">',
  '<form key={editProject?.id || "new-canals"} action={handleSubmit} id="form-canals" className="space-y-4 flex-1 flex flex-col">\n{isEditing && <input type="hidden" name="id" value={editProject.id} />}'
);

content = content.replace(
  'name="name" required type="text"',
  'name="name" defaultValue={editProject?.name} required type="text"'
);

content = content.replace(
  'name="category" type="text"',
  'name="category" defaultValue={editProject?.category} type="text"'
);

content = content.replace(
  'AutocompleteInput name="location" options={VIETNAM_PROVINCES}',
  'AutocompleteInput name="location" defaultValue={editProject?.location} options={VIETNAM_PROVINCES}'
);

content = content.replace(
  'select name="phaseId" className="',
  'select name="phaseId" defaultValue={editProject?.phaseId || ""} className="'
);

content = content.replace(
  'name="createdAt" defaultValue={new Date().toISOString().split(\'T\')[0]}',
  'name="createdAt" defaultValue={editProject?.createdAt ? new Date(editProject.createdAt).toISOString().split(\'T\')[0] : new Date().toISOString().split(\'T\')[0]}'
);

content = content.replace(
  'name="investor" type="text"',
  'name="investor" defaultValue={editProject?.investor} type="text"'
);

content = content.replace(
  'name="canalType" value="open" className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" defaultChecked',
  'name="canalType" value="open" className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" disabled={isEditing} defaultChecked={!isEditing || editProject?.canalType === "open"}'
);

content = content.replace(
  'name="canalType" value="pipe" className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"',
  'name="canalType" value="pipe" className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" disabled={isEditing} defaultChecked={isEditing && editProject?.canalType === "pipe"}'
);

content = content.replace(
  'AutocompleteInput name="managerName" options={users.map((u: any) => u.fullName)}',
  'AutocompleteInput name="managerName" defaultValue={users.find((u: any) => u.id === editProject?.managerId)?.fullName} options={users.map((u: any) => u.fullName)}'
);

content = content.replace(
  'name="cropCount" \n                      type="number"',
  'name="cropCount" disabled={isEditing}\n                      type="number"'
);

content = content.replace(
  'name={`cropName_${i}`} type="text"',
  'name={`cropName_${i}`} disabled={isEditing} defaultValue={initialCrops[i]?.name} type="text"'
);

content = content.replace(
  'name={`cropCoef_${i}`} type="number"',
  'name={`cropCoef_${i}`} disabled={isEditing} defaultValue={initialCrops[i]?.coef} type="number"'
);

content = content.replace(
  'name="summary" rows={4}',
  'name="summary" defaultValue={editProject?.summary} rows={4}'
);

content = content.replace(
  'Lưu dự án\n          </button>',
  '{isEditing ? "Cập nhật" : "Lưu dự án"}\n          </button>'
);

fs.writeFileSync(file, content);
console.log('Update complete');
