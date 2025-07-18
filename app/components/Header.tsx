'use client'

import { Dispatch, SetStateAction, ReactNode } from 'react'
import { X } from 'lucide-react'

// A reusable component for the styled toggle switch
const ToggleSwitch = ({ label, checked, onChange, emoji }: { label: string, checked: boolean, onChange: (checked: boolean) => void, emoji?: string }) => {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      <span className="ml-3 text-sm font-medium text-gray-700">
        {emoji && <span className="mr-1">{emoji}</span>}
        {label}
      </span>
    </label>
  );
};

interface HeaderProps {
  filter: string
  onFilterChange: Dispatch<SetStateAction<string>>
  tableFilter: string
  onTableFilterChange: Dispatch<SetStateAction<string>>
  guinnessFilter: boolean
  onGuinnessFilterChange: Dispatch<SetStateAction<boolean>>
  freePoolTonightOnly: boolean
  onFreePoolTonightToggle: Dispatch<SetStateAction<boolean>>
  liveTableOnly: boolean
  onLiveTableToggle: Dispatch<SetStateAction<boolean>>
  mobileOpen: boolean
  setMobileOpen: Dispatch<SetStateAction<boolean>>
  setShowList: Dispatch<SetStateAction<boolean>>
  children?: ReactNode
}

export default function Header({
  filter,
  onFilterChange,
  tableFilter,
  onTableFilterChange,
  guinnessFilter,
  onGuinnessFilterChange,
  freePoolTonightOnly,
  onFreePoolTonightToggle,
  liveTableOnly,
  onLiveTableToggle,
  mobileOpen,
  setMobileOpen,
  setShowList,
  children,
}: HeaderProps) {

  return (
    <header className="absolute top-4 left-4 right-4 z-50 bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg pointer-events-auto">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/cueclublogo.png" alt="Cue Club" className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold">Cue Club</h1>
              <p className="text-sm text-gray-600">Best pool bars in SF</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="hidden md:block relative">
              <input
                type="text"
                placeholder="Search bars..."
                className="px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm w-full"
                value={filter}
                onChange={e => onFilterChange(e.target.value)}
                onFocus={() => setShowList(true)}
              />
              {filter && (
                <button
                  onClick={() => onFilterChange('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            {children}
            <button
              className="md:hidden px-3 py-2 bg-gray-200 text-gray-800 rounded-md text-xs font-semibold"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? 'Close' : 'Filters'}
            </button>
          </div>
        </div>
        <div className={`${mobileOpen ? 'flex' : 'hidden'} mt-4 flex-col space-y-4 md:flex md:flex-row md:space-y-0 md:flex-wrap md:items-center md:gap-4 md:pt-2`}>
          <div className="md:hidden relative">
             <input
                type="text"
                placeholder="Search bars..."
                className="w-full px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                value={filter}
                onChange={e => onFilterChange(e.target.value)}
                onFocus={() => setShowList(true)}
              />
              {filter && (
                <button
                  onClick={() => onFilterChange('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
          </div>
          {/* ✅ FIX: Styled dropdown for number of tables */}
          <div className="relative w-full md:w-auto">
            <select
              className="appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 pr-8 rounded-md leading-tight focus:outline-none focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-blue-200 text-sm"
              value={tableFilter}
              onChange={e => onTableFilterChange(e.target.value)}
            >
              <option value="">No. of tables</option>
              <option value="1">1 Table</option>
              <option value="2">2 Tables</option>
              <option value="3+">3+ Tables</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:items-center md:justify-start md:gap-4">
            <ToggleSwitch
              label="Live table"
              emoji="📣"
              checked={liveTableOnly}
              onChange={onLiveTableToggle}
            />
            <ToggleSwitch
              label="Guinness on draft"
              emoji="🍺"
              checked={guinnessFilter}
              onChange={onGuinnessFilterChange}
            />
            <ToggleSwitch
              label="Free Pool tonight"
              emoji="🎯"
              checked={freePoolTonightOnly}
              onChange={onFreePoolTonightToggle}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
