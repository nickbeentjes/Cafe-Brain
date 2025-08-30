const { getMongoClient, logger } = require('../database');

module.exports = async function (context, req) {
  const { method, url } = req;
  const path = url.split('/').slice(-1)[0]; // Get the last part of the URL
  
  logger.info(`Products API called: ${method} ${url}`);

  try {
    // CORS headers
    context.res = {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    };

    // Handle OPTIONS requests for CORS
    if (method === 'OPTIONS') {
      context.res.status = 200;
      return;
    }

    // Route handling
    switch (method) {
      case 'GET':
        if (path === 'popular') {
          return await getPopularProducts(context);
        } else if (path === 'categories') {
          return await getProductCategories(context);
        } else if (path === 'search') {
          return await searchProducts(context, req.query);
        } else {
          return await getAllProducts(context);
        }
        break;

      case 'POST':
        return await createProduct(context, req.body);
        break;

      case 'PUT':
        return await updateProduct(context, req.body);
        break;

      case 'DELETE':
        return await deleteProduct(context, req.query.id);
        break;

      default:
        context.res.status = 405;
        context.res.body = { error: 'Method not allowed' };
        return;
    }

  } catch (error) {
    logger.error('Products API error:', error);
    context.res.status = 500;
    context.res.body = { 
      error: 'Internal server error',
      message: error.message 
    };
  }
};

// Get all products
async function getAllProducts(context) {
  const client = await getMongoClient();
  const db = client.db('cafe');
  const collection = db.collection('products');

  const products = await collection.find({}).toArray();
  
  context.res.status = 200;
  context.res.body = {
    success: true,
    data: products,
    count: products.length
  };
}

// Get popular products
async function getPopularProducts(context) {
  const client = await getMongoClient();
  const db = client.db('cafe');
  const collection = db.collection('products');

  // Get products with highest sales (you might need to join with orders)
  const products = await collection.find({})
    .sort({ sales_count: -1 })
    .limit(10)
    .toArray();
  
  context.res.status = 200;
  context.res.body = {
    success: true,
    data: products,
    count: products.length
  };
}

// Get product categories
async function getProductCategories(context) {
  const client = await getMongoClient();
  const db = client.db('cafe');
  const collection = db.collection('products');

  const categories = await collection.distinct('category');
  
  context.res.status = 200;
  context.res.body = {
    success: true,
    data: categories,
    count: categories.length
  };
}

// Search products
async function searchProducts(context, query) {
  const { q, category, min_price, max_price } = query;
  const client = await getMongoClient();
  const db = client.db('cafe');
  const collection = db.collection('products');

  let searchQuery = {};

  if (q) {
    searchQuery.$text = { $search: q };
  }

  if (category) {
    searchQuery.category = category;
  }

  if (min_price || max_price) {
    searchQuery.price = {};
    if (min_price) searchQuery.price.$gte = parseFloat(min_price);
    if (max_price) searchQuery.price.$lte = parseFloat(max_price);
  }

  const products = await collection.find(searchQuery).toArray();
  
  context.res.status = 200;
  context.res.body = {
    success: true,
    data: products,
    count: products.length
  };
}

// Create new product
async function createProduct(context, body) {
  const { name, description, price, category, image_url, square_id } = body;
  
  if (!name || !price || !category) {
    context.res.status = 400;
    context.res.body = { error: 'Missing required fields' };
    return;
  }

  const client = await getMongoClient();
  const db = client.db('cafe');
  const collection = db.collection('products');

  const product = {
    name,
    description: description || '',
    price: parseFloat(price),
    category,
    image_url: image_url || '',
    square_id: square_id || '',
    created_at: new Date(),
    updated_at: new Date(),
    sales_count: 0
  };

  const result = await collection.insertOne(product);
  
  context.res.status = 201;
  context.res.body = {
    success: true,
    data: { ...product, _id: result.insertedId }
  };
}

// Update product
async function updateProduct(context, body) {
  const { _id, name, description, price, category, image_url } = body;
  
  if (!_id) {
    context.res.status = 400;
    context.res.body = { error: 'Product ID is required' };
    return;
  }

  const client = await getMongoClient();
  const db = client.db('cafe');
  const collection = db.collection('products');

  const updateData = {
    updated_at: new Date()
  };

  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (price) updateData.price = parseFloat(price);
  if (category) updateData.category = category;
  if (image_url !== undefined) updateData.image_url = image_url;

  const result = await collection.updateOne(
    { _id: require('mongodb').ObjectId(_id) },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    context.res.status = 404;
    context.res.body = { error: 'Product not found' };
    return;
  }

  context.res.status = 200;
  context.res.body = {
    success: true,
    message: 'Product updated successfully'
  };
}

// Delete product
async function deleteProduct(context, productId) {
  if (!productId) {
    context.res.status = 400;
    context.res.body = { error: 'Product ID is required' };
    return;
  }

  const client = await getMongoClient();
  const db = client.db('cafe');
  const collection = db.collection('products');

  const result = await collection.deleteOne({ _id: require('mongodb').ObjectId(productId) });

  if (result.deletedCount === 0) {
    context.res.status = 404;
    context.res.body = { error: 'Product not found' };
    return;
  }

  context.res.status = 200;
  context.res.body = {
    success: true,
    message: 'Product deleted successfully'
  };
}
