import prisma from "../src/config/db";

async function main() {
  console.log("Seeding started...");

  // Clear existing data
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Categories
  const men = await prisma.category.create({
    data: { name: "Men", slug: "men", description: "Men's fashion wear" },
  });

  const women = await prisma.category.create({
    data: { name: "Women", slug: "women", description: "Women's fashion wear" },
  });

  const kids = await prisma.category.create({
    data: { name: "Kids", slug: "kids", description: "Kids' clothing collections" },
  });

  const sports = await prisma.category.create({
    data: { name: "Sports", slug: "sports", description: "Sportswear and athletic collections" },
  });

  // Subcategories
  const tshirts = await prisma.category.create({
    data: { name: "T-Shirts", slug: "men-tshirts", parentId: men.id },
  });

  const polos = await prisma.category.create({
    data: { name: "Polos", slug: "men-polos", parentId: men.id },
  });

  const activewear = await prisma.category.create({
    data: { name: "Activewear", slug: "men-activewear", parentId: men.id },
  });

  const kurtis = await prisma.category.create({
    data: { name: "Kurtis", slug: "women-kurtis", parentId: women.id },
  });

  const boys = await prisma.category.create({
    data: { name: "Boys", slug: "kids-boys", parentId: kids.id },
  });

  const jerseys = await prisma.category.create({
    data: { name: "Jerseys", slug: "sports-jerseys", parentId: sports.id },
  });

  console.log("Categories seeded successfully.");

  // 2. Create Products and Variants
  // Product 1: Premium Men's T-Shirt
  const prod1 = await prisma.product.create({
    data: {
      name: "Premium Crewneck T-Shirt",
      slug: "premium-crewneck-tshirt",
      description: "Crafted from 100% organic cotton, this heavy-weight tee offers the perfect blend of softness, structure, and breathable durability. Ideal for everyday lifestyle wear.",
      basePrice: 750.0,
      images: [
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800",
      ],
      categoryId: tshirts.id,
      tags: ["New Arrival", "Top Selling"],
      variants: {
        create: [
          { sku: "PM-TS-BLK-M", color: "Black", size: "M", stock: 120 },
          { sku: "PM-TS-BLK-L", color: "Black", size: "L", stock: 95 },
          { sku: "PM-TS-BLK-XL", color: "Black", size: "XL", stock: 60 },
          { sku: "PM-TS-NAV-M", color: "Navy Blue", size: "M", stock: 80 },
          { sku: "PM-TS-NAV-L", color: "Navy Blue", size: "L", stock: 110 },
          { sku: "PM-TS-NAV-XL", color: "Navy Blue", size: "XL", stock: 50 },
        ],
      },
    },
  });

  // Product 2: Slim Fit Polo
  const prod2 = await prisma.product.create({
    data: {
      name: "Luxury Pique Polo Shirt",
      slug: "luxury-pique-polo",
      description: "Upgrade your semi-formal wear with our premium pique cotton polo. Designed with a structured collar, tailored chest fit, and rib-knit sleeve cuffs.",
      basePrice: 1150.0,
      images: [
        "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=800",
      ],
      categoryId: polos.id,
      tags: ["Top Selling"],
      variants: {
        create: [
          { sku: "LX-PL-WHT-M", color: "White", size: "M", stock: 45 },
          { sku: "LX-PL-WHT-L", color: "White", size: "L", stock: 60 },
          { sku: "LX-PL-WHT-XL", color: "White", size: "XL", stock: 35 },
          { sku: "LX-PL-RED-M", color: "Red", size: "M", stock: 40 },
          { sku: "LX-PL-RED-L", color: "Red", size: "L", stock: 30 },
        ],
      },
    },
  });

  // Product 3: Bangladesh Fan Edition Football Jersey
  const prod3 = await prisma.product.create({
    data: {
      name: "Bangladesh Fan Edition Jersey",
      slug: "bangladesh-fan-jersey",
      description: "Show your pride with the official fan edition national jersey. Featuring high-performance dry-fit moisture-wicking technology and premium sublimation patterns.",
      basePrice: 950.0,
      images: [
        "https://images.unsplash.com/photo-1577416412292-747c6607f055?auto=format&fit=crop&q=80&w=800",
      ],
      categoryId: jerseys.id,
      tags: ["New Arrival", "Fan Edition"],
      variants: {
        create: [
          { sku: "BD-JR-GRN-M", color: "Green", size: "M", stock: 150 },
          { sku: "BD-JR-GRN-L", color: "Green", size: "L", stock: 180 },
          { sku: "BD-JR-GRN-XL", color: "Green", size: "XL", stock: 120 },
          { sku: "BD-JR-RED-M", color: "Red", size: "M", stock: 75, priceOverride: 900.0 }, // Special sale discount
          { sku: "BD-JR-RED-L", color: "Red", size: "L", stock: 85, priceOverride: 900.0 },
        ],
      },
    },
  });

  // Product 4: Women's Traditional Cotton Kurti
  const prod4 = await prisma.product.create({
    data: {
      name: "Classic Cotton Print Kurti",
      slug: "classic-print-kurti",
      description: "Made from premium linen cotton blend fabric. Elegantly stitched, lightweight, and perfect for ethnic occasions or casual everyday wear.",
      basePrice: 1550.0,
      images: [
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800",
      ],
      categoryId: kurtis.id,
      tags: ["New Arrival"],
      variants: {
        create: [
          { sku: "WM-KT-PNK-S", color: "Pink", size: "S", stock: 30 },
          { sku: "WM-KT-PNK-M", color: "Pink", size: "M", stock: 50 },
          { sku: "WM-KT-PNK-L", color: "Pink", size: "L", stock: 40 },
        ],
      },
    },
  });

  // 3. Create Seed User
  await prisma.user.create({
    data: {
      email: "rubayet@zendora.com",
      name: "Rubayet Khan",
      role: "ADMIN",
      passwordHash: "dummyhash123",
      phone: "+8801700000000",
      addresses: {
        create: [
          {
            street: "House 24, Road 8, Dhanmondi",
            city: "Dhaka",
            postalCode: "1209",
            country: "Bangladesh",
            zone: "INSIDE_DHAKA",
            isDefault: true,
          },
        ],
      },
    },
  });

  console.log("Products and Seed User completed.");
  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error("Error seeding database: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
