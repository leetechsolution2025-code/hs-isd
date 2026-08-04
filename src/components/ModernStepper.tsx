"use client";

import React from "react";

export interface ModernStepItem {
  num: number;
  id: string;
  title: string;
  desc: string;
  icon: string;
}

interface ModernStepperProps {
  steps: ModernStepItem[];
  currentStep: number;
  onStepChange: (num: number) => void;
  /** Optional horizontal padding, defaults to 24px */
  paddingX?: string | number;
  /** Optional vertical padding, defaults to 16px */
  paddingY?: string | number;
}

export const ModernStepper: React.FC<ModernStepperProps> = ({ 
  steps, 
  currentStep, 
  onStepChange,
  paddingX = 24,
  paddingY = 16
}) => {
  return (
    <div 
      className="w-full flex items-center justify-between" 
      style={{ 
        padding: `${typeof paddingY === 'number' ? paddingY + 'px' : paddingY} ${typeof paddingX === 'number' ? paddingX + 'px' : paddingX}` 
      }}
    >
      {steps.map((s, idx) => {
        const isActive = currentStep === s.num;
        const isPast = currentStep > s.num;

        return (
          <React.Fragment key={s.num}>
            <div 
              className={`flex flex-row items-center gap-3 cursor-pointer transition-all duration-300 ${isActive || isPast ? 'opacity-100' : 'opacity-70'}`}
              onClick={() => onStepChange(s.num)}
            >
              <div 
                className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-sm md:text-base shrink-0 transition-colors ${
                  isActive ? 'bg-[#003087] text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <i className={`bi ${s.icon}`} />
              </div>
              <div className="flex flex-col text-left">
                <h3 className={`text-[11px] md:text-sm font-bold m-0 leading-tight ${isActive ? 'text-[#003087]' : 'text-slate-500'}`}>
                  {s.title}
                </h3>
                <p className="text-[10px] md:text-xs text-slate-400 m-0 mt-0.5 hidden lg:block">
                  {s.desc}
                </p>
              </div>
            </div>
            
            {idx < steps.length - 1 && (
              <div className="flex-1 mx-2 md:mx-4 flex items-center justify-center hidden sm:flex">
                <div className="w-1/2 h-px bg-slate-200" />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
