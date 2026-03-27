# ⚡ Quick Reference - Copy & Paste Ready

## 🚀 Quick Start (5 phút)

### 1. Database Setup (MongoDB Compass)
```javascript
// Paste into MongoDB Compass > Collections > products > Aggregations

// Click "Add Stage" > $match
{
  "name": "Laptop Pro 1"
}

// Find & copy product ID
```

---

## 📦 cURL Commands - Ready to Copy-Paste

### Test 1: Lấy sản phẩm theo Category
```bash
curl -X GET "http://localhost:3000/api/products/category/507f1f77bcf86cd799439011?page=1&limit=20" \
  -H "Content-Type: application/json"
```

### Test 2: Lấy sản phẩm + Sắp xếp theo giá
```bash
curl -X GET "http://localhost:3000/api/products/category/507f1f77bcf86cd799439011?sort=price_asc&limit=20" \
  -H "Content-Type: application/json"
```

### Test 3: Lọc theo giá
```bash
curl -X GET "http://localhost:3000/api/products/category/507f1f77bcf86cd799439011?minPrice=20000000&maxPrice=40000000&limit=20" \
  -H "Content-Type: application/json"
```

### Test 4: Lấy Filter Options (Brands, Price Range)
```bash
curl -X GET "http://localhost:3000/api/products/category/507f1f77bcf86cd799439011/filters" \
  -H "Content-Type: application/json"
```

### Test 5: Lấy Category Stats
```bash
curl -X GET "http://localhost:3000/api/products/category-stats/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json"
```

### Test 6: Tìm kiếm Toàn bộ (Search)
```bash
curl -X GET "http://localhost:3000/api/products/search?q=laptop&page=1&limit=10" \
  -H "Content-Type: application/json"
```

### Test 7: Test Pagination - Page 2
```bash
curl -X GET "http://localhost:3000/api/products/category/507f1f77bcf86cd799439011?page=2&limit=10" \
  -H "Content-Type: application/json"
```

### Test 8: Kết hợp nhiều filters
```bash
curl -X GET "http://localhost:3000/api/products/category/507f1f77bcf86cd799439011?minPrice=20000000&maxPrice=40000000&sort=price_desc&search=gaming" \
  -H "Content-Type: application/json"
```

---

## 🎯 Validate Response Format

### ✅ Test 1 Expected Response
```json
{
  "success": true,
  "message": "Lấy sản phẩm theo danh mục thành công",
  "data": {
    "category": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Computers",
      "slug": "computers"
    },
    "breadcrumb": [
      {"id": "...", "name": "Electronics", "slug": "electronics"},
      {"id": "...", "name": "Computers", "slug": "computers"}
    ],
    "products": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 80,
      "totalPages": 4,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "subcategories": [
      {"id": "...", "name": "Laptops", "productCount": 50},
      {"id": "...", "name": "Desktops", "productCount": 30}
    ]
  }
}
```

### ✅ Test 4 Expected Response (Filters)
```json
{
  "success": true,
  "data": {
    "brands": ["Apple", "Intel", "NVIDIA"],
    "priceRange": {
      "min": 15000000,
      "max": 50000000
    },
    "subcategories": [
      {"id": "...", "name": "Laptops", "productCount": 50},
      {"id": "...", "name": "Desktops", "productCount": 30}
    ]
  }
}
```

