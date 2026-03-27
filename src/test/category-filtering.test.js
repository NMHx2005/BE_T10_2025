/**
 * TEST FILE: Category Product Filtering API
 * 
 * Chứa các test cases cho:
 * - getProductsByCategory
 * - getCategoryStats
 * - getCategoryFilters
 * - Performance test
 */

import mongoose from 'mongoose';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import User from '../../models/User.js';

/**
 * SETUP: Tạo test data
 */
const setupTestData = async () => {
    console.log('🔧 Đang tạo test data...');

    try {
        // Xóa data cũ
        await Product.deleteMany({});
        await Category.deleteMany({});

        // Tạo user (createdBy)
        let user = await User.findOne({ email: 'admin@test.com' });
        if (!user) {
            user = await User.create({
                name: 'Admin Test',
                email: 'admin@test.com',
                password: 'test123456!',
                role: 'admin'
            });
        }

        // Tạo category tree
        const electronics = await Category.create({
            name: 'Electronics',
            slug: 'electronics',
            description: 'Thiết bị điện tử',
            status: 'active',
            order: 1,
            createdBy: user._id
        });

        const computers = await Category.create({
            name: 'Computers',
            slug: 'computers',
            description: 'Máy tính',
            parent: electronics._id,
            status: 'active',
            order: 1,
            createdBy: user._id
        });

        const laptops = await Category.create({
            name: 'Laptops',
            slug: 'laptops',
            description: 'Máy tính xách tay',
            parent: computers._id,
            status: 'active',
            order: 1,
            createdBy: user._id
        });

        const desktops = await Category.create({
            name: 'Desktops',
            slug: 'desktops',
            description: 'Máy tính để bàn',
            parent: computers._id,
            status: 'active',
            order: 2,
            createdBy: user._id
        });

        const phones = await Category.create({
            name: 'Phones',
            slug: 'phones',
            description: 'Điện thoại',
            parent: electronics._id,
            status: 'active',
            order: 2,
            createdBy: user._id
        });

        // Tạo 50 sản phẩm laptop
        console.log('📦 Tạo 50 sản phẩm laptop...');
        const laptopProducts = [];
        for (let i = 1; i <= 50; i++) {
            laptopProducts.push({
                name: `Laptop Pro ${i}`,
                slug: `laptop-pro-${i}`,
                description: `Laptop cao cấp model ${i}`,
                category: laptops._id,
                price: 15000000 + i * 100000,
                stock: Math.floor(Math.random() * 100),
                variants: [{
                    sku: `LP-${i}`,
                    price: 15000000 + i * 100000,
                    stock: Math.floor(Math.random() * 100),
                    attributes: { storage: '256GB', ram: '8GB' }
                }],
                createdBy: user._id,
                rating: {
                    average: Math.random() * 5,
                    count: Math.floor(Math.random() * 100)
                }
            });
        }
        await Product.insertMany(laptopProducts);

        // Tạo 30 sản phẩm desktop
        console.log('📦 Tạo 30 sản phẩm desktop...');
        const desktopProducts = [];
        for (let i = 1; i <= 30; i++) {
            desktopProducts.push({
                name: `Desktop Master ${i}`,
                slug: `desktop-master-${i}`,
                description: `Desktop gaming model ${i}`,
                category: desktops._id,
                price: 25000000 + i * 150000,
                stock: Math.floor(Math.random() * 100),
                variants: [{
                    sku: `DT-${i}`,
                    price: 25000000 + i * 150000,
                    stock: Math.floor(Math.random() * 100),
                    attributes: { storage: '512GB', ram: '16GB' }
                }],
                createdBy: user._id,
                rating: {
                    average: Math.random() * 5,
                    count: Math.floor(Math.random() * 100)
                }
            });
        }
        await Product.insertMany(desktopProducts);

        // Tạo 40 sản phẩm điện thoại
        console.log('📦 Tạo 40 sản phẩm điện thoại...');
        const phoneProducts = [];
        for (let i = 1; i <= 40; i++) {
            phoneProducts.push({
                name: `Smartphone X${i}`,
                slug: `smartphone-x${i}`,
                description: `Điện thoại thông minh model X${i}`,
                category: phones._id,
                price: 8000000 + i * 50000,
                stock: Math.floor(Math.random() * 100),
                variants: [{
                    sku: `SP-${i}`,
                    price: 8000000 + i * 50000,
                    stock: Math.floor(Math.random() * 100),
                    attributes: { storage: '128GB', ram: '4GB' }
                }],
                createdBy: user._id,
                rating: {
                    average: Math.random() * 5,
                    count: Math.floor(Math.random() * 100)
                }
            });
        }
        await Product.insertMany(phoneProducts);

        console.log('✅ Test data setup hoàn thành!');
        console.log(`  - Electronics category: ${electronics._id}`);
        console.log(`  - Computers category (child): ${computers._id}`);
        console.log(`  - Laptops category (grandchild): ${laptops._id}`);
        console.log(`  - Total products: 120`);

        return {
            electronics,
            computers,
            laptops,
            desktops,
            phones,
            user
        };
    } catch (error) {
        console.error('❌ Lỗi khi setup test data:', error);
        throw error;
    }
};

