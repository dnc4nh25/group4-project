import { useState, useEffect } from 'react'
import axios from 'axios'

export function useFetch(url) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = async () => {
    setLoading(true)
    try {
      const res = await axios.get(url)
      setData(res.data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!url) return
    refetch()
  }, [url])

  return { data, loading, error, refetch }
}
