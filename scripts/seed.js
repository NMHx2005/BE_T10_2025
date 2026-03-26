import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from '../src/config/database.js';
import User from '../src/models/User.js';
import Category from '../src/models/Category.js';
import Brand from '../src/models/Brand.js';
import ProductAttribute from '../src/models/ProductAttribute.js';
import Product from '../src/models/Product.js';

dotenv.config();

const usersData = [
    {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        status: 'active',
        phone: '+84912345678'
    },
    {
        username: 'customer1',
        email: 'customer1@example.com',
        password: 'cust1234',
        role: 'user',
        status: 'active',
        phone: '+84987654321'
    }
];

const categoryData = [
    { name: 'Thời trang nam', slug: 'thoi-trang-nam', description: 'Thời trang dành cho nam giới', status: 'active', featured: true },
    { name: 'Thời trang nữ', slug: 'thoi-trang-nu', description: 'Thời trang dành cho nữ giới', status: 'active', featured: true },
    { name: 'Điện tử', slug: 'dien-tu', description: 'Thiết bị điện tử và phụ kiện', status: 'active', featured: true },
    { name: 'Đồ gia dụng', slug: 'do-gia-dung', description: 'Thiết bị gia dụng', status: 'active', featured: false },
    { name: 'Laptop', slug: 'laptop', description: 'Laptop và thiết bị văn phòng', status: 'active', featured: false },
    { name: 'Phụ kiện', slug: 'phu-kien', description: 'Phụ kiện và đồ dùng nhỏ', status: 'active', featured: false }
];

const brandData = [
    { name: 'Sunwear', slug: 'sunwear', description: 'Thương hiệu quần áo', createdBy: null },
    { name: 'RoadRunner', slug: 'roadrunner', description: 'Thương hiệu giày thể thao', createdBy: null },
    { name: 'SoundSphere', slug: 'soundsphere', description: 'Thiết bị âm thanh', createdBy: null },
    { name: 'OfficeTech', slug: 'officetech', description: 'Thiết bị văn phòng', createdBy: null },
    { name: 'ChefMaster', slug: 'chefmaster', description: 'Thiết bị nhà bếp', createdBy: null },
    { name: 'SkyPhone', slug: 'skyphone', description: 'Điện thoại thông minh', createdBy: null },
    { name: 'TravelPro', slug: 'travelpro', description: 'Hành lý và phụ kiện', createdBy: null },
    { name: 'HealthTrack', slug: 'healthtrack', description: 'Thiết bị sức khỏe thông minh', createdBy: null },
    { name: 'KitchenMax', slug: 'kitchenmax', description: 'Đồ dùng gia đình', createdBy: null },
    { name: 'GamerBase', slug: 'gamerbase', description: 'Thiết bị chơi game', createdBy: null }
];

const attributeData = [
    { name: 'Size', slug: 'size', type: 'select', description: 'Kích cỡ', options: [{ label: 'S', value: 'S' }, { label: 'M', value: 'M' }, { label: 'L', value: 'L' }, { label: 'XL', value: 'XL' }], required: true, filterable: true, searchable: true, createdBy: null },
    { name: 'Color', slug: 'color', type: 'color', description: 'Màu sắc', options: [{ label: 'Đỏ', value: 'Đo' }, { label: 'Xanh', value: 'Xanh' }, { label: 'Đen', value: 'Den' }, { label: 'Trắng', value: 'Trang' }], required: true, filterable: true, searchable: true, createdBy: null },
    { name: 'Material', slug: 'material', type: 'select', description: 'Chất liệu', options: [{ label: 'Cotton', value: 'Cotton' }, { label: 'Inox', value: 'Inox' }, { label: 'TPU', value: 'TPU' }], required: false, filterable: true, searchable: false, createdBy: null }
];

