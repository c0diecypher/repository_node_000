const db = require("../postgreSQL/db")

class UserController {
	async getStatusPaid(req, res) {
		try {
			const result = await db.query(
				'SELECT "userId", "userFio", "phoneNumber", "userAdress", "userCity", "userOrder" FROM "Users"'
			)

			const filteredOrders = result.rows.reduce((acc, user) => {
				if (user.userOrder) {
					const orders = JSON.parse(user.userOrder)
					const paidOrders = orders.filter((order) => order.status === "PAID")

					if (paidOrders.length > 0) {
						acc.push({
							userId: user.userId,
							userFio: user.userFio,
							phoneNumber: user.phoneNumber,
							userAdress: user.userAdress,
							userCity: user.userCity,
							userOrder: paidOrders,
						})
					}
				}
				return acc
			}, [])

			// Преобразование отфильтрованных данных в JSON
			const ordersJSON = JSON.stringify(filteredOrders)

			console.log(filteredOrders) // Вывод для отладки

			return filteredOrders
		} catch (error) {
			console.error("Error fetching users:", error)
			res.status(500).json({ error: "Internal Server Error" })
		}
	}
	async getChangeStatus(req, res) {
		const { userId, order_id, newStatus } = req.body
		try {
			if (!userId || !order_id || !newStatus) {
				return res.status(400).json({
					error:
						"userId, order_id, and newStatus are required in the request body",
				})
			}

			// Fetch the user based on userId
			const userResult = await db.query(
				'SELECT "userId", "userOrder" FROM "Users" WHERE "userId" = $1',
				[userId]
			)

			if (userResult.rows.length === 0) {
				console.error("User not found")
				return { error: "User not found" }
			}

			const user = userResult.rows[0]

			if (user.userOrder) {
				const orders = JSON.parse(user.userOrder)

				// Update the status of the specified order_id to the new status
				const updatedOrders = orders.map((order) => {
					if (order.order_id === order_id) {
						return { ...order, status: newStatus }
					}
					return order
				})

				// Update the user's order in the database with the new orders
				await db.query(
					'UPDATE "Users" SET "userOrder" = $1 WHERE "userId" = $2',
					[JSON.stringify(updatedOrders), userId]
				)

				console.log(
					`Order status updated for userId ${userId} and order_id ${order_id}`
				)
				return { success: true, message: "order_id с статусом обновлен" }
			}
		} catch (error) {
			console.error("Error updating order status:", error)
			res.status(500).json({ error: "Internal Server Error" })
		}
	}
	async getAllOrders(req, res) {
		try {
			const result = await db.query(
				'SELECT "userId", "userFio", "phoneNumber", "userAdress", "userCity", "userOrder" FROM "Users"'
			)

			const filteredOrders = result.rows.reduce((acc, user) => {
				if (user.userOrder) {
					const orders = JSON.parse(user.userOrder)
					const paidOrders = orders.filter(
						(order) => order.status === order.status
					)

					if (paidOrders.length > 0) {
						acc.push({
							userId: user.userId,
							userFio: user.userFio,
							phoneNumber: user.phoneNumber,
							userAdress: user.userAdress,
							userCity: user.userCity,
							userOrder: paidOrders,
						})
					}
				}
				return acc
			}, [])

			// Преобразование отфильтрованных данных в JSON
			const ordersJSON = JSON.stringify(filteredOrders)

			console.log(filteredOrders) // Вывод для отладки

			return filteredOrders
		} catch (error) {
			console.error("Error fetching users:", error)
			res.status(500).json({ error: "Internal Server Error" })
		}
	}
}

module.exports = new UserController()
