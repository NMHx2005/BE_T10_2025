#!/bin/bash

# ==============================================================
# CATEGORY PRODUCT FILTERING API - CURL TEST EXAMPLES
# ==============================================================
# 
# Sử dụng file này để test các endpoint category filtering
# Chạy: bash test-category-api.sh
# 
# Giả định server chạy tại http://localhost:3000
# ==============================================================

BASE_URL="http://localhost:3000/api/products"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   Category Product Filtering API Tests${NC}"
echo -e "${BLUE}============================================${NC}\n"

# ==============================================================
# NOTE: Thay thế category IDs bên dưới bằng ID thực từ database
# ==============================================================
ELECTRONICS_ID="507f1f77bcf86cd799439001"
COMPUTERS_ID="507f1f77bcf86cd799439011"
LAPTOPS_ID="507f1f77bcf86cd799439021"

echo -e "${YELLOW}ℹ️  Thay thế category IDs với ID thực từ database của bạn${NC}\n"

# ==============================================================
# TEST 1: GET /api/products/category/:categoryId
# ==============================================================
echo -e "${BLUE}📍 TEST 1: Lấy sản phẩm theo category${NC}"
echo -e "${YELLOW}GET /api/products/category/:categoryId?page=1&limit=10\n${NC}"

curl -X GET "${BASE_URL}/category/${LAPTOPS_ID}?page=1&limit=10" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

# ==============================================================
# TEST 2: GET /api/products/category/:categoryId với sort
# ==============================================================
echo -e "${BLUE}📍 TEST 2: Lấy sản phẩm với sort theo giá${NC}"
echo -e "${YELLOW}GET /api/products/category/:categoryId?sort=price_asc&limit=20\n${NC}"

curl -X GET "${BASE_URL}/category/${LAPTOPS_ID}?sort=price_asc&limit=20" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

# ==============================================================
# TEST 3: GET /api/products/category/:categoryId với price filter
# ==============================================================
echo -e "${BLUE}📍 TEST 3: Lọc sản phẩm theo giá${NC}"
echo -e "${YELLOW}GET /api/products/category/:categoryId?minPrice=20000000&maxPrice=50000000\n${NC}"

curl -X GET "${BASE_URL}/category/${LAPTOPS_ID}?minPrice=20000000&maxPrice=50000000&limit=20" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

# ==============================================================
# TEST 4: GET /api/products/category/:categoryId/filters
# ==============================================================
echo -e "${BLUE}📍 TEST 4: Lấy filter options cho category${NC}"
echo -e "${YELLOW}GET /api/products/category/:categoryId/filters\n${NC}"

curl -X GET "${BASE_URL}/category/${COMPUTERS_ID}/filters" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

# ==============================================================
# TEST 5: GET /api/products/category-stats/:categoryId
# ==============================================================
echo -e "${BLUE}📍 TEST 5: Lấy thống kê category${NC}"
echo -e "${YELLOW}GET /api/products/category-stats/:categoryId\n${NC}"

curl -X GET "${BASE_URL}/category-stats/${COMPUTERS_ID}" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

# ==============================================================
# TEST 6: GET /api/products/search (Fixed)
# ==============================================================
echo -e "${BLUE}📍 TEST 6: Full-text search${NC}"
echo -e "${YELLOW}GET /api/products/search?q=laptop\n${NC}"

curl -X GET "${BASE_URL}/search?q=laptop&page=1&limit=10" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

# ==============================================================
# TEST 7: GET /api/products với category filter
# ==============================================================
echo -e "${BLUE}📍 TEST 7: General product listing với category filter${NC}"
echo -e "${YELLOW}GET /api/products?category=:categoryId&page=1&limit=20\n${NC}"

curl -X GET "${BASE_URL}?category=${ELECTRONICS_ID}&page=1&limit=20" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

# ==============================================================
# TEST 8: Pagination test
# ==============================================================
echo -e "${BLUE}📍 TEST 8: Test pagination - Page 2${NC}"
echo -e "${YELLOW}GET /api/products/category/:categoryId?page=2&limit=10\n${NC}"

curl -X GET "${BASE_URL}/category/${LAPTOPS_ID}?page=2&limit=10" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

# ==============================================================
# TEST 9: Multiple filters
# ==============================================================
echo -e "${BLUE}📍 TEST 9: Kết hợp nhiều filter${NC}"
echo -e "${YELLOW}GET /api/products/category/:categoryId?minPrice=10000000&maxPrice=40000000&sort=price_desc&limit=15\n${NC}"

curl -X GET "${BASE_URL}/category/${LAPTOPS_ID}?minPrice=10000000&maxPrice=40000000&sort=price_desc&limit=15" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

# ==============================================================
# TEST 10: Search within category (Combined)
# ==============================================================
echo -e "${BLUE}📍 TEST 10: Tìm kiếm trong category${NC}"
echo -e "${YELLOW}GET /api/products/category/:categoryId?search=gaming\n${NC}"

curl -X GET "${BASE_URL}/category/${LAPTOPS_ID}?search=gaming&limit=20" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

# ==============================================================
# SUMMARY
# ==============================================================
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ Test suite hoàn thành!${NC}"
echo -e "${GREEN}============================================${NC}\n"

echo -e "${YELLOW}📝 Lưu ý các API endpoint chính:${NC}"
echo "1. GET /api/products/category/:categoryId - Lấy sản phẩm của category"
echo "2. GET /api/products/category/:categoryId/filters - Lấy filter options"
echo "3. GET /api/products/category-stats/:categoryId - Lấy thống kê category"
echo "4. GET /api/products/search - Tìm kiếm full-text (đã fix route ordering)"
echo "5. GET /api/products - Lấy sản phẩm (giờ hỗ trợ category filter)"

echo -e "\n${YELLOW}💡 Tips:${NC}"
echo "- Thay thế ELECTRONICS_ID, COMPUTERS_ID, LAPTOPS_ID bằng ID thực"
echo "- Chạy từng test riêng lẻ hoặc toàn bộ script"
echo "- Kiểm tra response time để đánh giá performance"
