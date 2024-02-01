//imports
require("dotenv").config()
const express = require("express")
const router = require("./routes/user.routes")
const TelegramBot = require("node-telegram-bot-api")
const UserController = require("./controller/user.controller")
const Notifier = require("./notifier")
const documentation = require("./messages/documentation")
//functions

const token = process.env.TOKEN

const bot = new TelegramBot(token, { polling: true })
const PORT = 5000
const app = express()

app.use(express.json())
app.use("/api", router)

bot.on("message", async (msg) => {
	const chatId = msg.chat.id
	const userId = msg.from.id
	const name = msg.from.first_name
	const username = msg.from.username || null
	const text = msg.text
	const allowedUserIds = [204688184, 1201116054]
	const chatStates = {}
	try {
		if (allowedUserIds.includes(userId)) {
			switch (text) {
				case "/orders":
					const orders = await UserController.getStatusPaid()

					if (orders.length === 0) {
						await bot.sendMessage(chatId, "Нет оплаченных заказов.")
					} else {
						// Отправка сообщения с результатами
						let message = "――――――――――――――――\n"

						orders.forEach((user) => {
							message += "ㅤㅤㅤㅤㅤ📋 Контакты:\n"
							message += `🆔 ${user.userId}\n`
							message += `👤 ФИО: ${user.userFio}\n`
							message += `📞 Телефон: ${user.phoneNumber}\n`
							message += `📦 Адрес: ${user.userAdress}\n`
							message += `\n`
							message += `ㅤㅤㅤㅤㅤ📋 Заказы:\n`

							user.userOrder.forEach((order) => {
								message += `🏷️ ${order.name}\n ✅ ${order.status}\n 💹 ${order.price}₽\n № ${order.order_id}\n 📐 ${order.size} (EU)\n 🕗${order.time}\n\n`
							})

							message += ""
							message += `――――――――――――――――\n`
						})

						await bot.sendMessage(chatId, message)
					}
					break

				// Добавьте другие команды здесь
				case "/documentation":
					await bot.sendMessage(chatId, documentation, { parse_mode: "HTML" })
					break

				case "/AllOrders":
					const AllOrders = await UserController.getAllOrders()

					if (AllOrders.length === 0) {
						await bot.sendMessage(chatId, "Нет оплаченных заказов.")
					} else {
						// Отправка сообщения с результатами
						let message = "――――――――――――――――\n"

						AllOrders.forEach((user) => {
							message += "ㅤㅤㅤㅤㅤ📋 Контакты:\n"
							message += `🆔 ${user.userId}\n`
							message += `👤 ФИО: ${user.userFio}\n`
							message += `📞 Телефон: ${user.phoneNumber}\n`
							message += `📦 Адрес: ${user.userAdress}\n`
							message += `\n`
							message += `ㅤㅤㅤㅤㅤ📋 Заказы:\n`

							user.userOrder.forEach((order) => {
								message += `🏷️ ${order.name}\n ✅ ${order.status}\n 💹 ${order.price}₽\n № ${order.order_id}\n 📐 ${order.size} (EU)\n\n`
							})

							message += ""
							message += `――――――――――――――――\n`
						})

						await bot.sendMessage(chatId, message)
					}
					break

				case "/change":
					await bot.sendMessage(chatId, "Введите <b>userId</b>", {
						parse_mode: "HTML",
					})

					// Сохраняем состояние разговора для данного пользователя
					chatStates[chatId] = { step: 1 } // начальный шаг

					bot.onText(/[0-9]+/, async (msg) => {
						const chatState = chatStates[chatId]

						if (!chatState || chatState.step !== 1) {
							// Игнорируем сообщение, так как пользователь не находится в нужном шаге
							return
						}

						const userId = msg.text

						// Отправляем вопрос о order_id
						await bot.sendMessage(chatId, "Введите номер <b>order_id</b>", {
							parse_mode: "HTML",
						})

						chatState.step = 2
						chatState.userId = userId

						bot.onText(/[0-9]+/, async (msg) => {
							const chatState = chatStates[chatId]

							if (!chatState || chatState.step !== 2) {
								// Игнорируем сообщение, так как пользователь не находится в нужном шаге
								return
							}

							const order_id = msg.text

							// Отправляем вопрос о newStatus
							await bot.sendMessage(chatId, "Введите новый <b>статус</b>", {
								parse_mode: "HTML",
							})

							chatState.step = 3
							chatState.order_id = order_id

							bot.onText(/[A-Za-z]+/, async (msg) => {
								const chatState = chatStates[chatId]

								if (!chatState || chatState.step !== 3) {
									// Игнорируем сообщение, так как пользователь не находится в нужном шаге
									return
								}

								const newStatus = msg.text

								if (newStatus.toLowerCase() === "/cancel") {
									// Пользователь отменил действие
									delete chatStates[chatId]
									await bot.sendMessage(chatId, "Действие отменено.")
									return
								}

								try {
									const result = await UserController.getChangeStatus({
										body: {
											userId: chatState.userId,
											order_id: chatState.order_id,
											newStatus: newStatus,
										},
									})

									// Отправляем сообщение с результатом
									const message = `Статус заказа обновлен для пользователя: \n🆔 ${chatState.userId}\n № ${chatState.order_id}\n ✅ ${newStatus}`
									await bot.sendMessage(chatId, message)

									// Завершаем разговор и удаляем состояние
									delete chatStates[chatId]
								} catch (error) {
									console.error(
										"Произошла ошибка при обновлении статуса заказа:",
										error
									)
									await bot.sendMessage(
										chatId,
										"Произошла ошибка при обновлении статуса заказа."
									)

									// Завершаем разговор и удаляем состояние
									delete chatStates[chatId]
								}
							})
						})
					})
					break
				case "/cancel":
					const keyboardMarkup = {
						keyboard: [["/cancel"]],
						resize_keyboard: true,
						one_time_keyboard: true,
					}
					await bot.sendMessage(chatId, "Действие отменено", {
						parse_mode: "HTML",
						reply_markup: JSON.stringify(keyboardMarkup),
					})
					return
			}
		}
	} catch (error) {
		console.error("Произошла ошибка при обработке команды", error)
		// Обработка ошибки, например, отправка сообщения об ошибке в чат
		await bot.sendMessage(chatId, "Произошла ошибка при обработке команды")
	}
})

app.listen(PORT, () => console.log(`Сервер запущен на порте ` + PORT))
