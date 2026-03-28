const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function restoreConfig() {
  const prisma = new PrismaClient();
  const landingDataPath = path.join(__dirname, 'src/data/landing-config.json');
  const landingData = JSON.parse(fs.readFileSync(landingDataPath, 'utf8'));

  try {
    console.log('Restaurando configuración desde landing-config.json...');
    
    // Preparar el objeto de configuración base
    const fullConfig = {
      ...landingData,
      whatsappNumber: landingData.whatsapp || '34650494728',
      storeName: landingData.nombre || 'Pujalte Fotografía',
      showImages: true,
      currency: 'EUR',
      phone: landingData.telefono || '650494728',
      email: landingData.email || 'hola@pujaltefotografia.es',
      slogan: landingData.slogan || 'POWERED BY PUJALTE CREATIVE STUDIO',
      subtitulo: landingData.subtitulo || 'Más que fotografía, tus mejores recuerdos',
      promos: landingData.promos || []
    };

    await prisma.systemConfig.upsert({
      where: { id: 'default' },
      update: { data: fullConfig },
      create: { 
        id: 'default',
        data: fullConfig
      }
    });

    console.log('✅ Configuración y BANNERS restaurados con éxito.');
  } catch (error) {
    console.error('❌ Error en la restauración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreConfig();