### ✅ Test 5 Expected Response (Stats)
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Computers",
    "slug": "computers",
    "productCount": 80,
    "breadcrumb": [
      {"id": "...", "name": "Electronics"}
    ],
    "children": [
      {"id": "...", "name": "Laptops", "productCount": 50},
      {"id": "...", "name": "Desktops", "productCount": 30}
    ]
  }
}
```

---

## 🔍 Validate Checklist

### For Test 1 (Products by Category)
- [ ] HTTP Status = 200
- [ ] `success` = true
- [ ] `breadcrumb` không trống (có 2 items: Electronics > Computers)
- [ ] `products` array có items (limit=20 → 20 items trên page 1)
- [ ] `pagination.totalItems` = 80 (50 laptops + 30 desktops)
- [ ] `subcategories` có 2 items
- [ ] Mỗi product có `_id`, `name`, `price`

### For Test 4 (Filters)
- [ ] HTTP Status = 200
- [ ] `brands` array không trống
- [ ] `priceRange.min` < `priceRange.max`
- [ ] `subcategories` có ít nhất 2 items
- [ ] Mỗi subcategory có `productCount` > 0

### For Test 5 (Stats)
- [ ] HTTP Status = 200
- [ ] `productCount` = 80
- [ ] `breadcrumb` array không trống
- [ ] `children` array có ít nhất 2 items
- [ ] Category info (name, slug, description) có đầy đủ

---

## ⏱️ Performance Benchmarks

Mục tiêu performance:

| Endpoint | Expected | Target |
|----------|----------|--------|
| GET /products/category/:id | < 100ms | ✅ |
| GET /products/category/:id/filters | < 50ms | ✅ |
| GET /products/category-stats/:id | < 100ms | ✅ |
| GET /products/search | < 150ms | ✅ |
| GET /products | < 100ms | ✅ |

Kiểm tra với curl:
```bash
time curl -s "http://localhost:3000/api/products/category/507f1f77bcf86cd799439011" > /dev/null
# Kiểm tra dòng "real" - phải < 0.2s
```

---

## 🐛 Quick Troubleshoot

| Error | Nguyên nhân | Fix |
|-------|-----------|-----|
| `404 Danh mục không tồn tại` | Category ID sai | Copy ID từ MongoDB |
| `Empty products array` | Category chưa có sản phẩm | Insert test products |
| `/search not found` | Routes ordering sai | Check routes file |
| `Slow response (> 500ms)` | Missing indexes | Run create indexes |
| `Cannot populate category` | Category reference broken | Check product.category |

---

## 📝 MongoDB Setup Commands

```javascript
// Connect to mongosh
// Paste into mongosh terminal

// 1. Tạo category gốc
db.categories.insertOne({
  name: "Electronics",
  slug: "electronics",
  status: "active",
  createdBy: ObjectId("YOUR_USER_ID")
})

// Lấy _id từ kết quả (ví dụ: 123abc...)
const ELECTRONICS_ID = "523abc..."

// 2. Tạo subcategory
db.categories.insertOne({
  name: "Computers",
  slug: "computers",
  parent: ObjectId(ELECTRONICS_ID),
  status: "active",
  createdBy: ObjectId("YOUR_USER_ID")
})

// 3. Insert 10 test products
db.products.insertMany(Array.from({length: 10}, (_, i) => ({
  name: `Test Product ${i+1}`,
  slug: `test-product-${i+1}`,
  description: `Description ${i+1}`,
  category: ObjectId(ELECTRONICS_ID),
  price: 1000000 + i * 100000,
  stock: 10,
  variants: [{
    sku: `SKU-${i+1}`,
    price: 1000000 + i * 100000,
    stock: 10,
    attributes: {}
  }],
  createdBy: ObjectId("YOUR_USER_ID"),
  deleted: false
})))

// 4. Verify
db.products.countDocuments({category: ObjectId(ELECTRONICS_ID)})
// Output: 10
```

---

## 🎬 Test Workflow (5 phút)

1. **Setup (1 min)**
   ```bash
   # Server chạy
   npm run dev
   ```

2. **Database (1 min)**
   - Mở MongoDB Compass
   - Paste MongoDB commands ở trên
   - Verify: có 10 products

3. **Test (3 min)**
   - Copy-paste cURL commands
   - Check response format
   - Validate data

**Hoặc dùng Postman**
- Import `Category-Filtering-API.postman_collection.json`
- Click "Send" × 5 endpoints
- Done! ✅

---

## 📱 Example Response Output

```bash
# Run this
curl -s "http://localhost:3000/api/products/category/123abc/filters" | jq '.'

# Output should look like:
{
  "success": true,
  "message": "Lấy các tùy chọn lọc thành công",
  "data": {
    "brands": [
      "Apple",
      "Dell",
      "HP"
    ],
    "priceRange": {
      "min": 10000000,
      "max": 50000000
    },
    "subcategories": [
      {
        "id": "456def",
        "name": "Laptops",
        "slug": "laptops",
        "productCount": 5
      }
    ]
  }
}
```

---

## Next Steps

✅ Test các endpoint trên  
✅ Verify response format  
✅ Check performance < 200ms  
✅ Deploy to production 🎉
