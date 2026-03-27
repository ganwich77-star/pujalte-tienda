'use client'

import React, { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

interface ImageCropperProps {
  image: string | null
  open: boolean
  onClose: () => void
  onCropComplete: (file: File) => void
  aspect?: number
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/jpeg')
  })
}

export function ImageCropper({
  image,
  open,
  onClose,
  onCropComplete,
  aspect = 16 / 9,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location)
  }, [])

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom)
  }, [])

  const onCropCompleteInternal = useCallback((_: Area, pixelArea: Area) => {
    setCroppedAreaPixels(pixelArea)
  }, [])

  const handleConfirm = async () => {
    if (!image || !croppedAreaPixels) return

    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels)
      if (croppedBlob) {
        const file = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' })
        onCropComplete(file)
        onClose()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] w-[95vw] h-[80vh] flex flex-col p-0 overflow-hidden sm:rounded-[2rem] border-0 shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-gray-800 tracking-tight">Reencuadrar Imagen</DialogTitle>
          <p className="text-sm text-gray-500">Usa el ratón para mover y hacer zoom</p>
        </DialogHeader>
        
        <div className="flex-1 relative bg-gray-900 mx-6 rounded-2xl overflow-hidden border border-gray-100">
          {image && (
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropCompleteInternal}
              classes={{
                containerClassName: 'bg-gray-950',
                mediaClassName: 'object-contain',
              }}
            />
          )}
        </div>

        <DialogFooter className="p-6 mt-auto bg-gray-50/50 backdrop-blur-sm flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-4 max-w-sm">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400 shrink-0">Zoom</span>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(vals) => setZoom(vals[0])}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} className="rounded-full px-6 text-gray-500 hover:text-gray-900 hover:bg-white border-0">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} className="bg-[#4A7C59] hover:bg-[#3d6649] text-white px-8 rounded-full shadow-lg shadow-[#4A7C59]/20 transition-all">
              Aplicar Recorte
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
