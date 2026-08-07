"use server"
// Force rebuild 1

import prisma from '@/lib/db'

export async function saveProject(projectId: string | null, nodes: any[], edges: any[]) {
  try {
    let id = projectId
    if (!id) {
      // Create a default project if none exists
      const newProject = await prisma.project.create({
        data: { 
          name: 'My Irrigation Design',
          code: 'DA-TMP-' + Date.now(),
          type: 'CANAL'
        }
      })
      id = newProject.id
    }

    // Clear existing nodes/edges for this project (simple overwrite for now)
    await prisma.node.deleteMany({ where: { projectId: id } })
    await prisma.edge.deleteMany({ where: { projectId: id } })

    // Save new nodes
    if (nodes.length > 0) {
      await prisma.node.createMany({
        data: nodes.map(n => ({
          id: n.id,
          projectId: id as string,
          type: n.type || 'default',
          positionX: n.position.x,
          positionY: n.position.y,
          data: JSON.stringify(n.data)
        }))
      })
    }

    // Save new edges
    if (edges.length > 0) {
      await prisma.edge.createMany({
        data: edges.map(e => ({
          id: e.id,
          projectId: id as string,
          source: e.source,
          target: e.target,
          data: JSON.stringify(e.data || {})
        }))
      })
    }

    return { success: true, projectId: id }
  } catch (error) {
    console.error("Error saving project:", error)
    return { success: false, error: 'Failed to save project' }
  }
}

export async function createProject(formData: FormData) {
  try {
    const type = formData.get('type') as string
    const name = formData.get('name') as string
    
    if (!name) {
      return { success: false, error: 'Tên dự án/công trình là bắt buộc' }
    }

    const category = (formData.get('category') as string) || null
    const location = (formData.get('location') as string) || null
    const phaseId = (formData.get('phaseId') as string) || null
    const summary = (formData.get('summary') as string) || null

    let investor = null
    let canalType = null
    let irrigationCoefficient = null
    let cropCount = null
    let managerId = null
    let createdAt = undefined

    if (type === 'CANAL') {
      investor = (formData.get('investor') as string) || null
      canalType = (formData.get('canalType') as string) || null
      
      const cc = formData.get('cropCount') as string
      if (cc) cropCount = parseInt(cc, 10)

      if (cropCount && cropCount > 0) {
        const crops = []
        for (let i = 0; i < cropCount; i++) {
          const name = formData.get(`cropName_${i}`) as string
          const coef = formData.get(`cropCoef_${i}`) as string
          if (name || coef) {
            crops.push({ name: name || '', coef: coef ? parseFloat(coef) : null })
          }
        }
        if (crops.length > 0) {
          irrigationCoefficient = JSON.stringify(crops)
        }
      }
      
      const managerName = formData.get('managerName') as string
      if (managerName) {
        const user = await prisma.user.findFirst({ where: { fullName: managerName }})
        if (user) {
          managerId = user.id
        }
      }

      const dateStr = formData.get('createdAt') as string
      if (dateStr) {
        createdAt = new Date(dateStr)
      }
    }

    const id = formData.get('id') as string

    if (id) {
      const project = await prisma.project.update({
        where: { id },
        data: {
          name,
          category,
          location,
          phaseId,
          investor,
          canalType,
          cropCount,
          irrigationCoefficient,
          managerId,
          summary,
          ...(createdAt && { createdAt })
        }
      })
      return { success: true, project }
    } else {
      // Generate code: DA-0001
      const lastProject = await prisma.project.findFirst({
        orderBy: { code: 'desc' },
        select: { code: true }
      })
      
      let nextCode = 'DA-0001'
      if (lastProject && lastProject.code && lastProject.code.startsWith('DA-')) {
        const numPart = parseInt(lastProject.code.replace('DA-', ''), 10)
        if (!isNaN(numPart)) {
          nextCode = `DA-${(numPart + 1).toString().padStart(4, '0')}`
        }
      }

      const project = await prisma.project.create({
        data: {
          code: nextCode,
          name,
          type,
          category,
          location,
          phaseId,
          investor,
          canalType,
          cropCount,
          irrigationCoefficient,
          managerId,
          summary,
          ...(createdAt && { createdAt })
        }
      })
      return { success: true, project }
    }
  } catch (error: any) {
    console.error("Create project error:", error)
    return { success: false, error: error.message }
  }
}

