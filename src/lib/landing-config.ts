import landingData from '@/data/landing-config.json';

export interface Service {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  foto: string;
  activa: boolean;
}

export interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  categoria: string;
  precio?: number;
  stock?: number;
  activa?: boolean;
  descripcion?: string;
}

export interface Testimonial {
  id: number;
  nombre: string;
  texto: string;
  rating: number;
  fecha: string;
  activo: boolean;
}

export interface LandingConfig {
  nombre: string;
  logo: string;
  slogan: string;
  subtitulo: string;
  heroFoto: string;
  ubicacion: string;
  telefono: string;
  whatsapp: string;
  email: string;
  instagram: string;
  googleReviewsUrl: string;
  visibilidad: {
    servicios: boolean;
    galeria: boolean;
    testimonios: boolean;
    sobreMi: boolean;
  };
  sobreMi: {
    foto: string;
    texto: string;
  };
  servicios: Service[];
  galeria: GalleryImage[];
  testimonios: Testimonial[];
  categorias: string[];
  storeUrl: string;
  seo: {
    titulo: string;
    descripcion: string;
    keywords: string;
  };
}

export const landingConfig = landingData as LandingConfig;
