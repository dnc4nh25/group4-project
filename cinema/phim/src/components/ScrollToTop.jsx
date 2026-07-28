import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Cuộn lên đầu trang mỗi khi đổi route (vd. từ danh sách phim → chi tiết phim). */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