const productData = (catIds, userId) => [
    {
        name: 'Áo thun nam cao cấp',
        slug: 'ao-thun-nam-cao-cap',
        description: 'Áo thun 100% cotton, mềm mịn, thấm hút tốt.',
        shortDescription: 'Áo thun cá tính cho nam',
        brand: 'Sunwear',
        category: catIds['Thời trang nam'],
        tags: ['ao-thun', 'nam', 'cotton'],
        status: 'active',
        featured: true,
        rating: { average: 4.6, count: 220 },
        seo: { title: 'Áo thun nam cao cấp', description: 'Áo thun phông cao cấp', keywords: ['ao thun', 'thoi trang nam'] },
        createdBy: userId,
        updatedBy: userId,
        variants: [
            { sku: 'ATN-S-TRANG-001', attributes: { size: 'S', color: 'Trắng' }, price: 189000, compareAtPrice: 249000, stock: 45, isActive: true },
            { sku: 'ATN-M-DEN-001', attributes: { size: 'M', color: 'Đen' }, price: 189000, stock: 60, isActive: true },
            { sku: 'ATN-L-XANH-001', attributes: { size: 'L', color: 'Xanh' }, price: 189000, stock: 30, isActive: true }
        ]
    },
    {
        name: 'Giày thể thao chạy bộ',
        slug: 'giay-the-thao-chay-bo',
        description: 'Giày chạy bộ TPU + mesh thoáng mát.',
        shortDescription: 'Giày thể thao unisex',
        brand: 'RoadRunner',
        category: catIds['Thời trang nam'],
        tags: ['giay', 'the-thao', 'chay-bo'],
        status: 'active',
        featured: true,
        rating: { average: 4.8, count: 340 },
        seo: { title: 'Giày RoadRunner', description: 'Giày chạy bộ êm chân', keywords: ['giay chay bo', 'giay the thao'] },
        createdBy: userId,
        updatedBy: userId,
        variants: [
            { sku: 'GTR-40-DO-001', attributes: { size: '40', color: 'Đỏ' }, price: 899000, compareAtPrice: 999000, stock: 28, isActive: true },
            { sku: 'GTR-41-DEN-001', attributes: { size: '41', color: 'Đen' }, price: 899000, stock: 8, isActive: true },
            { sku: 'GTR-42-XANH-001', attributes: { size: '42', color: 'Xanh' }, price: 899000, stock: 14, isActive: true }
        ]
    },
    {
        name: 'Tai nghe Bluetooth chống ồn',
        slug: 'tai-nghe-bluetooth-chong-on',
        description: 'Tai nghe ANC, 30h pin, mic kép, kết nối 2 thiết bị.',
        shortDescription: 'Tai nghe không dây chống ồn',
        brand: 'SoundSphere',
        category: catIds['Điện tử'],
        tags: ['audio', 'tai-nghe', 'bluetooth'],
        status: 'active',
        featured: false,
        rating: { average: 4.5, count: 110 },
        seo: { title: 'Tai nghe ANC', description: 'Tai nghe Bluetooth cao cấp', keywords: ['tai nghe anc', 'tai nghe bluetooth'] },
        createdBy: userId,
        updatedBy: userId,
        variants: [
            { sku: 'TNANC-BLACK-001', attributes: { color: 'Đen' }, price: 1299000, compareAtPrice: 1599000, stock: 80, isActive: true },
            { sku: 'TNANC-WHITE-001', attributes: { color: 'Trắng' }, price: 1299000, stock: 54, isActive: true }
        ]
    },
    {
        name: 'Laptop văn phòng 14 inch',
        slug: 'laptop-van-phong-14-inch',
        description: 'Core i5 12th Gen, 16GB RAM, 512GB SSD.',
        shortDescription: 'Laptop doanh nghiệp hiệu năng ổn',
        brand: 'OfficeTech',
        category: catIds['Laptop'],
        tags: ['laptop', 'van-phong', 'may-tinh'],
        status: 'active',
        featured: false,
        rating: { average: 4.2, count: 58 },
        seo: { title: 'Laptop OfficeTech', description: 'Laptop tốt cho văn phòng', keywords: ['laptop i5', 'laptop 14 inch'] },
        createdBy: userId,
        updatedBy: userId,
        variants: [
            { sku: 'LTP-14I5-16-512-001', attributes: { cpu: 'i5-1240P', ram: '16GB', ssd: '512GB' }, price: 16990000, stock: 22, isActive: true }
        ]
    },
    {
        name: 'Bộ nồi inox 5 món',
        slug: 'bo-noi-inox-5-mon',
        description: 'Inox 304 chống gỉ, nắp kính cường lực.',
        shortDescription: 'Bộ nồi inox gia đình',
        brand: 'ChefMaster',
        category: catIds['Đồ gia dụng'],
        tags: ['bo-noi', 'inox', 'nhabep'],
        status: 'active',
        featured: false,
        rating: { average: 4.3, count: 89 },
        seo: { title: 'Bộ nồi ChefMaster', description: 'Bộ nồi inox chất lượng', keywords: ['bo noi inox', 'noi inox'] },
        createdBy: userId,
        updatedBy: userId,
        variants: [{ sku: 'NOI-5MON-001', attributes: { material: 'Inox 304', set: '5 món' }, price: 1890000, stock: 100, isActive: true }]
    },
    {
        name: 'Điện thoại Android 6.7 inch',
        slug: 'dien-thoai-android-6-7-inch',
        description: 'Camera 108MP, pin 5500mAh, sạc nhanh 65W.',
        shortDescription: 'Smartphone cấu hình tốt',
        brand: 'SkyPhone',
        category: catIds['Điện tử'],
        tags: ['dien-thoai', 'smartphone', 'android'],
        status: 'active',
        featured: true,
        rating: { average: 4.7, count: 410 },
        seo: { title: 'SkyPhone 6.7 inch', description: 'Điện thoại pin trâu', keywords: ['dien thoai', 'smartphone'] },
        createdBy: userId,
        updatedBy: userId,
        variants: [
            { sku: 'SP-6.7-BLUE-001', attributes: { color: 'Xanh', rom: '256GB', ram: '8GB' }, price: 8990000, compareAtPrice: 9990000, stock: 150, isActive: true },
            { sku: 'SP-6.7-BLACK-001', attributes: { color: 'Đen', rom: '256GB', ram: '8GB' }, price: 8990000, stock: 135, isActive: true }
        ]
    },
    {
        name: 'Balo du lịch chống nước',
        slug: 'balo-du-lich-chong-nuoc',
        description: 'Balo 30L, nhiều ngăn, đệm lưng êm.',
        shortDescription: 'Balo du lịch/đi học chống nước',
        brand: 'TravelPro',
        category: catIds['Phụ kiện'],
        tags: ['balo', 'du-lich', 'chong-nuoc'],
        status: 'active',
        featured: false,
        rating: { average: 4.4, count: 176 },
        seo: { title: 'Balo TravelPro', description: 'Balo đa chức năng', keywords: ['balo du lich', 'balo chong nuoc'] },
        createdBy: userId,
        updatedBy: userId,
        variants: [
            { sku: 'BALO-30-BLACK-001', attributes: { color: 'Đen', capacity: '30L' }, price: 650000, stock: 42, isActive: true },
            { sku: 'BALO-30-GRAY-001', attributes: { color: 'Xám', capacity: '30L' }, price: 650000, stock: 26, isActive: true }
        ]
    },
    {
        name: 'Đồng hồ thông minh',
        slug: 'dong-ho-thong-minh',
        description: 'Màn hình AMOLED, đo nhịp tim/SpO2, GPS.',
        shortDescription: 'Smartwatch đa chức năng',
        brand: 'HealthTrack',
        category: catIds['Phụ kiện'],
        tags: ['dong-ho', 'smartwatch', 'wearable'],
        status: 'active',
        featured: true,
        rating: { average: 4.5, count: 198 },
        seo: { title: 'HealthTrack Smartwatch', description: 'Đồng hồ thông minh', keywords: ['smartwatch', 'dong ho thong minh'] },
        createdBy: userId,
        updatedBy: userId,
        variants: [
            { sku: 'DH-ANDROID-BLACK-001', attributes: { color: 'Đen' }, price: 1890000, stock: 95, isActive: true },
            { sku: 'DH-ANDROID-PINK-001', attributes: { color: 'Hồng' }, price: 1890000, stock: 68, isActive: true }
        ]
    },
    {
        name: 'Máy xay sinh tố 1200W',
        slug: 'may-xay-sinh-to-1200w',
        description: 'Cối thủy tinh 1.5L, 6 lưỡi inox, nhiều chế độ xay.',
        shortDescription: 'Máy xay gia đình',
        brand: 'KitchenMax',
        category: catIds['Đồ gia dụng'],
        tags: ['may-xay', 'nha-bep', 'sam-vat'],
        status: 'active',
        featured: false,
        rating: { average: 4.1, count: 37 },
        seo: { title: 'Máy xay KitchenMax', description: 'Máy xay công suất lớn', keywords: ['may xay sinh to', '1200W'] },
        createdBy: userId,
        updatedBy: userId,
        variants: [{ sku: 'MX1200-01', attributes: { power: '1200W', volume: '1.5L' }, price: 1299000, stock: 47, isActive: true }]
    },
    {
        name: 'Ghế chơi game ergonomics',
        slug: 'ghe-choi-game-ergonomics',
        description: 'Ghế gaming tựa lưng 4D, đệm mút, tải 150kg.',
        shortDescription: 'Ghế game êm ái',
        brand: 'GamerBase',
        category: catIds['Phụ kiện'],
        tags: ['ghe', 'gaming', 'ergonomics'],
        status: 'active',
        featured: true,
        rating: { average: 4.7, count: 72 },
        seo: { title: 'Ghế GamerBase', description: 'Ghế chơi game cao cấp', keywords: ['ghe game', 'ghe ergon'] },
        createdBy: userId,
        updatedBy: userId,
        variants: [{ sku: 'GHENG-01', attributes: { color: 'Đen/Xanh' }, price: 3490000, stock: 32, isActive: true }]
    }
];