export async function getProjects() {
  try {
    return await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { phase: true }
    })
  } catch (error) {
    console.error("Error getting projects:", error)
    return []
  }
}

export async function loadProject(projectId?: string) {
  try {
    let project = null
    if (projectId) {
      project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { nodes: true, edges: true }
      })
    } else {
      // Just grab the most recently updated one
      project = await prisma.project.findFirst({
        orderBy: { updatedAt: 'desc' },
        include: { nodes: true, edges: true }
      })
    }

    if (!project) return null

    return {
      id: project.id,
      name: project.name,
      nodes: project.nodes.map(n => ({
        id: n.id,
        type: n.type,
        position: { x: n.positionX, y: n.positionY },
        data: JSON.parse(n.data)
      })),
      edges: project.edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        data: JSON.parse(e.data)
      }))
    }
  } catch (error) {
    console.error("Error loading project:", error)
    return null
  }
}

export async function authenticateUser(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: 'Vui lòng nhập đầy đủ email và mật khẩu' }
  }

  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { department: true }
    })
    
    if (!user) {
      return { success: false, error: 'Tài khoản không tồn tại' }
    }

    const bcrypt = await import('bcryptjs')
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return { success: false, error: 'Mật khẩu không chính xác' }
    }

    return { 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        departmentName: user.department?.name
      }
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { success: false, error: 'Đã có lỗi xảy ra trong quá trình đăng nhập' }
  }
}

export async function getCompanyInfo() {
  try {
    let company = await prisma.company.findFirst()
    
    // If no company exists, create default one
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'CÔNG TY CỔ PHẦN TƯ VẤN XÂY DỰNG THUỶ LỢI VÀ CƠ SỞ HẠ TẦNG HẢI DƯƠNG',
          taxCode: '0800000672',
          taxAddress: 'Số 18 Phố Đỗ Ngọc Du, Phường Lê Thanh Nghị, TP Hải Dương, Việt Nam',
          address: 'Số 18 Phố Đỗ Ngọc Du, Phường Lê Thanh Nghị, Thành phố Hải Dương, Việt Nam',
          slogan: 'Giải pháp tư vấn toàn diện, nền tảng cho những công trình thủy lợi trường tồn.',
          internationalName: 'THE HYDRAULIC AND INFRASTURE CONSULTANT HAI DUONG JOINT STOCK COMPANY',
          shortName: 'CÔNG TY CP TƯ VẤN XDTL VÀ CSHT HẢI DƯƠNG',
          representative: 'NGUYỄN XUÂN TÀI',
          logoUrl: null
        }
      })
    }
    
    return company
  } catch (error) {
    console.error("Error getting company info:", error)
    return null
  }
}

export async function updateCompanyInfo(data: any) {
  try {
    const existing = await prisma.company.findFirst()
    if (!existing) {
      return { success: false, error: 'Company info not found' }
    }

    const updated = await prisma.company.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        taxCode: data.taxCode,
        taxAddress: data.taxAddress,
        address: data.address,
        slogan: data.slogan,
        internationalName: data.internationalName,
        shortName: data.shortName,
        representative: data.representative,
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl })
      }
    })

    return { success: true, company: updated }
  } catch (error) {
    console.error("Error updating company info:", error)
    return { success: false, error: 'Failed to update company info' }
  }
}

// --- CATEGORY ACTIONS ---

export async function getCategoryGroups() {
  try {
    return await prisma.categoryGroup.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: {
          select: { categories: true }
        }
      }
    })
  } catch (error) {
    console.error("Error getting category groups:", error)
    return []
  }
}

export async function createCategoryGroup(name: string) {
  try {
    // get max order index
    const last = await prisma.categoryGroup.findFirst({
      orderBy: { orderIndex: 'desc' }
    })
    const group = await prisma.categoryGroup.create({
      data: { 
        name,
        orderIndex: last ? last.orderIndex + 1 : 1
      }
    })
    return { success: true, group }
  } catch (error) {
    return { success: false, error: 'Failed to create group' }
  }
}

