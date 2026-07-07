import { Modal } from 'react-bootstrap'
import { useEffect } from 'react'

export default function TrailerModal({ show, onHide, trailerUrl, movieTitle }) {
  const getYouTubeId = (url) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const videoId = getYouTubeId(trailerUrl)

  useEffect(() => {
    if (!show) {
      const iframe = document.getElementById('trailer-iframe')
      if (iframe) {
        iframe.src = iframe.src
      }
    }
  }, [show])

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className="trailer-modal"
    >
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">
          🎬 Trailer: {movieTitle}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        {videoId ? (
          <div className="ratio ratio-16x9">
            <iframe
              id="trailer-iframe"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={`${movieTitle} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: 'none' }}
            ></iframe>
          </div>
        ) : (
          <div className="text-center p-5">
            <p className="text-muted">Không thể tải trailer</p>
          </div>
        )}
      </Modal.Body>
    </Modal>
  )
}
