import { useContext } from 'react'
import { PromoContext, type PromoValue } from './PromoProvider'

export function usePromo(): PromoValue {
  const value = useContext(PromoContext)
  if (!value) throw new Error('usePromo must be used inside <PromoProvider>')
  return value
}