export async function updateCategoryGroup(id: string, name: string) {
  try {
    const group = await prisma.categoryGroup.update({
      where: { id },
      data: { name }
    })
    return { success: true, group }
  } catch (error) {
    return { success: false, error: 'Failed to update group' }
  }
}

export async function deleteCategoryGroups(ids: string[]) {
  try {
    await prisma.categoryGroup.deleteMany({
      where: { id: { in: ids } }
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete groups' }
  }
}

export async function getCategories(groupId: string, parentId: string | null = null) {
  try {
    const data = await prisma.category.findMany({
      where: { groupId, parentId },
      orderBy: { orderIndex: 'asc' },
      include: { children: true }
    })
    console.log("getCategories returned:", data.length, "items for parentId:", parentId);
    return data;
  } catch (error) {
    console.error("Error getting categories:", error)
    return []
  }
}

export async function getCategoriesByGroupName(groupName: string) {
  try {
    const group = await prisma.categoryGroup.findFirst({
      where: { name: groupName }
    })
    if (!group) return []
    
    return await prisma.category.findMany({
      where: { groupId: group.id, isActive: true },
      orderBy: { orderIndex: 'asc' }
    })
  } catch (error) {
    console.error("Error getting categories by group name:", error)
    return []
  }
}

export async function createCategory(data: { groupId: string, parentId?: string | null, name: string, orderIndex?: number, isActive?: boolean, metadata?: string }) {
  try {
    let orderIndex = data.orderIndex
    if (orderIndex === undefined) {
      const last = await prisma.category.findFirst({
        where: { groupId: data.groupId },
        orderBy: { orderIndex: 'desc' }
      })
      orderIndex = last ? last.orderIndex + 1 : 1
    }

    const category = await prisma.category.create({
      data: {
        groupId: data.groupId,
        parentId: data.parentId || null,
        name: data.name,
        orderIndex,
        isActive: data.isActive !== undefined ? data.isActive : true,
        metadata: data.metadata
      }
    })
    return { success: true, category }
  } catch (error) {
    return { success: false, error: 'Failed to create category' }
  }
}

export async function updateCategory(id: string, data: { name?: string, orderIndex?: number, isActive?: boolean, metadata?: string }) {
  try {
    const category = await prisma.category.update({
      where: { id },
      data
    })
    return { success: true, category }
  } catch (error) {
    return { success: false, error: 'Failed to update category' }
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({
      where: { id }
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete category' }
  }
}

// --- USER ACTIONS ---

export async function getUsers() {
  try {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        department: true,
        level: true,
        employeeType: true,
        contractType: true,
      }
    })
  } catch (error) {
    console.error("Error getting users:", error)
    return []
  }
}

export async function createUser(data: any) {
  try {
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash(data.password || 'Pass@123', 10)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        employeeCode: data.employeeCode,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        idCardNumber: data.idCardNumber,
        idCardIssueDate: data.idCardIssueDate ? new Date(data.idCardIssueDate) : null,
        hometown: data.hometown,
        permanentAddress: data.permanentAddress,
        
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelation: data.emergencyContactRelation,
        
        departmentId: data.departmentId || null,
        levelId: data.levelId || null,
        employeeTypeId: data.employeeTypeId || null,
        contractTypeId: data.contractTypeId || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        workLocation: data.workLocation,
        contractNumber: data.contractNumber,
        contractSignDate: data.contractSignDate ? new Date(data.contractSignDate) : null,
        contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : null,
        socialInsuranceNumber: data.socialInsuranceNumber,
        taxCode: data.taxCode,
        isPayingInsurance: data.isPayingInsurance,
        
        baseSalary: data.baseSalary ? Number(data.baseSalary) : null,
        lunchAllowance: data.lunchAllowance ? Number(data.lunchAllowance) : null,
        fuelAllowance: data.fuelAllowance ? Number(data.fuelAllowance) : null,
        phoneAllowance: data.phoneAllowance ? Number(data.phoneAllowance) : null,
        seniorityAllowance: data.seniorityAllowance ? Number(data.seniorityAllowance) : null,
        
        bankAccountNumber: data.bankAccountNumber,
        bankName: data.bankName,
        bankBranch: data.bankBranch,
      }
    })
    return { success: true, user }
  } catch (error: any) {
    console.error("Create user error:", error)
    return { success: false, error: error.message }
  }
}

