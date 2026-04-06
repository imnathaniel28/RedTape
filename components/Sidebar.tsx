'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', tabPos: 'left'   as const, rotation: -4  },
  { href: '/templates', label: 'Templates', tabPos: 'center' as const, rotation: 1   },
  { href: '/profile',   label: 'Profile',   tabPos: 'right'  as const, rotation: -2  },
  { href: '/billing',   label: 'Billing',   tabPos: 'left'   as const, rotation: 2   },
]

const TAB_LEFT = { left: '8px', center: '50px', right: '92px' }

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="shrink-0 sticky top-0 self-start pt-8 pl-4 flex flex-col gap-2 z-10"
      style={{ width: '190px' }}
    >
      {NAV_ITEMS.map(({ href, label, tabPos, rotation }) => {
        const active = pathname === href || pathname.startsWith(href + '/')

        return (
          <Link
            key={href}
            href={href}
            className="block group transition-transform duration-150 hover:-translate-y-1"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <div className="relative" style={{ width: '160px', height: '110px' }}>
              {/* Tab */}
              <div
                className="absolute top-0 rounded-t-md"
                style={{
                  width: '58px',
                  height: '18px',
                  background: active ? '#f07070' : '#f4a0a0',
                  left: TAB_LEFT[tabPos],
                }}
              />
              {/* Folder body */}
              <div
                className="absolute top-[10px] left-0 right-0 bottom-0 rounded-sm flex items-center justify-center transition-all duration-150 group-hover:brightness-110"
                style={{
                  background: active
                    ? 'linear-gradient(180deg, #e52020 0%, #c81818 100%)'
                    : 'linear-gradient(180deg, #ef3535 0%, #d42525 100%)',
                  boxShadow: active
                    ? '3px 4px 10px rgba(0,0,0,0.3)'
                    : '2px 3px 8px rgba(0,0,0,0.18)',
                }}
              >
                <span
                  className="text-white font-bold text-base drop-shadow-md select-none"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {label}
                </span>
              </div>
            </div>
          </Link>
        )
      })}
    </aside>
  )
}
