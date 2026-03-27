# 🧪 Hướng dẫn Test Category Filtering API

## 📋 Mục lục
1. [Chuẩn bị dữ liệu](#chuẩn-bị-dữ-liệu)
2. [Test với Postman](#test-với-postman)
3. [Test với cURL](#test-với-curl)
4. [Test với Bash Script](#test-với-bash-script)
5. [Chạy Performance Tests](#chạy-performance-tests)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Chuẩn Bị Dữ Liệu

### Yêu cầu:
- Server đang running: `npm start` hoặc `npm run dev`
- Database connected (MongoDB)
- Tài khoản admin đã tạo

### Bước 1: Tạo Category Tree

**Dùng MongoDB Compass hoặc mongosh:**

```javascript
// Bước 1: Lấy user ID (admin)
db.users.findOne({ role: 'admin' })
// Copy _id (ví dụ: 507f191e810c19729de860ea)

// Bước 2: Tạo category gốc (Electronics)
db.categories.insertOne({
  _id: ObjectId("507f1f77bcf86cd799439001"),
  name: "Electronics",
  slug: "electronics",
  description: "Thiết bị điện tử",
  status: "active",
  order: 1,
  featured: true,
  parent: null,
  createdBy: ObjectId("507f191e810c19729de860ea"),
  createdAt: new Date(),
  updatedAt: new Date()
})

// Bước 3: Tạo category con (Computers)
db.categories.insertOne({
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "Computers",
  slug: "computers",
  description: "Máy tính",
  status: "active",
  order: 1,
  featured: true,
  parent: ObjectId("507f1f77bcf86cd799439001"),
  createdBy: ObjectId("507f191e810c19729de860ea"),
  createdAt: new Date(),
  updatedAt: new Date()
})

// Bước 4: Tạo category con con (Laptops)
db.categories.insertOne({
  _id: ObjectId("507f1f77bcf86cd799439021"),
  name: "Laptops",
  slug: "laptops",
  description: "Máy tính xách tay",
  status: "active",
  order: 1,
  featured: true,
  parent: ObjectId("507f1f77bcf86cd799439011"),
  createdBy: ObjectId("507f191e810c19729de860ea"),
  createdAt: new Date(),
  updatedAt: new Date()
})

// Bước 5: Tạo category con con (Desktops)
db.categories.insertOne({
  _id: ObjectId("507f1f77bcf86cd799439022"),
  name: "Desktops",
  slug: "desktops",
  description: "Máy tính để bàn",
  status: "active",
  order: 2,
  featured: false,
  parent: ObjectId("507f1f77bcf86cd799439011"),
  createdBy: ObjectId("507f191e810c19729de860ea"),
  createdAt: new Date(),
  updatedAt: new Date()
})

// Bước 6: Tạo 50 sản phẩm Laptop
const laptops = [];
for (let i = 1; i <= 50; i++) {
  laptops.push({
    name: `Laptop Pro ${i}`,
    slug: `laptop-pro-${i}`,
    description: `Laptop cao cấp model ${i}`,
    category: ObjectId("507f1f77bcf86cd799439021"),
    price: 15000000 + i * 100000,
    stock: Math.floor(Math.random() * 100),
    variants: [{
      sku: `LP-${i}`,
      price: 15000000 + i * 100000,
      stock: Math.floor(Math.random() * 100),
      attributes: { storage: "256GB", ram: "8GB" },
      isActive: true
    }],
    rating: {
      average: Math.random() * 5,
      count: Math.floor(Math.random() * 100)
    },
    createdBy: ObjectId("507f191e810c19729de860ea"),
    deleted: false,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  });
}
db.products.insertMany(laptops);

// Bước 7: Tạo 30 sản phẩm Desktop
const desktops = [];
for (let i = 1; i <= 30; i++) {
  desktops.push({
    name: `Desktop Master ${i}`,
    slug: `desktop-master-${i}`,
    description: `Desktop gaming model ${i}`,
    category: ObjectId("507f1f77bcf86cd799439022"),
    price: 25000000 + i * 150000,
    stock: Math.floor(Math.random() * 100),
    variants: [{
      sku: `DT-${i}`,
      price: 25000000 + i * 150000,
      stock: Math.floor(Math.random() * 100),
      attributes: { storage: "512GB", ram: "16GB" },
      isActive: true
    }],
    rating: {
      average: Math.random() * 5,
      count: Math.floor(Math.random() * 100)
    },
    createdBy: ObjectId("507f191e810c19729de860ea"),
    deleted: false,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  });
}
db.products.insertMany(desktops);
```

✅ **Sau bước này, có 80 sản phẩm test sẵn sàng!**

---

## 📮 Test với Postman

### Cách 1: Import Collection

1. **Mở Postman** → `File` → `Import`
2. **Chọn file**: `Category-Filtering-API.postman_collection.json`
3. **Thiết lập Environment**:
   - Click vào `...` → `Manage Environments` → `Create`
   - Tên: `Local Development`
   - Variables:
     ```
     base_url = http://localhost:3000/api
     category_id = 507f1f77bcf86cd799439011 (Computers category)
     ```

### Cách 2: Run Test Requests

**Folder: Category Filtering > Test 1: Get Products by Category**

```
GET {{base_url}}/products/category/{{category_id}}?page=1&limit=10&sort=newest
```

Click **Send** → Xem Response:
```json
{
  "success": true,
  "data": {
    "category": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Computers"
    },
    "breadcrumb": [
      { "name": "Electronics" },
      { "name": "Computers" }
    ],
    "products": [...],
    "pagination": {
      "page": 1,
      "totalItems": 80,
      "totalPages": 8
    },
    "subcategories": [
      { "name": "Laptops", "productCount": 50 },
      { "name": "Desktops", "productCount": 30 }
    ]
  }
}
```

✅ **Expected: Breadcrumb + 80 sản phẩm (Laptops + Desktops)**

### Cách 3: Test từng endpoint

| # | Endpoint | Mục đích | Expected |
|---|----------|---------|----------|
| 1 | `GET /products/category/:id` | Lấy sản phẩm + breadcrumb | 80 products, breadcrumb array |
| 2 | `GET /products/category/:id/filters` | Lấy filter options | brands array, price range |
| 3 | `GET /products/category-stats/:id` | Lấy stats | productCount: 80, children array |
| 4 | `GET /products/search?q=laptop` | Tìm kiếm | Products với "laptop" |
| 5 | `GET /products?category=:id` | Filter general | 80 products |

---

## 🔌 Test với cURL

### Basic Test (Copy-paste vào Terminal)

#### Test 1: Lấy sản phẩm theo category
```bash
curl -X GET "http://localhost:3000/api/products/category/507f1f77bcf86cd799439011?page=1&limit=10" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"
```

**Expected Response:**
- ✅ Status: 200
- ✅ `success: true`
- ✅ `breadcrumb` có 2 items (Electronics > Computers)
- ✅ `products` có 10 items (page 1, limit 10)
- ✅ `pagination.totalItems: 80`
- ✅ `subcategories` có 2 items (Laptops, Desktops)

---

#### Test 2: Lọc theo giá
```bash
curl -X GET "http://localhost:3000/api/products/category/507f1f77bcf86cd799439011?minPrice=20000000&maxPrice=50000000&sort=price_asc" \
  -H "Content-Type: application/json" | jq '.'
```

**Expected:**
- ✅ Sản phẩm có giá trong khoảng 20-50 triệu
- ✅ Sort theo giá tăng dần

---

#### Test 3: Lấy filter options
```bash
curl -X GET "http://localhost:3000/api/products/category/507f1f77bcf86cd799439011/filters" \
  -H "Content-Type: application/json" | jq '.data'
```

**Expected Output:**
```json
{
  "brands": ["Apple", "Intel", ...],
  "priceRange": {
    "min": 15000000,
    "max": 50000000
  },
  "subcategories": [
    { "name": "Laptops", "productCount": 50 },
    { "name": "Desktops", "productCount": 30 }
  ]
}
```

---

#### Test 4: Lấy category stats
```bash
curl -X GET "http://localhost:3000/api/products/category-stats/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" | jq '.data'
```

**Expected:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Computers",
  "productCount": 80,
  "breadcrumb": [...],
  "children": [
    { "name": "Laptops", "productCount": 50 },
    { "name": "Desktops", "productCount": 30 }
  ]
}
```

---

#### Test 5: Full-text search (đã fix)
```bash
curl -X GET "http://localhost:3000/api/products/search?q=laptop&page=1&limit=10" \
  -H "Content-Type: application/json" | jq '.data.products | length'
```

**Expected:**
- ✅ Trả về sản phẩm chứa "laptop" trong name/description
- ✅ Không bị chặn bởi `:id` route

---

#### Test 6: Pagination
```bash
# Page 1
curl -s "http://localhost:3000/api/products/category/507f1f77bcf86cd799439011?page=1&limit=10" | jq '.data.pagination'

# Page 2
curl -s "http://localhost:3000/api/products/category/507f1f77bcf86cd799439011?page=2&limit=10" | jq '.data.pagination'
```

**Expected:**
```json
Page 1:
{
  "page": 1,
  "limit": 10,
  "totalItems": 80,
  "totalPages": 8,
  "hasNextPage": true,
  "hasPrevPage": false
}

Page 2:
{
  "page": 2,
  "totalPages": 8,
  "hasNextPage": true,
  "hasPrevPage": true
}
```

---

## 🔨 Test với Bash Script

### Chạy test script
```bash
# Vào thư mục project
cd /Users/nmh/Document\ Work/Mac/NMHx/Teaching/backend_Thinh/BE_T10_2025

# Chạy script
bash test-category-api.sh
```

**Script sẽ tự động test tất cả 10 endpoints.**

### Hoặc tạo custom bash test

**Tạo file `test-quick.sh`:**
```bash
#!/bin/bash

CATEGORY_ID="507f1f77bcf86cd799439011"
BASE="http://localhost:3000/api/products"

echo "🧪 Testing Category Filtering API\n"

# Test 1
echo "1️⃣  Get products by category"
curl -s "$BASE/category/$CATEGORY_ID?page=1&limit=5" | jq '.data | {category, pagination}'

echo "\n2️⃣  Get category filters"
curl -s "$BASE/category/$CATEGORY_ID/filters" | jq '.data'

echo "\n3️⃣  Get category stats"
curl -s "$BASE/category-stats/$CATEGORY_ID" | jq '.data | {name, productCount, children}'

echo "\n✅ Tests completed!"
```

**Chạy:**
```bash
bash test-quick.sh
```

---

## 🚀 Chạy Performance Tests

### Test 1: Chạy automated performance tests

```bash
# Node version
node src/test/category-filtering.test.js
```

**Output mong đợi:**
```
🧪 Đang tạo test data...
✅ Test data setup hoàn thành!

📊 TEST 1: Category Tree Filtering Performance
✓ Query sản phẩm laptop category
  - Kết quả: 20 sản phẩm
  - Thời gian: 45ms
  ✅ PASS: Performance tốt (< 100ms)

📊 TEST 2: Category Stats Aggregation
✓ Price range aggregation
  - Thời gian: 32ms
  ✅ PASS: Performance tốt (< 50ms)

... (3 tests khác)

✅ Tất cả tests hoàn thành!
```

### Test 2: Đo response time bằng curl

```bash
# Time endpoint này
time curl -s "http://localhost:3000/api/products/category/507f1f77bcf86cd799439011?page=1&limit=50" > /dev/null

# Output tương tự:
# real    0m0.156s
# user    0m0.032s
# sys     0m0.028s
```

**Mục tiêu:**
- ✅ Real time < 200ms (tốt)
- ⚠️ Real time 200-500ms (chấp nhận được)
- ❌ Real time > 500ms (cần optimize)

---

## ✔️ Test Checklist

Sau khi test, xác nhận:

- [ ] **Breadcrumb**: Có đầy đủ tuyến đường từ root → current category
- [ ] **Products count**: Đúng = Laptops (50) + Desktops (30) = 80
- [ ] **Pagination**: `totalPages` = ceil(80/limit)
- [ ] **Subcategories**: Hiển thị 2 subcategories với đúng product count
- [ ] **Price range**: Min & Max đúng
- [ ] **Sort**: Products sắp xếp đúng theo tham số
- [ ] **Search**: /search endpoint hoạt động (không bị /:id chặn)
- [ ] **Performance**: Tất cả request < 200ms
- [ ] **Filters**: /filters endpoint có brands, price range, subcategories
- [ ] **Stats**: /category-stats có breadcrumb & product count

---

## 🐛 Troubleshooting

### ❌ Error: "Danh mục không tồn tại"
```
Giải pháp:
1. Kiểm tra category ID có chính xác không
2. Chạy: db.categories.find() trong mongosh
3. Copy _id từ kết quả
```

### ❌ Error: "Cannot populate category"
```
Giải pháp:
1. Kiểm tra sản phẩm có category field không
2. Chạy: db.products.findOne()
3. Xem category field
```

### ❌ /search endpoint not working
```
Kiểm tra:
1. Routes sắp xếp đúng không?
   - /search phải trước /:id
2. Có text index không?
   - db.products.getIndexes()
3. Có sử dụng `q` param không?
   - /search?q=laptop ✅
   - /search?search=laptop ❌
```

### ❌ Performance chậm
```
Kiểm tra:
1. Có tạo indices không?
   - db.products.getIndexes()
2. Query plan tốt không?
   - db.products.find({category: ...}).explain('executionStats')
3. Có quá nhiều documents không?
   - db.products.countDocuments()
```

### ✅ Tất cả works perfect!
```
Chúc mừng! API production ready:
- ✅ Breadcrumb hoạt động
- ✅ Category tree filtering hoạt động
- ✅ Performance đạt chuẩn
- ✅ Pagination chính xác
- ✅ Search fixed (không bị /:id chặn)
```

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra file:
- `src/controllers/client/product.controller.js` - Controllers
- `src/services/category.service.js` - Category service
- `src/routes/api/products.route.js` - Routes config
- `docs/category-filtering-api.md` - API docs

**Console error?** → Kiểm tra imports, database connection, category/product ID
