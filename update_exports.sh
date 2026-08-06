#!/bin/bash
sed -i '' 's/import { unicodeToTCVN3 } from '\''\.\/tcvn3'\'';/import { unicodeToTCVN3 } from '\''\.\/tcvn3'\'';\nimport { drawDXFStructure } from '\''\.\/exportStructures'\'';/' src/lib/exportDXF.ts
sed -i '' 's/export function generateProfileDXF(.*landmarkData: { name?: string, chainage: number, angleStr: string }\[\] = \[\]) {/export function generateProfileDXF(data: any[], settings: any, landmarkData: { name?: string, chainage: number, angleStr: string }[] = [], canalStructures: any[] = []) {/' src/lib/exportDXF.ts

sed -i '' 's/import { unicodeToTCVN3 } from '\''\.\/tcvn3'\'';/import { unicodeToTCVN3 } from '\''\.\/tcvn3'\'';\nimport { drawLISPStructure } from '\''\.\/exportStructures'\'';/' src/lib/exportLISP.ts
sed -i '' 's/export function generateProfileLISP(.*landmarkData: { name?: string, chainage: number, angleStr: string }\[\] = \[\]) {/export function generateProfileLISP(data: any[], settings: any, landmarkData: { name?: string, chainage: number, angleStr: string }[] = [], canalStructures: any[] = []) {/' src/lib/exportLISP.ts
