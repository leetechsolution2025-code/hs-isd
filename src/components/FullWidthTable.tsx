import React, { ReactNode } from 'react'

interface FullWidthTableProps {
  /** The <th> elements for the table header */
  head?: ReactNode
  /** The full <tr> elements for a nested or complex header */
  nestedHead?: ReactNode
  /** The <tr> elements for the table body */
  children: ReactNode
}

export default function FullWidthTable({ head, nestedHead, children }: FullWidthTableProps) {
  return (
    <div className="flex-1 overflow-auto -mx-4 sm:-mx-6 -mb-4 sm:-mb-6">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="border-b border-slate-200 text-slate-500 sticky top-0 z-10 bg-[#fafafa]">
          {nestedHead ? (
            nestedHead
          ) : (
            <tr className="uppercase text-[11px] tracking-wider font-bold">
              {head}
            </tr>
          )}
        </thead>
        <tbody className="divide-y divide-slate-100">
          {children}
        </tbody>
      </table>
    </div>
  )
}
