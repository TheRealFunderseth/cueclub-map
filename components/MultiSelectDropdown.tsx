'use client';

import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';

const days = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export default function MultiSelectDropdown({
  selected,
  setSelected,
  className = '',
}: {
  selected: string[];
  setSelected: (val: string[]) => void;
  className?: string;
}) {
  const toggleDay = (day: string) => {
    setSelected(
      selected.includes(day)
        ? selected.filter((d) => d !== day)
        : [...selected, day]
    );
  };

  return (
    <Listbox value={selected} onChange={setSelected} multiple>
      <div className="relative text-sm">
        <Listbox.Button className="w-52 cursor-pointer rounded border border-gray-300 bg-white px-3 py-1.5 text-left relative">
          <span className="block truncate">
            {selected.length === 0 ? 'Free Pool Days' : selected.map(d => d.slice(0,3)).join(', ')}
          </span>
          <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </span>
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-52 overflow-auto rounded-md border bg-white shadow">
            {days.map((day) => (
              <Listbox.Option key={day} value={day} as={Fragment}>
                {({ active }) => (
                  <li
                    className={`cursor-pointer select-none px-3 py-2 flex items-center gap-2 ${
                      active ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => toggleDay(day)}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(day)}
                      readOnly
                      className="accent-blue-600"
                    />
                    <span className="capitalize">{day}</span>
                  </li>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}
