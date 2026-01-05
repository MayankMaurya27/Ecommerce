import React, { useContext, useEffect, useState, useMemo } from 'react'
import Layout from '../../../components/layout/Layout'
import myContext from '../../../context/data/myContext'
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDollarSign, 
  FiShoppingCart, 
  FiUsers, 
  FiPackage,
  FiAlertTriangle,
  FiBarChart2,
  FiPieChart,
  FiActivity
} from 'react-icons/fi'
import { 
  MdInventory2, 
  MdOutlineProductionQuantityLimits,
  MdInsights,
  MdShowChart
} from 'react-icons/md'

function SmartAdminDashboard() {
  const context = useContext(myContext)
  const { mode, product, order, user } = context

  // Calculate analytics
  const analytics = useMemo(() => {
    // Total Revenue
    const totalRevenue = order.reduce((sum, ord) => {
      const orderTotal = ord.cartItems?.reduce((itemSum, item) => {
        return itemSum + (parseFloat(item.price) || 0)
      }, 0) || 0
      return sum + orderTotal
    }, 0)

    // Total Orders
    const totalOrders = order.length

    // Total Products
    const totalProducts = product.length

    // Total Users
    const totalUsers = user.length

    // Calculate sales by product (for low stock detection)
    const productSales = {}
    order.forEach(ord => {
      ord.cartItems?.forEach(item => {
        if (productSales[item.title]) {
          productSales[item.title] += 1
        } else {
          productSales[item.title] = 1
        }
      })
    })

    // Low Stock Products (products with low quantity or high sales)
    const lowStockThreshold = 10 // Products with less than 10 units are considered low stock
    const lowStockProducts = product.filter(prod => {
      const salesCount = productSales[prod.title] || 0
      // If product has quantity field, use it; otherwise estimate based on sales (assume starting stock of 100)
      const quantity = prod.quantity !== undefined ? prod.quantity : Math.max(0, 100 - salesCount)
      return quantity < lowStockThreshold
    })

    // Top Selling Products
    const topProducts = Object.entries(productSales)
      .map(([title, count]) => {
        const prod = product.find(p => p.title === title)
        return {
          title,
          sales: count,
          revenue: count * (parseFloat(prod?.price) || 0),
          imageUrl: prod?.imageUrl,
          category: prod?.category
        }
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)

    // Revenue by Category
    const categoryRevenue = {}
    order.forEach(ord => {
      ord.cartItems?.forEach(item => {
        if (categoryRevenue[item.category]) {
          categoryRevenue[item.category] += parseFloat(item.price) || 0
        } else {
          categoryRevenue[item.category] = parseFloat(item.price) || 0
        }
      })
    })

    // Recent Orders (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentOrders = order.filter(ord => {
      if (!ord.date) return false
      try {
        const orderDate = new Date(ord.date)
        return orderDate >= sevenDaysAgo && !isNaN(orderDate.getTime())
      } catch {
        return false
      }
    })

    // Growth Predictions
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const ordersPerDay = recentOrders.length / 7
    const predictedMonthlyRevenue = ordersPerDay * avgOrderValue * 30
    const growthRate = recentOrders.length > 0 ? 
      ((recentOrders.length / Math.max(totalOrders - recentOrders.length, 1)) * 100).toFixed(1) : 0

    // Customer Insights
    const uniqueCustomers = new Set(order.map(ord => ord.email)).size
    const avgCustomerValue = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalUsers,
      lowStockProducts,
      topProducts,
      categoryRevenue,
      recentOrders,
      predictedMonthlyRevenue,
      growthRate,
      uniqueCustomers,
      avgCustomerValue,
      avgOrderValue,
      ordersPerDay
    }
  }, [product, order, user])

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8" style={{ color: mode === 'dark' ? 'white' : '' }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <MdInsights className="text-purple-500" />
            Smart Admin Dashboard
          </h1>
          <p className="text-gray-600" style={{ color: mode === 'dark' ? '#a0a0a0' : '' }}>
            Real-time insights, predictions, and analytics for your ecommerce business
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <FiDollarSign size={32} />
              <FiTrendingUp size={24} />
            </div>
            <h3 className="text-gray-200 text-sm mb-1">Total Revenue</h3>
            <p className="text-3xl font-bold">{formatCurrency(analytics.totalRevenue)}</p>
            <p className="text-sm text-purple-200 mt-2">
              Avg Order: {formatCurrency(analytics.avgOrderValue)}
            </p>
          </div>

          {/* Total Orders */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <FiShoppingCart size={32} />
              <FiActivity size={24} />
            </div>
            <h3 className="text-gray-200 text-sm mb-1">Total Orders</h3>
            <p className="text-3xl font-bold">{analytics.totalOrders}</p>
            <p className="text-sm text-blue-200 mt-2">
              {analytics.ordersPerDay.toFixed(1)} orders/day
            </p>
          </div>

          {/* Total Products */}
          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <FiPackage size={32} />
              <MdInventory2 size={24} />
            </div>
            <h3 className="text-gray-200 text-sm mb-1">Total Products</h3>
            <p className="text-3xl font-bold">{analytics.totalProducts}</p>
            <p className="text-sm text-green-200 mt-2">
              {analytics.lowStockProducts.length} low stock
            </p>
          </div>

          {/* Total Users */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <FiUsers size={32} />
              <FiBarChart2 size={24} />
            </div>
            <h3 className="text-gray-200 text-sm mb-1">Total Users</h3>
            <p className="text-3xl font-bold">{analytics.totalUsers}</p>
            <p className="text-sm text-orange-200 mt-2">
              {analytics.uniqueCustomers} active customers
            </p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6" style={{ backgroundColor: mode === 'dark' ? 'rgb(46 49 55)' : '' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FiAlertTriangle className="text-red-500" />
                Low Stock Alerts
              </h2>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold" 
                    style={{ backgroundColor: mode === 'dark' ? 'rgb(127 29 29)' : '', color: mode === 'dark' ? '#ff6b6b' : '' }}>
                {analytics.lowStockProducts.length} Products
              </span>
            </div>
            {analytics.lowStockProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.lowStockProducts.slice(0, 6).map((prod, index) => (
                  <div key={index} className="border border-red-300 rounded-lg p-4 bg-red-50" 
                       style={{ backgroundColor: mode === 'dark' ? 'rgb(55 48 48)' : '', borderColor: mode === 'dark' ? 'rgb(127 29 29)' : '' }}>
                    <div className="flex items-center gap-3">
                      <img src={prod.imageUrl} alt={prod.title} className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{prod.title}</h3>
                        <p className="text-xs text-gray-600" style={{ color: mode === 'dark' ? '#a0a0a0' : '' }}>
                          {prod.category}
                        </p>
                        <p className="text-xs text-red-600 font-semibold mt-1">
                          Stock: {prod.quantity !== undefined ? prod.quantity : 'Low'} units
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8" style={{ color: mode === 'dark' ? '#a0a0a0' : '' }}>
                All products are well stocked! 🎉
              </p>
            )}
          </div>
        </div>

        {/* Growth Predictions & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Growth Predictions */}
          <div className="bg-white rounded-xl shadow-lg p-6" style={{ backgroundColor: mode === 'dark' ? 'rgb(46 49 55)' : '' }}>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <MdShowChart className="text-green-500" />
              Growth Predictions
            </h2>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg" 
                   style={{ backgroundColor: mode === 'dark' ? 'rgb(30 41 59)' : '' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Predicted Monthly Revenue</span>
                  <FiTrendingUp className="text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-600" style={{ color: mode === 'dark' ? '#4ade80' : '' }}>
                  {formatCurrency(analytics.predictedMonthlyRevenue)}
                </p>
                <p className="text-xs text-gray-600 mt-1" style={{ color: mode === 'dark' ? '#a0a0a0' : '' }}>
                  Based on last 7 days trend
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg" 
                   style={{ backgroundColor: mode === 'dark' ? 'rgb(30 41 59)' : '' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Growth Rate</span>
                  <FiActivity className="text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-purple-600" style={{ color: mode === 'dark' ? '#a78bfa' : '' }}>
                  {analytics.growthRate}%
                </p>
                <p className="text-xs text-gray-600 mt-1" style={{ color: mode === 'dark' ? '#a0a0a0' : '' }}>
                  Compared to previous period
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg" 
                   style={{ backgroundColor: mode === 'dark' ? 'rgb(30 41 59)' : '' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Average Customer Value</span>
                  <FiUsers className="text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-blue-600" style={{ color: mode === 'dark' ? '#60a5fa' : '' }}>
                  {formatCurrency(analytics.avgCustomerValue)}
                </p>
                <p className="text-xs text-gray-600 mt-1" style={{ color: mode === 'dark' ? '#a0a0a0' : '' }}>
                  Per customer lifetime value
                </p>
              </div>
            </div>
          </div>

          {/* Revenue by Category */}
          <div className="bg-white rounded-xl shadow-lg p-6" style={{ backgroundColor: mode === 'dark' ? 'rgb(46 49 55)' : '' }}>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FiPieChart className="text-blue-500" />
              Revenue by Category
            </h2>
            <div className="space-y-3">
              {Object.entries(analytics.categoryRevenue)
                .sort(([,a], [,b]) => b - a)
                .map(([category, revenue]) => {
                  const percentage = (revenue / analytics.totalRevenue * 100).toFixed(1)
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{category}</span>
                        <span className="text-sm font-bold">{formatCurrency(revenue)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2" 
                           style={{ backgroundColor: mode === 'dark' ? 'rgb(55 65 81)' : '' }}>
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1" style={{ color: mode === 'dark' ? '#a0a0a0' : '' }}>
                        {percentage}% of total revenue
                      </p>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6" style={{ backgroundColor: mode === 'dark' ? 'rgb(46 49 55)' : '' }}>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <MdOutlineProductionQuantityLimits className="text-orange-500" />
              Top Selling Products
            </h2>
            {analytics.topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: mode === 'dark' ? 'rgb(75 85 99)' : '' }}>
                      <th className="text-left py-3 px-4 font-semibold">Product</th>
                      <th className="text-left py-3 px-4 font-semibold">Category</th>
                      <th className="text-right py-3 px-4 font-semibold">Sales</th>
                      <th className="text-right py-3 px-4 font-semibold">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topProducts.map((prod, index) => (
                      <tr key={index} className="border-b" style={{ borderColor: mode === 'dark' ? 'rgb(75 85 99)' : '' }}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img src={prod.imageUrl} alt={prod.title} className="w-12 h-12 object-cover rounded" />
                            <span className="font-medium">{prod.title}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600" style={{ color: mode === 'dark' ? '#a0a0a0' : '' }}>
                            {prod.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold">{prod.sales}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold text-green-600" style={{ color: mode === 'dark' ? '#4ade80' : '' }}>
                            {formatCurrency(prod.revenue)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8" style={{ color: mode === 'dark' ? '#a0a0a0' : '' }}>
                No sales data available yet
              </p>
            )}
          </div>
        </div>

        {/* Smart Insights */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <MdInsights />
            Smart Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur">
              <h3 className="font-semibold mb-2">📊 Sales Performance</h3>
              <p className="text-sm">
                Your store has processed <strong>{analytics.totalOrders}</strong> orders with an average order value of{' '}
                <strong>{formatCurrency(analytics.avgOrderValue)}</strong>. Keep up the great work!
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur">
              <h3 className="font-semibold mb-2">👥 Customer Engagement</h3>
              <p className="text-sm">
                You have <strong>{analytics.uniqueCustomers}</strong> active customers with an average value of{' '}
                <strong>{formatCurrency(analytics.avgCustomerValue)}</strong> per customer.
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur">
              <h3 className="font-semibold mb-2">📈 Growth Opportunity</h3>
              <p className="text-sm">
                Based on current trends, you're projected to generate{' '}
                <strong>{formatCurrency(analytics.predictedMonthlyRevenue)}</strong> in the next month.
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur">
              <h3 className="font-semibold mb-2">⚠️ Action Required</h3>
              <p className="text-sm">
                {analytics.lowStockProducts.length > 0 ? (
                  <>
                    <strong>{analytics.lowStockProducts.length}</strong> products need restocking. 
                    Consider placing orders to avoid stockouts.
                  </>
                ) : (
                  <>All products are well stocked. No immediate action needed.</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SmartAdminDashboard