export async function updateUser(id: string, data: any) {
  try {

    let dataToUpdate = { ...data }
    if (data.password) {
      const bcrypt = await import('bcryptjs')
      dataToUpdate.password = await bcrypt.hash(data.password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        fullName: dataToUpdate.fullName,
        avatarUrl: dataToUpdate.avatarUrl,
        password: dataToUpdate.password,
        gender: dataToUpdate.gender,

        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        idCardNumber: data.idCardNumber,
        idCardIssueDate: data.idCardIssueDate ? new Date(data.idCardIssueDate) : null,
        hometown: data.hometown,
        permanentAddress: data.permanentAddress,
        
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelation: data.emergencyContactRelation,
        
        departmentId: data.departmentId || null,
        levelId: data.levelId || null,
        employeeTypeId: data.employeeTypeId || null,
        contractTypeId: data.contractTypeId || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        workLocation: data.workLocation,
        contractNumber: data.contractNumber,
        contractSignDate: data.contractSignDate ? new Date(data.contractSignDate) : null,
        contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : null,
        socialInsuranceNumber: data.socialInsuranceNumber,
        taxCode: data.taxCode,
        isPayingInsurance: data.isPayingInsurance,
        
        baseSalary: data.baseSalary ? Number(data.baseSalary) : null,
        lunchAllowance: data.lunchAllowance ? Number(data.lunchAllowance) : null,
        fuelAllowance: data.fuelAllowance ? Number(data.fuelAllowance) : null,
        phoneAllowance: data.phoneAllowance ? Number(data.phoneAllowance) : null,
        seniorityAllowance: data.seniorityAllowance ? Number(data.seniorityAllowance) : null,
        
        bankAccountNumber: data.bankAccountNumber,
        bankName: data.bankName,
        bankBranch: data.bankBranch,
      }
    })
    return { success: true, user }
  } catch (error: any) {
    console.error("Update user error:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({
      where: { id }
    })
    return { success: true }
  } catch (error: any) {
    console.error("Delete user error:", error)
    return { success: false, error: error.message }
  }
}

export async function deleteProjects(ids: string[]) {
  try {
    await prisma.project.deleteMany({
      where: { id: { in: ids } }
    });
    return { success: true };
  } catch (error: any) {
    console.error("Delete projects error:", error);
    return { success: false, error: error.message };
  }
}

export async function saveProjectDesignConfig(projectId: string, config: string) {
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { designConfig: config }
    });
    return { success: true };
  } catch (error: any) {
    console.error("Save design config error:", error);
    return { success: false, error: error.message };
  }
}

export async function saveLandmarkCoordinates(projectId: string, points: {name: string, x: number, y: number}[]) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.landmarkCoordinate.deleteMany({ where: { projectId } })
      
      if (points.length > 0) {
        await tx.landmarkCoordinate.createMany({
          data: points.map(p => ({
            projectId,
            name: p.name,
            x: p.x,
            y: p.y
          }))
        })
      }

      const proj = await tx.project.findUnique({ where: { id: projectId } })
      if (proj && (!proj.status || proj.status === 'chưa thực hiện')) {
        await tx.project.update({
          where: { id: projectId },
          data: { status: 'đang thực hiện' }
        })
      }
    })
    return { success: true }
  } catch (error: any) {
    console.error("Save landmarks error:", error)
    return { success: false, error: error.message }
  }
}

export async function getLandmarkCoordinates(projectId: string) {
  try {
    const coords = await prisma.landmarkCoordinate.findMany({
      where: { projectId }
    })
    return coords.map((c: any) => ({ name: c.name, x: c.x, y: c.y }))
  } catch (error) {
    console.error("Get landmarks error:", error)
    return []
  }
}

