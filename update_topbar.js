const fs = require('fs');
let content = fs.readFileSync('src/components/Topbar.tsx', 'utf8');

// Add state for grid menu and accesses
content = content.replace(
  "const [userMenuOpen, setUserMenuOpen] = useState(false)",
  "const [userMenuOpen, setUserMenuOpen] = useState(false)\n  const [gridMenuOpen, setGridMenuOpen] = useState(false)\n  const [userAccesses, setUserAccesses] = useState<any[]>([])"
);

// Add ref for grid menu
content = content.replace(
  "const userMenuRef = useRef<HTMLDivElement>(null)",
  "const userMenuRef = useRef<HTMLDivElement>(null)\n  const gridMenuRef = useRef<HTMLDivElement>(null)"
);

// Add useEffect to fetch accesses
const fetchEffect = `
  useEffect(() => {
    if (currentUser?.id) {
      fetch(\`/api/user/access?userId=\${currentUser.id}\`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setUserAccesses(data)
          }
        })
        .catch(console.error)
    }
  }, [currentUser])
`;
content = content.replace("useEffect(() => {\n    const savedUser = localStorage.getItem('currentUser')", fetchEffect + "\n  useEffect(() => {\n    const savedUser = localStorage.getItem('currentUser')");

// Update click outside logic
content = content.replace(
  "if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {\n        setUserMenuOpen(false)\n      }",
  "if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {\n        setUserMenuOpen(false)\n      }\n      if (gridMenuRef.current && !gridMenuRef.current.contains(e.target as Node)) {\n        setGridMenuOpen(false)\n      }"
);

// Replace grid button with dropdown wrapper
const gridButtonCode = `
        {/* Grid Menu */}
        <div className="relative" ref={gridMenuRef}>
          <button 
            onClick={() => setGridMenuOpen(!gridMenuOpen)}
            className={\`w-10 h-10 flex items-center justify-center rounded-lg transition-colors \${gridMenuOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-200'}\`}
          >
            <i className="bi bi-grid-3x3-gap text-lg" />
          </button>
          
          {gridMenuOpen && (
            <div className="absolute top-[110%] right-0 w-[480px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">Quản lý trực tiếp</h3>
                <p className="text-xs text-slate-500 mt-0.5">Chuyển nhanh sang các bộ phận được cấp quyền</p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3 max-h-[400px] overflow-auto">
                {userAccesses.length > 0 ? (
                  userAccesses.map((acc, idx) => (
                    <button 
                      key={idx} 
                      className="flex flex-col items-center justify-center text-center p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all gap-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <i className="bi bi-box text-xl" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-800">{acc.department?.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{acc.accessLevel === 2 ? 'Toàn quyền' : 'Chỉ xem'}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 py-8 text-center text-slate-500 text-sm">
                    Bạn chưa được cấp quyền truy cập bộ phận nào.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
`;

content = content.replace(
  /<button className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-200 transition-colors">\s*<i className="bi bi-grid-3x3-gap text-lg" \/>\s*<\/button>/,
  gridButtonCode
);

fs.writeFileSync('src/components/Topbar.tsx', content);
