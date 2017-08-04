const express = require("express")
const path = require("path")

const app = express()

const PORT = 8000

app.use(express.static(path.join(__dirname, "./client")))
app.use(express.static(path.join(__dirname, "./node_modules")))

const server = app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`)
})

const io = require("socket.io").listen(server)
const armies = {}
const BETWEEN_GAME_INTERVAL = 1000*60
let time_remaining = BETWEEN_GAME_INTERVAL

function run_game(){
	let player_ids = Object.keys(armies)

	if(!player_ids){
		console.log("Not enough players!")
		return
	}

	if(player_ids.length == 1){
		io.sockets.connected[player_ids[0]].emit("results", "You're the only player!")
		return
	}	

	let winners = new Array(5)

	for(let i=0; i<winners.length; i++){
		let best = -1
		for(let army in armies){
			if(armies[army][i] > best){
				winners[i] = [army]
				best = armies[army][i]
			} else if(armies[army][i] == best){
				winners[i].push(army)
			}
		}
	}

	let scores = {}

	winners.forEach(winner => {
		winner.forEach(player => {
			if(!scores[player]){ scores[player] = 0}
			scores[player] += 10/winner.length
		})
	})

	let high_score = Math.max(...Object.values(scores))

	player_ids.forEach(player => {
		let msg = ""
		console.log(player, scores[player], high_score)
		if(scores[player] == high_score){
			msg = "You win!"
		} else {
			msg = "You lose!"
		}
		io.sockets.connected[player].emit("results", msg)
	})

	console.log("All scores", scores)
}

io.on("connection", (socket) => {
	console.log("New connection", socket.id)

	socket.emit("time_remaining", time_remaining)
	
	socket.on("update_army", army => {
		armies[socket.id] = army
	})

	socket.on("disconnect", () => {
		delete armies[socket.id]
	})

	socket.on("chat", msg => io.emit("new_chat", msg))
})

setInterval(() => {
	time_remaining -= 10
	if(time_remaining <= 0){
		run_game()
		time_remaining = BETWEEN_GAME_INTERVAL
		io.emit("time_remaining", time_remaining)
	}
},10)