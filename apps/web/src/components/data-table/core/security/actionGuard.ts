import { useMemo } from 'react'
import type { SecureAction } from './types'
import { useVisibilityResolver } from './visibilityResolver'

export function useActionGuard(actions: SecureAction[]) {
  const { resolve } = useVisibilityResolver()

  return useMemo(() => {
    return actions.filter(action => {
      const visibility = resolve(action.requiredPermission, true)
      return visibility === 'ALLOW'
    })
  }, [actions, resolve])
}