const runSeed = async () => {
    try {
        console.log('Kết nối MongoDB...');
        await connectDB();

        console.log('Xóa dữ liệu cũ...');
        await Promise.all([
            User.deleteMany({}),
            Category.deleteMany({}),
            Brand.deleteMany({}),
            ProductAttribute.deleteMany({}),
            Product.deleteMany({})
        ]);

        console.log('Tạo users...');
        const hashedAdmin = await bcrypt.hash(usersData[0].password, 10);
        const hashedCust = await bcrypt.hash(usersData[1].password, 10);
        const users = await User.insertMany([
            { ...usersData[0], password: hashedAdmin },
            { ...usersData[1], password: hashedCust }
        ]);

        const adminUserId = users[0]._id;

        console.log('Tạo categories...');
        const categories = await Category.insertMany(categoryData.map(c => ({ ...c, createdBy: adminUserId, updatedBy: adminUserId })));
        const categoryMap = categories.reduce((acc, category) => {
            acc[category.name] = category._id;
            return acc;
        }, {});

        console.log('Tạo brands...');
        await Brand.insertMany(brandData.map((b, ix) => ({ ...b, createdBy: adminUserId, updatedBy: adminUserId, order: ix + 1 })));

        console.log('Tạo product attributes...');
        await ProductAttribute.insertMany(attributeData.map(attr => ({ ...attr, createdBy: adminUserId, updatedBy: adminUserId })));

        console.log('Tạo 10 products...');
        const products = productData(categoryMap, adminUserId);
        await Product.insertMany(products);

        console.log('Seed hoàn tất ✅');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi khi seed:', error);
        process.exit(1);
    }
};

runSeed();