/**
 * TEST 1: Category Tree Filtering Performance
 */
const testCategoryTreeFiltering = async (categories) => {
    console.log('\n\n📊 TEST 1: Category Tree Filtering Performance\n');

    try {
        const startTime = Date.now();

        // Query sản phẩm của laptops category (grandchild)
        const products = await Product.find({
            category: categories.laptops._id,
            deleted: { $ne: true }
        })
            .populate('category', 'name slug')
            .limit(20);

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`✓ Query sản phẩm laptop category`);
        console.log(`  - Kết quả: ${products.length} sản phẩm`);
        console.log(`  - Thời gian: ${duration}ms`);

        if (duration < 100) {
            console.log('  ✅ PASS: Performance tốt (< 100ms)');
        } else {
            console.log('  ⚠️  WARNING: Performance chưa tối ưu (> 100ms)');
        }
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    }
};

/**
 * TEST 2: Category Stats Aggregation
 */
const testCategoryStats = async (categories) => {
    console.log('\n\n📊 TEST 2: Category Stats Aggregation\n');

    try {
        // Test aggregation cho price range
        const startTime = Date.now();

        const priceStats = await Product.aggregate([
            {
                $match: {
                    category: categories.computers._id,
                    deleted: { $ne: true }
                }
            },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' },
                    avgPrice: { $avg: '$price' },
                    totalProducts: { $sum: 1 }
                }
            }
        ]);

        const endTime = Date.now();
        const duration = endTime - startTime;

        if (priceStats.length > 0) {
            const stats = priceStats[0];
            console.log(`✓ Price range aggregation cho Computers category`);
            console.log(`  - Min Price: ${stats.minPrice}`);
            console.log(`  - Max Price: ${stats.maxPrice}`);
            console.log(`  - Avg Price: ${Math.round(stats.avgPrice)}`);
            console.log(`  - Total Products: ${stats.totalProducts}`);
            console.log(`  - Thời gian: ${duration}ms`);

            if (duration < 50) {
                console.log('  ✅ PASS: Aggregation performance tốt (< 50ms)');
            } else {
                console.log('  ⚠️  WARNING: Aggregation chưa tối ưu (> 50ms)');
            }
        }
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    }
};

/**
 * TEST 3: Pagination Performance
 */
const testPaginationPerformance = async (categories) => {
    console.log('\n\n📊 TEST 3: Pagination Performance\n');

    try {
        // Test các page khác nhau
        const pages = [1, 5, 10];
        const limit = 10;

        for (const page of pages) {
            const skip = (page - 1) * limit;
            const startTime = Date.now();

            const products = await Product.find({
                category: categories.laptops._id,
                deleted: { $ne: true }
            })
                .skip(skip)
                .limit(limit)
                .lean();

            const endTime = Date.now();
            const duration = endTime - startTime;

            console.log(`✓ Page ${page} (skip: ${skip}, limit: ${limit})`);
            console.log(`  - Kết quả: ${products.length} sản phẩm`);
            console.log(`  - Thời gian: ${duration}ms`);
        }
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    }
};

