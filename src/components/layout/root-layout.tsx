import { useEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthFlowProvider } from '@/features/auth/components/auth-flow-provider'
import { CatalogRealtimeSync } from '@/features/catalog/components/catalog-realtime-sync'

export const RootLayout = () => {
  useEffect(() => {
    const root = document.getElementById('root')
    root?.removeAttribute('inert')
    root?.removeAttribute('aria-busy')
    document.getElementById('kurio-boot-status')?.remove()
  }, [])

  return (
    <TooltipProvider>
      <AuthFlowProvider>
        <CatalogRealtimeSync />
        <Outlet />
      </AuthFlowProvider>
    </TooltipProvider>
  )
}
