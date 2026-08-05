const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

content = content.replace(
  /export async function getCategories\(groupId: string\) {[\s\S]*?orderBy: { orderIndex: 'asc' }[\s\S]*?}\)/,
  `export async function getCategories(groupId: string, parentId: string | null = null) {
  try {
    return await prisma.category.findMany({
      where: { groupId, parentId },
      orderBy: { orderIndex: 'asc' },
      include: { children: true }
    })`
);

content = content.replace(
  /export async function createCategory\(data: any\) {[\s\S]*?data: {[\s\S]*?metadata: data\.metadata/,
  `export async function createCategory(data: any) {
  try {
    return await prisma.category.create({
      data: {
        groupId: data.groupId,
        parentId: data.parentId || null,
        name: data.name,
        orderIndex: data.orderIndex,
        isActive: data.isActive,
        metadata: data.metadata`
);

content = content.replace(
  /export async function updateCategory\(id: string, data: any\) {[\s\S]*?data: {[\s\S]*?metadata: data\.metadata/,
  `export async function updateCategory(id: string, data: any) {
  try {
    return await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        orderIndex: data.orderIndex,
        isActive: data.isActive,
        metadata: data.metadata`
);

fs.writeFileSync('src/app/actions.ts', content);