/**
 * TEST 4: Index Effectiveness
 */
const testIndexEffectiveness = async (categories) => {
    console.log('\n\n📊 TEST 4: Index Effectiveness\n');

    try {
        // Test với .explain() để xem query plan
        console.log('ℹ️  Checking query plan cho category filter...');

        const explanation = await Product.find({
            category: categories.laptops._id,
            deleted: { $ne: true }
        }).explain('executionStats');

        // Check xem có sử dụng index không
        const executionStages = explanation.executionStats.executionStages;
        const stagedType = executionStages.stage;

        console.log(`✓ Query execution stage: ${stagedType}`);

        if (stagedType.includes('COLLSCAN')) {
            console.log('  ⚠️  WARNING: Sử dụng COLLECTION SCAN (không tốt)');
        } else if (stagedType.includes('IXSCAN')) {
            console.log('  ✅ PASS: Sử dụng INDEX SCAN (tốt)');
        }

        const docsExamined = explanation.executionStats.totalDocsExamined;
        const docsReturned = explanation.executionStats.nReturned;
        const efficiency = docsReturned > 0 ? (docsReturned / docsExamined * 100).toFixed(2) : 0;

        console.log(`  - Docs examined: ${docsExamined}`);
        console.log(`  - Docs returned: ${docsReturned}`);
        console.log(`  - Efficiency: ${efficiency}%`);

        if (efficiency > 80) {
            console.log('  ✅ PASS: Query efficiency cao (> 80%)');
        } else if (efficiency > 50) {
            console.log('  ⚠️  WARNING: Query efficiency trung bình (50-80%)');
        } else {
            console.log('  ❌ FAIL: Query efficiency thấp (< 50%)');
        }
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    }
};

/**
 * TEST 5: Multi-level Category Filter
 */
const testMultilevelCategoryFilter = async (categories) => {
    console.log('\n\n📊 TEST 5: Multi-level Category Filter\n');

    try {
        // Query với category tree (Computers -> cả Laptops và Desktops)
        const startTime = Date.now();

        const computerSubcategories = await Category.find({
            parent: categories.computers._id,
            status: 'active'
        }, '_id');

        const computerIds = [categories.computers._id, ...computerSubcategories.map(c => c._id)];

        const products = await Product.find({
            category: { $in: computerIds },
            deleted: { $ne: true }
        })
            .select('name slug price')
            .limit(50);

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`✓ Query sản phẩm từ Computers + tất cả category con`);
        console.log(`  - Categories included: ${computerIds.length}`);
        console.log(`  - Kết quả: ${products.length} sản phẩm`);
        console.log(`  - Thời gian: ${duration}ms`);

        if (duration < 150) {
            console.log('  ✅ PASS: Multi-level filter performance tốt (< 150ms)');
        } else {
            console.log('  ⚠️  WARNING: Multi-level filter chưa tối ưu (> 150ms)');
        }
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    }
};

/**
 * RUN ALL TESTS
 */
export const runTests = async () => {
    try {
        console.log('🚀 Bắt đầu Category Filtering Performance Tests\n');

        const categories = await setupTestData();

        await testCategoryTreeFiltering(categories);
        await testCategoryStats(categories);
        await testPaginationPerformance(categories);
        await testIndexEffectiveness(categories);
        await testMultilevelCategoryFilter(categories);

        console.log('\n\n✅ Tất cả tests hoàn thành!');
    } catch (error) {
        console.error('❌ Lỗi khi chạy tests:', error);
    }
};

/**
 * MANUAL TEST: Gọi từ command line
 * node src/test/category-filtering.test.js
 */
if (import.meta.url === `file://${process.argv[1]}`) {
    await runTests();
    process.exit(0);
}
