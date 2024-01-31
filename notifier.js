require("dotenv").config()
const { EOL } = require("os")
const axios = require("axios")
const userId = 204688184
const token = process.env.TOKEN
const TELEGRAM_URL =
	" https://api.telegram.org/bot" +
	token +
	"/sendMessage?chat_id=" +
	userId +
	"&text="

module.exports = {
	notify: async function (title, body) {
		axios
			.get(TELEGRAM_URL + encodeURIComponent(title + EOL + body))
			.then(function (response) {
				// обрабатываем успех
				console.log(response)
			})
			.catch(function (error) {
				// обрабатываем ошибку
				console.log(error)
			})
	},
}
