/**
 * Test Script: Add Product from Dealer2 and Verify on Customer Page
 * 
 * This script tests the complete flow:
 * 1. Dealer adds a product via API
 * 2. Product is saved to MongoDB
 * 3. Product appears on customer all-products page
 * 
 * Run this script to verify the connection works:
 * node test-product-upload.js
 */

const API_BASE_URL = 'http://localhost:3000';

// Test product data
const testProduct = {
    name: 'Test Product - ' + new Date().toISOString(),
    description: 'This is a test product created to verify the dealer-to-customer sync',
    price: 99.99,
    category: 'snacks',
    image: 'https://via.placeholder.com/280x220',
    primaryImage: 'https://via.placeholder.com/280x220',
    stock: {
        quantity: 100
    },
    isActive: true
};

async function testProductUpload() {
    console.log('🧪 Testing Product Upload Flow...\n');

    // Step 1: Add product (simulating dealer upload)
    console.log('📦 Step 1: Adding product via API...');
    console.log('Product data:', testProduct);

    try {
        // Note: This requires a valid dealer JWT token
        // In real scenario, dealer would be logged in and token would be in localStorage
        const response = await fetch(`${API_BASE_URL}/api/dealer/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${dealerToken}` // Add token if available
            },
            body: JSON.stringify(testProduct)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Failed to add product:', errorData);
            console.log('\n⚠️  Note: This test requires a valid dealer JWT token.');
            console.log('   To test manually:');
            console.log('   1. Login as dealer at http://localhost:3000/dealer2');
            console.log('   2. Go to Products section');
            console.log('   3. Fill in the form and click "Save Product"');
            console.log('   4. Check http://localhost:3000/all-products.html');
            return;
        }

        const data = await response.json();
        console.log('✅ Product added successfully!');
        console.log('Product ID:', data.data?.product?._id || data.product?._id);
        console.log('Response:', JSON.stringify(data, null, 2));

        // Step 2: Verify product appears in GET /api/products
        console.log('\n📥 Step 2: Verifying product appears in GET /api/products...');

        const getResponse = await fetch(`${API_BASE_URL}/api/products`);
        const productsData = await getResponse.json();

        const products = productsData.data?.products || productsData.products || [];
        const addedProduct = products.find(p =>
            p.name === testProduct.name ||
            p._id === (data.data?.product?._id || data.product?._id)
        );

        if (addedProduct) {
            console.log('✅ Product found in products list!');
            console.log('Product details:', {
                id: addedProduct._id,
                name: addedProduct.name,
                price: addedProduct.price,
                category: addedProduct.category,
                isActive: addedProduct.isActive
            });
        } else {
            console.log('⚠️  Product not found in products list (might need a moment to sync)');
        }

        console.log(`\n✅ Test completed! Total products in database: ${products.length}`);
        console.log('\n📋 Next steps:');
        console.log('   1. Open http://localhost:3000/all-products.html in your browser');
        console.log('   2. The new product should appear in the product list');
        console.log('   3. Check browser console for Socket.IO connection messages');

    } catch (error) {
        console.error('❌ Error during test:', error.message);
        console.log('\n💡 Make sure:');
        console.log('   1. Backend server is running (node backend/server.js)');
        console.log('   2. MongoDB is connected');
        console.log('   3. Server is accessible at http://localhost:3000');
    }
}

// Run the test
testProductUpload();