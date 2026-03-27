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
  id: string | number;
  src: string;
  alt: string;
  categoria: string;
  activa?: boolean;
  mostrarPrecio?: boolean;
  descripcion?: string;
  precio?: number;
  isNew?: boolean;
  hasVariants?: boolean;
  variantBehavior?: 'add' | 'replace';
  variants?: {
    id: string;
    name: string;
    price: number;
    stock?: number;
  }[];
  isPack?: boolean;
  packItems?: (string | number)[];
}

export interface Testimonial {
  id: number;
  nombre: string;
  texto: string;
  rating: number;
  fecha: string;
  activo: boolean;
}

export interface Promo {
  id: string | number;
  type: 'image' | 'video';
  url: string;
  title: string;
  subtitle: string;
  badge: string;
  color: string;
  buttonText: string;
  action: 'shop' | 'contact' | 'none';
  activa: boolean;
  contentPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'bottom-center' | 'top' | 'top-center' | 'bottom';
  zoom?: boolean;
  zoomScale?: number;
  zoomY?: number;
  muted?: boolean;
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
  adminPassword?: string;
  promos?: Promo[];
}

export const landingConfig = landingData as LandingConfig;
