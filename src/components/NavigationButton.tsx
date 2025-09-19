'use client'

interface NavigationButtonProps {
  href: string
  children: React.ReactNode
  className?: string
}

export default function NavigationButton({ href, children, className }: NavigationButtonProps) {
  const handleClick = () => {
    window.location.href = href
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}