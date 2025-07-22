import { PrismaClient } from '@prisma/client';
import readXlsxFile from 'read-excel-file/node';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, 'products.xlsx');
  if (!filePath) {
    throw new Error('No se encontró el archivo products.xlsx');
  }

  console.log(`📄 Cargando productos desde: ${filePath}`);

  const rows = await readXlsxFile(filePath);

  const headers = rows[0];
  const dataRows = rows.slice(1);

  const colIndex = {
    tipoPrenda: headers.indexOf('TIPO_PRENDA'),
    color: headers.indexOf('COLOR'),
    talla: headers.indexOf('TALLA'),
    descripcion: headers.indexOf('DESCRIPCIÓN'),
    precio: headers.indexOf('PRECIO_50_U'),
    stock: headers.indexOf('CANTIDAD_DISPONIBLE'),
  };

  const tenPercentCount = Math.ceil(dataRows.length * 0.1);
  const sample = dataRows.slice(0, tenPercentCount);

  const mappedProducts = sample.map((row) => ({
    name: `${row[colIndex.tipoPrenda]} ${row[colIndex.color]} Talla ${row[colIndex.talla]}`,
    description: String(row[colIndex.descripcion] || 'Sin descripción'),
    price: Number(row[colIndex.precio] || 0),
    stock: Number(row[colIndex.stock] || 0),
  }));

  await prisma.product.createMany({
    data: mappedProducts,
    skipDuplicates: true,
  });

  console.log(`✅ Se insertaron ${mappedProducts.length} productos`);
}

main()
  .catch((e) => {
    console.error('❌ Error al cargar los productos:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
