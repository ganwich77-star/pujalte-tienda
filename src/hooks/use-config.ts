import { useState, useEffect } from 'react'
import { StoreConfig } from '@/types'

const defaultConfig: StoreConfig = {
  storeName: 'Pujalte Fotografía',
  showImages: true,
  currency: 'EUR',
  phone: '650494728',
  email: 'hola@pujaltefotografia.es',
  whatsappNumber: '34650494728',
  slogan: 'POWERED BY PUJALTE',
  enableCash: true,
  enableBizum: true,
  enableCard: true,
  formFields: []
}

export const useConfig = () => {
  const [config, setConfig] = useState<StoreConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config')
        if (response.ok) {
          const data = await response.json()
          setConfig(data)
        }
      } catch (error) {
        console.error('Error fetching config:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  return { config, loading }
}