export async function saveCanalStructures(projectId: string, structures: any[]) {
  try {
    await prisma.canalStructure.deleteMany({ where: { projectId } })
    if (structures.length > 0) {
      await prisma.canalStructure.createMany({
        data: structures.map(s => ({
          id: s.id && !s.id.startsWith('temp_') ? s.id : (s.id && s.id.startsWith('temp_') ? s.id : undefined),
          projectId,
          name: s.name,
          x: s.x,
          y: s.y,
          angle: s.angle,
          chainage: s.chainage,
          length: s.length,
          flowCalcMethod: s.flowCalcMethod,
          reqFlow: s.reqFlow,
          riceArea: s.riceArea,
          fruitArea: s.fruitArea,
          permeability: s.permeability,
          reqWaterLevel: s.reqWaterLevel,
          endChainage: s.endChainage,
          headLoss: s.headLoss,
          inletLoss: s.inletLoss,
          outletLoss: s.outletLoss,
          frictionLoss: s.frictionLoss,
          offtakeSide: s.offtakeSide,
          offtakeSize: s.offtakeSize,
          offtakeStatus: s.offtakeStatus,
          type: s.type,
          status: s.status
        }))
      })
    }
    return { success: true }
  } catch (error: any) {
    console.error("Save canal structures error:", error)
    return { success: false, error: error.message }
  }
}

export async function getCanalStructures(projectId: string) {
  try {
    const structures = await prisma.canalStructure.findMany({
      where: { projectId }
    })
    return structures
  } catch (error) {
    console.error("Get canal structures error:", error)
    return []
  }
}

export async function getTerrainData(projectId: string) {
  try {
    const data = await (prisma as any).terrainData.findMany({
      where: { projectId },
      orderBy: { lyTrinh: 'asc' }
    });
    return data;
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu địa hình:', error);
    return [];
  }
}

export async function saveTerrainData(projectId: string, data: any[]) {
  try {
    await prisma.$transaction(async (tx) => {
      // Xoá dữ liệu cũ
      await (tx as any).terrainData.deleteMany({
        where: { projectId }
      });
      
      if (data && data.length > 0) {
        // Thêm dữ liệu mới
        const CHUNK_SIZE = 100; // Force Turbopack rebuild
        const mappedData = data.map(item => ({
          projectId,
          tenMoc: item.tenMoc !== undefined && item.tenMoc !== null ? String(item.tenMoc) : '',
          lyTrinh: parseFloat(item.lyTrinh) || 0,
          khoangCach: parseFloat(item.khoangCach) || 0,
          caoDo: parseFloat(item.caoDo) || 0
        }));
        
        for (let i = 0; i < mappedData.length; i += CHUNK_SIZE) {
          const chunk = mappedData.slice(i, i + CHUNK_SIZE);
          await (tx as any).terrainData.createMany({
            data: chunk
          });
        }
      }
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Lỗi khi lưu dữ liệu địa hình:', error);
    require('fs').writeFileSync('terrain_error.log', String(error) + '\n' + (error.stack || ''));
    return { success: false, error: String(error) };
  }
}

export async function getCrossSectionData(projectId: string) {
  try {
    const data = await (prisma as any).crossSectionData.findMany({
      where: { projectId },
      orderBy: { chainage: 'asc' }
    });
    
    return data.map((item: any) => ({
      name: item.name,
      chainage: item.chainage,
      centerOffset: item.centerOffset,
      centerElevation: item.centerElevation,
      datum: item.datum,
      points: item.points ? JSON.parse(item.points) : []
    }));
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu mặt cắt ngang:', error);
    return [];
  }
}

export async function saveCrossSectionData(projectId: string, stakes: any[]) {
  try {
    await prisma.$transaction(async (tx) => {
      // Delete old data
      await (tx as any).crossSectionData.deleteMany({
        where: { projectId }
      });
      
      if (stakes && stakes.length > 0) {
        const CHUNK_SIZE = 50;
        const mappedData = stakes.map(stake => ({
          projectId,
          name: stake.name || '',
          chainage: parseFloat(stake.chainage) || 0,
          centerOffset: parseFloat(stake.centerOffset) || 0,
          centerElevation: parseFloat(stake.centerElevation) || 0,
          datum: stake.datum !== undefined && stake.datum !== null ? parseFloat(stake.datum) : null,
          points: JSON.stringify(stake.points || [])
        }));
        
        for (let i = 0; i < mappedData.length; i += CHUNK_SIZE) {
          const chunk = mappedData.slice(i, i + CHUNK_SIZE);
          await (tx as any).crossSectionData.createMany({
            data: chunk
          });
        }
      }
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Lỗi khi lưu dữ liệu mặt cắt ngang:', error);
    return { success: false, error: String(error) };
  }
}
