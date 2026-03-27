# 📚 Category Product Filtering API Documentation

## 📋 Tổng Quan

Hệ thống filtering sản phẩm theo category tree với hỗ trợ:
- ✅ Lọc theo category con (descendants)
- ✅ Breadcrumb navigation
- ✅ Thống kê sản phẩm per category
- ✅ Filter options (brands, price range)
- ✅ Tối ưu performance (index, aggregation)

---

## 🔌 API Endpoints

### 1️⃣ **GET /api/products/category/:categoryId**
Lấy danh sách sản phẩm của category (bao gồm tất cả category con)

#### Request
```
GET /api/products/category/507f1f77bcf86cd799439011?page=1&limit=10&sort=newest
```

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Trang hiện tại |
| `limit` | number | 10 | Số sản phẩm per trang (max 100) |
| `sort` | string | newest | Sắp xếp: `newest`, `oldest`, `price_asc`, `price_desc`, `name_asc`, `name_desc` |
| `minPrice` | number | - | Giá tối thiểu |
| `maxPrice` | number | - | Giá tối đa |
| `brand` | string | - | Lọc theo brand |
| `search` | string | - | Tìm kiếm theo text |

#### Response
```json
{
  "success": true,
  "message": "Lấy sản phẩm theo danh mục thành công",
  "data": {
    "category": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Computers",
      "slug": "computers",
      "description": "Máy tính",
      "image": "..."
    },
    "breadcrumb": [
      {
        "id": "507f1f77bcf86cd799439001",
        "name": "Electronics",
        "slug": "electronics"
      },
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Computers",
        "slug": "computers"
      }
    ],
    "products": [
      {
        "_id": "...",
        "name": "Laptop Pro",
        "slug": "laptop-pro",
        "price": 15000000,
        "category": {
          "_id": "507f1f77bcf86cd799439021",
          "name": "Laptops",
          "slug": "laptops"
        },
        "rating": {
          "average": 4.5,
          "count": 120
        }
      }
      // ... more products
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 120,
      "totalPages": 12,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "brand": null,
      "minPrice": null,
      "maxPrice": null,
      "search": null,
      "sort": "newest"
    },
    "subcategories": [
      {
        "id": "507f1f77bcf86cd799439021",
        "name": "Laptops",
        "slug": "laptops",
        "featured": true,
        "productCount": 50
      },
      {
        "id": "507f1f77bcf86cd799439022",
        "name": "Desktops",
        "slug": "desktops",
        "featured": false,
        "productCount": 30
      }
    ]
  }
}
```

#### Example Requests
```bash
# Lấy sản phẩm Electronics category, trang 1
curl "http://localhost:3000/api/products/category/507f1f77bcf86cd799439001?page=1&limit=20"

# Lọc theo giá và sort
curl "http://localhost:3000/api/products/category/507f1f77bcf86cd799439001?minPrice=10000000&maxPrice=50000000&sort=price_asc"

# Tìm kiếm trong category
curl "http://localhost:3000/api/products/category/507f1f77bcf86cd799439001?search=laptop&page=1"
```

---

### 2️⃣ **GET /api/products/category/:categoryId/filters**
Lấy các tùy chọn filter có sẵn cho category

#### Request
```
GET /api/products/category/507f1f77bcf86cd799439011/filters
```

#### Response
```json
{
  "success": true,
  "message": "Lấy các tùy chọn lọc thành công",
  "data": {
    "brands": [
      "Apple",
      "Intel",
      "NVIDIA",
      "Corsair"
    ],
    "priceRange": {
      "min": 8000000,
      "max": 50000000
    },
    "subcategories": [
      {
        "id": "507f1f77bcf86cd799439021",
        "name": "Laptops",
        "slug": "laptops",
        "productCount": 50
      },
      {
        "id": "507f1f77bcf86cd799439022",
        "name": "Desktops",
        "slug": "desktops",
        "productCount": 30
      }
    ]
  }
}
```

#### Use Case
UI sử dụng endpoint này để populate filter dropdown, price slider, category list mà không cần hardcode.

---

### 3️⃣ **GET /api/products/category-stats/:categoryId**
Lấy thống kê chi tiết của category

#### Request
```
GET /api/products/category-stats/507f1f77bcf86cd799439011
```

#### Response
```json
{
  "success": true,
  "message": "Lấy thống kê danh mục thành công",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Computers",
    "slug": "computers",
    "description": "Máy tính",
    "image": "...",
    "icon": "laptop",
    "featured": true,
    "breadcrumb": [
      {
        "id": "507f1f77bcf86cd799439001",
        "name": "Electronics",
        "slug": "electronics"
      },
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Computers",
        "slug": "computers"
      }
    ],
    "productCount": 80,
    "children": [
      {
        "id": "507f1f77bcf86cd799439021",
        "name": "Laptops",
        "slug": "laptops",
        "productCount": 50
      },
      {
        "id": "507f1f77bcf86cd799439022",
        "name": "Desktops",
        "slug": "desktops",
        "productCount": 30
      }
    ]
  }
}
```

---

### 4️⃣ **GET /api/products** (Enhanced)
API lấy danh sách sản phẩm cũ, giờ hỗ trợ category tree filtering

#### Query Parameters
Giống như endpoint `/category/:categoryId` nhưng thêm:

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Category ID - sẽ tự động filter cả category con |

#### Example
```bash
# Lấy sản phẩm của Electronics + tất cả con category
curl "http://localhost:3000/api/products?category=507f1f77bcf86cd799439001&page=1&limit=20"
```

---

