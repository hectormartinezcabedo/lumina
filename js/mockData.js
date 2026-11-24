/* ==========================================================================
   mockData.js — Datos simulados (simula la base de datos del Proyecto 1)
   Cada objeto representa un registro de la tabla "servicios".
   Se expone como variable global para que funcione abriendo el HTML
   directamente (file://), donde fetch() de un .json estaría bloqueado.
   ========================================================================== */

const SERVICIOS = [
  {
    id: 1,
    titulo: "Historias de amor, a tu manera",
    fotografo: "Marta García",
    categoria: "Bodas",
    ciudad: "Madrid",
    precio: 300,
    valoracion: 4.9,
    resenas: 128,
    imagen: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
    destacado: true
  },
  {
    id: 2,
    titulo: "Retratos que hablan de ti",
    fotografo: "Sofía Martínez",
    categoria: "Retratos",
    ciudad: "Barcelona",
    precio: 150,
    valoracion: 4.8,
    resenas: 94,
    imagen: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop",
    destacado: true
  },
  {
    id: 3,
    titulo: "Momentos en familia",
    fotografo: "Carlos Ruiz",
    categoria: "Familia",
    ciudad: "Valencia",
    precio: 120,
    valoracion: 4.7,
    resenas: 61,
    imagen: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=800&auto=format&fit=crop",
    destacado: false
  },
  {
    id: 4,
    titulo: "Moda y editorial",
    fotografo: "Laura Pérez",
    categoria: "Editorial",
    ciudad: "Madrid",
    precio: 200,
    valoracion: 4.9,
    resenas: 47,
    imagen: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800&auto=format&fit=crop",
    destacado: true
  },
  {
    id: 5,
    titulo: "Bodas íntimas al aire libre",
    fotografo: "Javier Moreno",
    categoria: "Bodas",
    ciudad: "Sevilla",
    precio: 450,
    valoracion: 4.6,
    resenas: 39,
    imagen: "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=800&auto=format&fit=crop",
    destacado: false
  },
  {
    id: 6,
    titulo: "Retrato profesional y corporativo",
    fotografo: "Elena Navarro",
    categoria: "Retratos",
    ciudad: "Bilbao",
    precio: 90,
    valoracion: 4.5,
    resenas: 72,
    imagen: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
    destacado: false
  },
  {
    id: 7,
    titulo: "Sesión de embarazo y recién nacido",
    fotografo: "Lucía Romero",
    categoria: "Familia",
    ciudad: "Málaga",
    precio: 180,
    valoracion: 5.0,
    resenas: 33,
    imagen: "https://images.unsplash.com/photo-1544126592-807ade215a0b?q=80&w=800&auto=format&fit=crop",
    destacado: true
  },
  {
    id: 8,
    titulo: "Lookbook para marcas emergentes",
    fotografo: "Diego Fernández",
    categoria: "Editorial",
    ciudad: "Barcelona",
    precio: 350,
    valoracion: 4.8,
    resenas: 25,
    imagen: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
    destacado: false
  }
];