### 5️⃣ **GET /api/products/search** (Fixed)
Tìm kiếm toàn bộ sản phẩm (full-text search)

#### Request
```
GET /api/products/search?q=laptop&page=1&limit=10
```

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | **Bắt buộc** - Từ khóa tìm kiếm |
| `page` | number | Trang (default 1) |
| `limit` | number | Sản phẩm per trang (default 10) |
| `category` | string | Filter theo category |
| `brand` | string | Filter theo brand |
| `minPrice` | number | Giá tối thiểu |
| `maxPrice` | number | Giá tối đa |
| `sort` | string | Sắp xếp |

---

## 🎬 Frontend Implementation Guide

### 1. Category Navigation UI
```html
<!-- Breadcrumb từ API -->
<nav class="breadcrumb">
  <a href="/products">Trang chủ</a>
  <span>/</span>
  <a href="/category/507f1f77bcf86cd799439001">Electronics</a>
  <span>/</span>
  <a href="/category/507f1f77bcf86cd799439011">Computers</a>
</nav>

<!-- Subcategories list -->
<aside class="filters">
  <h3>Danh mục con</h3>
  <ul>
    <li><a href="/category/507f1f77bcf86cd799439021">Laptops (50)</a></li>
    <li><a href="/category/507f1f77bcf86cd799439022">Desktops (30)</a></li>
  </ul>
</aside>
```

### 2. Filter & Sorting UI
```javascript
// Lấy filter options khi load category
async function loadCategoryFilters(categoryId) {
  const res = await fetch(`/api/products/category/${categoryId}/filters`);
  const { data } = await res.json();
  
  // Populate brand dropdown
  const brandSelect = document.getElementById('brand-filter');
  data.brands.forEach(brand => {
    const option = document.createElement('option');
    option.value = brand;
    option.textContent = brand;
    brandSelect.appendChild(option);
  });
  
  // Set price slider range
  const priceSlider = document.getElementById('price-slider');
  priceSlider.min = data.priceRange.min;
  priceSlider.max = data.priceRange.max;
}

// Apply filter
async function applyFilters(categoryId) {
  const params = new URLSearchParams({
    page: 1,
    limit: 20,
    sort: document.getElementById('sort').value,
    brand: document.getElementById('brand-filter').value,
    minPrice: document.getElementById('minPrice').value,
    maxPrice: document.getElementById('maxPrice').value,
    search: document.getElementById('search').value
  });
  
  const res = await fetch(`/api/products/category/${categoryId}?${params}`);
  const { data } = await res.json();
  
  // Render products
  renderProducts(data.products);
  
  // Render pagination
  renderPagination(data.pagination);
}
```

---

## 🚀 Performance Optimization

### Database Indexes
Các index đã tạo trong Product model:
```javascript
// Text search index
productSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text',
  brand: 'text'
});

// Category filtering
productSchema.index({ category: 1, status: 1 });
productSchema.index({ brand: 1, status: 1 });
```

### Category Service Optimization
- Sử dụng `lean()` khi không cần modify document
- Sử dụng projection để chỉ lấy fields cần thiết
- Caching product count nếu volume lớn

### Query Performance Tips
1. **Pagination**: Luôn dùng skip + limit
2. **Sorting**: Đặt sort field có index (createdAt, price)
3. **Selection**: Dùng projection để giảm dung lượng response
4. **Aggregation**: Sử dụng khi cần tính toán (price range, count)

---

## 🧪 Testing

### Chạy Performance Tests
```bash
node src/test/category-filtering.test.js
```

Test coverage:
- ✅ Category tree filtering
- ✅ Category stats aggregation
- ✅ Pagination performance
- ✅ Index effectiveness
- ✅ Multi-level category filter

### Sample Test Output
```
📊 TEST 1: Category Tree Filtering Performance
✓ Query sản phẩm laptop category
  - Kết quả: 20 sản phẩm
  - Thời gian: 45ms
  ✅ PASS: Performance tốt (< 100ms)

📊 TEST 2: Category Stats Aggregation
✓ Price range aggregation cho Computers category
  - Min Price: 25000000
  - Max Price: 50000000
  - Avg Price: 38000000
  - Total Products: 80
  - Thời gian: 32ms
  ✅ PASS: Aggregation performance tốt (< 50ms)
```

---

## 🐛 Common Issues & Troubleshooting

### Issue: /search endpoint not working
**Cause**: Route `/search` bị chặn bởi `/:id`
**Solution**: Routes đã được reorder - `/search` được đặt trước `/:id`

### Issue: Category filtering trả về sản phẩm từ parent category
**Cause**: Copy-paste error - query không bao gồm descendants
**Solution**: Sử dụng `getCategoryDescendants()` service function

### Issue: Performance chậm với large category tree
**Solution**:
1. Thêm index `{ parent: 1, status: 1 }`
2. Sử dụng aggregation pipeline thay vì multiple queries
3. Cache category tree nếu stable

---

## 📝 API Changes Checklist

- ✅ Fixed typo: `mỉnPrice` → `minPrice` trong getProducts
- ✅ Fixed route ordering: `/search` trước `/:id`
- ✅ Added category tree filtering support
- ✅ Added breadcrumb navigation
- ✅ Added category stats endpoint
- ✅ Added category filters endpoint
- ✅ Added performance tests
- ✅ Added indices optimization

---

## 📞 Support

Có vấn đề? Kiểm tra:
1. Category ID valid không (24 hex chars)
2. Category status = 'active' không
3. Product deleted field = true không
4. Database indices tạo đúng không

